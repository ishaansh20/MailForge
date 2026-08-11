const { asyncHandler } = require("../utils/asyncHandler");
const { ApiResponse } = require("../utils/ApiResponse");
const { globalSearch } = require("../services/search.service");

const search = asyncHandler(async (request, response) => {
  const results = await globalSearch(request.query.q);

  response.status(200).json(new ApiResponse(200, "Search results fetched successfully", results));
});

module.exports = { search };
