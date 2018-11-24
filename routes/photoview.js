const config = require('../config.json');
const resError = require('../utils/resError');

const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const Validator = require('fastest-validator');

const fs = require('fs');
const url = require('url');

const db = mysql.createConnection({
				host: config.db.host,
				user: config.db.user,
				password: config.db.password,
				database: config.db.database
			});


router.get('/post', (req, res) => {
	const postId = +req.query.id
	let props = {};

	const schema = new Validator().compile({
		postId: { type: 'number', empty: false },
		props: { type: 'object' },
	})

	const check = schema({
		postId: postId,
		props: props,
	});

	if(check !== true) return resError(res, 400);

	db.query(`
		SELECT 
			photo.user_id,
			photo.photo_id,
			photo.photo_600,
			photo.photo_timestamp,
			users_dinamic.user_name,
			photo_dinamic.photo_title,
			photo_dinamic.photo_desc,
			photo_dinamic.photo_comments,
			photo_dinamic.photo_likes,
			avatars.avatar_50,
			likes.like_id
		FROM photo 
		JOIN users_dinamic ON photo.user_id = users_dinamic.user_id
		JOIN photo_dinamic ON photo.photo_id = photo_dinamic.photo_id
		LEFT JOIN avatars ON avatars.user_id = users_dinamic.user_id
		LEFT OUTER JOIN likes ON photo.photo_id = likes.photo_id 
			&& likes.user_id = "${req.user}"
		WHERE photo.photo_id = "${+postId}" LIMIT 1
	`, (error, result, field) => {
		if(!result || !result.length) return resError(res, 404);
		props.postInfo = result[0];

		db.query(`
			SELECT
				comments.comment_id,
				users_dinamic.user_id,
				users_dinamic.user_name,
				comments.comment_text,
				avatars.avatar_50
			FROM comments 
			JOIN users_dinamic 
				ON comments.user_id = users_dinamic.user_id
			LEFT JOIN avatars ON avatars.user_id = users_dinamic.user_id
			WHERE photo_id = "${+postId}"
				ORDER BY comment_id DESC LIMIT 0, 10
		`, (error, result, field) => {
			props.postComments = result;

			return res.json(props);
		});
	});
});

router.get('/loadMoreComments', (req, res) => {
	const postId = +req.query.postId
	const startLimit = +req.query.startLimit
	const countLimit = +req.query.countLimit

	const schema = new Validator().compile({
		postId: { type: 'number', empty: false },
		startLimit: { type: 'number', empty: false },
		countLimit: { type: 'number', empty: false },
	})

	const check = schema({
		postId: postId,
		startLimit: startLimit,
		countLimit: countLimit,
	});

	if(check !== true) return resError(res, 400);

	db.query(`
		SELECT
			comments.comment_id,
			users_dinamic.user_id,
			users_dinamic.user_name,
			comments.comment_text,
			avatars.avatar_50
		FROM comments 
		JOIN users_dinamic 
			ON comments.user_id = users_dinamic.user_id
		LEFT JOIN avatars ON avatars.user_id = users_dinamic.user_id
		WHERE photo_id = "${+postId}"
			ORDER BY comment_id DESC LIMIT "${+startLimit}", "${+countLimit}"
	`, (error, result, field) => {
		result = result ? result : {loadMoreComments: false};

		return res.json(result);
	});
});

router.post('/changeTextBox', (req, res) => {
	const postId = +req.body.postId;
	const postTitle = req.body.postTitle.replace(/\r?\n?\s+/g, ' ').trim();
	const postDesc = req.body.postDesc.replace(/\s+/g, ' ').trim();

	const schema = new Validator().compile({
		postId: { type: 'number', empty: false },
		postTitle: { type: 'string', max: 50 },
		postDesc: { type: 'string', max: 250 },
	})

	const check = schema({
		postId: postId,
		postTitle: postTitle,
		postDesc: postDesc,
	});

	if(check !== true) return resError(res, 400);

	db.query(`
		UPDATE photo_dinamic a
		JOIN photo b ON b.photo_id = a.photo_id
		SET 
			a.photo_title = "${postTitle}",
			a.photo_desc = "${postDesc}"
		WHERE a.photo_id = "${+postId}"
			AND b.user_id = "${req.user}"
	`, (error, result, field) => {
		return res.json({changeDesc: 'ok'});
	});
});

router.post('/sendComment', (req, res) => {
	const postId = +req.body.postId;
	const commentText = req.body.commentText.replace(/\s+/g, ' ').trim();

	const schema = new Validator().compile({
		postId: { type: 'number', empty: false },
		commentText: { type: 'string', empty: false, min: 1, max: 250 },
	})

	const check = schema({
		postId: postId,
		commentText: commentText,
	});

	if(check !== true) return resError(res, 400);

	db.query(`
		INSERT INTO comments (
			photo_id,
			comment_text,
			user_id 
		) VALUES (
			"${+postId}",
			"${commentText}",
			"${req.user}"
		)
	`);

	db.query(`
		UPDATE photo_dinamic
		SET photo_comments = photo_comments + 1
		WHERE photo_id = "${+postId}"
	`);

	db.query(`
		SELECT
			comments.comment_id,
			comments.comment_text,
			comments.user_id,
			users_dinamic.user_name,
			avatars.avatar_50
		FROM comments
		JOIN users_dinamic ON users_dinamic.user_id = comments.user_id
		JOIN avatars ON avatars.user_id = users_dinamic.user_id
		WHERE comments.user_id = "${req.user}"
			ORDER BY comments.comment_id DESC LIMIT 1
	`, (error, result, field) => {
		return res.json(result[0]);
	});
});

router.post('/deletePost', (req, res) => {
	const postId = +req.body.postId;

	const schema = new Validator().compile({
		postId: { type: 'number', empty: false },
	})

	const check = schema({
		postId: postId,
	});

	if(check !== true) return resError(res, 400);

	db.query(`
		SELECT
			photo_250,
			photo_600
		FROM photo
		WHERE user_id = "${req.user}"
			AND photo_id = "${+postId}"
	`, (error, result, field) => {
		const oldPath250 = url.parse(result[0].photo_250).pathname;
		const oldPath600 = url.parse(result[0].photo_600).pathname;

		fs.unlink(config.cloud.pathForWindows + oldPath250, err => {});
		fs.unlink(config.cloud.pathForWindows + oldPath600, err => {});

		db.query(`
			DELETE
			FROM photo
			WHERE user_id = "${req.user}"
				AND photo_id = "${+postId}"
		`);

		return res.json({deletePost: 'ok'});
	});
});

router.post('/deleteComment', (req, res) => {
	const postId = +req.body.postId;
	const commentId = +req.body.commentId;

	const schema = new Validator().compile({
		postId: { type: 'number', empty: false },
		commentId: { type: 'number', empty: false },
	})

	const check = schema({
		postId: postId,
		commentId: commentId,
	});

	if(check !== true) return resError(res, 400);

	db.query(`
		SELECT 
			comments.user_id
		FROM comments
		WHERE comments.comment_id = "${commentId}"
	`, (error, result, field) => {
		if(+result[0].user_id === req.user){
			db.query(`
				UPDATE photo_dinamic
				SET photo_comments = photo_comments - 1
				WHERE photo_id = "${+postId}"
			`);
			db.query(`
				DELETE 
				FROM comments 
				WHERE comment_id = "${commentId}"
					AND user_id = "${req.user}"
			`);
		}

		return res.json({deleteComment: 'ok'});
	});
});


module.exports = router;