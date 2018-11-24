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

router.get('/recent', (req, res) => {
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
	`, (error, result, field) => { // WHERE photo.photo_timestamp > '$yesterday'
		return res.json({searchPosts: result});
	});
});

router.get('/users', (req, res) => {
	const inputString = req.query.name;

	const schema = new Validator().compile({
		inputString: { type: 'string', empty: false },
	})

	const check = schema({
		inputString: inputString,
	});

	if(check !== true) return resError(res, 400);

	db.query(`
		SELECT 
			users_dinamic.user_id,
			users_dinamic.user_name,
			country.country_name,
			avatars.avatar_50
		FROM users_dinamic
		LEFT JOIN avatars ON avatars.user_id = users_dinamic.user_id
		LEFT JOIN country ON country.country_id = users_dinamic.country_id
		WHERE users_dinamic.user_name LIKE "%${inputString}%"
	`, (error, result, field) => {
		return res.json({searchUsers: result});
	});
});


module.exports = router;