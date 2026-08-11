import { apiClient } from "./apiClient.js";

async function getUnsubscribeInfo(token) {
  const response = await apiClient.get(`/public/unsubscribe/${token}`);
  return response.data.data.contact;
}

async function confirmUnsubscribe(token) {
  const response = await apiClient.post(`/public/unsubscribe/${token}`);
  return response.data.data.contact;
}

export { getUnsubscribeInfo, confirmUnsubscribe };
