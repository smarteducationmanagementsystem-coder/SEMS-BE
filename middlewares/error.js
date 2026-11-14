const { ApiError } = require("../utils/apiError");

function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    next(error);
    return;
  }
  if (error?.name === "MulterError" && error.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({ message: "Use an image smaller than 5 MB." });
    return;
  }
  if (error?.code === 11000) {
    res.status(409).json({ message: "That record already exists for this institution." });
    return;
  }
  const status = error instanceof ApiError ? error.status : 500;
  if (status === 500) console.error(error);
  res.status(status).json({ message: status === 500 ? "Something went wrong." : error.message });
}

module.exports = { errorHandler };
