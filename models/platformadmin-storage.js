const mongoose = require("mongoose");

const storageUsageSchema = new mongoose.Schema(
  {
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true, unique: true },
    databaseBytes: { type: Number, required: true, default: 0 },
    cloudinaryBytes: { type: Number, default: null },
    measuredAt: { type: Date, required: true },
  },
  { timestamps: true, collection: "storage usage" },
);

module.exports = mongoose.model("StorageUsage", storageUsageSchema);
