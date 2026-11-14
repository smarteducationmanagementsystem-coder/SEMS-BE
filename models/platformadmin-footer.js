const mongoose = require("mongoose");

const platformFooterSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "public" },
    blurb: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    hours: { type: String, default: "", trim: true },
    instagram: { type: String, default: "", trim: true },
    facebook: { type: String, default: "", trim: true },
    tiktok: { type: String, default: "", trim: true },
    whatsapp: { type: String, default: "", trim: true },
  },
  { timestamps: true, collection: "platform footer" },
);

module.exports = mongoose.model("PlatformFooter", platformFooterSchema);
