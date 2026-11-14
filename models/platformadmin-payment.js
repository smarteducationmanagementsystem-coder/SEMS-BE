const mongoose = require("mongoose");

const platformPaymentSchema = new mongoose.Schema(
  {
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true },
    month: { type: String, required: true },
    status: { type: String, required: true, enum: ["paid", "unpaid"] },
  },
  { timestamps: true, collection: "platform payments" },
);

platformPaymentSchema.index({ institution: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("PlatformPayment", platformPaymentSchema);
