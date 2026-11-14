const mongoose = require("mongoose");
const { INSTITUTION_TYPES } = require("../constants/institution");

const locationSchema = new mongoose.Schema(
  {
    label: { type: String, default: "", trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
  },
  { _id: false },
);

const institutionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true },
    ownerName: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    type: { type: String, required: true, enum: INSTITUTION_TYPES },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    plan: { type: String, default: "Basic" },
    status: { type: String, default: "trial" },
    logoUrl: { type: String, default: "" },
    logoPublicId: { type: String, default: "", select: false },
    location1: { type: locationSchema, default: () => ({}) },
    location2: { type: locationSchema, default: () => ({}) },
    locationCheckEnabled: { type: Boolean, default: false },
    accessSet: { type: Boolean, default: false },
    access: {
      teacher: { type: [String] },
      staff: { type: [String] },
      student: { type: [String] },
    },
  },
  { timestamps: true },
);

institutionSchema.index({ city: 1, type: 1 });

module.exports = mongoose.model("Institution", institutionSchema);
