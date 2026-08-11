import { apiClient } from "./apiClient.js";

async function listSmtpConfigs(params = {}) {
  const response = await apiClient.get("/smtp", { params });
  return response.data.data;
}

async function getSmtpConfig(id) {
  const response = await apiClient.get(`/smtp/${id}`);
  return response.data.data.smtp;
}

async function createSmtpConfig(payload) {
  const response = await apiClient.post("/smtp", payload);
  return response.data.data.smtp;
}

async function updateSmtpConfig(id, payload) {
  const response = await apiClient.put(`/smtp/${id}`, payload);
  return response.data.data.smtp;
}

async function deleteSmtpConfig(id) {
  const response = await apiClient.delete(`/smtp/${id}`);
  return response.data.data;
}

async function testSmtpConfig(id) {
  const response = await apiClient.post(`/smtp/${id}/test`);
  return response.data.data.smtp;
}

async function sendTestEmail(id, to) {
  const response = await apiClient.post(`/smtp/${id}/send-test`, { to });
  return response.data.data;
}

async function setDefaultSmtpConfig(id) {
  const response = await apiClient.patch(`/smtp/${id}/default`);
  return response.data.data.smtp;
}

async function setSmtpConfigStatus(id, isActive) {
  const response = await apiClient.patch(`/smtp/${id}/status`, { isActive });
  return response.data.data.smtp;
}

export {
  listSmtpConfigs,
  getSmtpConfig,
  createSmtpConfig,
  updateSmtpConfig,
  deleteSmtpConfig,
  testSmtpConfig,
  sendTestEmail,
  setDefaultSmtpConfig,
  setSmtpConfigStatus,
};
