const express = require('express');
const router = express.Router();
const mysql = require('mysql');

var db = mysql.createConnection({
				host: '176.9.198.165',
				user: 'api',
				password: '223O2EOJAy',
				database: 'app'
			});

router.get('/clusters', function (req, res) {
	db.query(`
		SELECT
			photo_id,
			photo_latitude,
			photo_longitude
		FROM photo
	`, function (error, result, field) {
		if (error) throw error;

		return res.json({listMarkers: result});
	});
});

router.post('/posts/', function (req, res) {
	const markerIds = req.body.markerIds;
	const arrayMarkerIds = markerIds.join();

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
		WHERE photo.photo_id IN (${arrayMarkerIds})
	`, function (error, result, field) {
		if (error) throw error;

		return res.json({listPosts: result});
	});
});

module.exports = router;