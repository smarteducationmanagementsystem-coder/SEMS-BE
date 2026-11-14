const mongoose = require("mongoose");

const resultImageSchema = new mongoose.Schema(
  {
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    institutionCode: { type: String, required: true },
    className: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    month: { type: String, required: true },
    imageUrl: { type: String, required: true },
    publicId: { type: String, required: true },
  },
  { timestamps: true, collection: "result images" },
);

module.exports = mongoose.model("ResultImage", resultImageSchema);
