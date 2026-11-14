const mongoose = require("mongoose");
const { ApiError } = require("../utils/apiError");
const { digits } = require("../utils/text");
const { INSTITUTION_TYPES, PERSON_STATUSES } = require("../constants/institution");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requiredText(value, label, min = 2, max = 80) {
  const text = String(value ?? "").trim();
  if (text.length < min) throw new ApiError(400, `${label} is required.`);
  if (text.length > max) throw new ApiError(400, `${label} must be ${max} characters or fewer.`);
  return text;
}

function optionalText(value, max = 120) {
  const text = String(value ?? "").trim();
  if (text.length > max) throw new ApiError(400, `Use ${max} characters or fewer.`);
  return text;
}

function requiredEmail(value) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) throw new ApiError(400, "Enter a valid email.");
  return email;
}

function optionalEmail(value) {
  const email = String(value ?? "").trim().toLowerCase();
  if (!email) return "";
  if (!EMAIL_PATTERN.test(email)) throw new ApiError(400, "Enter a valid email.");
  return email;
}

function requiredPhone(value, label) {
  const phone = String(value ?? "").trim();
  if (digits(phone).length < 4) throw new ApiError(400, `${label} must be at least 4 digits.`);
  if (phone.length > 30) throw new ApiError(400, `${label} is too long.`);
  return phone;
}

function optionalDate(value, label) {
  const date = String(value ?? "").trim();
  if (!date) return "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new ApiError(400, `${label} must be a date.`);
  return date;
}

function institutionType(value) {
  const type = String(value ?? "").trim();
  if (!INSTITUTION_TYPES.includes(type)) throw new ApiError(400, "Type must be School, College, or Academy.");
  return type;
}

function personStatus(value) {
  const status = String(value ?? "").trim();
  if (!PERSON_STATUSES.includes(status)) throw new ApiError(400, "Status is not valid.");
  return status;
}

function parseSignup(body) {
  const source = body && typeof body === "object" ? body : {};
  const password = String(source.password ?? "");
  if (password.length < 4) throw new ApiError(400, "Password must be at least 4 characters.");
  if (password.length > 72) throw new ApiError(400, "Password must be 72 characters or fewer.");
  return {
    ownerName: requiredText(source.ownerName, "Owner name"),
    name: requiredText(source.name, "Institution name", 2, 120),
    city: requiredText(source.city, "City"),
    type: institutionType(source.type),
    email: requiredEmail(source.email),
    password,
  };
}

function parseOwnerLogin(body) {
  const source = body && typeof body === "object" ? body : {};
  const password = String(source.password ?? "");
  if (!password) throw new ApiError(400, "Password is required.");
  return { email: requiredEmail(source.email), password };
}

function requiredInstitutionId(value) {
  const id = String(value ?? "").trim();
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, "Choose an institution.");
  return id;
}

function queryText(value) {
  return Array.isArray(value) ? value[0] : value;
}

function parseDirectoryQuery(query) {
  const source = query && typeof query === "object" ? query : {};
  return {
    city: requiredText(queryText(source.city), "City"),
    type: institutionType(queryText(source.type)),
  };
}

function parseStudentLogin(body) {
  const source = body && typeof body === "object" ? body : {};
  return {
    username: requiredText(source.username, "Student name"),
    password: requiredPhone(source.password, "Password"),
    institutionId: requiredInstitutionId(source.institutionId),
  };
}

function optionalCoordinate(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  if (!Number.isFinite(number)) throw new ApiError(400, "Location is not valid.");
  return number;
}

function optionalNumber(value, fallback, max) {
  if (value === undefined || value === null || value === "") return fallback;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > max) throw new ApiError(400, "Enter a valid number.");
  return Math.round(number);
}

function parseTeacherLogin(body) {
  const source = body && typeof body === "object" ? body : {};
  return {
    email: requiredEmail(source.email),
    password: requiredPhone(source.password, "Password"),
    institutionId: requiredInstitutionId(source.institutionId),
    latitude: optionalCoordinate(source.latitude),
    longitude: optionalCoordinate(source.longitude),
  };
}

