const mongoose = require("mongoose");
const { PERSON_STATUSES } = require("../constants/institution");

const staffSchema = new mongoose.Schema(
  {
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    institutionCode: { type: String, required: true },
    employeeNo: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, default: "Staff", trim: true },
    department: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    joinedOn: { type: String, default: "" },
    status: { type: String, required: true, enum: PERSON_STATUSES },
    secretHash: { type: String, required: true, select: false },
  },
  { timestamps: true, collection: "staff" },
);

staffSchema.index({ institution: 1, email: 1 }, { unique: true });
staffSchema.index({ institution: 1, employeeNo: 1 }, { unique: true });

module.exports = mongoose.model("StaffMember", staffSchema);
