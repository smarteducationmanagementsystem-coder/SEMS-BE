const GRANTABLE_PAGES = [
  "/dashboard",
  "/dashboard/students",
  "/dashboard/teachers",
  "/dashboard/staff",
  "/dashboard/hiring",
  "/dashboard/attendance",
  "/dashboard/teacher-attendance",
  "/dashboard/staff-attendance",
  "/dashboard/fees",
  "/dashboard/exams",
  "/dashboard/results",
  "/dashboard/academics",
  "/dashboard/roles",
  "/dashboard/queries",
  "/dashboard/settings",
];

const DEFAULT_ACCESS = {
  teacher: [
    "/dashboard",
    "/dashboard/students",
    "/dashboard/attendance",
    "/dashboard/teacher-attendance",
    "/dashboard/exams",
    "/dashboard/results",
    "/dashboard/academics",
    "/dashboard/queries",
  ],
  staff: ["/dashboard", "/dashboard/teacher-attendance", "/dashboard/results"],
  student: ["/dashboard", "/dashboard/students", "/dashboard/attendance", "/dashboard/fees", "/dashboard/results", "/dashboard/queries"],
};

module.exports = { GRANTABLE_PAGES, DEFAULT_ACCESS };
