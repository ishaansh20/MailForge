const mongoose = require("mongoose");
const crypto = require("crypto");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CONTACT_STATUS = {
  SUBSCRIBED: "subscribed",
  UNSUBSCRIBED: "unsubscribed",
  BOUNCED: "bounced",
};

const contactSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 150,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      match: [EMAIL_PATTERN, "A valid email address is required"],
    },
    status: {
      type: String,
      enum: Object.values(CONTACT_STATUS),
      default: CONTACT_STATUS.SUBSCRIBED,
    },
    unsubscribeToken: {
      type: String,
      unique: true,
      sparse: true,
      default: () => crypto.randomBytes(16).toString("hex"),
    },
    lists: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "ContactList" }],
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

const Contact = mongoose.model("Contact", contactSchema);

module.exports = { Contact, CONTACT_STATUS };
