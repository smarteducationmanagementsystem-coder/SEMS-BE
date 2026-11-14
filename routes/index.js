const express = require("express");
const mongoose = require("mongoose");
const authRoutes = require("./auth.routes");
const institutionRoutes = require("./institution.routes");
const catalogRoutes = require("./catalog.routes");
const accessRoutes = require("./access.routes");
const { peopleRoutes } = require("./people.routes");
const { attendanceRoutes } = require("./attendance.routes");
const ledgerRoutes = require("./ledger.routes");
const queryRoutes = require("./query.routes");
const platformAdminRoutes = require("./platformadmin.routes");
const { students, teachers, staff } = require("../services/directory.service");
const { classes, subjects } = require("../services/academics.service");
const { hiring } = require("../services/hiring.service");
const { attendance } = require("../services/attendance.service");
const { parseStudent, parseTeacher, parseStaff } = require("../validators/auth.validator");
const { parseClass, parseSubject } = require("../validators/academics.validator");
const { parseHiring } = require("../validators/hiring.validator");
const { parseAttendanceBatch } = require("../validators/attendance.validator");

const router = express.Router();

router.get("/health", (req, res) => {
  res.json({ ok: mongoose.connection.readyState === 1, database: mongoose.connection.name || null });
});

router.use("/auth", authRoutes);
router.use("/platformadmin", platformAdminRoutes);
router.use("/institution", institutionRoutes);
router.use("/directory", catalogRoutes);
router.use("/access", accessRoutes);
router.use("/students", peopleRoutes(students, parseStudent));
router.use("/teachers", peopleRoutes(teachers, parseTeacher));
router.use("/staff", peopleRoutes(staff, parseStaff));
router.use("/classes", peopleRoutes(classes, parseClass));
router.use("/subjects", peopleRoutes(subjects, parseSubject));
router.use("/hiring", peopleRoutes(hiring, parseHiring));
router.use("/attendance", attendanceRoutes(attendance, parseAttendanceBatch));
router.use("/", ledgerRoutes);
router.use("/", queryRoutes);

router.use((req, res) => {
  res.status(404).json({ message: "Not found." });
});

module.exports = router;
