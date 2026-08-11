import { apiClient } from "./apiClient.js";

async function listCampaigns(params = {}) {
  const response = await apiClient.get("/campaigns", { params });
  return response.data.data;
}

async function getCampaign(id) {
  const response = await apiClient.get(`/campaigns/${id}`);
  return response.data.data.campaign;
}

async function createCampaign(payload) {
  const response = await apiClient.post("/campaigns", payload);
  return response.data.data.campaign;
}

async function duplicateCampaign(id) {
  const response = await apiClient.post(`/campaigns/${id}/duplicate`);
  return response.data.data.campaign;
}

async function updateCampaign(id, payload) {
  const response = await apiClient.put(`/campaigns/${id}`, payload);
  return response.data.data.campaign;
}

async function deleteCampaign(id) {
  const response = await apiClient.delete(`/campaigns/${id}`);
  return response.data.data;
}

async function sendCampaign(id) {
  const response = await apiClient.post(`/campaigns/${id}/send`);
  return response.data.data.campaign;
}

async function scheduleCampaign(id, scheduledAt) {
  const response = await apiClient.post(`/campaigns/${id}/schedule`, { scheduledAt });
  return response.data.data.campaign;
}

async function unscheduleCampaign(id) {
  const response = await apiClient.post(`/campaigns/${id}/unschedule`);
  return response.data.data.campaign;
}

async function getCampaignRecipients(id, params = {}) {
  const response = await apiClient.get(`/campaigns/${id}/recipients`, { params });
  return response.data.data;
}

async function sendTestCampaignEmail(payload) {
  const response = await apiClient.post("/campaigns/send-test", payload);
  return response.data.data;
}

export {
  listCampaigns,
  getCampaign,
  createCampaign,
  duplicateCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  scheduleCampaign,
  unscheduleCampaign,
  getCampaignRecipients,
  sendTestCampaignEmail,
};
