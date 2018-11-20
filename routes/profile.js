const config = require('../config.json');

const express = require('express');
const router = express.Router();
const mysql = require('mysql');

const db = mysql.createConnection({
				host: config.db.host,
				user: config.db.user,
				password: config.db.password,
				database: config.db.database
			});


router.get('/getInfo', function (req, res) {
	const userId = req.query.id
	const profile = {};

	db.query(`
		SELECT 
			users_dinamic.user_id,
			users_dinamic.user_name,
			users_dinamic.user_desc,
			users_dinamic.user_website,
			users_dinamic.user_followers,
			users_dinamic.user_following,
			avatars.avatar_150,
			country.country_name
		FROM users_dinamic
		LEFT OUTER JOIN avatars ON avatars.user_id = users_dinamic.user_id
		LEFT OUTER JOIN country ON country.country_id = users_dinamic.country_id
		WHERE users_dinamic.user_id = ${userId} LIMIT 1
	`, function (error1, result1, field1) {
		if (error1) throw error1;
		
		db.query(`
			SELECT
				photo_id,
				photo_250
			FROM photo
			WHERE user_id = ${userId}
				ORDER BY photo_timestamp DESC
		`, function (error2, result2, field2) {
			if (error2) throw error2;

			profile.profileInfo = result1[0];
			profile.profileInfo.count_posts = result2.length;
			profile.profilePosts = result2;

			return res.json({profile});
		});
	});
});


module.exports = router;