const { asyncHandler } = require("../utils/asyncHandler");
const { env } = require("../config/env");
const { handleBrevoEvent } = require("../services/webhook.service");

const brevoEvent = asyncHandler(async (request, response) => {
  if (!env.brevoWebhookSecret || request.params.secretToken !== env.brevoWebhookSecret) {
    response.status(404).end();
    return;
  }

  await handleBrevoEvent(request.body || {});

  response.status(200).json({ success: true });
});

module.exports = { brevoEvent };
