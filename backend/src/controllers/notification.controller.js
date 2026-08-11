const { asyncHandler } = require("../utils/asyncHandler");
const { ApiResponse } = require("../utils/ApiResponse");
const {
  listNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} = require("../services/notification.service");

const list = asyncHandler(async (request, response) => {
  const { page, limit } = request.query;

  const result = await listNotifications({ page, limit });

  response
    .status(200)
    .json(new ApiResponse(200, "Notifications fetched successfully", result));
});

const unreadCount = asyncHandler(async (request, response) => {
  const result = await getUnreadCount();

  response
    .status(200)
    .json(new ApiResponse(200, "Unread notification count fetched successfully", result));
});

const markRead = asyncHandler(async (request, response) => {
  const notification = await markNotificationAsRead(request.params.id);

  response
    .status(200)
    .json(new ApiResponse(200, "Notification marked as read", { notification }));
});

const markAllRead = asyncHandler(async (request, response) => {
  await markAllNotificationsAsRead();

  response
    .status(200)
    .json(new ApiResponse(200, "All notifications marked as read", {}));
});

module.exports = {
  list,
  unreadCount,
  markRead,
  markAllRead,
};
