const config = require(`../config.json`);
const resError = require(`../utils/resError`);

const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const Validator = require('fastest-validator');

const db = mysql.createConnection({
				host: config.db.host,
				user: config.db.user,
				password: config.db.password,
				database: config.db.database
			});

router.get('/clusters', (req, res) => {
	db.query(`
		SELECT
			photo_id,
			photo_latitude,
			photo_longitude
		FROM photo
	`, (error, result, field) => {
		return res.json({listMarkers: result});
	});
});

router.post('/posts', (req, res) => {
	const markerIds = req.body.markerIds.join();

	const schema = new Validator().compile({
		markerIds: { type: 'string' },
	})

	const check = schema({
		markerIds: markerIds,
	});

	if(check !== true) return resError(res, 400);

	db.query(`
		SELECT
			photo.photo_id,
			photo.photo_250,
			users_dinamic.user_name,
			photo_dinamic.photo_title,
			photo_dinamic.photo_comments,
			photo_dinamic.photo_likes,
			avatars.avatar_50
		FROM photo
		JOIN users_dinamic ON photo.user_id = users_dinamic.user_id
		JOIN photo_dinamic ON photo.photo_id = photo_dinamic.photo_id
		LEFT JOIN avatars ON avatars.user_id = users_dinamic.user_id
		WHERE photo.photo_id IN (${markerIds})
	`, (error, result, field) => {
		return res.json({listPosts: result});
	});
});

module.exports = router;