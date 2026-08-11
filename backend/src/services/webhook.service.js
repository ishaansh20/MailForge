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

async function handleBrevoEvent(payload) {
  console.log("[BREVO WEBHOOK]", JSON.stringify(payload));
  const event = payload.event;
  const messageId = extractMessageId(payload);

  if (!event || !messageId) {
    console.warn("[BREVO WEBHOOK] Missing event or message-id", payload);
    return;
  }

  const recipient = await CampaignRecipient.findOne({
    providerMessageId: messageId,
  });

  if (!recipient) {
    console.warn("[BREVO WEBHOOK] Recipient not found", {
      event,
      messageId,
      email: payload.email,
    });
    return;
  }

  if (event === "delivered") {
    if (!recipient.deliveredAt) {
      recipient.deliveredAt = new Date();
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

    if (isFirstOpen) {
      recipient.openedAt = new Date();
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
    recipient.lastClickedUrl = payload.link || recipient.lastClickedUrl;

    if (isFirstClick) {
      recipient.clickedAt = new Date();
    }

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
