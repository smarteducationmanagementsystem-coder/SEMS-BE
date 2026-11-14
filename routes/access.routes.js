const express = require("express");
const accessController = require("../controllers/access.controller");
const { requireAuth, requireOwner } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { parseAccess } = require("../validators/access.validator");

const router = express.Router();

router.get("/", requireAuth, accessController.getAccess);
router.put("/", requireAuth, requireOwner, validate(parseAccess), accessController.saveAccess);

module.exports = router;
