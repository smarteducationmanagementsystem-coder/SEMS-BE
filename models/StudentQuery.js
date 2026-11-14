const mongoose = require("mongoose");

const studentQuerySchema = new mongoose.Schema(
  {
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true },
    institutionCode: { type: String, required: true },
    studentId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true },
    className: { type: String, default: "", trim: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: { type: String, default: "new", enum: ["new", "read"] },
    date: { type: String, required: true },
  },
  { timestamps: true, collection: "student queries" },
);

studentQuerySchema.index({ institution: 1, date: 1 });
studentQuerySchema.index({ institution: 1, studentId: 1, date: 1 });

module.exports = mongoose.model("StudentQuery", studentQuerySchema);
