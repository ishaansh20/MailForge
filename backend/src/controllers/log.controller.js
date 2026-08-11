const { asyncHandler } = require("../utils/asyncHandler");
const { ApiResponse } = require("../utils/ApiResponse");
const { listLogs, getLogStats } = require("../services/log.service");

const list = asyncHandler(async (request, response) => {
  const { page, limit, search, status, campaignId } = request.query;

  const result = await listLogs({ page, limit, search, status, campaignId });

  response
    .status(200)
    .json(new ApiResponse(200, "Logs fetched successfully", result));
});

const stats = asyncHandler(async (request, response) => {
  const result = await getLogStats();

  response
    .status(200)
    .json(new ApiResponse(200, "Log stats fetched successfully", result));
});

module.exports = { list, stats };
