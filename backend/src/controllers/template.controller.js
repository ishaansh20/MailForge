const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { validateTemplatePayload } = require("../validators/template.validation");
const {
  listTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} = require("../services/template.service");

const list = asyncHandler(async (request, response) => {
  const { page, limit, search } = request.query;

  const result = await listTemplates({ page, limit, search });

  response
    .status(200)
    .json(new ApiResponse(200, "Templates fetched successfully", result));
});

const getById = asyncHandler(async (request, response) => {
  const template = await getTemplateById(request.params.id);

  response
    .status(200)
    .json(new ApiResponse(200, "Template fetched successfully", { template }));
});

const create = asyncHandler(async (request, response) => {
  const errors = validateTemplatePayload(request.body);

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", errors);
  }

  const template = await createTemplate(request.body);

  response
    .status(201)
    .json(new ApiResponse(201, "Template created successfully", { template }));
});

const update = asyncHandler(async (request, response) => {
  const errors = validateTemplatePayload(request.body);

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", errors);
  }

  const template = await updateTemplate(request.params.id, request.body);

  response
    .status(200)
    .json(new ApiResponse(200, "Template updated successfully", { template }));
});

const remove = asyncHandler(async (request, response) => {
  await deleteTemplate(request.params.id);

  response
    .status(200)
    .json(new ApiResponse(200, "Template deleted successfully", {}));
});

module.exports = { list, getById, create, update, remove };
