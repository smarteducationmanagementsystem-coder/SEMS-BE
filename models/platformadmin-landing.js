const mongoose = require("mongoose");

const imageSchema = {
  url: { type: String, default: "", trim: true },
  publicId: { type: String, default: "", trim: true },
};

const platformLandingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, default: "public" },
    signupImage: imageSchema,
    loginImage: imageSchema,
    logoImage: imageSchema,
    aboutImage: imageSchema,
  },
  { timestamps: true, collection: "platform landing" },
);

module.exports = mongoose.model("PlatformLanding", platformLandingSchema);
