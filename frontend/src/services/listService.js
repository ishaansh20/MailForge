import { apiClient } from "./apiClient.js";

async function listContactLists(params = {}) {
  const response = await apiClient.get("/lists", { params });
  return response.data.data;
}

async function getContactList(id) {
  const response = await apiClient.get(`/lists/${id}`);
  return response.data.data.list;
}

async function createContactList(payload) {
  const response = await apiClient.post("/lists", payload);
  return response.data.data.list;
}

async function updateContactList(id, payload) {
  const response = await apiClient.put(`/lists/${id}`, payload);
  return response.data.data.list;
}

async function deleteContactList(id) {
  const response = await apiClient.delete(`/lists/${id}`);
  return response.data.data;
}

async function getListMembers(id, params = {}) {
  const response = await apiClient.get(`/lists/${id}/members`, { params });
  return response.data.data;
}

async function getAvailableContacts(id, params = {}) {
  const response = await apiClient.get(`/lists/${id}/available-contacts`, { params });
  return response.data.data;
}

async function addContactsToList(id, contactIds) {
  const response = await apiClient.post(`/lists/${id}/members`, { contactIds });
  return response.data.data;
}

async function removeContactFromList(id, contactId) {
  const response = await apiClient.delete(`/lists/${id}/members/${contactId}`);
  return response.data.data;
}

async function removeContactsFromList(id, contactIds) {
  const response = await apiClient.post(`/lists/${id}/members/remove`, { contactIds });
  return response.data.data;
}

async function addNewContactsToList(id, contacts) {
  const response = await apiClient.post(`/lists/${id}/members/manual`, { contacts });
  return response.data.data;
}

export {
  listContactLists,
  getContactList,
  createContactList,
  updateContactList,
  deleteContactList,
  getListMembers,
  getAvailableContacts,
  addContactsToList,
  removeContactFromList,
  removeContactsFromList,
  addNewContactsToList,
};
