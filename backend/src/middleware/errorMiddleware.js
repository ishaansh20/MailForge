const { ApiError } = require("../utils/ApiError");

function notFoundHandler(request, response, next) {
  next(
    new ApiError(
      404,
      `Route not found: ${request.originalUrl}`,
      "ROUTE_NOT_FOUND",
    ),
  );
}

function errorHandler(error, request, response, next) {
  const statusCode = error.statusCode || 500;
  const payload = {
    success: false,
    message: error.message || "Internal Server Error",
    errorCode: error.errorCode || "INTERNAL_SERVER_ERROR",
    errors: error.errors || [],
  };

  response.status(statusCode).json(payload);
}

module.exports = { notFoundHandler, errorHandler };
