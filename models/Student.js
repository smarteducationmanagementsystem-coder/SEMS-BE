const mongoose = require("mongoose");
const { PERSON_STATUSES } = require("../constants/institution");

const studentSchema = new mongoose.Schema(
  {
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    institutionCode: { type: String, required: true },
    admissionNo: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    gender: { type: String, required: true, enum: ["Female", "Male"] },
    className: { type: String, required: true, trim: true },
    section: { type: String, default: "", trim: true },
    session: { type: String, default: "", trim: true },
    guardian: { type: String, required: true, trim: true },
    guardianPhone: { type: String, required: true, trim: true },
    email: { type: String, default: "", lowercase: true, trim: true },
    phone: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    dob: { type: String, default: "" },
    status: { type: String, required: true, enum: PERSON_STATUSES },
    enrolledOn: { type: String, default: "" },
    secretHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

studentSchema.index({ institution: 1, admissionNo: 1 }, { unique: true });

module.exports = mongoose.model("Student", studentSchema);
