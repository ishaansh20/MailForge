import { apiClient } from "./apiClient.js";

async function getOverview() {
  const response = await apiClient.get("/analytics/overview");
  return response.data.data;
}

async function getSendsOverTime(days = 14) {
  const response = await apiClient.get("/analytics/sends-over-time", {
    params: { days },
  });
  return response.data.data.items;
}

async function getTopCampaigns(
  limit = 100,
  sortBy = "total",
  campaignFilter = "all",
) {
  const response = await apiClient.get("/analytics/top-campaigns", {
    params: { limit, sortBy, campaignFilter },
  });
  return response.data.data.items;
}

async function getTrends() {
  const response = await apiClient.get("/analytics/trends");
  return response.data.data;
}

async function getSubscriberGrowth(months = 12) {
  const response = await apiClient.get("/analytics/subscriber-growth", {
    params: { months },
  });
  return response.data.data.items;
}

export {
  getOverview,
  getSendsOverTime,
  getTopCampaigns,
  getTrends,
  getSubscriberGrowth,
};
