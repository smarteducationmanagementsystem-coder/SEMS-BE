const ResultImage = require("../models/ResultImage");
const Student = require("../models/Student");
const { ApiError } = require("../utils/apiError");
const { uploadResultImage } = require("./cloudinary.service");
const { keptMonths, purgeExpired } = require("./retention.service");

function sameText(left, right) {
  return String(left || "").trim().toLowerCase() === String(right || "").trim().toLowerCase();
}

function serialize(doc) {
  return {
    id: String(doc._id),
    className: doc.className,
    section: doc.section,
    month: doc.month,
    imageUrl: doc.imageUrl,
  };
}

function canUpload(auth) {
  return auth.role === "owner" || auth.role === "teacher" || auth.role === "staff";
}

function resultImageService() {
  return {
    async list(auth) {
      await purgeExpired(auth.institutionId);
      const rows = await ResultImage.find({ institution: auth.institutionId }).sort({ createdAt: -1 });
      if (auth.role === "student") {
        const student = await Student.findOne({ _id: auth.userId, institution: auth.institutionId }).select("className section");
        if (!student) return [];
        return rows.filter((row) => sameText(row.className, student.className) && sameText(row.section, student.section)).map(serialize);
      }
      if (!canUpload(auth)) return [];
      return rows.map(serialize);
    },

    async save(auth, file, className, section) {
      if (!canUpload(auth)) throw new ApiError(403, "You cannot upload a result image.");
      const room = String(className || "").trim();
      const group = String(section || "").trim();
      if (!room || room.length > 80 || !group || group.length > 40) throw new ApiError(400, "Choose a class and a section.");
      if (!file?.buffer?.length) throw new ApiError(400, "Choose an image file.");
      const uploaded = await uploadResultImage({ code: auth.institutionCode, _id: auth.institutionId }, file.buffer, file.mimetype, file.originalname);
      const doc = await ResultImage.create({
        institution: auth.institutionId,
        institutionCode: auth.institutionCode,
        className: room,
        section: group,
        month: keptMonths()[1],
        imageUrl: uploaded.imageUrl,
        publicId: uploaded.publicId,
      });
      return serialize(doc);
    },
  };
}

module.exports = { resultImages: resultImageService() };
