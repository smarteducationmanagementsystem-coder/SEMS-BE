const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { asyncHandler } = require("../utils/asyncHandler");
const { parseQuery } = require("../validators/query.validator");
const { queries } = require("../services/query.service");
const { listRoles } = require("../services/role.service");

const router = express.Router();

router.get(
  "/roles",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ data: await listRoles(req.auth.institutionId) });
  }),
);

router.get(
  "/queries",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ data: await queries.list(req.auth) });
  }),
);

router.post(
  "/queries",
  requireAuth,
  validate(parseQuery),
  asyncHandler(async (req, res) => {
    res.status(201).json({ data: await queries.create(req.auth, req.body) });
  }),
);

router.post(
  "/queries/:id/read",
  requireAuth,
  asyncHandler(async (req, res) => {
    res.json({ data: await queries.markRead(req.auth, req.params.id) });
  }),
);

module.exports = router;
