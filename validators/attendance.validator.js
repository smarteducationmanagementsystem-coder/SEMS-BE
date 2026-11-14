const { ApiError } = require("../utils/apiError");

const STATUSES = ["present", "absent", "late", "leave"];

function parseRow(source, index) {
  const row = source && typeof source === "object" ? source : {};
  const date = String(row.date ?? "").trim();
  const personId = String(row.personId ?? "").trim();
  const personName = String(row.personName ?? "").trim();
  const kind = row.kind === "staff" ? "staff" : row.kind === "student" ? "student" : "";
  const status = String(row.status ?? "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ApiError(400, `Row ${index + 1} needs a valid date.`);
  if (!personId || personId.length > 80) throw new ApiError(400, `Row ${index + 1} needs a person.`);
  if (personName.length < 2 || personName.length > 80) throw new ApiError(400, `Row ${index + 1} needs a name.`);
  if (!kind) throw new ApiError(400, `Row ${index + 1} has an unknown attendance type.`);
  if (!STATUSES.includes(status)) throw new ApiError(400, `Row ${index + 1} has an unknown status.`);
  return {
    date,
    personId,
    personName,
    kind,
    className: String(row.className ?? "").trim().slice(0, 80),
    section: String(row.section ?? "").trim().slice(0, 40),
    status,
  };
}

function parseAttendanceBatch(body) {
  const source = body && typeof body === "object" ? body : {};
  const rows = Array.isArray(source.rows) ? source.rows : [];
  if (rows.length === 0) throw new ApiError(400, "Add at least one attendance mark.");
  if (rows.length > 300) throw new ApiError(400, "Save fewer attendance marks at a time.");
  return { rows: rows.map(parseRow) };
}

module.exports = { parseAttendanceBatch };
