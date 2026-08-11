const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const {
  validateRegisterPayload,
  validateLoginPayload,
  validateUpdateProfilePayload,
  validateChangePasswordPayload,
  validateForgotPasswordPayload,
  validateResetPasswordPayload,
} = require("../validators/auth.validation");
const {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
} = require("../services/auth.service");

const register = asyncHandler(async (request, response) => {
  const errors = validateRegisterPayload(request.body);

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", errors);
  }

  const result = await registerUser(request.body);

  response
    .status(201)
    .json(new ApiResponse(201, "Account created successfully", result));
});

const login = asyncHandler(async (request, response) => {
  const errors = validateLoginPayload(request.body);

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", errors);
  }

  const result = await loginUser(request.body);

  response.status(200).json(new ApiResponse(200, "Login successful", result));
});

const me = asyncHandler(async (request, response) => {
  if (!request.user) {
    throw new ApiError(401, "Authentication required", "UNAUTHORIZED");
  }

  const user = await getCurrentUser(request.user._id);

  response
    .status(200)
    .json(new ApiResponse(200, "Current user fetched successfully", { user }));
});

const logout = asyncHandler(async (request, response) => {
  response.status(200).json(new ApiResponse(200, "Logout successful", {}));
});

const updateMe = asyncHandler(async (request, response) => {
  const errors = validateUpdateProfilePayload(request.body);

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", errors);
  }

  const user = await updateProfile(request.user._id, request.body);

  response
    .status(200)
    .json(new ApiResponse(200, "Profile updated successfully", { user }));
});

const updateMyPassword = asyncHandler(async (request, response) => {
  const errors = validateChangePasswordPayload(request.body);

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", errors);
  }

  await changePassword(request.user._id, request.body);

  response
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully", {}));
});

const forgotPassword = asyncHandler(async (request, response) => {
  const errors = validateForgotPasswordPayload(request.body);

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", errors);
  }

  await requestPasswordReset(request.body.email);

  response
    .status(200)
    .json(
      new ApiResponse(
        200,
        "If an account with that email exists, a reset link has been sent.",
        {},
      ),
    );
});

const resetPasswordAction = asyncHandler(async (request, response) => {
  const errors = validateResetPasswordPayload(request.body);

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", errors);
  }

  await resetPassword(request.params.token, request.body.newPassword);

  response
    .status(200)
    .json(new ApiResponse(200, "Password reset successfully", {}));
});

module.exports = {
  register,
  login,
  me,
  logout,
  updateMe,
  updateMyPassword,
  forgotPassword,
  resetPassword: resetPasswordAction,
};
