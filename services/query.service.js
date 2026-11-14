const mongoose = require("mongoose");
const Student = require("../models/Student");
const StudentQuery = require("../models/StudentQuery");
const { ApiError } = require("../utils/apiError");
const { purgeExpired } = require("./retention.service");

function todayKey(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function serialize(doc) {
  return {
    id: String(doc._id),
    name: doc.name,
    email: doc.email || "",
    institution: "",
    subject: doc.subject,
    className: doc.className || "",
    studentId: doc.studentId,
    message: doc.message,
    status: doc.status === "read" ? "read" : "new",
    date: doc.date,
  };
}

function queryService() {
  return {
    async list(auth) {
      await purgeExpired(auth.institutionId);
      if (!["owner", "teacher", "staff", "student"].includes(auth.role)) return [];
      const filter = { institution: auth.institutionId };
      if (auth.role === "student") filter.studentId = String(auth.userId);
      const rows = await StudentQuery.find(filter).sort({ date: -1, createdAt: -1 });
      return rows.map(serialize);
    },

    async create(auth, input) {
      if (auth.role !== "student") throw new ApiError(403, "Only a student can send a query.");
      const student = await Student.findOne({ _id: auth.userId, institution: auth.institutionId });
      if (!student) throw new ApiError(403, "Only a student can send a query.");
      const doc = await StudentQuery.create({
        institution: auth.institutionId,
        institutionCode: auth.institutionCode,
        studentId: String(student._id),
        name: student.name,
        email: student.email || "",
        className: student.section ? `${student.className} · ${student.section}` : student.className,
        subject: input.subject,
        message: input.message,
        status: "new",
        date: todayKey(),
      });
      return serialize(doc);
    },

    async markRead(auth, id) {
      if (!["owner", "teacher", "staff"].includes(auth.role)) throw new ApiError(403, "You cannot update this query.");
      if (!mongoose.isValidObjectId(id)) throw new ApiError(404, "That query was not found.");
      const doc = await StudentQuery.findOneAndUpdate(
        { _id: id, institution: auth.institutionId },
        { $set: { status: "read" } },
        { returnDocument: "after" },
      );
      if (!doc) throw new ApiError(404, "That query was not found.");
      return serialize(doc);
    },
  };
}

module.exports = { queries: queryService() };
