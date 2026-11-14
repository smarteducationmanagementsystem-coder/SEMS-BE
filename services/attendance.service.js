const AttendanceRecord = require("../models/AttendanceRecord");
const { ApiError } = require("../utils/apiError");
const { isKeptDate, purgeExpired } = require("./retention.service");

function serialize(doc) {
  return {
    id: String(doc._id),
    date: doc.date,
    personId: doc.personId,
    personName: doc.personName,
    kind: doc.kind,
    className: doc.className || "",
    section: doc.section || "",
    status: doc.status,
  };
}

function attendanceService() {
  return {
    async list(auth) {
      await purgeExpired(auth.institutionId);
      const filter = { institution: auth.institutionId };
      if (auth.role === "student") filter.personId = String(auth.userId);
      const rows = await AttendanceRecord.find(filter).sort({ date: -1, personName: 1 });
      return rows.map(serialize);
    },

    async save(auth, rows) {
      if (auth.role !== "owner" && auth.role !== "teacher") throw new ApiError(403, "You cannot mark attendance.");
      if (rows.some((row) => !isKeptDate(row.date))) throw new ApiError(400, "Only the current month and the previous month can be stored.");
      const saved = [];
      for (const row of rows) {
        const doc = await AttendanceRecord.findOneAndUpdate(
          { institution: auth.institutionId, kind: row.kind, date: row.date, personId: row.personId },
          {
            $set: {
              ...row,
              institution: auth.institutionId,
              institutionCode: auth.institutionCode,
            },
          },
          { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
        );
        if (!doc) throw new ApiError(500, "Attendance could not be saved.");
        saved.push(serialize(doc));
      }
      return saved;
    },
  };
}

module.exports = { attendance: attendanceService() };
