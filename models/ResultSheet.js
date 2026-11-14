const mongoose = require("mongoose");

const resultSheetSchema = new mongoose.Schema(
  {
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    institutionCode: { type: String, required: true },
    sheetKey: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    className: { type: String, default: "", trim: true },
    section: { type: String, default: "", trim: true },
    month: { type: String, required: true },
    savedOn: { type: String, default: "" },
    nameWidth: { type: Number, default: 180 },
    noWidth: { type: Number, default: 0 },
    marksWidth: { type: Number, default: 0 },
    obtainedWidth: { type: Number, default: 0 },
    percentWidth: { type: Number, default: 0 },
    positionWidth: { type: Number, default: 0 },
    subjectRowHeight: { type: Number, default: 0 },
    labelRowHeight: { type: Number, default: 0 },
    columns: { type: [mongoose.Schema.Types.Mixed], default: [] },
    rows: { type: [mongoose.Schema.Types.Mixed], default: [] },
    textStyles: { type: mongoose.Schema.Types.Mixed, default: {} },
    files: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true, collection: "result sheets" },
);

resultSheetSchema.index({ institution: 1, sheetKey: 1 }, { unique: true });

module.exports = mongoose.model("ResultSheet", resultSheetSchema);
