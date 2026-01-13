const jwt = require('jsonwebtoken');
const { promisify } = require('util');

const sign = (payload, secret, options) => jwt.sign(payload, secret, options);
const verify = promisify(jwt.verify);

module.exports = { sign, verify }; 