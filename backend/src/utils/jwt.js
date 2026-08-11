const jwt = require("jsonwebtoken");

const { env } = require("../config/env");

function signToken(payload) {
  if (!env.jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

function verifyToken(token) {
  if (!env.jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.verify(token, env.jwtSecret);
}

module.exports = { signToken, verifyToken };
