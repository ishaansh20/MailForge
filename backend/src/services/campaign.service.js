const crypto = require("crypto");
const { ApiError } = require("../utils/ApiError");
const { Campaign, CAMPAIGN_STATUS } = require("../models/campaign.model");
const { CampaignRecipient } = require("../models/campaignRecipient.model");
const { SmtpConfig } = require("../models/smtp.model");
const { Contact } = require("../models/contact.model");
const { ContactList } = require("../models/contactList.model");
const { campaignSendQueue } = require("../queues/campaignSend.queue");
const { sendCampaignEmailToRecipient } = require("./campaignMailer");
const { env } = require("../config/env");
const { computeCampaignRates } = require("../utils/campaignRates.util");

function sanitizeCampaign(campaign) {
  return {
    id: campaign._id.toString(),
    name: campaign.name,
    subject: campaign.subject,
    body: campaign.body,
    smtpConfig:
      campaign.smtpConfig && campaign.smtpConfig.name
        ? {
            id: campaign.smtpConfig._id.toString(),
            name: campaign.smtpConfig.name,
          }
        : campaign.smtpConfig?.toString(),
    targetList:
      campaign.targetList && campaign.targetList.name
        ? {
            id: campaign.targetList._id.toString(),
            name: campaign.targetList.name,
          }
        : campaign.targetList?.toString() || null,
    excludedContacts: (campaign.excludedContacts || []).map((contact) =>
      contact._id ? contact._id.toString() : contact.toString(),
    ),
    status: campaign.status,
    stats: campaign.stats,
    rates: computeCampaignRates(campaign.stats),
    failureReason: campaign.failureReason,
    scheduledAt: campaign.scheduledAt,
    sentAt: campaign.sentAt,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt,
  };
}

function sanitizeRecipient(recipient) {
  return {
    id: recipient._id.toString(),
    name: recipient.name,
    email: recipient.email,
    status: recipient.status,
    error: recipient.error,
    sentAt: recipient.sentAt,
    deliveredAt: recipient.deliveredAt,
    openedAt: recipient.openedAt,
    openCount: recipient.openCount,
    clickedAt: recipient.clickedAt,
    clickCount: recipient.clickCount,
  };
}

function ensureDraft(campaign) {
  if (campaign.status !== CAMPAIGN_STATUS.DRAFT) {
    throw new ApiError(
      400,
      "Only draft campaigns can be modified",
      "CAMPAIGN_NOT_DRAFT",
    );
  }
}

