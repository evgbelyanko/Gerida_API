const config = require('../config');
const multer = require('multer');
const generateFileName = require(`${__dirname}/generateFileName`);

const storage = multer.diskStorage({
		destination: function (req, file, callback) {
			const {
				tmp,
				absolutePath
			} = config.cloud;

			callback(null, absolutePath + tmp);
		},
		filename: function (req, file, callback) {
			callback(null, generateFileName(new Date()));
		}
	});
const upload = multer({ storage : storage}).single('file');

module.exports = upload;