const express = require('express');
const router = express.Router();
const mysql = require('mysql');

var db = mysql.createConnection({
				host: '176.9.198.165',
				user: 'api',
				password: '223O2EOJAy',
				database: 'app'
			});


router.get('/post', function (req, res) {
	const postId = req.query.id
	const startLimit = 0;
	const countLimit = 10;
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
				ORDER BY comment_id DESC LIMIT ${startLimit}, ${countLimit}
		`, function (error, result2, field) {
			if (error) throw error;

			props.postInfo = result1[0];
			props.postComments = result2;

			return res.json(props);
		});
	});
});


module.exports = router;