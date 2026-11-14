const bcrypt = require("bcryptjs");

const ROUNDS = 10;

function hashSecret(value) {
  return bcrypt.hash(String(value), ROUNDS);
}

function verifySecret(value, hash) {
  return bcrypt.compare(String(value), hash);
}

module.exports = { hashSecret, verifySecret };
