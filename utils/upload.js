const multer = require('multer');

const storage = multer.diskStorage({
		destination: function (req, file, callback) {
			const testPath = 'C:/AppServ/www/';

			callback(null, testPath + '/cloud/tmp/');
		},
		filename: function (req, file, callback) {
			const date = new Date()
			const day = date.getDate();
			const hours = date.getHours();
			const minutes = date.getMinutes();
			const seconds = date.getSeconds();
			const milliseconds = date.getMilliseconds();
			const time = `${day}${hours}${minutes}${seconds}${milliseconds}`;
			const randStr = (Math.random()*1e16).toString(32).replace(/\./g, '');

			callback(null, `${time}_${randStr}.jpg`);
		}
	});
const upload = multer({ storage : storage}).single('file');

module.exports = upload;