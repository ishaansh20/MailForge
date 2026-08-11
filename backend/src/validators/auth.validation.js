const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegisterPayload(payload) {
  const errors = [];

  if (!payload.name || payload.name.trim().length < 2) {
    errors.push({
      field: "name",
      message: "Name must be at least 2 characters",
    });
  }

  if (!payload.email || !emailPattern.test(payload.email)) {
    errors.push({
      field: "email",
      message: "A valid email address is required",
    });
  }

  if (!payload.password || payload.password.length < 8) {
    errors.push({
      field: "password",
      message: "Password must be at least 8 characters",
    });
  }

  if (payload.password !== payload.confirmPassword) {
    errors.push({
      field: "confirmPassword",
      message: "Passwords do not match",
    });
  }

  return errors;
}

function validateLoginPayload(payload) {
  const errors = [];

  if (!payload.email || !emailPattern.test(payload.email)) {
    errors.push({
      field: "email",
      message: "A valid email address is required",
    });
  }

  if (!payload.password) {
    errors.push({ field: "password", message: "Password is required" });
  }

  return errors;
}

function validateUpdateProfilePayload(payload) {
  const errors = [];

  if (!payload.name || payload.name.trim().length < 2) {
    errors.push({
      field: "name",
      message: "Name must be at least 2 characters",
    });
  }

  if (!payload.email || !emailPattern.test(payload.email)) {
    errors.push({
      field: "email",
      message: "A valid email address is required",
    });
  }

  return errors;
}

function validateChangePasswordPayload(payload) {
  const errors = [];

  if (!payload.currentPassword) {
    errors.push({ field: "currentPassword", message: "Current password is required" });
  }

  if (!payload.newPassword || payload.newPassword.length < 8) {
    errors.push({
      field: "newPassword",
      message: "New password must be at least 8 characters",
    });
  }

  if (payload.newPassword !== payload.confirmNewPassword) {
    errors.push({
      field: "confirmNewPassword",
      message: "Passwords do not match",
    });
  }

  return errors;
}

function validateForgotPasswordPayload(payload) {
  const errors = [];

  if (!payload.email || !emailPattern.test(payload.email)) {
    errors.push({
      field: "email",
      message: "A valid email address is required",
    });
  }

  return errors;
}

function validateResetPasswordPayload(payload) {
  const errors = [];

  if (!payload.newPassword || payload.newPassword.length < 8) {
    errors.push({
      field: "newPassword",
      message: "New password must be at least 8 characters",
    });
  }

  if (payload.newPassword !== payload.confirmNewPassword) {
    errors.push({
      field: "confirmNewPassword",
      message: "Passwords do not match",
    });
  }

  return errors;
}

module.exports = {
  validateRegisterPayload,
  validateLoginPayload,
  validateUpdateProfilePayload,
  validateChangePasswordPayload,
  validateForgotPasswordPayload,
  validateResetPasswordPayload,
};
