import { apiClient } from "./apiClient.js";

async function listTemplates(params = {}) {
  const response = await apiClient.get("/templates", { params });
  return response.data.data;
}

async function getTemplate(id) {
  const response = await apiClient.get(`/templates/${id}`);
  return response.data.data.template;
}

async function createTemplate(payload) {
  const response = await apiClient.post("/templates", payload);
  return response.data.data.template;
}

async function updateTemplate(id, payload) {
  const response = await apiClient.put(`/templates/${id}`, payload);
  return response.data.data.template;
}

async function deleteTemplate(id) {
  const response = await apiClient.delete(`/templates/${id}`);
  return response.data.data;
}

export { listTemplates, getTemplate, createTemplate, updateTemplate, deleteTemplate };
