const config = require(`../config.json`);
const resError = require(`../utils/resError`);

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
	const props = {};
	const countLimit = 30;

	const schema = new Validator().compile({
		userId: { type: 'string' },
		props: { type: 'object' },
	})

	const check = schema({
		userId: userId,
		props: props,
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
		props.profileInfo = result[0];

		db.query(`
			SELECT count(photo_id) AS hidden_posts
			FROM photo
			WHERE user_id = ${+userId}
		`, (error, result, field) => {
			const count_posts = result[0].hidden_posts;
			props.hidden_posts = result[0].hidden_posts - countLimit;

			db.query(`
				SELECT
					photo_id,
					photo_250
				FROM photo
				WHERE user_id = ${+userId}
					ORDER BY photo_timestamp DESC LIMIT ${countLimit}
			`, (error, result, field) => {
				props.profileInfo.count_posts = count_posts;
				props.profilePosts = result;

				return res.json(props);
			});
		});
	});
});

router.get('/loadMorePosts', (req, res) => {
	const userId = req.query.id;
	const startLimit = 30;//+req.query.startLimit
	const countLimit = 30;//+req.query.countLimit
	const props = {};

	const schema = new Validator().compile({
		userId: { type: 'string' },
		startLimit: { type: 'number', empty: false },
		countLimit: { type: 'number', empty: false },
	})

	const check = schema({
		userId: userId,
		startLimit: startLimit,
		countLimit: countLimit,
	});

	if(check !== true) return resError(res, 400);

	db.query(`
		SELECT count(photo_id)-${countLimit}-${startLimit} AS hidden_posts
		FROM photo
		WHERE user_id = ${+userId}
	`, (error, result, field) => {
		props.hidden_posts = result[0].hidden_posts;

		db.query(`
			SELECT
				photo_id,
				photo_250
			FROM photo
			WHERE user_id = ${+userId}
				ORDER BY photo_timestamp DESC LIMIT ${+startLimit}, ${+countLimit}
		`, (error, result, field) => {
			props.profilePosts = result;

			return res.json(props);
		});
	});
});



module.exports = router;