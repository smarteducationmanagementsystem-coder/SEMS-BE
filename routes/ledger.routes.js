const express = require("express");
const multer = require("multer");
const { requireAuth } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { asyncHandler } = require("../utils/asyncHandler");
const { staffAttendance } = require("../services/staff-attendance.service");
const { fees } = require("../services/fee.service");
const { resultSheets } = require("../services/result-sheet.service");
const { resultImages } = require("../services/result-image.service");
const { parseStaffPunch, parseStaffStatus, parseFeeBatch, parseResultSheet } = require("../validators/ledger.validator");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

function resultImageUpload(req, res, next) {
  upload.single("image")(req, res, (error) => {
    next(error);
  });
}

const router = express.Router();

router.get(
  "/staff-attendance",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ data: await staffAttendance.list(req.auth) });
  }),
);
router.post(
  "/staff-attendance/punch",
  requireAuth,
  validate(parseStaffPunch),
  asyncHandler(async (req, res) => {
    res.json({ data: await staffAttendance.punch(req.auth, req.body) });
  }),
);
router.post(
  "/staff-attendance/status",
  requireAuth,
  validate(parseStaffStatus),
  asyncHandler(async (req, res) => {
    res.json({ data: await staffAttendance.mark(req.auth, req.body) });
  }),
);

router.get(
  "/fees",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ data: await fees.list(req.auth) });
  }),
);
router.post(
  "/fees",
  requireAuth,
  validate(parseFeeBatch),
  asyncHandler(async (req, res) => {
    res.json({ data: await fees.save(req.auth, req.body.records) });
  }),
);

router.get(
  "/result-sheets",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ data: await resultSheets.list(req.auth) });
  }),
);
router.put(
  "/result-sheets",
  requireAuth,
  validate(parseResultSheet),
  asyncHandler(async (req, res) => {
    res.json({ data: await resultSheets.save(req.auth, req.body) });
  }),
);
router.delete(
  "/result-sheets/:sheetKey",
  requireAuth,
  asyncHandler(async (req, res) => {
    await resultSheets.remove(req.auth, req.params.sheetKey);
    res.json({ ok: true });
  }),
);

router.get(
  "/result-images",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ data: await resultImages.list(req.auth) });
  }),
);
router.post(
  "/result-images",
  requireAuth,
  resultImageUpload,
  asyncHandler(async (req, res) => {
    res.json({ data: await resultImages.save(req.auth, req.file, req.body.className, req.body.section) });
  }),
);

module.exports = router;
