const mongoose = require("mongoose");

const contactListSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
      minlength: 2,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  },
);

const ContactList = mongoose.model("ContactList", contactListSchema);

module.exports = { ContactList };
