const express = require("express");
const multer = require("multer");
const institutionController = require("../controllers/institution.controller");
const { requireAuth, requireOwner } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { parseCampusSettings, parseCredentials } = require("../validators/auth.validator");
const { ApiError } = require("../utils/apiError");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

function logoUpload(req, res, next) {
  upload.single("logo")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }
    if (error.code === "LIMIT_FILE_SIZE") {
      next(new ApiError(400, "Use an image smaller than 5 MB."));
      return;
    }
    next(error instanceof ApiError ? error : new ApiError(400, "Choose an image file."));
  });
}

const router = express.Router();

router.get("/brand/:code/logo", institutionController.logoFile);
router.put("/", requireAuth, requireOwner, validate(parseCampusSettings), institutionController.updateCampus);
router.put("/credentials", requireAuth, requireOwner, validate(parseCredentials), institutionController.updateCredentials);
router.post("/logo", requireAuth, requireOwner, logoUpload, institutionController.saveLogo);
router.delete("/logo", requireAuth, requireOwner, institutionController.removeLogo);

module.exports = router;
