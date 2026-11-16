const { asyncHandler } = require("../utils/asyncHandler");
const institutionService = require("../services/institution.service");

const updateCampus = asyncHandler(async (req, res) => {
  res.json({ data: await institutionService.updateCampus(req.auth, req.body) });
});

const updateCredentials = asyncHandler(async (req, res) => {
  res.json({ data: await institutionService.updateCredentials(req.auth, req.body) });
});

const saveLogo = asyncHandler(async (req, res) => {
  res.json({ data: await institutionService.saveLogo(req.auth, req.file) });
});

const removeLogo = asyncHandler(async (req, res) => {
  res.json({ data: await institutionService.removeLogo(req.auth) });
});

const logoFile = asyncHandler(async (req, res) => {
  const file = await institutionService.readLogo(req.params.code);
  if (file.redirect) {
    res.redirect(file.redirect);
    return;
  }
  res.set("Content-Type", file.mime);
  res.set("Cache-Control", "public, max-age=300");
  res.set("X-Content-Type-Options", "nosniff");
  res.set("Content-Security-Policy", "default-src 'none'");
  res.send(file.buffer);
});

module.exports = { updateCampus, updateCredentials, saveLogo, removeLogo, logoFile };
