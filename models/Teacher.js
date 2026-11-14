const mongoose = require("mongoose");
const { PERSON_STATUSES } = require("../constants/institution");

const teacherSchema = new mongoose.Schema(
  {
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    institutionCode: { type: String, required: true },
    employeeNo: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    subject: { type: String, required: true, trim: true },
    classes: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    qualification: { type: String, required: true, trim: true },
    joinedOn: { type: String, default: "" },
    status: { type: String, required: true, enum: PERSON_STATUSES },
    secretHash: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

teacherSchema.index({ institution: 1, email: 1 }, { unique: true });
teacherSchema.index({ institution: 1, employeeNo: 1 }, { unique: true });

module.exports = mongoose.model("Teacher", teacherSchema);
