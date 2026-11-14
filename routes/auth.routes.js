const express = require("express");
const authController = require("../controllers/auth.controller");
const { requireAuth } = require("../middlewares/auth");
const { validate } = require("../middlewares/validate");
const { parseSignup, parseOwnerLogin, parseStudentLogin, parseTeacherLogin } = require("../validators/auth.validator");

const router = express.Router();

router.post("/signup", validate(parseSignup), authController.signup);
router.post("/login", validate(parseOwnerLogin), authController.login);
router.post("/student-login", validate(parseStudentLogin), authController.loginStudent);
router.post("/teacher-login", validate(parseTeacherLogin), authController.loginTeacher);
router.get("/me", requireAuth, authController.me);

module.exports = router;
