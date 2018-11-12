const express = require('express');
const router = express.Router();
const mysql = require('mysql');

const db = mysql.createConnection({
				host: 'localhost',
				user: 'app',
				password: 'appappapp',
				database: 'app'
			});

router.get('/recent', function (req, res) {
	db.query(`
		SELECT
			photo.photo_id,
			photo.photo_250,
			users_dinamic.user_id,
			users_dinamic.user_name,
			avatars.avatar_50
		FROM photo 
		JOIN photo_dinamic ON photo_dinamic.photo_id = photo.photo_id
		JOIN users_dinamic ON users_dinamic.user_id = photo.user_id
		LEFT JOIN avatars ON avatars.user_id = users_dinamic.user_id
			ORDER BY photo_dinamic.photo_likes DESC
	`, function (error, result, field) { // WHERE photo.photo_timestamp > '$yesterday'
		if (error) throw error;

		return res.json({searchPosts: result});
	});
});

router.get('/users', function (req, res) {
	const inputString = req.query.name;

	db.query(`
		SELECT 
			users_dinamic.user_id,
			users_dinamic.user_name,
			country.country_name,
			avatars.avatar_50
		FROM users_dinamic
		LEFT JOIN avatars ON avatars.user_id = users_dinamic.user_id
		LEFT JOIN country ON country.country_id = users_dinamic.country_id
		WHERE users_dinamic.user_name LIKE '%${inputString}%'
	`, function (error, result, field) {
		if (error) throw error;

		return res.json({searchUsers: result});
	});
});


module.exports = router;