async function listCampaigns({
  page = 1,
  limit = 10,
  search = "",
  status,
} = {}) {
  const query = {};

  if (search) {
    const searchRegex = new RegExp(
      search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    query.$or = [{ name: searchRegex }, { subject: searchRegex }];
  }

  if (status) {
    query.status = status;
  }

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (pageNumber - 1) * pageSize;

  const [items, total] = await Promise.all([
    Campaign.find(query)
      .populate("smtpConfig", "name")
      .populate("targetList", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize),
    Campaign.countDocuments(query),
  ]);

  return {
    items: items.map(sanitizeCampaign),
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}

async function getCampaignById(id) {
  const campaign = await Campaign.findById(id)
    .populate("smtpConfig", "name")
    .populate("targetList", "name");

  if (!campaign) {
    throw new ApiError(404, "Campaign not found", "CAMPAIGN_NOT_FOUND");
  }

  return sanitizeCampaign(campaign);
}

async function createCampaign(payload) {
  const smtpConfig = await SmtpConfig.findById(payload.smtpConfig);

  if (!smtpConfig) {
    throw new ApiError(
      400,
      "Selected SMTP configuration does not exist",
      "SMTP_NOT_FOUND",
    );
  }

  if (payload.targetList) {
    const targetList = await ContactList.findById(payload.targetList);

    if (!targetList) {
      throw new ApiError(400, "Selected list does not exist", "LIST_NOT_FOUND");
    }
  }

  const campaign = await Campaign.create({
    name: payload.name.trim(),
    subject: payload.subject.trim(),
    body: payload.body,
    smtpConfig: payload.smtpConfig,
    targetList: payload.targetList || null,
    excludedContacts: payload.excludedContacts || [],
  });

  await campaign.populate("smtpConfig", "name");
  await campaign.populate("targetList", "name");

  return sanitizeCampaign(campaign);
}

async function duplicateCampaign(id) {
  const original = await Campaign.findById(id);

  if (!original) {
    throw new ApiError(404, "Campaign not found", "CAMPAIGN_NOT_FOUND");
  }

  const smtpConfig = await SmtpConfig.findById(original.smtpConfig);

  if (!smtpConfig) {
    throw new ApiError(
      400,
      "The original SMTP configuration no longer exists. Create a new campaign and select an active configuration.",
      "SMTP_NOT_FOUND",
    );
  }

  let targetList = null;

  if (original.targetList) {
    const existingList = await ContactList.findById(original.targetList);
    targetList = existingList ? existingList._id : null;
  }

  const campaign = await Campaign.create({
    name: `${original.name} (Copy)`,
    subject: original.subject,
    body: original.body,
    smtpConfig: smtpConfig._id,
    targetList,
  });

  await campaign.populate("smtpConfig", "name");
  await campaign.populate("targetList", "name");

  return sanitizeCampaign(campaign);
}

async function updateCampaign(id, payload) {
  const campaign = await Campaign.findById(id);

  if (!campaign) {
    throw new ApiError(404, "Campaign not found", "CAMPAIGN_NOT_FOUND");
  }

  ensureDraft(campaign);

  if (payload.smtpConfig) {
    const smtpConfig = await SmtpConfig.findById(payload.smtpConfig);

    if (!smtpConfig) {
      throw new ApiError(
        400,
        "Selected SMTP configuration does not exist",
        "SMTP_NOT_FOUND",
      );
    }

    campaign.smtpConfig = payload.smtpConfig;
  }

  if (payload.targetList) {
    const targetList = await ContactList.findById(payload.targetList);

    if (!targetList) {
      throw new ApiError(400, "Selected list does not exist", "LIST_NOT_FOUND");
    }
  }

  if (payload.name !== undefined) campaign.name = payload.name.trim();
  if (payload.subject !== undefined) campaign.subject = payload.subject.trim();
  if (payload.body !== undefined) campaign.body = payload.body;
  if (payload.targetList !== undefined)
    campaign.targetList = payload.targetList || null;

  await campaign.save();
  await campaign.populate("smtpConfig", "name");
  await campaign.populate("targetList", "name");

  return sanitizeCampaign(campaign);
}

async function deleteCampaign(id) {
  const campaign = await Campaign.findById(id);

  if (!campaign) {
    throw new ApiError(404, "Campaign not found", "CAMPAIGN_NOT_FOUND");
  }

  ensureDraft(campaign);

  await CampaignRecipient.deleteMany({ campaign: campaign._id });
  await campaign.deleteOne();
}

async function beginCampaignDelivery(campaign, fromStatus) {
  const smtpConfig = await SmtpConfig.findById(campaign.smtpConfig);

  if (!smtpConfig) {
    throw new ApiError(
      400,
      "Selected SMTP configuration does not exist",
      "SMTP_NOT_FOUND",
    );
  }

  if (!smtpConfig.isActive) {
    throw new ApiError(
      400,
      "Inactive SMTP configurations cannot send campaigns",
      "SMTP_INACTIVE_SEND_FORBIDDEN",
    );
  }

  const contactQuery = {
    status: "subscribed",
  };

  if (campaign.targetList) {
    contactQuery.lists = campaign.targetList;
  }

  if (campaign.excludedContacts?.length) {
    contactQuery._id = {
      $nin: campaign.excludedContacts,
    };
  }

  const contacts = await Contact.find(contactQuery);

  if (contacts.length === 0) {
    throw new ApiError(
      400,
      campaign.targetList
        ? "There are no subscribed contacts in the selected list"
        : "There are no subscribed contacts to send to",
      "CAMPAIGN_NO_RECIPIENTS",
    );
  }

  await Promise.all(
    contacts
      .filter((contact) => !contact.unsubscribeToken)
      .map(async (contact) => {
        contact.unsubscribeToken = crypto.randomBytes(16).toString("hex");
        await contact.save();
      }),
  );

  const updatedCampaign = await Campaign.findOneAndUpdate(
    { _id: campaign._id, status: fromStatus },
    {
      status: CAMPAIGN_STATUS.SENDING,
      "stats.total": contacts.length,
      "stats.sent": 0,
      "stats.failed": 0,
    },
    { new: true },
  );

  if (!updatedCampaign) {
    throw new ApiError(
      400,
      "Campaign is no longer eligible to send",
      "CAMPAIGN_NOT_ELIGIBLE",
    );
  }

  const insertedRecipients = await CampaignRecipient.insertMany(
    contacts.map((contact) => ({
      campaign: updatedCampaign._id,
      contact: contact._id,
      name: contact.name,
      email: contact.email,
      unsubscribeToken: contact.unsubscribeToken,
    })),
  );

  try {
    await campaignSendQueue.addBulk(
      insertedRecipients.map((recipient) => ({
        name: "send-recipient-email",
        data: {
          campaignId: updatedCampaign._id.toString(),
          recipientId: recipient._id.toString(),
        },
        opts: { jobId: recipient._id.toString() },
      })),
    );
  } catch (error) {
    await Campaign.findByIdAndUpdate(updatedCampaign._id, {
      status: CAMPAIGN_STATUS.FAILED,
      failureReason: `Unable to queue campaign for delivery: ${error.message}`,
    });

    throw error;
  }

  return updatedCampaign;
}

async function sendCampaign(id) {
  const campaign = await Campaign.findById(id);

  if (!campaign) {
    throw new ApiError(404, "Campaign not found", "CAMPAIGN_NOT_FOUND");
  }

  ensureDraft(campaign);

  const updatedCampaign = await beginCampaignDelivery(
    campaign,
    CAMPAIGN_STATUS.DRAFT,
  );

  await updatedCampaign.populate("smtpConfig", "name");
  await updatedCampaign.populate("targetList", "name");

  return sanitizeCampaign(updatedCampaign);
}

function ensureSchedulable(campaign) {
  if (campaign.status !== CAMPAIGN_STATUS.DRAFT) {
    throw new ApiError(
      400,
      "Only draft campaigns can be scheduled",
      "CAMPAIGN_NOT_DRAFT",
    );
  }
}

async function scheduleCampaign(id, scheduledAt) {
  const campaign = await Campaign.findById(id);

  if (!campaign) {
    throw new ApiError(404, "Campaign not found", "CAMPAIGN_NOT_FOUND");
  }

  ensureSchedulable(campaign);

  const scheduledDate = new Date(scheduledAt);

  if (
    Number.isNaN(scheduledDate.getTime()) ||
    scheduledDate.getTime() <= Date.now()
  ) {
    throw new ApiError(
      400,
      "Scheduled time must be in the future",
      "CAMPAIGN_INVALID_SCHEDULE",
    );
  }

  campaign.status = CAMPAIGN_STATUS.SCHEDULED;
  campaign.scheduledAt = scheduledDate;
  await campaign.save();
  await campaign.populate("smtpConfig", "name");
  await campaign.populate("targetList", "name");

  return sanitizeCampaign(campaign);
}

async function unscheduleCampaign(id) {
  const campaign = await Campaign.findById(id);

  if (!campaign) {
    throw new ApiError(404, "Campaign not found", "CAMPAIGN_NOT_FOUND");
  }

  if (campaign.status !== CAMPAIGN_STATUS.SCHEDULED) {
    throw new ApiError(
      400,
      "Only scheduled campaigns can be unscheduled",
      "CAMPAIGN_NOT_SCHEDULED",
    );
  }

  campaign.status = CAMPAIGN_STATUS.DRAFT;
  campaign.scheduledAt = null;
  await campaign.save();
  await campaign.populate("smtpConfig", "name");
  await campaign.populate("targetList", "name");

  return sanitizeCampaign(campaign);
}

async function processDueScheduledCampaigns() {
  const dueCampaigns = await Campaign.find({
    status: CAMPAIGN_STATUS.SCHEDULED,
    scheduledAt: { $lte: new Date() },
  });

  for (const campaign of dueCampaigns) {
    try {
      await beginCampaignDelivery(campaign, CAMPAIGN_STATUS.SCHEDULED);
    } catch (error) {
      await Campaign.findByIdAndUpdate(campaign._id, {
        status: CAMPAIGN_STATUS.FAILED,
        failureReason: error.message,
      });
    }
  }
}

async function getCampaignRecipients(
  campaignId,
  { page = 1, limit = 10, status } = {},
) {
  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    throw new ApiError(404, "Campaign not found", "CAMPAIGN_NOT_FOUND");
  }

  const query = { campaign: campaignId };

  if (status) {
    query.status = status;
  }

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (pageNumber - 1) * pageSize;

  const [items, total] = await Promise.all([
    CampaignRecipient.find(query)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(pageSize),
    CampaignRecipient.countDocuments(query),
  ]);

  return {
    items: items.map(sanitizeRecipient),
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}

async function sendTestCampaignEmail({
  smtpConfig: smtpConfigId,
  subject,
  body,
  to,
  contactName,
}) {
  const smtpConfig =
    await SmtpConfig.findById(smtpConfigId).select("+password");

  if (!smtpConfig) {
    throw new ApiError(404, "SMTP configuration not found", "SMTP_NOT_FOUND");
  }

  if (!smtpConfig.isActive) {
    throw new ApiError(
      400,
      "Inactive SMTP configurations cannot send emails",
      "SMTP_INACTIVE_SEND_FORBIDDEN",
    );
  }

  const fakeCampaign = { subject, body };
  const fakeRecipient = {
    name: contactName || "there",
    email: to,
    unsubscribeToken: "test-preview",
  };

  try {
    await sendCampaignEmailToRecipient({
      campaign: fakeCampaign,
      smtpConfig,
      recipient: fakeRecipient,
      frontendUrl: env.frontendUrl,
    });
  } catch (error) {
    throw new ApiError(
      502,
      error.message || "Failed to send test email",
      "CAMPAIGN_TEST_SEND_FAILED",
    );
  }
}

module.exports = {
  listCampaigns,
  getCampaignById,
  createCampaign,
  duplicateCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  scheduleCampaign,
  unscheduleCampaign,
  processDueScheduledCampaigns,
  getCampaignRecipients,
  sendTestCampaignEmail,
};
