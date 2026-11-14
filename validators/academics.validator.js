const { ApiError } = require("../utils/apiError");

function requiredText(value, label, max = 80) {
  const text = String(value ?? "").trim();
  if (!text) throw new ApiError(400, `${label} is required.`);
  if (text.length > max) throw new ApiError(400, `${label} must be ${max} characters or fewer.`);
  return text;
}

function optionalText(value, max = 80) {
  const text = String(value ?? "").trim();
  if (text.length > max) throw new ApiError(400, `Use ${max} characters or fewer.`);
  return text;
}

function parseClass(body) {
  const source = body && typeof body === "object" ? body : {};
  return {
    name: requiredText(source.name, "Class name"),
    section: requiredText(source.section, "Section", 40),
    session: optionalText(source.session, 40),
    teacher: optionalText(source.teacher, 80),
    room: optionalText(source.room, 40),
  };
}

function parseSubject(body) {
  const source = body && typeof body === "object" ? body : {};
  const periods = source.weeklyPeriods === undefined || source.weeklyPeriods === null || source.weeklyPeriods === "" ? 0 : Number(source.weeklyPeriods);
  if (!Number.isInteger(periods) || periods < 0 || periods > 40) throw new ApiError(400, "Weekly periods must be a whole number.");
  return {
    name: requiredText(source.name, "Subject name"),
    code: optionalText(source.code, 20),
    className: optionalText(source.className, 120),
    teacher: optionalText(source.teacher, 80),
    weeklyPeriods: periods,
  };
}

module.exports = { parseClass, parseSubject };
