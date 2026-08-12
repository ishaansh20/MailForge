import { apiClient } from "./apiClient.js";

async function listLogs(params = {}) {
  const response = await apiClient.get("/logs", { params });
  return response.data.data;
}

async function getLogStats() {
  const response = await apiClient.get("/logs/stats");
  return response.data.data;
}

export { listLogs, getLogStats };
