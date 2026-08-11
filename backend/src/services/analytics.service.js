const { Contact, CONTACT_STATUS } = require("../models/contact.model");
const { Campaign, CAMPAIGN_STATUS } = require("../models/campaign.model");
const {
  CampaignRecipient,
  RECIPIENT_STATUS,
} = require("../models/campaignRecipient.model");
const { computeCampaignRates } = require("../utils/campaignRates.util");

function getMonthBoundaries(monthsAgo) {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo, 1),
  );
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - monthsAgo + 1, 1),
  );

  return { start, end };
}

function calcChangePercent(current, previous) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 1000) / 10;
}

async function getTrends() {
  const thisMonth = getMonthBoundaries(0);
  const lastMonth = getMonthBoundaries(1);

  const [
    contactsThisMonth,
    contactsLastMonth,
    campaignsThisMonth,
    campaignsLastMonth,
    sentThisMonth,
    sentLastMonth,
  ] = await Promise.all([
    Contact.countDocuments({
      createdAt: { $gte: thisMonth.start, $lt: thisMonth.end },
    }),
    Contact.countDocuments({
      createdAt: { $gte: lastMonth.start, $lt: lastMonth.end },
    }),
    Campaign.countDocuments({
      createdAt: { $gte: thisMonth.start, $lt: thisMonth.end },
    }),
    Campaign.countDocuments({
      createdAt: { $gte: lastMonth.start, $lt: lastMonth.end },
    }),
    CampaignRecipient.countDocuments({
      status: { $in: [RECIPIENT_STATUS.SENT, RECIPIENT_STATUS.BOUNCED] },
      sentAt: { $gte: thisMonth.start, $lt: thisMonth.end },
    }),
    CampaignRecipient.countDocuments({
      status: { $in: [RECIPIENT_STATUS.SENT, RECIPIENT_STATUS.BOUNCED] },
      sentAt: { $gte: lastMonth.start, $lt: lastMonth.end },
    }),
  ]);

  return {
    contacts: {
      current: contactsThisMonth,
      previous: contactsLastMonth,
      changePercent: calcChangePercent(contactsThisMonth, contactsLastMonth),
    },
    campaigns: {
      current: campaignsThisMonth,
      previous: campaignsLastMonth,
      changePercent: calcChangePercent(campaignsThisMonth, campaignsLastMonth),
    },
    sent: {
      current: sentThisMonth,
      previous: sentLastMonth,
      changePercent: calcChangePercent(sentThisMonth, sentLastMonth),
    },
  };
}

