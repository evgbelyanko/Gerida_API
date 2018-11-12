const express = require('express');
const router = express.Router();
const mysql = require('mysql');

const db = mysql.createConnection({
				host: 'localhost',
				user: 'app',
				password: 'appappapp',
				database: 'app'
			});


router.get('/checkFollowing', function (req, res) {
	const whoUserId = req.query.userId;

	db.query(`
		SELECT follow_id
		FROM follows
		WHERE follower_id = ${req.session.user.id}
			AND who_id = ${whoUserId} LIMIT 1
	`, function (error, result, field) {
		if (error) throw error;

		result = result[0] == null ? {following: false} : {following: true};


		return res.json(result);
	});
});

router.get('/actionsFollowing', function (req, res) {
	const whoUserId = req.query.userId;
	let counterValue = 0;

	db.query(`
		SELECT follow_id
		FROM follows
		WHERE follower_id = ${req.session.user.id}
			AND who_id = ${whoUserId} LIMIT 1
	`, function (error, result, field) {
		if (error) throw error;

		if(result[0] == null) {
			db.query(`
				INSERT INTO follows (
					follower_id,
					who_id
				) VALUES (
					${req.session.user.id},
					${whoUserId} 
				)
			`);
			counterValue = 1;
			result = {following: true};
		} else {
			db.query(`
				DELETE
				FROM follows
				WHERE follower_id = ${req.session.user.id}
					AND who_id = ${whoUserId}
			`);
			counterValue = -1;
			result = {following: false};
		}

		db.query(`
			UPDATE users_dinamic
			SET user_followers = user_followers + ${counterValue}
			WHERE user_id = ${req.session.user.id}
		`);
		db.query(`
			UPDATE users_dinamic
			SET user_followers = user_followers + ${counterValue}
			WHERE user_id = ${whoUserId}
		`);

		return res.json(result);
	});
});


module.exports = router;