const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const {
  validateCampaignPayload,
  validateSchedulePayload,
  validateSendTestCampaignPayload,
} = require("../validators/campaign.validation");
const {
  listCampaigns,
  getCampaignById,
  createCampaign,
  duplicateCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  scheduleCampaign,
  unscheduleCampaign,
  getCampaignRecipients,
  sendTestCampaignEmail,
} = require("../services/campaign.service");

const list = asyncHandler(async (request, response) => {
  const { page, limit, search, status } = request.query;

  const result = await listCampaigns({ page, limit, search, status });

  response
    .status(200)
    .json(new ApiResponse(200, "Campaigns fetched successfully", result));
});

const getById = asyncHandler(async (request, response) => {
  const campaign = await getCampaignById(request.params.id);

  response
    .status(200)
    .json(new ApiResponse(200, "Campaign fetched successfully", { campaign }));
});

const create = asyncHandler(async (request, response) => {
  const errors = validateCampaignPayload(request.body);

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", errors);
  }

  const campaign = await createCampaign(request.body);

  response
    .status(201)
    .json(new ApiResponse(201, "Campaign created successfully", { campaign }));
});

const update = asyncHandler(async (request, response) => {
  const errors = validateCampaignPayload(request.body);

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", errors);
  }

  const campaign = await updateCampaign(request.params.id, request.body);

  response
    .status(200)
    .json(new ApiResponse(200, "Campaign updated successfully", { campaign }));
});

const duplicate = asyncHandler(async (request, response) => {
  const campaign = await duplicateCampaign(request.params.id);

  response
    .status(201)
    .json(new ApiResponse(201, "Campaign duplicated successfully", { campaign }));
});

const remove = asyncHandler(async (request, response) => {
  await deleteCampaign(request.params.id);

  response
    .status(200)
    .json(new ApiResponse(200, "Campaign deleted successfully", {}));
});

const send = asyncHandler(async (request, response) => {
  const campaign = await sendCampaign(request.params.id);

  response
    .status(200)
    .json(new ApiResponse(200, "Campaign send started", { campaign }));
});

const schedule = asyncHandler(async (request, response) => {
  const errors = validateSchedulePayload(request.body);

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", errors);
  }

  const campaign = await scheduleCampaign(request.params.id, request.body.scheduledAt);

  response
    .status(200)
    .json(new ApiResponse(200, "Campaign scheduled successfully", { campaign }));
});

const unschedule = asyncHandler(async (request, response) => {
  const campaign = await unscheduleCampaign(request.params.id);

  response
    .status(200)
    .json(new ApiResponse(200, "Campaign schedule cancelled", { campaign }));
});

const recipients = asyncHandler(async (request, response) => {
  const { page, limit, status } = request.query;

  const result = await getCampaignRecipients(request.params.id, { page, limit, status });

  response
    .status(200)
    .json(new ApiResponse(200, "Campaign recipients fetched successfully", result));
});

const sendTest = asyncHandler(async (request, response) => {
  const errors = validateSendTestCampaignPayload(request.body);

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", errors);
  }

  await sendTestCampaignEmail(request.body);

  response
    .status(200)
    .json(new ApiResponse(200, `Test email sent to ${request.body.to}`, {}));
});

module.exports = {
  list,
  getById,
  create,
  duplicate,
  update,
  remove,
  send,
  schedule,
  unschedule,
  recipients,
  sendTest,
};
