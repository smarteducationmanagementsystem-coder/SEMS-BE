const mongoose = require("mongoose");

const platformContactPageSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "public" },
    email: { type: String, default: "", trim: true },
    whatsapp: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    hours: { type: String, default: "", trim: true },
    city: { type: String, default: "", trim: true },
    instagram: { type: String, default: "", trim: true },
    facebook: { type: String, default: "", trim: true },
    tiktok: { type: String, default: "", trim: true },
    placeholder: { type: Boolean, default: true },
  },
  { timestamps: true, collection: "platform contact page" },
);

module.exports = mongoose.model("PlatformContactPage", platformContactPageSchema);
