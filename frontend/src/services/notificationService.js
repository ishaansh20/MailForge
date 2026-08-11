import { apiClient } from "./apiClient.js";

async function listNotifications(params = {}) {
  const response = await apiClient.get("/notifications", { params });
  return response.data.data;
}

async function getUnreadNotificationCount() {
  const response = await apiClient.get("/notifications/unread-count");
  return response.data.data.count;
}

async function markNotificationRead(id) {
  const response = await apiClient.patch(`/notifications/${id}/read`);
  return response.data.data.notification;
}

async function markAllNotificationsRead() {
  const response = await apiClient.patch("/notifications/read-all");
  return response.data.data;
}

export {
  listNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
};
