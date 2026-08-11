const { asyncHandler } = require("../utils/asyncHandler");
const { ApiResponse } = require("../utils/ApiResponse");
const {
  getContactByUnsubscribeToken,
  unsubscribeByToken,
} = require("../services/contact.service");

const getUnsubscribeInfo = asyncHandler(async (request, response) => {
  const contact = await getContactByUnsubscribeToken(request.params.token);

  response
    .status(200)
    .json(new ApiResponse(200, "Contact fetched successfully", { contact }));
});

const confirmUnsubscribe = asyncHandler(async (request, response) => {
  const contact = await unsubscribeByToken(request.params.token);

  response
    .status(200)
    .json(new ApiResponse(200, "You have been unsubscribed successfully", { contact }));
});

module.exports = { getUnsubscribeInfo, confirmUnsubscribe };
