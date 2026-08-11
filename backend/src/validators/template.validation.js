function validateTemplatePayload(payload) {
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

  return errors;
}

module.exports = { validateTemplatePayload };
