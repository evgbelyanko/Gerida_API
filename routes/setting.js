const express = require('express');
const router = express.Router();
const mysql = require('mysql');

const db = mysql.createConnection({
				host: 'localhost',
				user: 'app',
				password: 'appappapp',
				database: 'app'
			});


router.get('/getInfo', function (req, res) {
	const userId = req.query.id

	db.query(`
		SELECT 
			users_dinamic.user_name,
			users_dinamic.user_desc,
			users_dinamic.country_id,
			users_dinamic.user_website,
			avatars.avatar_150
		FROM users_dinamic
		LEFT JOIN avatars ON avatars.user_id = users_dinamic.user_id
		LEFT OUTER JOIN country ON country.country_id = users_dinamic.country_id
		WHERE users_dinamic.user_id = ${req.session.user.id} LIMIT 1
	`, function (error, result, field) {
		if (error) throw error;

		return res.json(result[0]);
	});

});


module.exports = router;