const mongoose = require("mongoose");
const HiringStaff = require("../models/HiringStaff");
const { ApiError } = require("../utils/apiError");

function assertObjectId(id) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, "Hiring record was not found in this institution.");
}

function serialize(doc) {
  return {
    id: String(doc._id),
    name: doc.name,
    phone: doc.phone,
    email: doc.email || "",
    gender: doc.gender,
    address: doc.address || "",
    qualification: doc.qualification || "",
    subject: doc.subject || "",
  };
}

function hiringService() {
  return {
    async list(auth) {
      if (auth.role !== "owner") return [];
      const rows = await HiringStaff.find({ institution: auth.institutionId }).sort({ createdAt: -1 });
      return rows.map(serialize);
    },

    async create(auth, input) {
      const doc = await HiringStaff.create({
        ...input,
        institution: auth.institutionId,
        institutionCode: auth.institutionCode,
      });
      return serialize(doc);
    },

    async update(auth, id, input) {
      assertObjectId(id);
      const doc = await HiringStaff.findOne({ _id: id, institution: auth.institutionId });
      if (!doc) throw new ApiError(404, "Hiring record was not found in this institution.");
      doc.set({ ...input, institution: auth.institutionId, institutionCode: auth.institutionCode });
      await doc.save();
      return serialize(doc);
    },

    async remove(auth, id) {
      assertObjectId(id);
      const doc = await HiringStaff.findOneAndDelete({ _id: id, institution: auth.institutionId });
      if (!doc) throw new ApiError(404, "Hiring record was not found in this institution.");
    },
  };
}

module.exports = { hiring: hiringService() };
