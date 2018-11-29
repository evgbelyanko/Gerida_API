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


router.get('/users', (req, res) => {
	const page = req.query.page;
	const userId = req.query.userid;
	let option = '';
	let condition = '';

	const schema = new Validator().compile({
		page: { type: 'string', empty: false },
		userId: { type: 'string', empty: false },
		option: { type: 'string' },
		condition: { type: 'string' }
	})

	const check = schema({
		page: page,
		userId: userId,
		option: option,
		condition: condition
	});

	if(check !== true) return resError(res, 400);

	switch (page) {
		case 'following':
			option = 'who_id';
			condition = 'follower_id';
			break;
		case 'followers':
			option = 'follower_id';
			condition = 'who_id';
			break;
		default:
			return resError(res, 400);
			break;
	}

	db.query(`
		SELECT
			users_dinamic.user_id,
			users_dinamic.user_name,
			avatars.avatar_50
		FROM users_dinamic
		LEFT OUTER JOIN follows
			ON follows.${option} = users_dinamic.user_id
		LEFT JOIN avatars ON avatars.user_id = users_dinamic.user_id
		WHERE follows.${condition} = ${+userId}
	`, (error1, result1, field1)  => {
		//if(!result1 || !result1.length) return resError(res, 404);

		db.query(`
			SELECT user_name
			FROM users_dinamic
			WHERE user_id = ${+userId}
		`, (error2, result2, field2)  => {

			return res.json({
				ownerUserName: result2[0].user_name,
				listUsers: result1
			});
		});
	});
		

});


module.exports = router;