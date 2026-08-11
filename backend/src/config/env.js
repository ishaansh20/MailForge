const dotenv = require("dotenv");

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || "",
  jwtSecret: process.env.JWT_SECRET || "",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  smtpEncryptionKey: process.env.SMTP_ENCRYPTION_KEY || "",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  brevoWebhookSecret: process.env.BREVO_WEBHOOK_SECRET || "",
};

module.exports = { env };
