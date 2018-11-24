const config = require('../config.json');
const resError = require('../utils/resError');

const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const Validator = require("fastest-validator");

const db = mysql.createConnection({
				host: config.db.host,
				user: config.db.user,
				password: config.db.password,
				database: config.db.database
			});


router.get('/getInfo', (req, res) => {
	const userId = req.query.id
	const profile = {};

	const schema = new Validator().compile({
		userId: { type: 'string' },
		profile: { type: 'object' },
	})

	const check = schema({
		userId: userId,
		profile: profile,
	});

	if(check !== true) return resError(res, 400);

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
		WHERE users_dinamic.user_id = ${+userId} LIMIT 1
	`, (error, result, field) => {
		if(!result || !result.length) return resError(res, 404);

		profile.profileInfo = result[0];
		
		db.query(`
			SELECT
				photo_id,
				photo_250
			FROM photo
			WHERE user_id = ${+userId}
				ORDER BY photo_timestamp DESC
		`, (error, result, field) => {
			profile.profileInfo.count_posts = result.length;
			profile.profilePosts = result;

			return res.json({profile});
		});
	});
});


module.exports = router;