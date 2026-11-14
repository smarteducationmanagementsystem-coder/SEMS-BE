const mongoose = require("mongoose");

const hiringStaffSchema = new mongoose.Schema(
  {
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    institutionCode: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    gender: { type: String, required: true, enum: ["Female", "Male"] },
    email: { type: String, default: "", lowercase: true, trim: true },
    address: { type: String, default: "", trim: true },
    qualification: { type: String, default: "", trim: true },
    subject: { type: String, default: "", trim: true },
  },
  { timestamps: true, collection: "hiring staff" },
);

module.exports = mongoose.model("HiringStaff", hiringStaffSchema);
