const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
  {
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    institutionCode: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    nameKey: { type: String, required: true },
    classKey: { type: String, default: "" },
    code: { type: String, default: "", trim: true },
    className: { type: String, default: "", trim: true },
    teacher: { type: String, default: "", trim: true },
    weeklyPeriods: { type: Number, default: 0 },
  },
  { timestamps: true },
);

subjectSchema.index({ institution: 1, nameKey: 1, classKey: 1 }, { unique: true });

module.exports = mongoose.model("Subject", subjectSchema);
