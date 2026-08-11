const { processDueScheduledCampaigns } = require("../services/campaign.service");

const POLL_INTERVAL_MS = 30 * 1000;

function startCampaignScheduler() {
  const intervalId = setInterval(() => {
    processDueScheduledCampaigns().catch((error) => {
      console.error("Campaign scheduler run failed:", error.message);
    });
  }, POLL_INTERVAL_MS);

  return intervalId;
}

module.exports = { startCampaignScheduler };
