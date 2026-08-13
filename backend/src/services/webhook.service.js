const { Campaign } = require("../models/campaign.model");
const {
  CampaignRecipient,
  RECIPIENT_STATUS,
} = require("../models/campaignRecipient.model");
const { Contact, CONTACT_STATUS } = require("../models/contact.model");

const BOUNCE_EVENTS = new Set([
  "hard_bounce",
  "hardBounce",
  "blocked",
  "invalid",
]);

const UNSUBSCRIBE_EVENTS = new Set(["unsubscribed", "spam"]);

const TRANSIENT_EVENTS = new Set(["softBounce", "soft_bounce", "deferred"]);

function extractMessageId(payload) {
  return payload["message-id"] || payload.messageId || null;
}

function extractMailforgeIds(payload) {
  const custom = payload["X-Mailin-custom"] || payload["x-mailin-custom"] || "";

  const values = {};

  for (const part of String(custom).split(";")) {
    const [key, value] = part.split("=");

    if (key && value) {
      values[key.trim()] = value.trim();
    }
  }

  return {
    campaignId: values.campaignId || null,
    recipientId: values.recipientId || null,
  };
}

function getBrevoEventDate(payload) {
  if (Number.isFinite(Number(payload.ts_epoch))) {
    return new Date(Number(payload.ts_epoch));
  }

  if (Number.isFinite(Number(payload.ts_event))) {
    return new Date(Number(payload.ts_event) * 1000);
  }

  return null;
}

async function handleBrevoEvent(payload) {
  console.log("[BREVO WEBHOOK]", JSON.stringify(payload));
  const event = payload.event;
  const messageId = extractMessageId(payload);

  const { campaignId, recipientId } = extractMailforgeIds(payload);
  const eventDate = getBrevoEventDate(payload);

  if (!event) {
    console.warn("[BREVO WEBHOOK] Missing event", payload);
    return;
  }
  let recipient = null;

  if (recipientId) {
    recipient = await CampaignRecipient.findById(recipientId);
  }

  if (!recipient && messageId) {
    recipient = await CampaignRecipient.findOne({
      providerMessageId: messageId,
    });
  }

  if (!recipient) {
    console.warn("[BREVO WEBHOOK] Recipient not found", {
      event,
      messageId,
      campaignId,
      recipientId,
      email: payload.email,
    });
    return;
  }

  if (campaignId && recipient.campaign?.toString() !== campaignId) {
    console.warn("[BREVO WEBHOOK] Campaign mismatch", {
      event,
      messageId,
      campaignId,
      recipientId,
      databaseCampaignId: recipient.campaign?.toString(),
    });
    return;
  }

  console.log("[BREVO WEBHOOK] MAPPED", {
    event,
    messageId,
    campaignId,
    recipientId,
    email: payload.email,
    databaseRecipientId: recipient._id.toString(),
    databaseCampaignId: recipient.campaign?.toString(),
  });

  if (event === "delivered") {
    if (!recipient.deliveredAt && eventDate) {
      recipient.deliveredAt = eventDate;
      await recipient.save();
      await Campaign.findByIdAndUpdate(recipient.campaign, {
        $inc: { "stats.delivered": 1 },
      });
    }
    return;
  }

  if (
    event === "opened" ||
    event === "unique_opened" ||
    event === "uniqueOpened"
  ) {
    const isFirstOpen = !recipient.openedAt;

    recipient.openCount += 1;
    if (eventDate) {
      recipient.openedAt = eventDate;
    }

    await recipient.save();

    if (isFirstOpen) {
      await Campaign.findByIdAndUpdate(recipient.campaign, {
        $inc: { "stats.opened": 1 },
      });
    }

    return;
  }

  if (event === "click") {
    const isFirstClick = !recipient.clickedAt;

    recipient.clickCount += 1;
    if (eventDate) {
      recipient.clickedAt = eventDate;
    }

    recipient.lastClickedUrl = payload.link || recipient.lastClickedUrl;

    await recipient.save();

    if (isFirstClick) {
      await Campaign.findByIdAndUpdate(recipient.campaign, {
        $inc: { "stats.clicked": 1 },
      });
    }

    return;
  }

  if (BOUNCE_EVENTS.has(event)) {
    if (recipient.status !== RECIPIENT_STATUS.BOUNCED) {
      recipient.status = RECIPIENT_STATUS.BOUNCED;
      recipient.error = payload.reason || event;
      await recipient.save();
      await Campaign.findByIdAndUpdate(recipient.campaign, {
        $inc: { "stats.bounced": 1 },
      });
      await Contact.findByIdAndUpdate(recipient.contact, {
        status: CONTACT_STATUS.BOUNCED,
      });
    }
    return;
  }

  if (UNSUBSCRIBE_EVENTS.has(event)) {
    await Contact.findByIdAndUpdate(recipient.contact, {
      status: CONTACT_STATUS.UNSUBSCRIBED,
    });
    return;
  }

  if (TRANSIENT_EVENTS.has(event)) {
    recipient.softBounceCount += 1;
    await recipient.save();
  }

  // sent/request and any other unrecognized events: acknowledged, no action needed.
}

module.exports = { handleBrevoEvent };
