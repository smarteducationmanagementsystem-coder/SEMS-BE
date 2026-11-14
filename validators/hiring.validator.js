const { ApiError } = require("../utils/apiError");
const { digits } = require("../utils/text");

function requiredText(value, label, max = 80) {
  const text = String(value ?? "").trim();
  if (text.length < 2) throw new ApiError(400, `${label} is required.`);
  if (text.length > max) throw new ApiError(400, `${label} must be ${max} characters or fewer.`);
  return text;
}

function optionalText(value, max = 180) {
  const text = String(value ?? "").trim();
  if (text.length > max) throw new ApiError(400, `Use ${max} characters or fewer.`);
  return text;
}

function optionalEmail(value) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!email) return "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ApiError(400, "Enter a valid email.");
  return email;
}

function parseHiring(body) {
  const source = body && typeof body === "object" ? body : {};
  const phone = String(source.phone ?? "").trim();
  if (digits(phone).length < 4) throw new ApiError(400, "Phone no must be at least 4 digits.");
  if (phone.length > 30) throw new ApiError(400, "Phone no is too long.");
  const gender = source.gender === "Male" || source.gender === "Female" ? source.gender : "";
  if (!gender) throw new ApiError(400, "Gender must be Female or Male.");
  return {
    name: requiredText(source.name, "Name"),
    phone,
    gender,
    email: optionalEmail(source.email),
    address: optionalText(source.address),
    qualification: optionalText(source.qualification, 120),
    subject: optionalText(source.subject, 80),
  };
}

module.exports = { parseHiring };
