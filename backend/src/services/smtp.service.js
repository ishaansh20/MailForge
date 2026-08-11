const { ApiError } = require("../utils/ApiError");
const { encrypt } = require("../utils/encryption");
const { createTransporter } = require("../utils/smtp.utils");
const { verifyBrevoApiKey, sendViaBrevoApi } = require("../utils/brevoApi.utils");
const { SmtpConfig, SMTP_STATUS, SMTP_TRANSPORT } = require("../models/smtp.model");

function sanitizeSmtpConfig(config) {
  return {
    id: config._id.toString(),
    name: config.name,
    transport: config.transport,
    host: config.host,
    port: config.port,
    secure: config.secure,
    username: config.username,
    fromName: config.fromName,
    fromEmail: config.fromEmail,
    isDefault: config.isDefault,
    isActive: config.isActive,
    status: config.status,
    lastTestedAt: config.lastTestedAt,
    lastTestError: config.lastTestError,
    createdAt: config.createdAt,
    updatedAt: config.updatedAt,
  };
}

async function ensureUniqueName(name, excludeId) {
  const query = { name: name.trim() };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existing = await SmtpConfig.findOne(query);

  if (existing) {
    throw new ApiError(
      409,
      "An SMTP configuration with this name already exists",
      "SMTP_NAME_EXISTS",
    );
  }
}

async function listSmtpConfigs({ page = 1, limit = 10, search = "", status, isActive } = {}) {
  const query = {};

  if (search) {
    const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: searchRegex }, { host: searchRegex }, { fromEmail: searchRegex }];
  }

  if (status) {
    query.status = status;
  }

  if (isActive !== undefined) {
    query.isActive = isActive === "true" || isActive === true;
  }

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (pageNumber - 1) * pageSize;

  const [items, total] = await Promise.all([
    SmtpConfig.find(query).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
    SmtpConfig.countDocuments(query),
  ]);

  return {
    items: items.map(sanitizeSmtpConfig),
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}

async function getSmtpConfigById(id) {
  const config = await SmtpConfig.findById(id);

  if (!config) {
    throw new ApiError(404, "SMTP configuration not found", "SMTP_NOT_FOUND");
  }

  return sanitizeSmtpConfig(config);
}

async function createSmtpConfig(payload) {
  await ensureUniqueName(payload.name);

  const transport = payload.transport === SMTP_TRANSPORT.BREVO_API
    ? SMTP_TRANSPORT.BREVO_API
    : SMTP_TRANSPORT.SMTP;

  const isBrevoApi = transport === SMTP_TRANSPORT.BREVO_API;

  const config = await SmtpConfig.create({
    name: payload.name.trim(),
    transport,
    host: isBrevoApi ? "api.brevo.com" : payload.host.trim(),
    port: isBrevoApi ? 443 : Number(payload.port),
    secure: isBrevoApi ? true : Boolean(payload.secure),
    username: isBrevoApi ? "api-key" : payload.username.trim(),
    password: encrypt(payload.password),
    fromName: payload.fromName.trim(),
    fromEmail: payload.fromEmail.trim().toLowerCase(),
  });

  return sanitizeSmtpConfig(config);
}

async function updateSmtpConfig(id, payload) {
  const config = await SmtpConfig.findById(id);

  if (!config) {
    throw new ApiError(404, "SMTP configuration not found", "SMTP_NOT_FOUND");
  }

  if (payload.name && payload.name.trim() !== config.name) {
    await ensureUniqueName(payload.name, id);
    config.name = payload.name.trim();
  }

  const nextTransport =
    payload.transport === SMTP_TRANSPORT.BREVO_API || payload.transport === SMTP_TRANSPORT.SMTP
      ? payload.transport
      : config.transport;
  const isBrevoApi = nextTransport === SMTP_TRANSPORT.BREVO_API;
  const transportChanged = nextTransport !== config.transport;

  const connectionFieldsChanged =
    transportChanged ||
    (!isBrevoApi && payload.host !== undefined && payload.host.trim() !== config.host) ||
    (!isBrevoApi && payload.port !== undefined && Number(payload.port) !== config.port) ||
    (!isBrevoApi && payload.username !== undefined && payload.username.trim() !== config.username) ||
    Boolean(payload.password);

  config.transport = nextTransport;

  if (isBrevoApi) {
    config.host = "api.brevo.com";
    config.port = 443;
    config.secure = true;
    config.username = "api-key";
  } else {
    if (payload.host !== undefined) config.host = payload.host.trim();
    if (payload.port !== undefined) config.port = Number(payload.port);
    if (payload.secure !== undefined) config.secure = Boolean(payload.secure);
    if (payload.username !== undefined) config.username = payload.username.trim();
  }

  if (payload.fromName !== undefined) config.fromName = payload.fromName.trim();
  if (payload.fromEmail !== undefined) config.fromEmail = payload.fromEmail.trim().toLowerCase();
  if (payload.password) config.password = encrypt(payload.password);

  if (connectionFieldsChanged) {
    config.status = SMTP_STATUS.UNTESTED;
    config.lastTestedAt = null;
    config.lastTestError = null;
  }

  await config.save();

  return sanitizeSmtpConfig(config);
}

