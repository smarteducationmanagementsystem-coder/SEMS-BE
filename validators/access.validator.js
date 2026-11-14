const { ApiError } = require("../utils/apiError");
const { GRANTABLE_PAGES } = require("../constants/pages");

function pageList(value, label) {
  if (!Array.isArray(value)) throw new ApiError(400, `${label} permissions must be a list.`);
  const pages = [];
  for (const item of value) {
    const href = String(item ?? "").trim();
    if (!GRANTABLE_PAGES.includes(href)) throw new ApiError(400, "That page cannot be assigned.");
    if (!pages.includes(href)) pages.push(href);
  }
  return pages;
}

function parseAccess(body) {
  const source = body && typeof body === "object" ? body : {};
  return {
    teacher: pageList(source.teacher, "Teacher"),
    staff: pageList(source.staff, "Staff"),
    student: pageList(source.student, "Student"),
  };
}

module.exports = { parseAccess };
