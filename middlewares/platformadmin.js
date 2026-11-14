const jwt = require("jsonwebtoken");
const { ApiError } = require("../utils/apiError");

function readToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7).trim() : "";
}

function requirePlatformAdmin(req, res, next) {
  try {
    const token = readToken(req);
    if (!token) throw new ApiError(401, "Login required.");
    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
    } catch {
      throw new ApiError(401, "Session expired. Log in again.");
    }
    if (payload.role !== "platform") throw new ApiError(403, "Only the platform admin can open this.");
    req.platformAdmin = true;
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { requirePlatformAdmin };
