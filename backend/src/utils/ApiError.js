class ApiError extends Error {
  constructor(
    statusCode,
    message,
    errorCode = "INTERNAL_SERVER_ERROR",
    errors = [],
  ) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.errors = errors;
    this.success = false;
  }
}

module.exports = { ApiError };
