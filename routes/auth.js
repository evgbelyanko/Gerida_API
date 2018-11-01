const express = require('express');
const router = express.Router();

const mysql = require('mysql');
const generateToken = require('../utils/generateToken.js');
//const verifyToken = require('../utils/verifyToken.js');

const db = mysql.createConnection({
				host: '176.9.198.165',
				user: 'api',
				password: '223O2EOJAy',
				database: 'app'
			});


router.post('/vkontakte', (req, res) => {
  	const userId = +req.body.userid
  	const token = generateToken({id: userId})
	const sql = `SELECT user_id FROM users WHERE user_id = ${userId}`  

	db.query(sql, function(error, result){
		if(error){ res.status(500).send() }

		req.session.user = {
			id: userId,
			token: token
		}

		console.log('authorized: ' + req.session.cookie._expires)

		res.json({
			success: true,
			user: req.session.user
		});
	});
});



router.post('/logout', function(req, res){
	req.session.destroy();
	res.end();
})


router.post('/refresh', function(req, res){
    const token = req.body.token;

/*    console.log('token received: '+token)
    console.log('session token: '+req.session.user.token)*/

    if(token === req.session.user.token){
 		res.status(200).json({continue: 'true'})
	} else {
		console.log(`continue: 'false'`)
		res.status(401).send()
	}
})

router.post('/me',function(req,res){  
    res.send(req.session)
})

module.exports = router;