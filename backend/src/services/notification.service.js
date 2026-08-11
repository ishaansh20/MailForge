const { ApiError } = require("../utils/ApiError");
const { Notification } = require("../models/notification.model");

function sanitizeNotification(notification) {
  return {
    id: notification._id.toString(),
    type: notification.type,
    title: notification.title,
    message: notification.message,
    isRead: notification.isRead,
    relatedCampaign: notification.relatedCampaign
      ? notification.relatedCampaign.toString()
      : null,
    createdAt: notification.createdAt,
  };
}

async function createNotification({ type, title, message, relatedCampaign = null }) {
  const notification = await Notification.create({
    type,
    title,
    message,
    relatedCampaign,
  });

  return sanitizeNotification(notification);
}

async function listNotifications({ page = 1, limit = 20 } = {}) {
  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 20));
  const skip = (pageNumber - 1) * pageSize;

  const [items, total] = await Promise.all([
    Notification.find().sort({ createdAt: -1 }).skip(skip).limit(pageSize),
    Notification.countDocuments(),
  ]);

  return {
    items: items.map(sanitizeNotification),
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}

async function getUnreadCount() {
  const count = await Notification.countDocuments({ isRead: false });
  return { count };
}

async function markNotificationAsRead(id) {
  const notification = await Notification.findById(id);

  if (!notification) {
    throw new ApiError(404, "Notification not found", "NOTIFICATION_NOT_FOUND");
  }

  if (!notification.isRead) {
    notification.isRead = true;
    await notification.save();
  }

  return sanitizeNotification(notification);
}

async function markAllNotificationsAsRead() {
  await Notification.updateMany({ isRead: false }, { $set: { isRead: true } });
}

module.exports = {
  createNotification,
  listNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
};
