const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/apiError");
const { resolveMembership } = require("../services/auth.service");

function readToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

async function requireAuth(req, res, next) {
  try {
    const token = readToken(req);
    if (!token) throw new ApiError(401, "Login required.");
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    } catch {
      throw new ApiError(401, "Session expired. Log in again.");
    }
    // Tenant is loaded from the saved account. school_id in the request is ignored.
    const membership = await resolveMembership(payload);
    if (!membership) throw new ApiError(401, "This account is no longer active.");
    req.auth = membership;
    next();
  } catch (error) {
    next(error);
  }
}

function requireOwner(req, res, next) {
  if (req.auth?.role !== "owner") {
    next(new ApiError(403, "Only the institution owner can change this record."));
    return;
  }
  next();
}

module.exports = { requireAuth, requireOwner };
