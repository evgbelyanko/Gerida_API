const config = require('../config.json');

const express = require('express');
const router = express.Router();
const mysql = require('mysql');
const passport = require('passport');
const VKontakteStrategy = require('passport-vkontakte').Strategy;

const db = mysql.createConnection({
				host: config.db.host,
				user: config.db.user,
				password: config.db.password,
				database: config.db.database
			});

passport.use(new VKontakteStrategy({
		clientID:     '6704784',
		clientSecret: 'lrb5ZO65Wma5HPB6puM4',
		callbackURL:  `${config.serverUrl}/auth/vkontakte`
	}, (accessToken, refreshToken, params, profile, done) => { done(null, profile) }
));

router.get('/vkontakte',
	passport.authenticate('vkontakte', { failureRedirect: '/auth' }), (req, res) => {

	db.query(`
		SELECT user_id 
		FROM users 
		WHERE user_id = ${req.user.id}`
		, (error, result) => {
			if(result[0] == null) res.redirect(`${config.clientUrl}/auth`);
	});

	res.redirect(`${config.clientUrl}?set_userId=${req.user.id}`);
});

router.post('/logout', function(req, res){
	req.session.destroy();
	res.end();
})

module.exports = router;