async function getSubscriberGrowth(months = 12) {
  const monthCount = Math.min(24, Math.max(1, Number(months) || 12));
  const now = new Date();
  const rangeStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (monthCount - 1), 1),
  );

  const [baselineCount, monthlyNew] = await Promise.all([
    Contact.countDocuments({ createdAt: { $lt: rangeStart } }),
    Contact.aggregate([
      { $match: { createdAt: { $gte: rangeStart } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  const newByMonth = new Map(
    monthlyNew.map((entry) => [entry._id, entry.count]),
  );

  let runningTotal = baselineCount;
  const points = [];

  for (let i = 0; i < monthCount; i += 1) {
    const monthDate = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() - (monthCount - 1) + i,
        1,
      ),
    );
    const key = `${monthDate.getUTCFullYear()}-${String(monthDate.getUTCMonth() + 1).padStart(2, "0")}`;

    runningTotal += newByMonth.get(key) || 0;
    points.push({ month: key, count: runningTotal });
  }

  return points;
}

async function getOverview() {
  const [
    totalContacts,
    subscribedContacts,
    unsubscribedContacts,
    bouncedContacts,
    totalCampaigns,
    totalSent,
    totalFailed,
    draftCampaigns,
    scheduledCampaigns,
    sendingCampaigns,
    completedCampaigns,
    failedCampaigns,
    engagementAgg,
  ] = await Promise.all([
    Contact.countDocuments({}),
    Contact.countDocuments({ status: CONTACT_STATUS.SUBSCRIBED }),
    Contact.countDocuments({ status: CONTACT_STATUS.UNSUBSCRIBED }),
    Contact.countDocuments({ status: CONTACT_STATUS.BOUNCED }),
    Campaign.countDocuments({}),
    CampaignRecipient.countDocuments({
      status: { $in: [RECIPIENT_STATUS.SENT, RECIPIENT_STATUS.BOUNCED] },
    }),
    CampaignRecipient.countDocuments({ status: RECIPIENT_STATUS.FAILED }),
    Campaign.countDocuments({ status: CAMPAIGN_STATUS.DRAFT }),
    Campaign.countDocuments({ status: CAMPAIGN_STATUS.SCHEDULED }),
    Campaign.countDocuments({ status: CAMPAIGN_STATUS.SENDING }),
    Campaign.countDocuments({ status: CAMPAIGN_STATUS.COMPLETED }),
    Campaign.countDocuments({ status: CAMPAIGN_STATUS.FAILED }),
    Campaign.aggregate([
      {
        $group: {
          _id: null,
          delivered: { $sum: "$stats.delivered" },
          opened: { $sum: "$stats.opened" },
          clicked: { $sum: "$stats.clicked" },
          bounced: { $sum: "$stats.bounced" },
        },
      },
    ]),
  ]);

  const totalAttempted = totalSent + totalFailed;
  const successRate =
    totalAttempted > 0
      ? Math.round((totalSent / totalAttempted) * 1000) / 10
      : 0;

  const engagement = engagementAgg[0] || {
    delivered: 0,
    opened: 0,
    clicked: 0,
    bounced: 0,
  };
  const rates = computeCampaignRates({
    sent: totalSent,
    delivered: engagement.delivered,
    opened: engagement.opened,
    clicked: engagement.clicked,
    bounced: engagement.bounced,
  });

  return {
    totalContacts,
    subscribedContacts,
    unsubscribedContacts,
    bouncedContacts,
    totalCampaigns,
    totalSent,
    totalFailed,
    totalDelivered: engagement.delivered,
    totalOpened: engagement.opened,
    totalClicked: engagement.clicked,
    totalBounced: engagement.bounced,
    successRate,
    openRate: rates.openRate,
    clickRate: rates.clickRate,
    bounceRate: rates.bounceRate,
    campaignsByStatus: {
      draft: draftCampaigns,
      scheduled: scheduledCampaigns,
      sending: sendingCampaigns,
      completed: completedCampaigns,
      failed: failedCampaigns,
    },
  };
}

async function getSendsOverTime(days = 14) {
  const dayCount = Math.min(90, Math.max(1, Number(days) || 14));

  const now = new Date();
  const todayUtcMidnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
  );
  const since = new Date(
    todayUtcMidnight - (dayCount - 1) * 24 * 60 * 60 * 1000,
  );

  const results = await CampaignRecipient.aggregate([
    { $match: { sentAt: { $ne: null, $gte: since } } },
    {
      $group: {
        _id: {
          date: { $dateToString: { format: "%Y-%m-%d", date: "$sentAt" } },
          status: "$status",
        },
        count: { $sum: 1 },
      },
    },
  ]);

  const dateMap = new Map();

  for (let i = 0; i < dayCount; i += 1) {
    const key = new Date(since.getTime() + i * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    dateMap.set(key, { date: key, sent: 0, failed: 0 });
  }

  results.forEach((entry) => {
    const dayEntry = dateMap.get(entry._id.date);

    if (!dayEntry) {
      return;
    }

    if (entry._id.status === RECIPIENT_STATUS.SENT) {
      dayEntry.sent = entry.count;
    } else if (
      entry._id.status === RECIPIENT_STATUS.FAILED ||
      entry._id.status === RECIPIENT_STATUS.BOUNCED
    ) {
      dayEntry.failed += entry.count;
    }
  });

  return Array.from(dateMap.values());
}

async function getTopCampaigns(
  limit = 100,
  sortBy = "total",
  campaignFilter = "all",
) {
  const limitNumber = Math.min(100, Math.max(1, Number(limit) || 100));

  const query = {
    $or: [{ isTestCampaign: false }, { isTestCampaign: { $exists: false } }],
  };

  switch (campaignFilter) {
    case "sent":
      query["stats.sent"] = { $gt: 0 };
      break;
    case "not_sent":
      query["stats.sent"] = 0;
      query.status = {
        $in: [CAMPAIGN_STATUS.DRAFT, CAMPAIGN_STATUS.SCHEDULED],
      };
      break;
    case "scheduled":
      query.status = CAMPAIGN_STATUS.SCHEDULED;
      break;
    case "sending":
      query.status = CAMPAIGN_STATUS.SENDING;
      break;
    case "completed":
      query.status = CAMPAIGN_STATUS.COMPLETED;
      break;
    case "failed":
      query.status = CAMPAIGN_STATUS.FAILED;
      break;
    case "all":
    default:
      break;
  }

  const sortOrder =
    sortBy === "latest"
      ? { createdAt: -1 }
      : { "stats.total": -1, createdAt: -1 };

  const campaigns = await Campaign.find(query)
    .sort(sortOrder)
    .limit(limitNumber);

  return campaigns.map((campaign) => {
    const stats = campaign.stats || {};
    const delivered = stats.delivered || 0;
    const opened = stats.opened || 0;
    const clicked = stats.clicked || 0;
    const sent = stats.sent || 0;

    return {
      id: campaign._id.toString(),
      name: campaign.name,
      subject: campaign.subject,
      status: campaign.status,
      sendStatus:
        sent > 0
          ? "sent"
          : campaign.status === CAMPAIGN_STATUS.SENDING
            ? "sending"
            : campaign.status === CAMPAIGN_STATUS.SCHEDULED
              ? "scheduled"
              : campaign.status === CAMPAIGN_STATUS.FAILED
                ? "failed"
                : "not_sent",
      total: stats.total || 0,
      sent,
      delivered,
      opened,
      notOpened: Math.max(delivered - opened, 0),
      clicked,
      notClicked: Math.max(delivered - clicked, 0),
      bounced: stats.bounced || 0,
      failed: stats.failed || 0,
      deliveryRate: sent > 0 ? Math.round((delivered / sent) * 1000) / 10 : 0,
      successRate:
        stats.total > 0 ? Math.round((sent / stats.total) * 1000) / 10 : 0,
      scheduledAt: campaign.scheduledAt,
      sentAt: campaign.sentAt,
      createdAt: campaign.createdAt,
      ...computeCampaignRates(stats),
    };
  });
}

module.exports = {
  getOverview,
  getSendsOverTime,
  getTopCampaigns,
  getTrends,
  getSubscriberGrowth,
};
