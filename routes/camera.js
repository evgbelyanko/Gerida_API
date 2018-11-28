const config = require(`../config.json`);
const upload = require(`../utils/upload`);
const resError = require(`../utils/resError`);

const express = require('express');
const router = express.Router();
const mysql = require('mysql');

const fs = require('fs');
const sharp = require('sharp');
const Validator = require("fastest-validator");

const db = mysql.createConnection({
				host: config.db.host,
				user: config.db.user,
				password: config.db.password,
				database: config.db.database
			});


router.post('/uploadpicture', function (req, res) {
	upload(req, res, function(error) {
		const filePath = req.file.path;
		const fileName = req.file.filename;
		const photoTitle = req.body.photo_title.replace(/\r?\n?\s+/g, ' ').trim();
		const photoDesc = req.body.photo_desc.replace(/\s+/g, ' ').trim();
		const photoLatitude = req.body.latitude;
		const photoLongitude = req.body.longitude;
		const photoUserId = req.body.user_id;
		const {
			photos250,
			photos600,
			absolutePath
		} = config.cloud;

		const schema = new Validator().compile({
			filePath: { type: 'string', empty: false },
			fileName: { type: 'string', empty: false },
			photoTitle: { type: 'string', max: 50 },
			photoDesc: { type: 'string', max: 250 },
			photoLatitude: { type: 'string', empty: false },
			photoLongitude: { type: 'string', empty: false },
			photoUserId: { type: 'string', empty: false }
		})

		const check = schema({
			filePath: filePath,
			fileName: fileName,
			photoTitle: photoTitle,
			photoDesc: photoDesc,
			photoLatitude: photoLatitude,
			photoLongitude: photoLongitude,
			photoUserId: photoUserId
		});

		if(check !== true) return resError(res, 400);

		fs.readFile(filePath, (err, data) => {
			const prom1 = sharp(data)
				.resize(250, 250)
				.toFile(absolutePath + photos250 + fileName);

			const prom2 = sharp(data)
				.resize(600, 600)
				.toFile(absolutePath + photos600 + fileName);

			Promise.all([prom1, prom2]).then(values => {
				fs.unlink(filePath, err => {});

				const date = new Date()
				const day = date.getDate();
				const hours = date.getHours();
				const minutes = date.getMinutes();
				const seconds = date.getSeconds();
				const milliseconds = date.getMilliseconds();
				const thisTime_photoId = `${day}${hours}${minutes}${seconds}${milliseconds}`;

				db.query(`
					INSERT INTO photo (
						photo_id,
						photo_250,
						photo_600,
						photo_latitude,
						photo_longitude,
						user_id
					) VALUES (
						"${thisTime_photoId}",
						"${config.cloudUrl + photos250 + fileName}",
						"${config.cloudUrl + photos600 + fileName}",
						"${+photoLatitude}",
						"${+photoLongitude}",
						"${+photoUserId}"
					)
				`);

				db.query(`
					INSERT INTO photo_dinamic (
						photo_id,
						photo_title,
						photo_desc
					) VALUES (
						"${thisTime_photoId}",
						"${photoTitle}",
						"${photoDesc}"
					)
				`);

				return res.json({
					postId: thisTime_photoId,
					title: photoTitle,
					desc: photoDesc,
					latitude: photoLatitude,
					longitude: photoLongitude,
					userId: photoUserId
				});

			});
		});

	});
});

module.exports = router;