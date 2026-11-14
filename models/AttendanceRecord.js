const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    institutionCode: { type: String, required: true },
    date: { type: String, required: true },
    personId: { type: String, required: true },
    personName: { type: String, required: true, trim: true },
    kind: { type: String, required: true, enum: ["student", "staff"] },
    className: { type: String, default: "", trim: true },
    section: { type: String, default: "", trim: true },
    status: { type: String, required: true, enum: ["present", "absent", "late", "leave"] },
  },
  { timestamps: true, collection: "attendance" },
);

attendanceSchema.index({ institution: 1, kind: 1, date: 1, personId: 1 }, { unique: true });

module.exports = mongoose.model("AttendanceRecord", attendanceSchema);
