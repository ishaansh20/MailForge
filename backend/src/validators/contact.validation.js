const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactPayload(payload) {
  const errors = [];

  if (!payload.name || payload.name.trim().length < 1) {
    errors.push({ field: "name", message: "Name is required" });
  }

  if (!payload.email || !emailPattern.test(payload.email)) {
    errors.push({ field: "email", message: "A valid email address is required" });
  }

  return errors;
}

function validateImportPayload(payload) {
  const errors = [];

  if (!payload.csvText || payload.csvText.trim().length === 0) {
    errors.push({ field: "csvText", message: "CSV content is required" });
  }

  return errors;
}

module.exports = { validateContactPayload, validateImportPayload, emailPattern };
