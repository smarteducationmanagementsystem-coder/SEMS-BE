const StaffAttendance = require("../models/StaffAttendance");
const { ApiError } = require("../utils/apiError");
const { purgeExpired } = require("./retention.service");

function serialize(doc) {
  return {
    id: String(doc._id),
    personId: doc.personId,
    personName: doc.personName,
    personKind: doc.personKind,
    date: doc.date,
    inTime: doc.inTime || "",
    outTime: doc.outTime || "",
    status: doc.status || "",
  };
}

function assertSelf(auth, personId) {
  if (auth.role === "owner") return;
  if ((auth.role === "teacher" || auth.role === "staff") && String(auth.userId) === personId) return;
  throw new ApiError(403, "You can record attendance only for your own name.");
}

function staffAttendanceService() {
  return {
    async list(auth) {
      await purgeExpired(auth.institutionId);
      if (auth.role === "student") return [];
      const filter = { institution: auth.institutionId };
      if (auth.role === "teacher" || auth.role === "staff") filter.personId = String(auth.userId);
      const rows = await StaffAttendance.find(filter).sort({ date: -1, personName: 1 });
      return rows.map(serialize);
    },

    async punch(auth, input) {
      assertSelf(auth, input.personId);
      const existing = await StaffAttendance.findOne({ institution: auth.institutionId, personId: input.personId, date: input.date });
      if (existing?.status === "absent" || existing?.status === "leave") {
        throw new ApiError(400, "In and Out stay closed when the day is absent or leave.");
      }
      const field = input.action === "in" ? "inTime" : "outTime";
      if (existing?.[field]) return serialize(existing);
      const doc = await StaffAttendance.findOneAndUpdate(
        { institution: auth.institutionId, personId: input.personId, date: input.date },
        {
          $set: {
            institution: auth.institutionId,
            institutionCode: auth.institutionCode,
            personId: input.personId,
            personName: input.personName,
            personKind: input.personKind,
            date: input.date,
            [field]: input.time,
          },
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
      if (!doc) throw new ApiError(500, "Attendance could not be saved.");
      return serialize(doc);
    },

    async mark(auth, input) {
      assertSelf(auth, input.personId);
      const doc = await StaffAttendance.findOneAndUpdate(
        { institution: auth.institutionId, personId: input.personId, date: input.date },
        {
          $set: {
            institution: auth.institutionId,
            institutionCode: auth.institutionCode,
            personId: input.personId,
            personName: input.personName,
            personKind: input.personKind,
            date: input.date,
            status: input.status,
          },
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
      if (!doc) throw new ApiError(500, "Attendance could not be saved.");
      return serialize(doc);
    },
  };
}

module.exports = { staffAttendance: staffAttendanceService() };
