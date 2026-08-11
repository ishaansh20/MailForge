function validateContactListPayload(payload) {
  const errors = [];

  if (!payload.name || payload.name.trim().length < 2) {
    errors.push({ field: "name", message: "Name must be at least 2 characters" });
  }

  if (payload.description && payload.description.length > 500) {
    errors.push({ field: "description", message: "Description must be under 500 characters" });
  }

  return errors;
}

module.exports = { validateContactListPayload };
