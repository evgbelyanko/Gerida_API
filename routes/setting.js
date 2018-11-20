const config = require('../config.json');

const express = require('express');
const router = express.Router();
const mysql = require('mysql');

const url = require('url');
const fs = require('fs');
const sharp = require('sharp');
const upload = require('../utils/upload');

const db = mysql.createConnection({
				host: config.db.host,
				user: config.db.user,
				password: config.db.password,
				database: config.db.database
			});


router.get('/getInfo', function (req, res) {
	const userId = req.query.id
	let setting = {};

	db.query(`
		SELECT 
			users_dinamic.user_name,
			users_dinamic.user_desc,
			users_dinamic.country_id,
			users_dinamic.user_website,
			avatars.avatar_150
		FROM users_dinamic
		LEFT JOIN avatars ON avatars.user_id = users_dinamic.user_id
		LEFT OUTER JOIN country ON country.country_id = users_dinamic.country_id
		WHERE users_dinamic.user_id = ${req.user} LIMIT 1
	`, function (error, result, field) {
		if (error) throw error;

		setting = result[0];

		return res.json({setting});
	});
});

router.post('/updateAvatar', function (req, res) {
	upload(req, res, function(error) {
		const filePath = req.file.path;
		const fileName = req.file.filename;
		const {
			avatars50,
			avatars150,
			pathForWindows
		} = config.cloud;

		fs.readFile(filePath, (err, data) => {
			const prom1 = sharp(data)
				.resize(50, 50)
				.toFile(pathForWindows + avatars50 + fileName);

			const prom2 = sharp(data)
				.resize(150, 150)
				.toFile(pathForWindows + avatars150 + fileName);

			Promise.all([prom1, prom2]).then(values => { 
				fs.unlink(filePath, err => {});

				db.query(`
					SELECT
						avatar_50,
						avatar_150
					FROM avatars
					WHERE user_id = ${req.user}
				`, function (error, result, field) {
					const oldPath50 = url.parse(result[0].avatar_50).pathname;
					const oldPath150 = url.parse(result[0].avatar_150).pathname;

					fs.unlink(pathForWindows + oldPath50, err => {});
					fs.unlink(pathForWindows + oldPath150, err => {});
				});

				db.query(`
					UPDATE avatars
					SET 
						avatar_50 = "${config.cloudUrl + avatars50 + fileName}",
						avatar_150 = "${config.cloudUrl + avatars150 + fileName}"
					WHERE user_id = ${req.user}
				`, function (error, result, field) {
					return res.json({
						updateAvatar: true,
						avatar_150: config.cloudUrl + avatars150 + fileName
					});
				});

			});
		});

	});
});

router.post('/deleteAvatar', function (req, res) {
	db.query(`
		SELECT
			avatar_50,
			avatar_150
		FROM avatars
		WHERE user_id = ${req.user}
	`, function (error, result, field) {
		const oldPath50 = url.parse(result[0].avatar_50).pathname;
		const oldPath150 = url.parse(result[0].avatar_150).pathname;

		fs.unlink(config.cloud.pathForWindows + oldPath50, err => {});
		fs.unlink(config.cloud.pathForWindows + oldPath150, err => {});
	});

	db.query(`
		UPDATE avatars
		SET 
			avatar_50 = "${config.cloudUrl + config.cloud.defaultAvatars50}",
			avatar_150 = "${config.cloudUrl + config.cloud.defaultAvatars150}"
		WHERE user_id = ${req.user}
	`, function (error, result, field) {
		return res.json({
			deleteAvatar: true,
			avatar_150: config.cloudUrl + config.cloud.defaultAvatars150
		});
	});

});

router.post('/updateProfile', function (req, res) {
	const userName = req.body.userName;
	const userDesc = req.body.userDesc;
	const countryId = req.body.countryId;
	const userWebsite = req.body.userWebsite;

	db.query(`
		UPDATE users_dinamic
		SET 
			user_name = "${userName}",
			user_desc = "${userDesc}",
			country_id = "${countryId}",
			user_website = "${userWebsite}"
			WHERE 
			user_id = ${req.user}
	`, function (error, result, field) {
		if (error) throw error;

		return res.json({updateProfile: true});
	});
});


module.exports = router;