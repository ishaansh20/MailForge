const { Queue } = require("bullmq");
const { redisConnection } = require("../config/redis");

const CAMPAIGN_SEND_QUEUE_NAME = "campaign-send";

const campaignSendQueue = new Queue(CAMPAIGN_SEND_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: {
      age: 24 * 60 * 60,
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 60 * 60,
    },
  },
});

module.exports = { campaignSendQueue, CAMPAIGN_SEND_QUEUE_NAME };
