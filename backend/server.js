const app = require("./src/app");
const { connectDB } = require("./src/config/db");
const { startCampaignScheduler } = require("./src/jobs/campaignScheduler.job");
const { startCampaignSendWorker } = require("./src/workers/campaignSend.worker");

const PORT = process.env.PORT || 5000;

async function startServer() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

  startCampaignScheduler();
  startCampaignSendWorker();
}

startServer().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
