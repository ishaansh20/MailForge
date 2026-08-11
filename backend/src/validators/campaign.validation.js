const mongoose = require("mongoose");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCampaignPayload(payload) {
  const errors = [];

  if (!payload.name || payload.name.trim().length < 2) {
    errors.push({ field: "name", message: "Name must be at least 2 characters" });
  }

  if (!payload.subject || payload.subject.trim().length < 1) {
    errors.push({ field: "subject", message: "Subject is required" });
  }

  if (!payload.body || payload.body.trim().length < 1) {
    errors.push({ field: "body", message: "Email body is required" });
  }

  if (!payload.smtpConfig || !mongoose.isValidObjectId(payload.smtpConfig)) {
    errors.push({ field: "smtpConfig", message: "A valid SMTP configuration must be selected" });
  }

  if (payload.targetList && !mongoose.isValidObjectId(payload.targetList)) {
    errors.push({ field: "targetList", message: "Selected list is not valid" });
  }

  return errors;
}

function validateSchedulePayload(payload) {
  const errors = [];

  if (!payload.scheduledAt) {
    errors.push({ field: "scheduledAt", message: "Scheduled date and time is required" });
  } else {
    const scheduledDate = new Date(payload.scheduledAt);

    if (Number.isNaN(scheduledDate.getTime())) {
      errors.push({ field: "scheduledAt", message: "Scheduled date and time is invalid" });
    } else if (scheduledDate.getTime() <= Date.now()) {
      errors.push({ field: "scheduledAt", message: "Scheduled time must be in the future" });
    }
  }

  return errors;
}

function validateSendTestCampaignPayload(payload) {
  const errors = [];

  if (!payload.smtpConfig || !mongoose.isValidObjectId(payload.smtpConfig)) {
    errors.push({ field: "smtpConfig", message: "A valid SMTP configuration must be selected" });
  }

  if (!payload.subject || payload.subject.trim().length < 1) {
    errors.push({ field: "subject", message: "Subject is required" });
  }

  if (!payload.body || payload.body.trim().length < 1) {
    errors.push({ field: "body", message: "Email body is required" });
  }

  if (!payload.to || !emailPattern.test(payload.to)) {
    errors.push({ field: "to", message: "A valid recipient email address is required" });
  }

  return errors;
}

module.exports = { validateCampaignPayload, validateSchedulePayload, validateSendTestCampaignPayload };
