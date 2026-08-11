const crypto = require("crypto");
const { ApiError } = require("../utils/ApiError");
const { signToken } = require("../utils/jwt");
const { hashPassword, comparePassword } = require("../utils/password");
const { createTransporter } = require("../utils/smtp.utils");
const { env } = require("../config/env");
const { User } = require("../models/user.model");
const { SmtpConfig } = require("../models/smtp.model");

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function hashResetToken(rawToken) {
  return crypto.createHash("sha256").update(rawToken).digest("hex");
}

async function sendPasswordResetEmail(user, rawToken) {
  const smtpConfig =
    (await SmtpConfig.findOne({ isDefault: true, isActive: true }).select(
      "+password",
    )) || (await SmtpConfig.findOne({ isActive: true }).select("+password"));

  if (!smtpConfig) {
    console.error(
      `Password reset requested for ${user.email}, but no active SMTP configuration exists`,
    );
    return;
  }

  const resetUrl = `${env.frontendUrl}/reset-password/${rawToken}`;
  const transporter = createTransporter(smtpConfig);

  await transporter.sendMail({
    from: `"${smtpConfig.fromName}" <${smtpConfig.fromEmail}>`,
    to: user.email,
    subject: "Reset your Nuform Social Workspace password",
    html: `<p>Hi ${user.name},</p><p>We received a request to reset your Nuform Social Workspace password. Click the link below to choose a new one — this link expires in 1 hour.</p><p><a href="${resetUrl}">Reset your password</a></p><p>If you didn't request this, you can safely ignore this email.</p>`,
  });
}

function sanitizeUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function registerUser({ name, email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new ApiError(
      409,
      "An account with this email already exists",
      "EMAIL_ALREADY_EXISTS",
    );
  }

  const hashedPassword = await hashPassword(password);

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
  });

  const token = signToken({ userId: user._id.toString() });

  return {
    user: sanitizeUser(user),
    token,
  };
}

async function loginUser({ email, password }) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select(
    "+password",
  );

  if (!user) {
    throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const passwordMatches = await comparePassword(password, user.password);

  if (!passwordMatches) {
    throw new ApiError(401, "Invalid email or password", "INVALID_CREDENTIALS");
  }

  const token = signToken({ userId: user._id.toString() });

  return {
    user: sanitizeUser(user),
    token,
  };
}

async function getCurrentUser(userId) {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  return sanitizeUser(user);
}

async function updateProfile(userId, { name, email }) {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (normalizedEmail !== user.email) {
    const existingUser = await User.findOne({
      email: normalizedEmail,
      _id: { $ne: userId },
    });

    if (existingUser) {
      throw new ApiError(
        409,
        "An account with this email already exists",
        "EMAIL_ALREADY_EXISTS",
      );
    }

    user.email = normalizedEmail;
  }

  user.name = name.trim();
  await user.save();

  return sanitizeUser(user);
}

async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  const passwordMatches = await comparePassword(currentPassword, user.password);

  if (!passwordMatches) {
    throw new ApiError(
      400,
      "Current password is incorrect",
      "INVALID_CURRENT_PASSWORD",
    );
  }

  user.password = await hashPassword(newPassword);
  await user.save();
}

async function requestPasswordReset(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (user) {
    const rawToken = crypto.randomBytes(32).toString("hex");

    user.passwordResetTokenHash = hashResetToken(rawToken);
    user.passwordResetExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await user.save();

    try {
      await sendPasswordResetEmail(user, rawToken);
    } catch (error) {
      console.error(
        `Failed to send password reset email to ${user.email}:`,
        error.message,
      );
    }
  }
}

async function resetPassword(rawToken, newPassword) {
  const tokenHash = hashResetToken(rawToken);
  const user = await User.findOne({
    passwordResetTokenHash: tokenHash,
    passwordResetExpires: { $gt: new Date() },
  }).select("+passwordResetTokenHash +passwordResetExpires");

  if (!user) {
    throw new ApiError(
      400,
      "This reset link is invalid or has expired",
      "INVALID_RESET_TOKEN",
    );
  }

  user.password = await hashPassword(newPassword);
  user.passwordResetTokenHash = null;
  user.passwordResetExpires = null;
  await user.save();
}

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
};
