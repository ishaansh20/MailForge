const { asyncHandler } = require("../utils/asyncHandler");
const { ApiError } = require("../utils/ApiError");
const { ApiResponse } = require("../utils/ApiResponse");
const { validateContactListPayload } = require("../validators/contactList.validation");
const {
  listContactLists,
  getContactListById,
  createContactList,
  updateContactList,
  deleteContactList,
  getListMembers,
  getAvailableContacts,
  addContactsToList,
  removeContactFromList,
  removeContactsFromList,
  addNewContactsToList,
} = require("../services/contactList.service");

const list = asyncHandler(async (request, response) => {
  const { page, limit, search } = request.query;

  const result = await listContactLists({ page, limit, search });

  response
    .status(200)
    .json(new ApiResponse(200, "Lists fetched successfully", result));
});

const getById = asyncHandler(async (request, response) => {
  const contactList = await getContactListById(request.params.id);

  response
    .status(200)
    .json(new ApiResponse(200, "List fetched successfully", { list: contactList }));
});

const create = asyncHandler(async (request, response) => {
  const errors = validateContactListPayload(request.body);

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", errors);
  }

  const contactList = await createContactList(request.body);

  response
    .status(201)
    .json(new ApiResponse(201, "List created successfully", { list: contactList }));
});

const update = asyncHandler(async (request, response) => {
  const errors = validateContactListPayload(request.body);

  if (errors.length > 0) {
    throw new ApiError(400, "Validation failed", "VALIDATION_ERROR", errors);
  }

  const contactList = await updateContactList(request.params.id, request.body);

  response
    .status(200)
    .json(new ApiResponse(200, "List updated successfully", { list: contactList }));
});

const remove = asyncHandler(async (request, response) => {
  await deleteContactList(request.params.id);

  response
    .status(200)
    .json(new ApiResponse(200, "List deleted successfully", {}));
});

const members = asyncHandler(async (request, response) => {
  const { page, limit, search } = request.query;

  const result = await getListMembers(request.params.id, { page, limit, search });

  response
    .status(200)
    .json(new ApiResponse(200, "List members fetched successfully", result));
});

const availableContacts = asyncHandler(async (request, response) => {
  const { page, limit, search } = request.query;

  const result = await getAvailableContacts(request.params.id, { page, limit, search });

  response
    .status(200)
    .json(new ApiResponse(200, "Available contacts fetched successfully", result));
});

const addMembers = asyncHandler(async (request, response) => {
  await addContactsToList(request.params.id, request.body.contactIds);

  response
    .status(200)
    .json(new ApiResponse(200, "Contacts added to list successfully", {}));
});

const removeMember = asyncHandler(async (request, response) => {
  await removeContactFromList(request.params.id, request.params.contactId);

  response
    .status(200)
    .json(new ApiResponse(200, "Contact removed from list successfully", {}));
});

const removeMembers = asyncHandler(async (request, response) => {
  await removeContactsFromList(request.params.id, request.body.contactIds);

  response
    .status(200)
    .json(new ApiResponse(200, "Contacts removed from list successfully", {}));
});

const addNewMembers = asyncHandler(async (request, response) => {
  const result = await addNewContactsToList(request.params.id, request.body.contacts);

  response
    .status(200)
    .json(new ApiResponse(200, "Contacts added to list successfully", result));
});

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  members,
  availableContacts,
  addMembers,
  removeMember,
  removeMembers,
  addNewMembers,
};
