const config = require(`../config.json`);
const upload = require(`../utils/upload`);
const resError = require(`../utils/resError`);

const express = require('express');
const router = express.Router();
const mysql = require('mysql');

const fs = require('fs');
const url = require('url');
const sharp = require('sharp');
const Validator = require('fastest-validator');

const db = mysql.createConnection({
				host: config.db.host,
				user: config.db.user,
				password: config.db.password,
				database: config.db.database
			});


router.get('/getInfo', (req, res) => {
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
	`, (error, result, field) => {
		setting = result[0];

		return res.json({setting});
	});
});

router.post('/updateAvatar', (req, res) => {
	upload(req, res, (error) => {
		const filePath = req.file.path;
		const fileName = req.file.filename;
		const {
			avatars50,
			avatars150,
			absolutePath
		} = config.cloud;

		const schema = new Validator().compile({
			filePath: { type: 'string', empty: false },
			fileName: { type: 'string', empty: false },
		})

		const check = schema({
			filePath: filePath,
			fileName: fileName,
		});

		if(check !== true) return resError(res, 400);

		fs.readFile(filePath, (err, data) => {
			const prom1 = sharp(data)
				.resize(50, 50)
				.toFile(absolutePath + avatars50 + fileName);

			const prom2 = sharp(data)
				.resize(150, 150)
				.toFile(absolutePath + avatars150 + fileName);

			Promise.all([prom1, prom2]).then(values => { 
				fs.unlink(filePath, err => {});

				db.query(`
					SELECT
						avatar_50,
						avatar_150
					FROM avatars
					WHERE user_id = ${req.user}
				`, (error, result, field) => {
					const oldPath50 = url.parse(result[0].avatar_50).pathname;
					const oldPath150 = url.parse(result[0].avatar_150).pathname;

					fs.unlink(absolutePath + oldPath50, err => {});
					fs.unlink(absolutePath + oldPath150, err => {});
				});

				db.query(`
					UPDATE avatars
					SET 
						avatar_50 = "${config.cloudUrl + avatars50 + fileName}",
						avatar_150 = "${config.cloudUrl + avatars150 + fileName}"
					WHERE user_id = ${req.user}
				`, (error, result, field) => {
					return res.json({
						updateAvatar: true,
						avatar_150: config.cloudUrl + avatars150 + fileName
					});
				});

			});
		});

	});
});

router.post('/deleteAvatar', (req, res) => {
	db.query(`
		SELECT
			avatar_50,
			avatar_150
		FROM avatars
		WHERE user_id = ${req.user}
	`, (error, result, field) => {
		const oldPath50 = url.parse(result[0].avatar_50).pathname;
		const oldPath150 = url.parse(result[0].avatar_150).pathname;

		fs.unlink(config.cloud.absolutePath + oldPath50, err => {});
		fs.unlink(config.cloud.absolutePath + oldPath150, err => {});
	});

	db.query(`
		UPDATE avatars
		SET 
			avatar_50 = "${config.protocol + config.clientUrl + config.cloud.defaultAvatars50}",
			avatar_150 = "${config.protocol + config.clientUrl + config.cloud.defaultAvatars150}"
		WHERE user_id = ${req.user}
	`, (error, result, field) => {
		return res.json({
			deleteAvatar: true,
			avatar_150: config.protocol + config.clientUrl + config.cloud.defaultAvatars150
		});
	});

});

router.post('/updateProfile', (req, res) => {
	const userName = req.body.userName.replace(/\r?\n?\s+/g, ' ').trim();
	const userDesc = req.body.userDesc.replace(/\s+/g, ' ').trim();
	const countryId = +req.body.countryId;
	const userWebsite = req.body.userWebsite.replace(/\r?\n?\s+/g, '').trim();

	const schema = new Validator().compile({
		userName: { type: 'string', empty: false, max: 30 },
		userDesc: { type: 'string', max: 250 },
		countryId: { type: 'number', integer: true },
		userWebsite: { type: (userWebsite.length ? 'url' : 'string'), max: 150},
	})

	const check = schema({
		userName: userName,
		userDesc: userDesc,
		countryId: countryId,
		userWebsite: userWebsite,
	});

	if(check !== true) return resError(res, 400);

	db.query(`
		UPDATE users_dinamic
		SET 
			user_name = "${userName}",
			user_desc = "${userDesc}",
			country_id = "${countryId}",
			user_website = "${userWebsite}"
			WHERE 
			user_id = ${req.user}
	`, (error, result, field) => {
		return res.json({updateProfile: true});
	});
});


module.exports = router;