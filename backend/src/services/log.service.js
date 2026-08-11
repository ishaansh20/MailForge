const { CampaignRecipient, RECIPIENT_STATUS } = require("../models/campaignRecipient.model");

function sanitizeLog(recipient) {
  return {
    id: recipient._id.toString(),
    campaign:
      recipient.campaign && recipient.campaign.name
        ? { id: recipient.campaign._id.toString(), name: recipient.campaign.name }
        : null,
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
    createdAt: recipient.createdAt,
  };
}

async function listLogs({ page = 1, limit = 10, search = "", status, campaignId } = {}) {
  const query = {};

  if (search) {
    const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ name: searchRegex }, { email: searchRegex }];
  }

  if (status) {
    query.status = status;
  }

  if (campaignId) {
    query.campaign = campaignId;
  }

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (pageNumber - 1) * pageSize;

  const [items, total] = await Promise.all([
    CampaignRecipient.find(query)
      .populate("campaign", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize),
    CampaignRecipient.countDocuments(query),
  ]);

  return {
    items: items.map(sanitizeLog),
    pagination: {
      page: pageNumber,
      limit: pageSize,
      total,
      totalPages: Math.ceil(total / pageSize) || 1,
    },
  };
}

async function getLogStats() {
  const [sent, bounced, failed, pending, total] = await Promise.all([
    CampaignRecipient.countDocuments({ status: RECIPIENT_STATUS.SENT }),
    CampaignRecipient.countDocuments({ status: RECIPIENT_STATUS.BOUNCED }),
    CampaignRecipient.countDocuments({ status: RECIPIENT_STATUS.FAILED }),
    CampaignRecipient.countDocuments({ status: RECIPIENT_STATUS.PENDING }),
    CampaignRecipient.countDocuments({}),
  ]);

  return { sent, bounced, failed, pending, total };
}

module.exports = { listLogs, getLogStats };
