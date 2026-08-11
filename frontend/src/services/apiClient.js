import axios from "axios";
import { clearAuthToken, getAccessToken } from "../utils/authStorage.js";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthToken();
      window.dispatchEvent(new Event("ems:unauthorized"));
    }

    return Promise.reject(error);
  },
);

export { apiClient };
