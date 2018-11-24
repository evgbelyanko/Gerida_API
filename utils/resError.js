const resError = (res, number) => {
	return res.status(number).send({error: number});
}

module.exports = resError;