const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCommonFields(payload, errors) {
  const isBrevoApi = payload.transport === "brevo_api";

  if (payload.transport !== undefined && !["smtp", "brevo_api"].includes(payload.transport)) {
    errors.push({ field: "transport", message: "Transport must be either smtp or brevo_api" });
  }

  if (!payload.name || payload.name.trim().length < 2) {
    errors.push({ field: "name", message: "Name must be at least 2 characters" });
  }

  if (!isBrevoApi) {
    if (!payload.host || payload.host.trim().length < 1) {
      errors.push({ field: "host", message: "Host is required" });
    }

    const port = Number(payload.port);
    if (!payload.port || Number.isNaN(port) || !Number.isInteger(port) || port < 1 || port > 65535) {
      errors.push({ field: "port", message: "Port must be a valid number between 1 and 65535" });
    }

    if (payload.secure !== undefined && typeof payload.secure !== "boolean") {
      errors.push({ field: "secure", message: "Secure must be a boolean" });
    }

    if (!payload.username || payload.username.trim().length < 1) {
      errors.push({ field: "username", message: "Username is required" });
    }
  }

  if (!payload.fromName || payload.fromName.trim().length < 1) {
    errors.push({ field: "fromName", message: "From name is required" });
  }

  if (!payload.fromEmail || !emailPattern.test(payload.fromEmail)) {
    errors.push({ field: "fromEmail", message: "A valid from email address is required" });
  }
}

function validateCreateSmtpPayload(payload) {
  const errors = [];

  validateCommonFields(payload, errors);

  if (!payload.password || payload.password.length < 1) {
    errors.push({ field: "password", message: "Password is required" });
  }

  return errors;
}

function validateUpdateSmtpPayload(payload) {
  const errors = [];

  validateCommonFields(payload, errors);

  if (payload.password !== undefined && payload.password.length < 1) {
    errors.push({ field: "password", message: "Password cannot be empty" });
  }

  return errors;
}

function validateSendTestEmailPayload(payload) {
  const errors = [];

  if (!payload.to || !emailPattern.test(payload.to)) {
    errors.push({ field: "to", message: "A valid recipient email address is required" });
  }

  return errors;
}

module.exports = {
  validateCreateSmtpPayload,
  validateUpdateSmtpPayload,
  validateSendTestEmailPayload,
};
