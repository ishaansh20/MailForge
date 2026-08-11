const mongoose = require("mongoose");

const SMTP_STATUS = {
  UNTESTED: "untested",
  SUCCESS: "success",
  FAILED: "failed",
};

const SMTP_TRANSPORT = {
  SMTP: "smtp",
  BREVO_API: "brevo_api",
};

const smtpSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: 2,
      maxlength: 100,
    },
    transport: {
      type: String,
      enum: Object.values(SMTP_TRANSPORT),
      default: SMTP_TRANSPORT.SMTP,
    },
    host: {
      type: String,
      required: true,
      trim: true,
    },
    port: {
      type: Number,
      required: true,
      min: 1,
      max: 65535,
    },
    secure: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    fromName: {
      type: String,
      required: true,
      trim: true,
    },
    fromEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: Object.values(SMTP_STATUS),
      default: SMTP_STATUS.UNTESTED,
    },
    lastTestedAt: {
      type: Date,
      default: null,
    },
    lastTestError: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

const SmtpConfig = mongoose.model("SmtpConfig", smtpSchema);

module.exports = { SmtpConfig, SMTP_STATUS, SMTP_TRANSPORT };
