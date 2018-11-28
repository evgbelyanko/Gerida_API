const config = require(`../config.json`);
const generateFileName = require(`../utils/generateFileName`);

const express = require('express');
const router = express.Router();
const mysql = require('mysql');

const fs = require('fs');
const sharp = require('sharp');
const request = require('request');
const passport = require('passport');
const VKontakteStrategy = require('passport-vkontakte').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const GoogleStrategy = require('passport-google-oauth').OAuthStrategy;

const db = mysql.createConnection({
				host: config.db.host,
				user: config.db.user,
				password: config.db.password,
				database: config.db.database
			});

passport.use(new VKontakteStrategy({
		clientID:     '6704784',
		clientSecret: 'lrb5ZO65Wma5HPB6puM4',
		callbackURL:  `${config.protocol + config.serverUrl}/auth/vkontakte`,
		profileFields: ['bdate', 'photo_200']
	}, (accessToken, refreshToken, params, profile, done) => {
		const scheme = {
			bdate: profile._json.bdate,
			provider: profile.provider,
			profileId: profile._json.id,
			displayName: profile.displayName,
			photo_200: profile._json.photo_200,
			last_name: profile._json.last_name,
			first_name: profile._json.first_name,
		};
		verification(profile, done, scheme);
		console.log(`${config.protocol + config.serverUrl}/auth/vkontakte`)
	}
));

passport.use(new FacebookStrategy({
		clientID: '562106614218636',
		clientSecret: 'de40b7632a7a80955b2eb38580516956',
		callbackURL: `${config.protocol + config.serverUrl}/auth/facebook`,
		profileFields: ['id', 'displayName', 'first_name', 'last_name', 'birthday', 'picture.type(large)' ]
	}, (accessToken, refreshToken, profile, cb) => {
		const scheme = {
			provider: profile.provider,
			profileId: profile._json.id,
			displayName: profile.displayName,
			last_name: profile._json.last_name,
			first_name: profile._json.first_name,
			photo_200: profile._json.picture.data.url,
			bdate: profile._json.birthday.replace(/\//g,'.')
		};
		verification(profile, cb, scheme);
	}
));

passport.use(new GoogleStrategy({
		consumerKey: '37283406293-hv292ahaibvul14a8qfljk5bj6v6pad4.apps.googleusercontent.com',
		consumerSecret: '-154h-L9Q6uYKqOxSksJWuep',
		callbackURL: `${config.protocol + config.serverUrl}/auth/google`,
		//profileFields: ['id', 'displayName', 'first_name', 'last_name', 'birthday', 'picture.type(large)' ]
	}, (accessToken, refreshToken, profile, cb) => {
		console.log(profile)
/*		const scheme = {
			provider: profile.provider,
			profileId: profile._json.id,
			displayName: profile.displayName,
			last_name: profile._json.last_name,
			first_name: profile._json.first_name,
			photo_200: profile._json.picture.data.url,
			bdate: profile._json.birthday.replace(/\//g,'.')
		};
		verification(profile, cb, scheme);*/
	}
));

router.get('/vkontakte',
	passport.authenticate('vkontakte', { failureRedirect: '/auth' }), (req, res) => {
	successfulAuth(req, res);
});

router.get('/facebook',
	passport.authenticate('facebook', { failureRedirect: '/auth' }), (req, res) => {
	successfulAuth(req, res);
});

router.get('/google',
	passport.authenticate('google', { failureRedirect: '/auth' }), (req, res) => {
	//successfulAuth(req, res);
});

router.post('/logout', function(req, res){
	req.session.destroy();
	res.end();
})

const successfulAuth = (req, res) => { 
	res.redirect(`${config.protocol + config.clientUrl}?set_userId=${req.user.appUserId}`) 
}

const verification = (profile, done, scheme) => {
	db.query(`
		SELECT 
			max_id, 
			(SELECT user_id FROM users WHERE user_socialnetwork_id = ${scheme.profileId} LIMIT 1) AS user_id 
		FROM (SELECT max(user_id) AS max_id FROM users LIMIT 1) AS query
	`, (error, result) => {
		console.log(result)
		const {
			max_id,
			user_id
		} = result[0];

		switch(user_id) {
			case null:
				profile.appUserId = max_id + 1;
				scheme.userId = profile.appUserId;
				registration(scheme);
				break;
			default:
				profile.appUserId = user_id;
		}

		done(null, profile);
	})
}

const registration = (scheme) => {
	const {
		tmp,
		avatars50,
		avatars150,
		absolutePath,
	} = config.cloud;
	const fileName = generateFileName(new Date());

	request(scheme.photo_200, {encoding: 'binary'}, function(error, response, body) {
		const file = absolutePath + tmp + fileName;

		fs.writeFile(file, body, 'binary', function (err) {
			fs.readFile(file, (err, data) => {
				sharp(data)
					.resize(50, 50)
					.toFile(absolutePath + avatars50 + fileName);

				sharp(data)
					.resize(150, 150)
					.toFile(absolutePath + avatars150 + fileName);
				fs.unlink(file, err => {});
			});
		});
	});

	db.query(`
		INSERT INTO users (
			user_id,
			user_first_name,
			user_last_name,
			user_bdate,
			user_socialnetwork,
			user_socialnetwork_id
		) VALUES (
			"${scheme.userId}",
			"${scheme.first_name}",
			"${scheme.last_name}",
			"${scheme.bdate}",
			"${scheme.provider}",
			"${scheme.profileId}"
		)
	`);

	db.query(`
		INSERT INTO users_dinamic (
			user_id,
			user_name
		) VALUES (
			"${scheme.userId}",
			"${scheme.displayName}"
		)
	`);

	db.query(`
		INSERT INTO avatars (
			user_id,
			avatar_50,
			avatar_150
		) VALUES (
			"${scheme.userId}",
			"${config.cloudUrl + avatars50 + fileName}",
			"${config.cloudUrl + avatars150 + fileName}"
		)
	`);
}

module.exports = router;