function parseCampusLocation(value, label) {
  const source = value && typeof value === "object" ? value : {};
  const text = optionalText(source.label, 120);
  const latitude = optionalCoordinate(source.latitude);
  const longitude = optionalCoordinate(source.longitude);
  const hasPoint = latitude !== null || longitude !== null;
  if (!hasPoint) return { label: text, latitude: null, longitude: null };
  if (latitude === null || longitude === null || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new ApiError(400, `${label} needs a captured point. Stand there and use this device.`);
  }
  return { label: text, latitude, longitude };
}

function parseCampusSettings(body) {
  const source = body && typeof body === "object" ? body : {};
  return {
    ownerName: requiredText(source.ownerName, "Owner name"),
    institutionName: requiredText(source.institutionName, "Institution name", 2, 120),
    tagline: optionalText(source.tagline, 160),
    email: requiredEmail(source.email),
    phone: optionalText(source.phone, 30),
    city: requiredText(source.city, "City"),
    address: optionalText(source.address, 180),
    session: optionalText(source.session, 40) || "2026–27",
    lateFee: optionalNumber(source.lateFee, 500, 1000000),
    reminderDays: optionalNumber(source.reminderDays, 3, 365),
    feeReminders: source.feeReminders !== false && source.feeReminders !== "false",
    resultAlerts: source.resultAlerts !== false && source.resultAlerts !== "false",
    attendanceAlerts: source.attendanceAlerts !== false && source.attendanceAlerts !== "false",
    location1: parseCampusLocation(source.location1, "Location 1"),
    location2: parseCampusLocation(source.location2, "Location 2"),
    locationCheckEnabled: source.locationCheckEnabled === true || source.locationCheckEnabled === "true",
  };
}

function parseStudent(body) {
  const source = body && typeof body === "object" ? body : {};
  const gender = source.gender === "Male" || source.gender === "Female" ? source.gender : "";
  if (!gender) throw new ApiError(400, "Gender must be Female or Male.");
  return {
    admissionNo: optionalText(source.admissionNo, 40),
    name: requiredText(source.name, "Student name"),
    gender,
    className: requiredText(source.className, "Class", 1, 80),
    section: optionalText(source.section, 20),
    session: optionalText(source.session, 40),
    guardian: requiredText(source.guardian, "Guardian"),
    guardianPhone: requiredPhone(source.guardianPhone, "Guardian phone"),
    email: optionalEmail(source.email),
    phone: optionalText(source.phone, 30),
    address: optionalText(source.address, 180),
    dob: optionalDate(source.dob, "Date of birth"),
    status: personStatus(source.status || "active"),
    enrolledOn: optionalDate(source.enrolledOn, "Enrolled on"),
  };
}

function parseTeacher(body) {
  const source = body && typeof body === "object" ? body : {};
  return {
    employeeNo: optionalText(source.employeeNo, 40),
    name: requiredText(source.name, "Teacher name"),
    subject: requiredText(source.subject, "Subject", 1, 80),
    classes: requiredText(source.classes, "Assigned class", 1, 120),
    phone: requiredPhone(source.phone, "Phone"),
    email: requiredEmail(source.email),
    qualification: requiredText(source.qualification, "Qualification", 1, 120),
    joinedOn: optionalDate(source.joinedOn, "Joined on"),
    status: personStatus(source.status || "active"),
  };
}

function parseStaff(body) {
  const source = body && typeof body === "object" ? body : {};
  return {
    employeeNo: optionalText(source.employeeNo, 40),
    name: requiredText(source.name, "Staff name"),
    role: optionalText(source.role, 80) || "Staff",
    department: requiredText(source.department, "Department", 1, 80),
    phone: requiredPhone(source.phone, "Phone"),
    email: requiredEmail(source.email),
    joinedOn: optionalDate(source.joinedOn, "Joined on"),
    status: personStatus(source.status || "active"),
  };
}

module.exports = {
  parseSignup,
  parseOwnerLogin,
  parseDirectoryQuery,
  parseStudentLogin,
  parseTeacherLogin,
  parseStudent,
  parseTeacher,
  parseStaff,
  parseCampusSettings,
};
