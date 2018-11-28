const config = require(`${__dirname}/config.json`);
const resError = require(`${__dirname}/utils/resError`);

const domain = require('domain');
const errorHandler = require('express-async-error').Handler

const express = require('express')
const app = express();
const fs = require('fs');
const options = {
  key: fs.readFileSync(`${__dirname}/ssl/privateKey.key`),
  cert: fs.readFileSync(`${__dirname}/ssl/certificate.crt`)
};
const server = require(config.protocol).createServer(config.protocol === 'https' ? options : null, app);

const expressSession = require('express-session');
const redisClient = require('redis').createClient();
const redisStore = require('connect-redis')(expressSession);

const cors = require('cors');
const passport = require('passport');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

app.use(errorHandler())
app.use(cookieParser());
app.use(cors({
  origin: config.allowOrigin,
  methods:['GET','POST'],
  credentials: true 
}));
app.use(bodyParser.urlencoded({ 
	extended: true,
	limit: '5mb'
}));
app.use(bodyParser.json());

app.use(expressSession({
	name: 'RedisSession',
	secret: 'DnB07A4QWzCK4CyEdARvZxZkH8WSqBQT',
	resave: true,
	saveUninitialized: false,
	rolling: true,
	store: new redisStore({ 
		host: 'localhost',
		port: 6379, 
		client: redisClient
	}),
	cookie: {
		httpOnly: false,
		secure: false,
		maxAge: 604800000 // week
	},
}));

app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser((user, done) => { done(null, user.appUserId); });
passport.deserializeUser((id, done) => { done(null, id); });

function protectedSection(req, res, next) {
	!req.user ? resError(res, 401) : next();
}

app.all('/*', (req, res, next) => {
	res.header('Access-Control-Allow-Origin', config.allowOrigin.join());
	res.header('Access-Control-Allow-Credentials', true);
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
	next();
});
app.use('/auth', require('./routes/auth'));
app.use('/camera', require('./routes/camera'));
app.use('/map', protectedSection, require('./routes/map'));
app.use('/menu', protectedSection, require('./routes/menu'));
app.use('/feed', protectedSection, require('./routes/feed'));
app.use('/search', protectedSection, require('./routes/search'));
app.use('/follows', protectedSection, require('./routes/follows'));
app.use('/profile', protectedSection, require('./routes/profile'));
app.use('/setting', protectedSection, require('./routes/setting'));
app.use('/photoview', protectedSection, require('./routes/photoview'));

app.listen(8000);

console.log(`API is running, port :8000`);