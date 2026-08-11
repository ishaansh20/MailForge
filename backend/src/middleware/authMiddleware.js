const { ApiError } = require("../utils/ApiError");
const { asyncHandler } = require("../utils/asyncHandler");
const { verifyToken } = require("../utils/jwt");
const { User } = require("../models/user.model");

const authenticate = asyncHandler(async (request, response, next) => {
  const authorizationHeader = request.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Authentication required", "UNAUTHORIZED");
  }

  const token = authorizationHeader.split(" ")[1];
  const decodedToken = verifyToken(token);
  const user = await User.findById(decodedToken.userId).select("-password");

  if (!user) {
    throw new ApiError(401, "User not found", "UNAUTHORIZED");
  }

  request.user = user;
  next();
});

module.exports = { authenticate };
