const mongoose = require("mongoose");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RECIPIENT_STATUS = {
  PENDING: "pending",
  SENT: "sent",
  BOUNCED: "bounced",
  FAILED: "failed",
};

const campaignRecipientSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
      index: true,
    },
    contact: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      match: [EMAIL_PATTERN, "A valid email address is required"],
    },
    unsubscribeToken: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(RECIPIENT_STATUS),
      default: RECIPIENT_STATUS.PENDING,
    },
    error: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    providerMessageId: {
      type: String,
      default: null,
      index: true,
    },
    deliveredAt: {
      type: Date,
      default: null,
    },
    openedAt: {
      type: Date,
      default: null,
    },
    openCount: {
      type: Number,
      default: 0,
    },
    clickedAt: {
      type: Date,
      default: null,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    lastClickedUrl: {
      type: String,
      default: null,
    },
    softBounceCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

const CampaignRecipient = mongoose.model("CampaignRecipient", campaignRecipientSchema);

module.exports = { CampaignRecipient, RECIPIENT_STATUS };
