import { apiClient } from "./apiClient.js";

async function globalSearch(query) {
  const response = await apiClient.get("/search", { params: { q: query } });
  return response.data.data;
}

export { globalSearch };
