const mongoose = require("mongoose");

const classRoomSchema = new mongoose.Schema(
  {
    institution: { type: mongoose.Schema.Types.ObjectId, ref: "Institution", required: true, index: true },
    institutionCode: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    section: { type: String, required: true, trim: true },
    nameKey: { type: String, required: true },
    sectionKey: { type: String, required: true },
    session: { type: String, default: "", trim: true },
    teacher: { type: String, default: "", trim: true },
    room: { type: String, default: "", trim: true },
  },
  { timestamps: true, collection: "classes" },
);

classRoomSchema.index({ institution: 1, nameKey: 1, sectionKey: 1 }, { unique: true });

module.exports = mongoose.model("ClassRoom", classRoomSchema);
