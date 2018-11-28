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


router.get('/checkFollowing', (req, res) => {
	const whoUserId = req.query.userId;

	const schema = new Validator().compile({
		whoUserId: { type: 'string', empty: false},
	})

	const check = schema({
		whoUserId: whoUserId,
	});

	if(check !== true) return resError(res, 400);

	db.query(`
		SELECT follow_id
		FROM follows
		WHERE follower_id = ${req.user}
			AND who_id = ${+whoUserId} LIMIT 1
	`, (error, result, field) => {
		result = result[0] == null ? {following: false} : {following: true};

		return res.json(result);
	});
});

router.get('/actionsFollowing', (req, res) => {
	const whoUserId = req.query.userId;
	let counterValue = 0;

	const schema = new Validator().compile({
		whoUserId: { type: 'string', empty: false},
		counterValue: { type: 'number' }
	})

	const check = schema({
		whoUserId: whoUserId,
		counterValue: counterValue,
	});

	if(check !== true || whoUserId == req.user) return resError(res, 400);

	db.query(`
		SELECT follow_id
		FROM follows
		WHERE follower_id = ${req.user}
			AND who_id = ${+whoUserId} LIMIT 1
	`, (error, result, field) => {
		if(result[0] == null) {
			db.query(`
				INSERT INTO follows (
					follower_id,
					who_id
				) VALUES (
					${req.user},
					${+whoUserId} 
				)
			`);
			counterValue = 1;
			result = {following: true};
		} else {
			db.query(`
				DELETE
				FROM follows
				WHERE follower_id = ${req.user}
					AND who_id = ${+whoUserId}
			`);
			counterValue = -1;
			result = {following: false};
		}

		db.query(`
			UPDATE users_dinamic
			SET user_following = user_following + ${counterValue}
			WHERE user_id = ${req.user}
		`);
		db.query(`
			UPDATE users_dinamic
			SET user_followers = user_followers + ${counterValue}
			WHERE user_id = ${+whoUserId}
		`);

		return res.json(result);
	});
});

router.post('/sendLike', (req, res) => {
	const postId = +req.body.postId
	let counterValue = 0;
	let isLike = null;

	const schema = new Validator().compile({
		postId: { type: 'number', empty: false},
		counterValue: { type: 'number' },
	})

	const check = schema({
		postId: postId,
		counterValue: counterValue,
	});

	if(check !== true) return resError(res, 400);

	db.query(`
		SELECT 
			like_id
		FROM likes
		WHERE user_id = ${req.user}
			AND photo_id = ${postId} LIMIT 1
	`, (error, result, field) => {
		if(result[0] == null) {
			db.query(`
				INSERT INTO likes (
					photo_id,
					user_id 
				) VALUES (
					${postId},
					${req.user}
				)
			`);
			counterValue = 1;
			isLike = true;
		} else {
			db.query(`
				DELETE FROM likes
				WHERE photo_id = ${postId}
					AND user_id = ${req.user}
			`);
			counterValue = -1;
			isLike = false;
		}

		db.query(`
			UPDATE photo_dinamic
			SET photo_likes = photo_likes + ${counterValue}
			WHERE photo_id = ${postId}
		`);

		db.query(`
			SELECT 
				photo_likes
			FROM photo_dinamic
			WHERE photo_id = ${postId} LIMIT 1
		`, (error, result, field) => {
			result[0].photo_id = postId;
			result[0].isLike = isLike;

			return res.json({stateLike: result[0]});
		});
	});
});

module.exports = router;