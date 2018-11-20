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


router.get('/post', function (req, res) {
	const postId = req.query.id
	let props = {};

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
			&& likes.user_id = 162117576
		WHERE photo.photo_id = ${postId} LIMIT 1
	`, function (error, result1, field) {
		if (error) throw error;
		

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
			WHERE photo_id = ${postId}
				ORDER BY comment_id DESC LIMIT 0, 10
		`, function (error, result2, field) {
			if (error) throw error;

			props.postInfo = result1[0];
			props.postComments = result2;

			return res.json(props);
		});
	});
});

router.get('/loadMoreComments', function (req, res) {
	const postId = req.query.postId
	const startLimit = req.query.startLimit
	const countLimit = req.query.countLimit

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
		WHERE photo_id = ${postId}
			ORDER BY comment_id DESC LIMIT ${startLimit}, ${countLimit}
	`, function (error, result, field) {
		if (error) throw error;

		result = result ? result : {loadMoreComments: false};

		return res.json(result);
	});
});

router.post('/changeTextBox', function (req, res) {
	const postId = req.body.postId
	const postTitle = req.body.postTitle
	const postDesc = req.body.postDesc

	db.query(`
		UPDATE photo_dinamic a
		JOIN photo b ON b.photo_id = a.photo_id
		SET 
			a.photo_title = "${postTitle}",
			a.photo_desc = "${postDesc}"
		WHERE a.photo_id = ${postId}
			AND b.user_id = ${req.user}
	`, function (error, result, field) {
		if (error) throw error;
		return res.json({changeDesc: 'ok'});
	});
});

router.post('/sendComment', function (req, res) {
	const postId = req.body.postId
	const commentText = req.body.commentText

	db.query(`
		INSERT INTO comments (
			photo_id,
			comment_text,
			user_id 
		) VALUES (
			${postId},
			"${commentText}",
			${req.user}
		)
	`);

	db.query(`
		UPDATE photo_dinamic
		SET photo_comments = photo_comments + 1
		WHERE photo_id = ${postId}
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
		WHERE comments.user_id = ${req.user}
			ORDER BY comments.comment_id DESC LIMIT 1
	`, function (error, result, field) {
		if (error) throw error;

		return res.json(result[0]);
	});
});

router.post('/deletePost', function (req, res) {
	const postId = req.body.postId

	db.query(`
		SELECT
			photo_250,
			photo_600
		FROM photo
		WHERE user_id = ${req.user}
			AND photo_id = ${postId}
	`, function (error, result, field) {
		if (error) throw error;

/*		unlink($_SERVER['DOCUMENT_ROOT'].parse_url($row[0], PHP_URL_PATH));
		unlink($_SERVER['DOCUMENT_ROOT'].parse_url($row[1], PHP_URL_PATH));*/
		db.query(`
			DELETE
			FROM photo
			WHERE user_id = ${req.user}
				AND photo_id = ${postId}
		`);

		return res.json({deletePost: 'ok'});
	});
});

router.post('/deleteComment', function (req, res) {
	const postId = req.body.postId
	const commentId = req.body.commentId

	db.query(`
		SELECT 
			comments.user_id
		FROM comments
		WHERE comments.comment_id = ${commentId}
	`, function (error, result, field) {
		if (error) throw error;

		if(+result[0].user_id === req.user){
			db.query(`
				UPDATE photo_dinamic
				SET photo_comments = photo_comments - 1
				WHERE photo_id = ${postId}
			`);
			db.query(`
				DELETE 
				FROM comments 
				WHERE comment_id = ${commentId}
					AND user_id = ${req.user}
			`);
		}

		return res.json({deleteComment: 'ok'});
	});
});


module.exports = router;