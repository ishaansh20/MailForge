import { apiClient } from "./apiClient.js";

async function listContacts(params = {}) {
  const response = await apiClient.get("/contacts", { params });
  return response.data.data;
}

async function getContact(id) {
  const response = await apiClient.get(`/contacts/${id}`);
  return response.data.data.contact;
}

async function createContact(payload) {
  const response = await apiClient.post("/contacts", payload);
  return response.data.data.contact;
}

async function updateContact(id, payload) {
  const response = await apiClient.put(`/contacts/${id}`, payload);
  return response.data.data.contact;
}

async function deleteContact(id) {
  const response = await apiClient.delete(`/contacts/${id}`);
  return response.data.data;
}

async function setContactStatus(id, status) {
  const response = await apiClient.patch(`/contacts/${id}/status`, { status });
  return response.data.data.contact;
}

async function importContacts(csvText) {
  const response = await apiClient.post("/contacts/import", { csvText });
  return response.data.data;
}

export {
  listContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact,
  setContactStatus,
  importContacts,
};