async function deleteSmtpConfig(id) {
  const config = await SmtpConfig.findById(id);

  if (!config) {
    throw new ApiError(404, "SMTP configuration not found", "SMTP_NOT_FOUND");
  }

  if (config.isDefault) {
    throw new ApiError(
      400,
      "The default SMTP configuration cannot be deleted",
      "SMTP_DEFAULT_DELETE_FORBIDDEN",
    );
  }

  await config.deleteOne();
}

async function testSmtpConfig(id) {
  const config = await SmtpConfig.findById(id).select("+password");

  if (!config) {
    throw new ApiError(404, "SMTP configuration not found", "SMTP_NOT_FOUND");
  }

  try {
    if (config.transport === SMTP_TRANSPORT.BREVO_API) {
      await verifyBrevoApiKey(config);
    } else {
      const transporter = createTransporter(config);
      await transporter.verify();
    }
    config.status = SMTP_STATUS.SUCCESS;
    config.lastTestError = null;
  } catch (error) {
    config.status = SMTP_STATUS.FAILED;
    config.lastTestError = error.message;
  }

  config.lastTestedAt = new Date();
  await config.save();

  return sanitizeSmtpConfig(config);
}

async function sendTestEmail(id, toEmail) {
  const config = await SmtpConfig.findById(id).select("+password");

  if (!config) {
    throw new ApiError(404, "SMTP configuration not found", "SMTP_NOT_FOUND");
  }

  if (!config.isActive) {
    throw new ApiError(
      400,
      "Inactive SMTP configurations cannot send emails",
      "SMTP_INACTIVE_SEND_FORBIDDEN",
    );
  }

  const subject = "Test Email from Nuform Social Workspace";
  const text = `This is a test email sent using the "${config.name}" SMTP configuration to confirm outbound delivery is working.`;
  const html = `<p>This is a test email sent using the <strong>${config.name}</strong> SMTP configuration to confirm outbound delivery is working.</p>`;

  try {
    if (config.transport === SMTP_TRANSPORT.BREVO_API) {
      const result = await sendViaBrevoApi({ smtpConfig: config, to: toEmail, subject, html, text });
      return { messageId: result.messageId, accepted: [toEmail], rejected: [] };
    }

    const transporter = createTransporter(config);
    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to: toEmail,
      subject,
      text,
      html,
    });

    return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected };
  } catch (error) {
    throw new ApiError(502, error.message || "Failed to send test email", "SMTP_SEND_FAILED");
  }
}

async function setDefaultSmtp(id) {
  const config = await SmtpConfig.findById(id);

  if (!config) {
    throw new ApiError(404, "SMTP configuration not found", "SMTP_NOT_FOUND");
  }

  if (!config.isActive) {
    throw new ApiError(
      400,
      "An inactive SMTP configuration cannot be set as default",
      "SMTP_INACTIVE_DEFAULT_FORBIDDEN",
    );
  }

  if (!config.isDefault) {
    await SmtpConfig.updateMany({ isDefault: true }, { $set: { isDefault: false } });
    config.isDefault = true;
    await config.save();
  }

  return sanitizeSmtpConfig(config);
}

async function setSmtpActiveStatus(id, isActive) {
  const config = await SmtpConfig.findById(id);

  if (!config) {
    throw new ApiError(404, "SMTP configuration not found", "SMTP_NOT_FOUND");
  }

  if (config.isDefault && !isActive) {
    throw new ApiError(
      400,
      "The default SMTP configuration cannot be disabled",
      "SMTP_DEFAULT_DISABLE_FORBIDDEN",
    );
  }

  config.isActive = isActive;
  await config.save();

  return sanitizeSmtpConfig(config);
}

module.exports = {
  listSmtpConfigs,
  getSmtpConfigById,
  createSmtpConfig,
  updateSmtpConfig,
  deleteSmtpConfig,
  testSmtpConfig,
  sendTestEmail,
  setDefaultSmtp,
  setSmtpActiveStatus,
};
