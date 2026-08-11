const nodemailer = require("nodemailer");

const { decrypt } = require("./encryption");

function createTransporter(smtpConfig) {
  return nodemailer.createTransport({
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    auth: {
      user: smtpConfig.username,
      pass: decrypt(smtpConfig.password),
    },
  });
}

module.exports = { createTransporter };
