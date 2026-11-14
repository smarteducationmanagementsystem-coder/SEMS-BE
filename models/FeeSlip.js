const mongoose = require("mongoose");

const feeSlipSchema = new mongoose.Schema(
  {
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    institutionCode: { type: String, required: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true, trim: true },
    className: { type: String, default: "", trim: true },
    month: { type: String, required: true },
    challanNo: { type: String, default: "", trim: true },
    tuition: { type: Number, default: 0 },
    other: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    lateFee: { type: Number, default: 0 },
    paid: { type: Number, default: 0 },
    method: { type: String, default: "—", trim: true },
    dueDate: { type: String, default: "" },
    status: { type: String, default: "", enum: ["", "paid", "unpaid", "pending"] },
  },
  { timestamps: true, collection: "fees" },
);

feeSlipSchema.index({ institution: 1, studentId: 1, month: 1 }, { unique: true });

module.exports = mongoose.model("FeeSlip", feeSlipSchema);
