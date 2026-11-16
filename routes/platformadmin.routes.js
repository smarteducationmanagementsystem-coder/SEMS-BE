const express = require("express");
const multer = require("multer");
const controller = require("../controllers/platformadmin.controller");
const { requirePlatformAdmin } = require("../middlewares/platformadmin");
const { validate } = require("../middlewares/validate");
const { ApiError } = require("../utils/apiError");
const { parseLogin, parseInstitutionUpdate, parsePaymentStatus, parseEmailMessage, parseAccountUpdate, parseContact, parsePricing, parseFooter, parseContactPage } = require("../validators/platformadmin.validator");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

function landingUpload(req, res, next) {
  upload.single("image")(req, res, (error) => {
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

router.post("/login", validate(parseLogin), controller.login);
router.post("/contact", validate(parseContact), controller.saveContact);
router.get("/dashboard", requirePlatformAdmin, controller.dashboard);
router.get("/institutions", requirePlatformAdmin, controller.institutions);
router.get("/institutions/:id/storage", requirePlatformAdmin, controller.institutionStorage);
router.put("/institutions/:id", requirePlatformAdmin, validate(parseInstitutionUpdate), controller.updateInstitution);
router.delete("/institutions/:id", requirePlatformAdmin, controller.deleteInstitution);
router.get("/payments", requirePlatformAdmin, controller.payments);
router.delete("/payments", requirePlatformAdmin, controller.deletePayments);
router.put("/payments/:id", requirePlatformAdmin, validate(parsePaymentStatus), controller.markPayment);
router.get("/settings", requirePlatformAdmin, controller.account);
router.put("/settings", requirePlatformAdmin, validate(parseAccountUpdate), controller.updateAccount);
router.get("/pending-payments", requirePlatformAdmin, controller.pendingPayments);
router.get("/email/recipients", requirePlatformAdmin, controller.recipients);
router.post("/email", requirePlatformAdmin, validate(parseEmailMessage), controller.sendEmail);
router.get("/contact", requirePlatformAdmin, controller.contacts);
router.get("/pricing", controller.pricing);
router.put("/pricing", requirePlatformAdmin, validate(parsePricing), controller.savePricing);
router.get("/footer", controller.footer);
router.put("/footer", requirePlatformAdmin, validate(parseFooter), controller.saveFooter);
router.get("/contact-page", controller.contactPage);
router.put("/contact-page", requirePlatformAdmin, validate(parseContactPage), controller.saveContactPage);
router.get("/landing", controller.landing);
router.put("/landing/:slot", requirePlatformAdmin, landingUpload, controller.saveLandingImage);
router.delete("/landing/:slot", requirePlatformAdmin, controller.removeLandingImage);

module.exports = router;
