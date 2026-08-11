const { asyncHandler } = require("../utils/asyncHandler");
const { ApiResponse } = require("../utils/ApiResponse");
const {
  getOverview,
  getSendsOverTime,
  getTopCampaigns,
  getTrends,
  getSubscriberGrowth,
} = require("../services/analytics.service");

const overview = asyncHandler(async (request, response) => {
  const result = await getOverview();

  response
    .status(200)
    .json(
      new ApiResponse(200, "Analytics overview fetched successfully", result),
    );
});

const sendsOverTime = asyncHandler(async (request, response) => {
  const { days } = request.query;

  const result = await getSendsOverTime(days);

  response.status(200).json(
    new ApiResponse(200, "Sends over time fetched successfully", {
      items: result,
    }),
  );
});

const topCampaigns = asyncHandler(async (request, response) => {
  const { limit, sortBy, campaignFilter } = request.query;

  const result = await getTopCampaigns(limit, sortBy, campaignFilter);

  response.status(200).json(
    new ApiResponse(200, "Top campaigns fetched successfully", {
      items: result,
    }),
  );
});

const trends = asyncHandler(async (request, response) => {
  const result = await getTrends();

  response
    .status(200)
    .json(new ApiResponse(200, "Trends fetched successfully", result));
});

const subscriberGrowth = asyncHandler(async (request, response) => {
  const { months } = request.query;

  const result = await getSubscriberGrowth(months);

  response.status(200).json(
    new ApiResponse(200, "Subscriber growth fetched successfully", {
      items: result,
    }),
  );
});

module.exports = {
  overview,
  sendsOverTime,
  topCampaigns,
  trends,
  subscriberGrowth,
};
