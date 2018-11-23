const fileName = (date) => {
	const day = date.getDate();
	const hours = date.getHours();
	const minutes = date.getMinutes();
	const seconds = date.getSeconds();
	const milliseconds = date.getMilliseconds();
	const time = `${day}${hours}${minutes}${seconds}${milliseconds}`;
	const randStr = (Math.random()*1e16).toString(32).replace(/\./g, '');

	return `${time}_${randStr}.jpg`;
}

module.exports = fileName;