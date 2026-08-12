import { apiClient } from "./apiClient.js";

async function register(payload) {
  const response = await apiClient.post("/auth/register", payload);
  return response.data.data;
}

async function login(payload) {
  const response = await apiClient.post("/auth/login", payload);
  return response.data.data;
}

async function getCurrentUser() {
  const response = await apiClient.get("/auth/me");
  return response.data.data;
}

async function logout() {
  const response = await apiClient.post("/auth/logout");
  return response.data.data;
}

async function updateProfile(payload) {
  const response = await apiClient.put("/auth/me", payload);
  return response.data.data;
}

async function changePassword(payload) {
  const response = await apiClient.put("/auth/me/password", payload);
  return response.data.data;
}

async function forgotPassword(email) {
  const response = await apiClient.post("/auth/forgot-password", { email });
  return response.data.data;
}

async function resetPassword(token, payload) {
  const response = await apiClient.post(`/auth/reset-password/${token}`, payload);
  return response.data.data;
}

export {
  register,
  login,
  getCurrentUser,
  logout,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
