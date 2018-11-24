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

router.get('/posts', (req, res)=> {
	db.query(`
		SELECT 
			photo.photo_id,
			photo.photo_600,
			photo.user_id,
			photo.photo_timestamp,
			photo_dinamic.photo_title,
			photo_dinamic.photo_desc,
			photo_dinamic.photo_likes,
			photo_dinamic.photo_comments,
			users_dinamic.user_name,
			avatars.avatar_50,
			likes.like_id
		FROM photo
		JOIN photo_dinamic ON photo.photo_id = photo_dinamic.photo_id
		JOIN users_dinamic ON photo.user_id = users_dinamic.user_id
		LEFT JOIN avatars ON avatars.user_id = users_dinamic.user_id
		LEFT OUTER JOIN follows ON follows.follower_id = ${req.user}
		LEFT OUTER JOIN likes ON likes.photo_id = photo.photo_id
			&& likes.user_id = follows.follower_id
		WHERE photo.user_id = follows.who_id 
			ORDER BY photo.photo_timestamp DESC
	`, (error, result, field) => {
		return res.json({feedPosts: result});
	});
});


module.exports = router;