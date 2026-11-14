const { asyncHandler } = require("../utils/asyncHandler");
const catalogService = require("../services/catalog.service");
const { parseDirectoryQuery } = require("../validators/auth.validator");

const cities = asyncHandler(async (req, res) => {
  res.json({ data: await catalogService.listCities() });
});

const institutions = asyncHandler(async (req, res) => {
  const query = parseDirectoryQuery(req.query);
  res.json({ data: await catalogService.listInstitutions(query) });
});

module.exports = { cities, institutions };
