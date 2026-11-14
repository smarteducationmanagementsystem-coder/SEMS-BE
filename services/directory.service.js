const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const StaffMember = require("../models/StaffMember");
const { createPeopleService, serializeStudent, serializeTeacher, serializeStaff } = require("./people.service");

const students = createPeopleService({
  Model: Student,
  label: "Student",
  secretField: "guardianPhone",
  numberField: "admissionNo",
  numberPrefix: "ADM",
  uniqueFields: ["admissionNo"],
  serialize: serializeStudent,
});

const teachers = createPeopleService({
  Model: Teacher,
  label: "Teacher",
  secretField: "phone",
  numberField: "employeeNo",
  numberPrefix: "EMP",
  uniqueFields: ["email", "employeeNo"],
  serialize: serializeTeacher,
});

const staff = createPeopleService({
  Model: StaffMember,
  label: "Staff member",
  secretField: "phone",
  numberField: "employeeNo",
  numberPrefix: "STF",
  uniqueFields: ["email", "employeeNo"],
  serialize: serializeStaff,
});

module.exports = { students, teachers, staff };
