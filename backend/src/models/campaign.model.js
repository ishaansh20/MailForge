const mongoose = require("mongoose");

const CAMPAIGN_STATUS = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  SENDING: "sending",
  COMPLETED: "completed",
  FAILED: "failed",
};

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 150,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    body: {
      type: String,
      required: true,
    },
    smtpConfig: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SmtpConfig",
      required: true,
    },
    targetList: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ContactList",
      default: null,
    },
    excludedContacts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Contact",
      },
    ],
    status: {
      type: String,
      enum: Object.values(CAMPAIGN_STATUS),
      default: CAMPAIGN_STATUS.DRAFT,
    },
    stats: {
      total: { type: Number, default: 0 },
      sent: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      delivered: { type: Number, default: 0 },
      opened: { type: Number, default: 0 },
      clicked: { type: Number, default: 0 },
      bounced: { type: Number, default: 0 },
    },
    failureReason: {
      type: String,
      default: null,
    },
    scheduledAt: {
      type: Date,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
    isTestCampaign: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const Campaign = mongoose.model("Campaign", campaignSchema);

module.exports = { Campaign, CAMPAIGN_STATUS };
