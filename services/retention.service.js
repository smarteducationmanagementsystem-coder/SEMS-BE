const AttendanceRecord = require("../models/AttendanceRecord");
const StaffAttendance = require("../models/StaffAttendance");
const FeeSlip = require("../models/FeeSlip");
const ResultSheet = require("../models/ResultSheet");
const ResultImage = require("../models/ResultImage");
const StudentQuery = require("../models/StudentQuery");
const { destroyAsset } = require("./cloudinary.service");

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function keptMonths(now = new Date()) {
  const current = new Date(now.getFullYear(), now.getMonth(), 1);
  const previous = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  return [monthKey(previous), monthKey(current)];
}

function monthOf(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) return monthKey(value);
  const match = String(value).match(/^(\d{4}-\d{2})/);
  return match ? match[1] : "";
}

function isKeptMonth(value, now = new Date()) {
  const month = monthOf(value);
  return Boolean(month) && keptMonths(now).includes(month);
}

function isKeptDate(value, now = new Date()) {
  return isKeptMonth(String(value || "").slice(0, 7), now);
}

async function purgeExpired(institutionId) {
  const [fees, sheets, images] = await Promise.all([
    FeeSlip.find({ institution: institutionId }).select("month"),
    ResultSheet.find({ institution: institutionId }).select("month savedOn updatedAt"),
    ResultImage.find({ institution: institutionId }).select("month publicId"),
  ]);
  const staleFees = fees.filter((row) => !isKeptMonth(row.month)).map((row) => row._id);
  const staleSheets = sheets.filter((row) => !isKeptMonth(row.month || row.savedOn || row.updatedAt)).map((row) => row._id);
  const staleImages = images.filter((row) => !isKeptMonth(row.month));
  const cutoff = `${keptMonths()[0]}-01`;
  await Promise.all([
    AttendanceRecord.deleteMany({ institution: institutionId, date: { $lt: cutoff } }),
    StaffAttendance.deleteMany({ institution: institutionId, date: { $lt: cutoff } }),
    staleFees.length ? FeeSlip.deleteMany({ _id: { $in: staleFees } }) : Promise.resolve(),
    staleSheets.length ? ResultSheet.deleteMany({ _id: { $in: staleSheets } }) : Promise.resolve(),
    staleImages.length ? ResultImage.deleteMany({ _id: { $in: staleImages.map((row) => row._id) } }) : Promise.resolve(),
    StudentQuery.deleteMany({ institution: institutionId, date: { $lt: cutoff } }),
    ...staleImages.map((row) => destroyAsset(row.publicId)),
  ]);
}

module.exports = { keptMonths, isKeptMonth, isKeptDate, purgeExpired };
