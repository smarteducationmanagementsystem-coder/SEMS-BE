const mongoose = require("mongoose");

const planSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    audience: { type: String, default: "", trim: true },
    price: { type: String, required: true, trim: true },
    period: { type: String, default: "", trim: true },
    points: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    buttonLabel: { type: String, default: "Get started", trim: true },
  },
  { _id: false },
);

const platformPricingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "public" },
    plans: { type: [planSchema], default: [] },
    payment: {
      accountName: { type: String, default: "", trim: true },
      accountNumber: { type: String, default: "", trim: true },
      detail: { type: String, default: "", trim: true },
    },
  },
  { timestamps: true, collection: "platform pricing" },
);

module.exports = mongoose.model("PlatformPricing", platformPricingSchema);
