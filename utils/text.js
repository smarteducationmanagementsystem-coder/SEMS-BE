function digits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = { digits, escapeRegex };
