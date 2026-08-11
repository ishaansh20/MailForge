const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const {
  validateContactPayload,
  validateImportPayload,
} = require("../validators/contact.validation");
const {
  listContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  setContactStatus,
  importContactsFromCsv,
} = require("../services/contact.service");
const { CONTACT_STATUS } = require("../models/contact.model");

const list = asyncHandler(async (request, response) => {
  const { page, limit, search, status } = request.query;

  const result = await listContacts({ page, limit, search, status });

  response
    .status(200)
    .json(new ApiResponse(200, "Contacts fetched successfully", result));
});

const getById = asyncHandler(async (request, response) => {
  const contact = await getContactById(request.params.id);

  response
    .status(200)
    .json(new ApiResponse(200, "Contact fetched successfully", { contact }));
});

const create = asyncHandler(async (request, response) => {
  const errors = validateContactPayload(request.body);

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", errors);
  }

  const contact = await createContact(request.body);

  response
    .status(201)
    .json(new ApiResponse(201, "Contact created successfully", { contact }));
});

const update = asyncHandler(async (request, response) => {
  const errors = validateContactPayload(request.body);

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", errors);
  }

  const contact = await updateContact(request.params.id, request.body);

  response
    .status(200)
    .json(new ApiResponse(200, "Contact updated successfully", { contact }));
});

const remove = asyncHandler(async (request, response) => {
  await deleteContact(request.params.id);

  response
    .status(200)
    .json(new ApiResponse(200, "Contact deleted successfully", {}));
});

const setStatus = asyncHandler(async (request, response) => {
  if (!Object.values(CONTACT_STATUS).includes(request.body.status)) {
    throw new ApiError(
      400,
      "Validation failed",
      "VALIDATION_ERROR",
      [{ field: "status", message: "status must be one of: " + Object.values(CONTACT_STATUS).join(", ") }],
    );
  }

  const contact = await setContactStatus(request.params.id, request.body.status);

  response
    .status(200)
    .json(new ApiResponse(200, "Contact status updated successfully", { contact }));
});

const importCsv = asyncHandler(async (request, response) => {
  const errors = validateImportPayload(request.body);

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", errors);
  }

  const result = await importContactsFromCsv(request.body.csvText);

  response
    .status(200)
    .json(new ApiResponse(200, "Contact import completed", result));
});

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  setStatus,
  importCsv,
};
