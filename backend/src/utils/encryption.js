const crypto = require("crypto");
const { env } = require("../config/env");

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

function getEncryptionKey() {
  if (!env.smtpEncryptionKey) {
    throw new Error("SMTP_ENCRYPTION_KEY is not configured");
  }

  const key = Buffer.from(env.smtpEncryptionKey, "hex");

  if (key.length !== 32) {
    throw new Error("SMTP_ENCRYPTION_KEY must be a 64-character hex string (32 bytes)");
  }

  return key;
}

function encrypt(plainText) {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([cipher.update(plainText, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString("hex"), authTag.toString("hex"), encrypted.toString("hex")].join(":");
}

function decrypt(payload) {
  const key = getEncryptionKey();
  const [ivHex, authTagHex, encryptedHex] = payload.split(":");

  if (!ivHex || !authTagHex || !encryptedHex) {
    throw new Error("Invalid encrypted payload format");
  }

  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const encrypted = Buffer.from(encryptedHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

  return decrypted.toString("utf8");
}

module.exports = { encrypt, decrypt };
