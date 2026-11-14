const mongoose = require("mongoose");

const locationSchema = new mongoose.Schema(
  {
    label: { type: String, default: "", trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
  { _id: false },
);

const settingsSchema = new mongoose.Schema(
  {
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true, unique: true },
    institutionCode: { type: String, required: true, unique: true },
    ownerName: { type: String, required: true, trim: true },
    institutionName: { type: String, required: true, trim: true },
    tagline: { type: String, default: "", trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    address: { type: String, default: "", trim: true },
    session: { type: String, default: "2026–27", trim: true },
    lateFee: { type: Number, default: 500 },
    reminderDays: { type: Number, default: 3 },
    feeReminders: { type: Boolean, default: true },
    resultAlerts: { type: Boolean, default: true },
    attendanceAlerts: { type: Boolean, default: true },
    logoUrl: { type: String, default: "" },
    logoPublicId: { type: String, default: "" },
    logoMime: { type: String, default: "" },
    logoData: { type: Buffer, select: false },
    location1: { type: locationSchema, default: () => ({}) },
    location2: { type: locationSchema, default: () => ({}) },
    locationCheckEnabled: { type: Boolean, default: false },
    profileSaved: { type: Boolean, default: false },
  },
  { timestamps: true, collection: "settings" },
);

module.exports = mongoose.model("Settings", settingsSchema);
