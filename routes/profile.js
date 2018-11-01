const express = require('express');
const router = express.Router();
const mysql = require('mysql');

var db = mysql.createConnection({
				host: '176.9.198.165',
				user: 'api',
				password: '223O2EOJAy',
				database: 'app'
			});


router.get('/getInfo', function (req, res) {
	const userId = req.query.id
	let props = {};

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

			props.profileInfo = result1[0];
			props.profileInfo.count_posts = result2.length;
			props.profilePosts = result2;

			return res.json(props);
		});
	});
});


module.exports = router;