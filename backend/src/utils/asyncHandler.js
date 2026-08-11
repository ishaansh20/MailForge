function asyncHandler(requestHandler) {
  return function asyncRequestHandler(request, response, next) {
    return Promise.resolve(requestHandler(request, response, next)).catch(next);
  };
}

module.exports = { asyncHandler };
