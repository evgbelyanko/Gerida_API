const express = require('express');
const app = express();
const server = require('http').createServer(app);

const expressSession = require('express-session');
const redisClient = require('redis').createClient();
const redisStore = require('connect-redis')(expressSession);

const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');


app.use(cookieParser());
app.use(cors({
  origin:['http://localhost:3000'],
  methods:['GET','POST'],
  credentials: true 
}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(expressSession({
	name: 'RedisSession',
	secret: 'DnB07A4QWzCK4CyEdARvZxZkH8WSqBQT',
	resave: true,
	saveUninitialized: true,
	cookie: {
		httpOnly: false,
		secure: false,
		maxAge: 3600000 // 1 hour
	},
	store: new redisStore({ 
	  host: 'localhost',
	  port: 6379, 
	  client: redisClient
	})
}));

const map = require('./routes/map');
const menu = require('./routes/menu');
const feed = require('./routes/feed');
const auth = require('./routes/auth');
const search = require('./routes/search');
const follows = require('./routes/follows');
const profile = require('./routes/profile');
const setting = require('./routes/setting');
const photoview = require('./routes/photoview');


function protectedSection(req, res, next) {
	if(!req.session.user){
		console.log('not authorized')
		res.status(401).send({error: 401})
	} else {
		next();
	}
}

app.all('/*', function(req, res, next) {
	res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
	res.header('Access-Control-Allow-Credentials', true);
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});
app.use('/auth', auth);
app.use('/map', protectedSection, map);
app.use('/menu', protectedSection, menu);
app.use('/feed', protectedSection, feed);
app.use('/search', protectedSection, search);
app.use('/follows', protectedSection, follows);
app.use('/profile', protectedSection, profile);
app.use('/setting', protectedSection, setting);
app.use('/photoview', protectedSection, photoview);










server.listen(8000);
console.log(`API is running, port :8000`);