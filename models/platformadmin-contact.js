const mongoose = require("mongoose");

const platformContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    institution: { type: String, default: "", trim: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true, collection: "platform contact" },
);

module.exports = mongoose.model("PlatformContact", platformContactSchema);
