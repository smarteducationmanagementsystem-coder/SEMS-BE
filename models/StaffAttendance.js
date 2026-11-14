const mongoose = require("mongoose");

const staffAttendanceSchema = new mongoose.Schema(
  {
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    institutionCode: { type: String, required: true },
    personId: { type: String, required: true },
    personName: { type: String, required: true, trim: true },
    personKind: { type: String, required: true, enum: ["teacher", "staff"] },
    date: { type: String, required: true },
    inTime: { type: String, default: "" },
    outTime: { type: String, default: "" },
    status: { type: String, default: "", enum: ["", "present", "late", "absent", "leave"] },
  },
  { timestamps: true, collection: "staff attendance" },
);

staffAttendanceSchema.index({ institution: 1, personId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("StaffAttendance", staffAttendanceSchema);
