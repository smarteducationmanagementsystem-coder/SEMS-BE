const { asyncHandler } = require("../utils/asyncHandler");
const authService = require("../services/auth.service");

const signup = asyncHandler(async (req, res) => {
  res.status(201).json(await authService.signup(req.body));
});

const login = asyncHandler(async (req, res) => {
  res.json(await authService.login(req.body));
});

const loginStudent = asyncHandler(async (req, res) => {
  res.json(await authService.loginStudent(req.body));
});

const loginTeacher = asyncHandler(async (req, res) => {
  res.json(await authService.loginTeacher(req.body));
});

const me = asyncHandler(async (req, res) => {
  res.json(await authService.me(req.auth));
});

module.exports = { signup, login, loginStudent, loginTeacher, me };
