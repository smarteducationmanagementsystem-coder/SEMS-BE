const { ApiError } = require("../utils/apiError");

function text(value, max) {
  const next = String(value ?? "").trim();
  if (next.length > max) throw new ApiError(400, `Use ${max} characters or fewer.`);
  return next;
}

function parseQuery(body) {
  const source = body && typeof body === "object" ? body : {};
  const subject = text(source.subject, 120);
  const message = text(source.message, 2000);
  if (!subject) throw new ApiError(400, "Subject is required.");
  if (!message) throw new ApiError(400, "Message is required.");
  return { subject, message };
}

module.exports = { parseQuery };
