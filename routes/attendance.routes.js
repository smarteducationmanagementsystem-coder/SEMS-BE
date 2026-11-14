const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { asyncHandler } = require("../utils/asyncHandler");

function attendanceRoutes(service, parseBody) {
  const router = express.Router();
  router.get(
    "/",
    requireAuth,
    asyncHandler(async (req, res) => {
      res.json({ data: await service.list(req.auth) });
    }),
  );
  router.post(
    "/",
    requireAuth,
    validate(parseBody),
    asyncHandler(async (req, res) => {
      res.json({ data: await service.save(req.auth, req.body.rows) });
    }),
  );
  return router;
}

module.exports = { attendanceRoutes };
