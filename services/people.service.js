const mongoose = require("mongoose");
const { ApiError } = require("../utils/apiError");
const { hashSecret, verifySecret } = require("../utils/password");
const { digits } = require("../utils/text");

function assertObjectId(id, label) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, `${label} was not found in this institution.`);
}

function stampTenant(input, auth) {
  return {
    ...input,
    institution: auth.institutionId,
    institutionCode: auth.institutionCode,
  };
}

function createPeopleService({ Model, label, secretField, numberField, numberPrefix, uniqueFields, serialize }) {
  async function assertUnique(auth, input, id) {
    for (const field of uniqueFields) {
      if (!input[field]) continue;
      const existing = await Model.findOne({
        institution: auth.institutionId,
        [field]: input[field],
        ...(id ? { _id: { $ne: id } } : {}),
      });
      if (existing) throw new ApiError(409, `That ${field === "email" ? "email" : "number"} is already used in this institution.`);
    }
  }

  async function applySecret(doc, plain) {
    const normalized = digits(plain);
    if (normalized.length < 4) throw new ApiError(400, "Phone number must be at least 4 digits.");
    if (!doc.secretHash || !(await verifySecret(normalized, doc.secretHash))) {
      doc.secretHash = await hashSecret(normalized);
    }
  }

  return {
    async list(auth) {
      if (auth.role === "student" && Model.modelName !== "Student") return [];
      const filter = { institution: auth.institutionId };
      if (auth.role === "student") filter._id = auth.userId;
      const rows = await Model.find(filter).sort({ createdAt: -1 });
      return rows.map(serialize);
    },

    async create(auth, input) {
      const record = {
        ...input,
        [numberField]: input[numberField] || `${numberPrefix}-${Date.now().toString().slice(-6)}`,
      };
      await assertUnique(auth, record, null);
      const doc = new Model(stampTenant(record, auth));
      await applySecret(doc, record[secretField]);
      await doc.save();
      return serialize(doc);
    },

    async update(auth, id, input) {
      assertObjectId(id, label);
      const doc = await Model.findOne({ _id: id, institution: auth.institutionId }).select("+secretHash");
      if (!doc) throw new ApiError(404, `${label} was not found in this institution.`);
      await assertUnique(auth, input, doc._id);
      doc.set(stampTenant(input, auth));
      await applySecret(doc, input[secretField]);
      await doc.save();
      return serialize(doc);
    },

    async remove(auth, id) {
      assertObjectId(id, label);
      const doc = await Model.findOneAndDelete({ _id: id, institution: auth.institutionId });
      if (!doc) throw new ApiError(404, `${label} was not found in this institution.`);
    },
  };
}

function serializeStudent(doc) {
  return {
    id: String(doc._id),
    institutionCode: doc.institutionCode,
    admissionNo: doc.admissionNo,
    name: doc.name,
    gender: doc.gender,
    className: doc.className,
    section: doc.section || "",
    session: doc.session || "",
    guardian: doc.guardian,
    guardianPhone: doc.guardianPhone,
    email: doc.email || "",
    phone: doc.phone || "",
    address: doc.address || "",
    dob: doc.dob || "",
    status: doc.status,
    enrolledOn: doc.enrolledOn || "",
  };
}

function serializeTeacher(doc) {
  return {
    id: String(doc._id),
    institutionCode: doc.institutionCode,
    employeeNo: doc.employeeNo,
    name: doc.name,
    subject: doc.subject,
    classes: doc.classes,
    phone: doc.phone,
    email: doc.email,
    qualification: doc.qualification,
    joinedOn: doc.joinedOn || "",
    status: doc.status,
  };
}

function serializeStaff(doc) {
  return {
    id: String(doc._id),
    institutionCode: doc.institutionCode,
    employeeNo: doc.employeeNo,
    name: doc.name,
    role: doc.role || "Staff",
    department: doc.department,
    phone: doc.phone,
    email: doc.email,
    joinedOn: doc.joinedOn || "",
    status: doc.status,
  };
}

module.exports = { createPeopleService, serializeStudent, serializeTeacher, serializeStaff };
