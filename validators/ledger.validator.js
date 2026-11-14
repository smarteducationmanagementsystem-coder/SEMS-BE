const { ApiError } = require("../utils/apiError");
const { isKeptDate, isKeptMonth } = require("../services/retention.service");

const WINDOW = "Only the current month and the previous month can be stored.";

function sourceOf(body) {
  return body && typeof body === "object" ? body : {};
}

function text(value, max) {
  const next = String(value ?? "").trim();
  if (next.length > max) throw new ApiError(400, `Use ${max} characters or fewer.`);
  return next;
}

function required(value, label, max) {
  const next = text(value, max);
  if (next.length < 1) throw new ApiError(400, `${label} is required.`);
  return next;
}

function dateValue(value) {
  const date = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isKeptDate(date)) throw new ApiError(400, WINDOW);
  return date;
}

function monthValue(value) {
  const month = String(value ?? "").trim();
  if (!/^\d{4}-\d{2}$/.test(month) || !isKeptMonth(month)) throw new ApiError(400, WINDOW);
  return month;
}

function money(value) {
  const number = Number(value ?? 0);
  if (!Number.isFinite(number) || number < 0 || number > 10000000) throw new ApiError(400, "Enter a valid amount.");
  return Math.round(number);
}

function width(value, fallback) {
  const number = Number(value ?? fallback);
  if (!Number.isFinite(number) || number < 0 || number > 2000) return fallback;
  return Math.round(number);
}

function personKind(value) {
  if (value === "teacher" || value === "staff") return value;
  throw new ApiError(400, "Choose a teacher or a staff member.");
}

function parseStaffPunch(body) {
  const source = sourceOf(body);
  const action = source.action === "in" || source.action === "out" ? source.action : "";
  if (!action) throw new ApiError(400, "Choose In or Out.");
  return {
    personId: required(source.personId, "Person", 80),
    personName: required(source.personName, "Name", 80),
    personKind: personKind(source.personKind),
    date: dateValue(source.date),
    action,
    time: required(source.time, "Time", 20),
  };
}

function parseStaffStatus(body) {
  const source = sourceOf(body);
  const status = String(source.status ?? "").trim();
  if (!["", "present", "late", "absent", "leave"].includes(status)) throw new ApiError(400, "That attendance status is not valid.");
  return {
    personId: required(source.personId, "Person", 80),
    personName: required(source.personName, "Name", 80),
    personKind: personKind(source.personKind),
    date: dateValue(source.date),
    status,
  };
}

function parseFee(source, index) {
  const row = sourceOf(source);
  const status = String(row.status ?? "").trim();
  if (!["", "paid", "unpaid", "pending"].includes(status)) throw new ApiError(400, `Fee ${index + 1} has an unknown status.`);
  return {
    studentId: required(row.studentId, "Student", 80),
    studentName: required(row.studentName, "Student name", 80),
    className: text(row.className, 80),
    month: monthValue(row.month),
    challanNo: text(row.challanNo, 40),
    tuition: money(row.tuition),
    other: money(row.other),
    discount: money(row.discount),
    lateFee: money(row.lateFee),
    paid: money(row.paid),
    method: text(row.method, 40) || "—",
    dueDate: text(row.dueDate, 20),
    status,
  };
}

function parseFeeBatch(body) {
  const source = sourceOf(body);
  const records = Array.isArray(source.records) ? source.records : [source];
  if (records.length === 0) throw new ApiError(400, "Add a fee record.");
  if (records.length > 500) throw new ApiError(400, "Save fewer fee records at a time.");
  return { records: records.map(parseFee) };
}

function parseFiles(value) {
  if (!Array.isArray(value) || value.length === 0) return [];
  if (value.length > 5) throw new ApiError(400, "A result can keep 5 files.");
  return value.map((file) => {
    const item = sourceOf(file);
    const mime = text(item.mime, 80);
    const url = String(item.url ?? "");
    if (!mime.startsWith("image/") && mime !== "application/pdf") throw new ApiError(400, "Result files must be an image or a PDF.");
    if (!url || url.length > 1500000) throw new ApiError(400, "That result file is too large.");
    return { name: text(item.name, 120), mime, url };
  });
}

function parseResultSheet(body) {
  const source = sourceOf(body);
  const savedOn = text(source.savedOn, 20);
  if (savedOn && !/^\d{4}-\d{2}-\d{2}$/.test(savedOn)) throw new ApiError(400, "Saved date must be a date.");
  const columns = Array.isArray(source.columns) ? source.columns : [];
  const rows = Array.isArray(source.rows) ? source.rows : [];
  if (columns.length > 32) throw new ApiError(400, "A result sheet can have 32 subject columns.");
  if (rows.length > 200) throw new ApiError(400, "A result sheet can have 200 rows.");
  return {
    id: text(source.id, 80),
    title: required(source.title, "Result title", 120),
    className: text(source.className, 80),
    section: text(source.section, 40),
    month: monthValue(source.month),
    savedOn,
    nameWidth: width(source.nameWidth, 180),
    noWidth: width(source.noWidth, 0),
    marksWidth: width(source.marksWidth, 0),
    obtainedWidth: width(source.obtainedWidth, 0),
    percentWidth: width(source.percentWidth, 0),
    positionWidth: width(source.positionWidth, 0),
    subjectRowHeight: width(source.subjectRowHeight, 0),
    labelRowHeight: width(source.labelRowHeight, 0),
    columns,
    rows,
    textStyles: source.textStyles && typeof source.textStyles === "object" ? source.textStyles : {},
    files: parseFiles(source.files),
  };
}

module.exports = { parseStaffPunch, parseStaffStatus, parseFeeBatch, parseResultSheet };
