const { asyncHandler } = require("../utils/asyncHandler");
const accessService = require("../services/access.service");

const getAccess = asyncHandler(async (req, res) => {
  res.json({ data: await accessService.getAccess(req.auth) });
});

const saveAccess = asyncHandler(async (req, res) => {
  res.json({ data: await accessService.saveAccess(req.auth, req.body) });
});

module.exports = { getAccess, saveAccess };
