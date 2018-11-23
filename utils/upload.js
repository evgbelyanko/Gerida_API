const config = require('../config');
const multer = require('multer');
const generateFileName = require('./generateFileName');

const storage = multer.diskStorage({
		destination: function (req, file, callback) {
			const {
				tmp,
				pathForWindows
			} = config.cloud;

			callback(null, pathForWindows + tmp);
		},
		filename: function (req, file, callback) {
			callback(null, generateFileName(new Date()));
		}
	});
const upload = multer({ storage : storage}).single('file');

module.exports = upload;