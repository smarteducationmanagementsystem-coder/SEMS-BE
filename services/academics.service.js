const mongoose = require("mongoose");
const ClassRoom = require("../models/ClassRoom");
const Subject = require("../models/Subject");
const { ApiError } = require("../utils/apiError");
const { escapeRegex } = require("../utils/text");

function assertObjectId(id, label) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, `${label} was not found in this institution.`);
}

function key(value) {
  return String(value ?? "").trim().toLowerCase();
}

function sameText(value) {
  return new RegExp(`^${escapeRegex(String(value ?? "").trim())}$`, "i");
}

function serializeClass(doc) {
  return {
    id: String(doc._id),
    name: doc.name,
    section: doc.section,
    session: doc.session || "",
    teacher: doc.teacher || "",
    room: doc.room || "",
  };
}

function serializeSubject(doc) {
  return {
    id: String(doc._id),
    name: doc.name,
    code: doc.code || "",
    className: doc.className || "",
    teacher: doc.teacher || "",
    weeklyPeriods: doc.weeklyPeriods || 0,
  };
}

function classService() {
  return {
    async list(auth) {
      const rows = await ClassRoom.find({ institution: auth.institutionId }).sort({ name: 1, section: 1 });
      return rows.map(serializeClass);
    },

    async create(auth, input) {
      const existing = await ClassRoom.findOne({
        institution: auth.institutionId,
        name: sameText(input.name),
        section: sameText(input.section),
      });
      if (existing) throw new ApiError(409, "That class and section already exist in this institution.");
      const doc = await ClassRoom.create({
        ...input,
        nameKey: key(input.name),
        sectionKey: key(input.section),
        institution: auth.institutionId,
        institutionCode: auth.institutionCode,
      });
      return serializeClass(doc);
    },

    async update(auth, id, input) {
      assertObjectId(id, "Class");
      const doc = await ClassRoom.findOne({ _id: id, institution: auth.institutionId });
      if (!doc) throw new ApiError(404, "Class was not found in this institution.");
      const existing = await ClassRoom.findOne({
        institution: auth.institutionId,
        name: sameText(input.name),
        section: sameText(input.section),
        _id: { $ne: doc._id },
      });
      if (existing) throw new ApiError(409, "That class and section already exist in this institution.");
      doc.set({
        ...input,
        nameKey: key(input.name),
        sectionKey: key(input.section),
        institution: auth.institutionId,
        institutionCode: auth.institutionCode,
      });
      await doc.save();
      return serializeClass(doc);
    },

    async remove(auth, id) {
      assertObjectId(id, "Class");
      const doc = await ClassRoom.findOneAndDelete({ _id: id, institution: auth.institutionId });
      if (!doc) throw new ApiError(404, "Class was not found in this institution.");
    },
  };
}

function subjectService() {
  return {
    async list(auth) {
      const rows = await Subject.find({ institution: auth.institutionId }).sort({ name: 1 });
      return rows.map(serializeSubject);
    },

    async create(auth, input) {
      const existing = await Subject.findOne({
        institution: auth.institutionId,
        name: sameText(input.name),
        className: sameText(input.className),
      });
      if (existing) throw new ApiError(409, "That subject already exists in this institution.");
      const doc = await Subject.create({
        ...input,
        nameKey: key(input.name),
        classKey: key(input.className),
        institution: auth.institutionId,
        institutionCode: auth.institutionCode,
      });
      return serializeSubject(doc);
    },

    async update(auth, id, input) {
      assertObjectId(id, "Subject");
      const doc = await Subject.findOne({ _id: id, institution: auth.institutionId });
      if (!doc) throw new ApiError(404, "Subject was not found in this institution.");
      const existing = await Subject.findOne({
        institution: auth.institutionId,
        name: sameText(input.name),
        className: sameText(input.className),
        _id: { $ne: doc._id },
      });
      if (existing) throw new ApiError(409, "That subject already exists in this institution.");
      doc.set({
        ...input,
        nameKey: key(input.name),
        classKey: key(input.className),
        institution: auth.institutionId,
        institutionCode: auth.institutionCode,
      });
      await doc.save();
      return serializeSubject(doc);
    },

    async remove(auth, id) {
      assertObjectId(id, "Subject");
      const doc = await Subject.findOneAndDelete({ _id: id, institution: auth.institutionId });
      if (!doc) throw new ApiError(404, "Subject was not found in this institution.");
    },
  };
}

module.exports = { classes: classService(), subjects: subjectService() };
