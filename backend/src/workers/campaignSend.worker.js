const { Worker } = require("bullmq");
const { redisConnection } = require("../config/redis");
const { CAMPAIGN_SEND_QUEUE_NAME } = require("../queues/campaignSend.queue");
const { sendCampaignEmailToRecipient } = require("../services/campaignMailer");
const { env } = require("../config/env");
const { Campaign, CAMPAIGN_STATUS } = require("../models/campaign.model");
const {
  CampaignRecipient,
  RECIPIENT_STATUS,
} = require("../models/campaignRecipient.model");
const { SmtpConfig } = require("../models/smtp.model");
const { createNotification } = require("../services/notification.service");

const WORKER_CONCURRENCY = 5;
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_DURATION_MS = 1000;

async function finalizeCampaignIfDone(campaignId) {
  const pendingCount = await CampaignRecipient.countDocuments({
    campaign: campaignId,
    status: RECIPIENT_STATUS.PENDING,
  });

  if (pendingCount > 0) {
    return;
  }

  const updatedCampaign = await Campaign.findOneAndUpdate(
    { _id: campaignId, status: CAMPAIGN_STATUS.SENDING },
    { status: CAMPAIGN_STATUS.COMPLETED, sentAt: new Date() },
    { new: true },
  );

  if (updatedCampaign) {
    await createNotification({
      type: "campaign_completed",
      title: "Campaign completed",
      message: `"${updatedCampaign.name}" finished sending — ${updatedCampaign.stats.sent} sent, ${updatedCampaign.stats.failed} failed.`,
      relatedCampaign: updatedCampaign._id,
    });
  }
}

async function markRecipientFailed(campaignId, recipient, errorMessage) {
  recipient.status = RECIPIENT_STATUS.FAILED;
  recipient.error = errorMessage;
  await recipient.save();
  await Campaign.findByIdAndUpdate(campaignId, { $inc: { "stats.failed": 1 } });
  await finalizeCampaignIfDone(campaignId);
}

async function processJob(job) {
  const { campaignId, recipientId } = job.data;

  const recipient = await CampaignRecipient.findById(recipientId);

  if (!recipient || recipient.status !== RECIPIENT_STATUS.PENDING) {
    return;
  }

  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    await markRecipientFailed(
      campaignId,
      recipient,
      "Campaign no longer exists",
    );
    return;
  }

  const smtpConfig = await SmtpConfig.findById(campaign.smtpConfig).select(
    "+password",
  );

  if (!smtpConfig) {
    await markRecipientFailed(
      campaignId,
      recipient,
      "SMTP configuration no longer exists",
    );
    return;
  }

  try {
    const result = await sendCampaignEmailToRecipient({
      campaign,
      smtpConfig,
      recipient,
      frontendUrl: env.frontendUrl,
    });

    if (result?.rejected?.length > 0) {
      await markRecipientFailed(
        campaignId,
        recipient,
        "Recipient address rejected by mail server",
      );
      return;
    }

    recipient.status = RECIPIENT_STATUS.SENT;
    recipient.sentAt = new Date();
    recipient.providerMessageId = result?.messageId || null;

    console.log("[BREVO SEND]", {
      recipientId: recipient._id.toString(),
      email: recipient.email,
      messageId: result?.messageId || null,
    });

    await recipient.save();
    await Campaign.findByIdAndUpdate(campaignId, { $inc: { "stats.sent": 1 } });
    await finalizeCampaignIfDone(campaignId);
  } catch (error) {
    const attemptsAllowed = job.opts.attempts || 1;
    const isFinalAttempt = job.attemptsMade + 1 >= attemptsAllowed;

    if (isFinalAttempt) {
      await markRecipientFailed(campaignId, recipient, error.message);
    }

    throw error;
  }
}

function startCampaignSendWorker() {
  const worker = new Worker(CAMPAIGN_SEND_QUEUE_NAME, processJob, {
    connection: redisConnection,
    concurrency: WORKER_CONCURRENCY,
    limiter: {
      max: RATE_LIMIT_MAX,
      duration: RATE_LIMIT_DURATION_MS,
    },
  });

  worker.on("error", (error) => {
    console.error("Campaign send worker error:", error.message);
  });

  return worker;
}

module.exports = { startCampaignSendWorker };
