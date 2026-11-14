const mongoose = require("mongoose");

const platformAdminSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
  },
  { timestamps: true, collection: "platformadmin" },
);

module.exports = mongoose.model("PlatformAdmin", platformAdminSchema);
