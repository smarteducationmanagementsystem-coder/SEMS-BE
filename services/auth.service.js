const jwt = require("jsonwebtoken");
const Counter = require("../models/Counter");
const Institution = require("../models/Institution");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const StaffMember = require("../models/StaffMember");
const { TYPE_PREFIX } = require("../constants/institution");
const { ApiError } = require("../utils/apiError");
const { hashSecret, verifySecret } = require("../utils/password");
const { presentAccess } = require("./access.service");
const { syncRoles } = require("./role.service");
const { attachSettings } = require("./institution.service");
const { assertCampusLocation } = require("./location.service");
const { digits, escapeRegex } = require("../utils/text");

const PEOPLE = {
  student: Student,
  teacher: Teacher,
  staff: StaffMember,
};

async function nextInstitutionCode(type) {
  const counter = await Counter.findOneAndUpdate({ key: `institution:${type}` }, { $inc: { seq: 1 } }, { upsert: true, new: true });
  return `${TYPE_PREFIX[type]}${String(counter.seq).padStart(3, "0")}`;
}

async function presentInstitution(institution) {
  const students = await Student.countDocuments({ institution: institution._id });
  const profile = await attachSettings(institution);
  return {
    id: String(institution._id),
    code: institution.code,
    type: institution.type,
    students,
    plan: institution.plan || "Basic",
    status: institution.status || "trial",
    name: profile.institutionName,
    ...profile,
  };
}

function signToken(actorId, role) {
  return jwt.sign({ sub: String(actorId), role }, process.env.JWT_SECRET, { expiresIn: "7d", algorithm: "HS256" });
}

async function issue(role, actorId, institution) {
  const access = presentAccess(institution);
  try {
    await syncRoles(institution, access);
  } catch (error) {
    console.error("Could not store roles:", error.message);
  }
  return {
    token: signToken(role === "owner" ? institution._id : actorId, role),
    role,
    actorId: role === "owner" ? null : String(actorId),
    institution: await presentInstitution(institution),
    access,
  };
}

async function signup(input) {
  const existing = await Institution.findOne({ email: input.email });
  if (existing) throw new ApiError(409, "That email is already registered. Sign in instead.");
  const institution = await Institution.create({
    code: await nextInstitutionCode(input.type),
    ownerName: input.ownerName,
    name: input.name,
    city: input.city,
    type: input.type,
    email: input.email,
    passwordHash: await hashSecret(input.password),
  });
  return issue("owner", institution._id, institution);
}

async function login(input) {
  const institution = await Institution.findOne({ email: input.email }).select("+passwordHash");
  const matches = institution ? await verifySecret(input.password, institution.passwordHash) : false;
  if (!matches) throw new ApiError(401, "Email or password does not match an institution.");
  return issue("owner", institution._id, institution);
}

async function institutionForLogin(institutionId) {
  const institution = await Institution.findById(institutionId);
  if (!institution) throw new ApiError(401, "Choose a registered institution.");
  return institution;
}

async function loginStudent(input) {
  const requested = await institutionForLogin(input.institutionId);
  const students = await Student.find({
    institution: requested._id,
    name: new RegExp(`^${escapeRegex(input.username)}$`, "i"),
  }).select("+secretHash");
  const matches = [];
  for (const student of students) {
    if (String(student.institution) !== String(requested._id)) continue;
    if (await verifySecret(digits(input.password), student.secretHash)) matches.push(student);
  }
  if (matches.length !== 1) {
    throw new ApiError(401, matches.length > 1 ? "More than one student matches this institution." : "That student was not found for this institution.");
  }
  const institution = await Institution.findById(matches[0].institution);
  if (!institution) throw new ApiError(401, "That student was not found for this institution.");
  return issue("student", matches[0]._id, institution);
}

async function loginTeacher(input) {
  const requested = await institutionForLogin(input.institutionId);
  const [teachers, staff] = await Promise.all([
    Teacher.find({ institution: requested._id, email: input.email }).select("+secretHash"),
    StaffMember.find({ institution: requested._id, email: input.email }).select("+secretHash"),
  ]);
  const people = [
    ...teachers.map((person) => ({ person, role: "teacher" })),
    ...staff.map((person) => ({ person, role: "staff" })),
  ];
  const matches = [];
  for (const entry of people) {
    if (String(entry.person.institution) !== String(requested._id)) continue;
    if (await verifySecret(digits(input.password), entry.person.secretHash)) matches.push(entry);
  }
  if (matches.length !== 1) {
    throw new ApiError(401, matches.length > 1 ? "More than one account matches this institution." : "That teacher or staff member was not found for this institution.");
  }
  const institution = await Institution.findById(matches[0].person.institution);
  if (!institution) throw new ApiError(401, "That teacher or staff member was not found for this institution.");
  assertCampusLocation(institution, input);
  return issue(matches[0].role, matches[0].person._id, institution);
}

async function resolveMembership(payload) {
  if (!payload?.sub || !payload?.role) return null;
  if (payload.role === "owner") {
    const institution = await Institution.findById(payload.sub);
    if (!institution) return null;
    return { userId: String(institution._id), role: "owner", institutionId: institution._id, institutionCode: institution.code };
  }
  const Model = PEOPLE[payload.role];
  if (!Model) return null;
  const person = await Model.findById(payload.sub).populate("institution");
  if (!person?.institution) return null;
  return {
    userId: String(person._id),
    role: payload.role,
    institutionId: person.institution._id,
    institutionCode: person.institution.code,
  };
}

async function me(auth) {
  const institution = await Institution.findById(auth.institutionId);
  if (!institution) throw new ApiError(401, "This account is no longer active.");
  const access = presentAccess(institution);
  try {
    await syncRoles(institution, access);
  } catch (error) {
    console.error("Could not store roles:", error.message);
  }
  return {
    role: auth.role,
    actorId: auth.role === "owner" ? null : auth.userId,
    institution: await presentInstitution(institution),
    access,
  };
}

module.exports = { signup, login, loginStudent, loginTeacher, resolveMembership, me };
