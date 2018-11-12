const express = require('express');
const router = express.Router();
const mysql = require('mysql');

const db = mysql.createConnection({
				host: 'localhost',
				user: 'app',
				password: 'appappapp',
				database: 'app'
			});


router.get('/users', function (req, res) {
	const page = req.query.page;
	const userId = req.query.userid;
	let option = '';
	let condition = '';

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
			return res.json({error: 'page nuuuuuuuullll'});
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
		WHERE follows.${condition} = ${userId}
	`, function (error1, result1, field1) {
		if (error1) throw error1;

		db.query(`
			SELECT user_name
			FROM users_dinamic
			WHERE user_id = ${userId}
		`, function (error2, result2, field2) {
			if (error2) throw error2;

			return res.json({
				ownerUserName: result2[0].user_name,
				listUsers: result1
			});
		});
	});
		

});


module.exports = router;