const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const {
  validateCreateSmtpPayload,
  validateUpdateSmtpPayload,
  validateSendTestEmailPayload,
} = require("../validators/smtp.validation");
const {
  listSmtpConfigs,
  getSmtpConfigById,
  createSmtpConfig,
  updateSmtpConfig,
  deleteSmtpConfig,
  testSmtpConfig,
  sendTestEmail,
  setDefaultSmtp,
  setSmtpActiveStatus,
} = require("../services/smtp.service");

const list = asyncHandler(async (request, response) => {
  const { page, limit, search, status, isActive } = request.query;

  const result = await listSmtpConfigs({ page, limit, search, status, isActive });

  response
    .status(200)
    .json(new ApiResponse(200, "SMTP configurations fetched successfully", result));
});

const getById = asyncHandler(async (request, response) => {
  const smtp = await getSmtpConfigById(request.params.id);

  response
    .status(200)
    .json(new ApiResponse(200, "SMTP configuration fetched successfully", { smtp }));
});

const create = asyncHandler(async (request, response) => {
  const errors = validateCreateSmtpPayload(request.body);

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", errors);
  }

  const smtp = await createSmtpConfig(request.body);

  response
    .status(201)
    .json(new ApiResponse(201, "SMTP configuration created successfully", { smtp }));
});

const update = asyncHandler(async (request, response) => {
  const errors = validateUpdateSmtpPayload(request.body);

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", errors);
  }

  const smtp = await updateSmtpConfig(request.params.id, request.body);

  response
    .status(200)
    .json(new ApiResponse(200, "SMTP configuration updated successfully", { smtp }));
});

const remove = asyncHandler(async (request, response) => {
  await deleteSmtpConfig(request.params.id);

  response
    .status(200)
    .json(new ApiResponse(200, "SMTP configuration deleted successfully", {}));
});

const testConnection = asyncHandler(async (request, response) => {
  const smtp = await testSmtpConfig(request.params.id);

  response
    .status(200)
    .json(new ApiResponse(200, "SMTP connection test completed", { smtp }));
});

const sendTest = asyncHandler(async (request, response) => {
  const errors = validateSendTestEmailPayload(request.body);

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", errors);
  }

  const result = await sendTestEmail(request.params.id, request.body.to);

  response
    .status(200)
    .json(new ApiResponse(200, `Test email sent to ${request.body.to}`, result));
});

const setDefault = asyncHandler(async (request, response) => {
  const smtp = await setDefaultSmtp(request.params.id);

  response
    .status(200)
    .json(new ApiResponse(200, "Default SMTP configuration updated successfully", { smtp }));
});

const setStatus = asyncHandler(async (request, response) => {
  if (typeof request.body.isActive !== "boolean") {
    throw new ApiError(
      400,
      "Validation failed",
      "VALIDATION_ERROR",
      [{ field: "isActive", message: "isActive must be a boolean" }],
    );
  }

  const smtp = await setSmtpActiveStatus(request.params.id, request.body.isActive);

  response
    .status(200)
    .json(new ApiResponse(200, "SMTP configuration status updated successfully", { smtp }));
});

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  testConnection,
  sendTest,
  setDefault,
  setStatus,
};
