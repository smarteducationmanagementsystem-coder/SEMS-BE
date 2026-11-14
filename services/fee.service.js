const FeeSlip = require("../models/FeeSlip");
const { ApiError } = require("../utils/apiError");
const { purgeExpired } = require("./retention.service");

function serialize(doc) {
  return {
    id: String(doc._id),
    studentId: doc.studentId,
    studentName: doc.studentName,
    className: doc.className || "",
    month: doc.month,
    challanNo: doc.challanNo || "",
    tuition: doc.tuition || 0,
    other: doc.other || 0,
    discount: doc.discount || 0,
    lateFee: doc.lateFee || 0,
    paid: doc.paid || 0,
    method: doc.method || "—",
    dueDate: doc.dueDate || "",
    status: doc.status || "",
  };
}

function feeService() {
  return {
    async list(auth) {
      await purgeExpired(auth.institutionId);
      const filter = { institution: auth.institutionId };
      if (auth.role === "student") filter.studentId = String(auth.userId);
      const rows = await FeeSlip.find(filter).sort({ month: -1, studentName: 1 });
      return rows.map(serialize);
    },

    async save(auth, records) {
      if (auth.role !== "owner") throw new ApiError(403, "Only the institution owner can change fee records.");
      const saved = [];
      for (const record of records) {
        const doc = await FeeSlip.findOneAndUpdate(
          { institution: auth.institutionId, studentId: record.studentId, month: record.month },
          { $set: { ...record, institution: auth.institutionId, institutionCode: auth.institutionCode } },
          { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
        );
        if (!doc) throw new ApiError(500, "The fee record could not be saved.");
        saved.push(serialize(doc));
      }
      return saved;
    },
  };
}

module.exports = { fees: feeService() };
