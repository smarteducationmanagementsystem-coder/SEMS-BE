const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true },
    institutionCode: { type: String, required: true },
    key: { type: String, required: true, enum: ["super_admin", "teacher", "staff", "student"] },
    label: { type: String, required: true, trim: true },
    title: { type: String, default: "", trim: true },
    description: { type: String, default: "", trim: true },
    pages: { type: [String], default: [] },
  },
  { timestamps: true, collection: "roles" },
);

roleSchema.index({ institution: 1, key: 1 }, { unique: true });

module.exports = mongoose.model("Role", roleSchema);
