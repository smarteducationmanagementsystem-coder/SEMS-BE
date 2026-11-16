const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Institution = require("../models/Institution");
const Settings = require("../models/Settings");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const StaffMember = require("../models/StaffMember");
const HiringStaff = require("../models/HiringStaff");
const ClassRoom = require("../models/ClassRoom");
const Subject = require("../models/Subject");
const AttendanceRecord = require("../models/AttendanceRecord");
const StaffAttendance = require("../models/StaffAttendance");
const FeeSlip = require("../models/FeeSlip");
const ResultSheet = require("../models/ResultSheet");
const ResultImage = require("../models/ResultImage");
const StudentQuery = require("../models/StudentQuery");
const Role = require("../models/Role");
const PlatformPayment = require("../models/platformadmin-payment");
const PlatformAdmin = require("../models/platformadmin");
const PlatformContact = require("../models/platformadmin-contact");
const StorageUsage = require("../models/platformadmin-storage");
const PlatformPricing = require("../models/platformadmin-pricing");
const PlatformFooter = require("../models/platformadmin-footer");
const PlatformContactPage = require("../models/platformadmin-contact-page");
const PlatformLanding = require("../models/platformadmin-landing");
const { ApiError } = require("../utils/apiError");
const { hashSecret, verifySecret } = require("../utils/password");
const { destroyAsset, folderBytes, institutionFolder, uploadPlatformImage } = require("./cloudinary.service");

/** Slot name used in the URL and the upload field -> field stored in the database. */
const LANDING_SLOTS = {
  signupimage: "signupImage",
  loginimage: "loginImage",
  logoimage: "logoImage",
  aboutimage: "aboutImage",
};

function landingField(slot) {
  const field = LANDING_SLOTS[String(slot || "").toLowerCase()];
  if (!field) throw new ApiError(404, "That landing image does not exist.");
  return field;
}
const { sendPlatformMail } = require("./platformadmin-mail");

const CHILD_MODELS = [Student, Teacher, StaffMember, HiringStaff, ClassRoom, Subject, AttendanceRecord, StaffAttendance, FeeSlip, ResultSheet, ResultImage, StudentQuery, Role, Settings, PlatformPayment, StorageUsage];

function currentMonth(now = new Date()) {
  return joinedMonth(now);
}

function joinedMonth(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Karachi", year: "numeric", month: "2-digit" }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  return year && month ? `${year}-${month}` : "";
}

function activeInMonth(institutions, month) {
  return institutions.filter((item) => {
    const joined = joinedMonth(item.createdAt);
    return Boolean(joined) && joined <= month;
  });
}

function countMap(rows) {
  return new Map(rows.map((row) => [String(row._id), row.count]));
}

function assertId(id) {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new ApiError(404, "That institution was not found.");
  return id;
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function institutionFilter(type, city) {
  const filter = {};
  if (type) filter.type = type;
  if (city) filter.city = new RegExp(`^${escapeRegex(city)}$`, "i");
  return filter;
}

async function countsFor(ids) {
  if (ids.length === 0) return { students: new Map(), teachers: new Map(), staff: new Map() };
  const match = { institution: { $in: ids } };
  const group = { $group: { _id: "$institution", count: { $sum: 1 } } };
  const [students, teachers, staff] = await Promise.all([
    Student.aggregate([{ $match: match }, group]),
    Teacher.aggregate([{ $match: match }, group]),
    StaffMember.aggregate([{ $match: match }, group]),
  ]);
  return { students: countMap(students), teachers: countMap(teachers), staff: countMap(staff) };
}

function formatStorage(bytes) {
  if (bytes == null) return "unavailable";
  const gigabyte = 1024 * 1024 * 1024;
  const megabyte = 1024 * 1024;
  if (bytes >= gigabyte) return `${(bytes / gigabyte).toFixed(2)} GB`;
  return `${(bytes / megabyte).toFixed(2)} MB`;
}

function usageLabel(databaseBytes, cloudinaryBytes) {
  return `Database ${formatStorage(databaseBytes)} · Cloudinary ${formatStorage(cloudinaryBytes)}`;
}

async function storedBytes(Model, match) {
  const [row] = await Model.aggregate([{ $match: match }, { $group: { _id: null, bytes: { $sum: { $bsonSize: "$$ROOT" } } } }]);
  return Number(row?.bytes || 0);
}

async function databaseBytesFor(institutionId) {
  const models = CHILD_MODELS.filter((Model) => Model !== StorageUsage);
  const parts = await Promise.all([storedBytes(Institution, { _id: institutionId }), ...models.map((Model) => storedBytes(Model, { institution: institutionId }))]);
  return parts.reduce((sum, value) => sum + value, 0);
}

function presentRow(institution, settings, counts) {
  const id = String(institution._id);
  return {
    id,
    name: institution.name,
    city: institution.city,
    phone: settings?.phone || "",
    email: institution.email,
    type: institution.type,
    students: counts.students.get(id) || 0,
    teachers: counts.teachers.get(id) || 0,
    staff: counts.staff.get(id) || 0,
    joinedAt: institution.createdAt || null,
  };
}

async function loadAccount() {
  const existing = await PlatformAdmin.findOne().select("+passwordHash");
  if (existing) return existing;
  const email = String(process.env.PLATFORM_ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.PLATFORM_ADMIN_PASSWORD || "");
  if (!email || !password) throw new ApiError(500, "Platform admin account is not set up.");
  return PlatformAdmin.create({ email, passwordHash: await hashSecret(password) });
}

function signToken() {
  return jwt.sign({ sub: "platform-admin", role: "platform" }, process.env.JWT_SECRET, { expiresIn: "7d", algorithm: "HS256" });
}

function platformAdminService() {
  return {
    async login(input) {
      const account = await loadAccount();
      const matches = await verifySecret(input.password, account.passwordHash);
      if (input.email !== account.email || !matches) throw new ApiError(401, "Email or password is incorrect.");
      return { token: signToken() };
    },

    async account() {
      const row = await loadAccount();
      return { email: row.email };
    },

    async updateAccount(input) {
      const account = await loadAccount();
      const matches = await verifySecret(input.currentPassword, account.passwordHash);
      if (!matches) throw new ApiError(401, "Current password is incorrect.");
      account.email = input.email;
      if (input.password) account.passwordHash = await hashSecret(input.password);
      await account.save();
      return { email: account.email };
    },

    async dashboard() {
      const month = currentMonth();
      const [institutionCount, students, teachers, staff, fees, institutions, paidMarks] = await Promise.all([
        Institution.countDocuments(),
        Student.countDocuments(),
        Teacher.countDocuments(),
        StaffMember.countDocuments(),
        FeeSlip.find({ month }).select("paid"),
        Institution.find().select("createdAt"),
        PlatformPayment.find({ month, status: "paid" }).select("institution"),
      ]);
      const paidIds = new Set(paidMarks.map((item) => String(item.institution)));
      const active = activeInMonth(institutions, month);
      const paidPayment = active.filter((item) => paidIds.has(String(item._id))).length;
      const revenue = fees.reduce((sum, fee) => sum + Number(fee.paid || 0), 0);
      return {
        month,
        institutions: institutionCount,
        students,
        people: teachers + staff,
        pendingPayment: Math.max(active.length - paidPayment, 0),
        paidPayment,
        revenue,
      };
    },

    async list(type) {
      const filter = type ? { type } : {};
      const institutions = await Institution.find(filter).sort({ name: 1 });
      const ids = institutions.map((item) => item._id);
      const [settings, counts] = await Promise.all([
        Settings.find({ institution: { $in: ids } }).select("institution phone"),
        countsFor(ids),
      ]);
      const phones = new Map(settings.map((item) => [String(item.institution), item]));
      return institutions.map((item) => presentRow(item, phones.get(String(item._id)), counts));
    },

    async update(id, input) {
      const institution = await Institution.findById(assertId(id));
      if (!institution) throw new ApiError(404, "That institution was not found.");
      const taken = await Institution.findOne({ email: input.email, _id: { $ne: institution._id } }).select("_id");
      if (taken) throw new ApiError(409, "Another institution already uses that email.");
      institution.name = input.name;
      institution.city = input.city;
      institution.email = input.email;
      institution.type = input.type;
      await institution.save();
      await Settings.updateOne(
        { institution: institution._id },
        { $set: { institutionName: input.name, city: input.city, email: input.email, phone: input.phone } },
      );
      const rows = await this.list("");
      return rows.find((item) => item.id === String(institution._id));
    },

    async storage(id) {
      const institution = await Institution.findById(assertId(id)).select("code");
      if (!institution) throw new ApiError(404, "That institution was not found.");
      const databaseBytes = await databaseBytesFor(institution._id);
      let cloudinaryBytes = null;
      try {
        cloudinaryBytes = await folderBytes(institutionFolder(institution));
      } catch (error) {
        console.error("Cloudinary storage measurement failed:", error?.message || error);
      }
      const measuredAt = new Date();
      await StorageUsage.findOneAndUpdate(
        { institution: institution._id },
        { $set: { databaseBytes, cloudinaryBytes, measuredAt } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
      return { databaseBytes, cloudinaryBytes, measuredAt, label: usageLabel(databaseBytes, cloudinaryBytes) };
    },

    async remove(id) {
      const institution = await Institution.findById(assertId(id)).select("+logoPublicId");
      if (!institution) throw new ApiError(404, "That institution was not found.");
      const [images, settings] = await Promise.all([
        ResultImage.find({ institution: institution._id }).select("publicId"),
        Settings.findOne({ institution: institution._id }).select("logoPublicId"),
      ]);
      const publicIds = [...images.map((item) => item.publicId), settings?.logoPublicId, institution.logoPublicId].filter(Boolean);
      await Promise.all(CHILD_MODELS.map((Model) => Model.deleteMany({ institution: institution._id })));
      await Institution.deleteOne({ _id: institution._id });
      await Promise.all(publicIds.map((publicId) => destroyAsset(publicId)));
    },

    async payments(type, city, monthValue) {
      const month = monthValue || currentMonth();
      const institutions = await Institution.find(type ? { type } : {}).sort({ name: 1 }).select("name city type createdAt");
      const visible = activeInMonth(institutions, month);
      const cityKey = String(city || "").trim().toLowerCase();
      const rows = cityKey ? visible.filter((item) => String(item.city || "").trim().toLowerCase() === cityKey) : visible;
      const marks = await PlatformPayment.find({
        institution: { $in: rows.map((item) => item._id) },
        month,
      }).select("institution status");
      const statusById = new Map(marks.map((item) => [String(item.institution), item.status]));
      return {
        month,
        cities: [...new Set(visible.map((item) => String(item.city || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
        rows: rows.map((item) => ({
          id: String(item._id),
          name: item.name,
          type: item.type,
          city: item.city,
          joinedAt: item.createdAt || null,
          status: statusById.get(String(item._id)) === "paid" ? "paid" : "unpaid",
        })),
      };
    },

    async markPayment(id, status, monthValue) {
      const institution = await Institution.findById(assertId(id)).select("createdAt");
      if (!institution) throw new ApiError(404, "That institution was not found.");
      const month = monthValue || currentMonth();
      const joined = joinedMonth(institution.createdAt);
      if (!joined || joined > month) throw new ApiError(400, "That institution had not joined in the selected month.");
      await PlatformPayment.findOneAndUpdate(
        { institution: institution._id, month },
        { $set: { status } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
      return { id: String(institution._id), status, month };
    },

    async pendingPayments() {
      const month = currentMonth();
      const [institutions, paid] = await Promise.all([
        Institution.find().sort({ createdAt: 1, name: 1 }).select("name type createdAt"),
        PlatformPayment.find({ month, status: "paid" }).select("institution"),
      ]);
      const paidIds = new Set(paid.map((item) => String(item.institution)));
      const unpaid = activeInMonth(institutions, month).filter((item) => !paidIds.has(String(item._id)));
      const settings = await Settings.find({ institution: { $in: unpaid.map((item) => item._id) } }).select("institution phone");
      const phones = new Map(settings.map((item) => [String(item.institution), item.phone || ""]));
      return {
        month,
        rows: unpaid.map((item) => ({
          id: String(item._id),
          name: item.name,
          type: item.type,
          phone: phones.get(String(item._id)) || "",
          joinedAt: item.createdAt || null,
        })),
      };
    },

    async deletePayments(from, to) {
      const result = await PlatformPayment.deleteMany({ month: { $gte: from, $lte: to } });
      return { deleted: result.deletedCount || 0 };
    },

    async saveContact(input) {
      const row = await PlatformContact.create(input);
      return { id: String(row._id) };
    },

    async contacts() {
      const rows = await PlatformContact.find().sort({ createdAt: -1 });
      return rows.map((item) => ({
        id: String(item._id),
        name: item.name,
        email: item.email,
        institution: item.institution || "",
        message: item.message,
        createdAt: item.createdAt || null,
      }));
    },

    async recipients(type) {
      const rows = await Institution.find(type ? { type } : {}).sort({ name: 1 }).select("name type email");
      return rows.map((item) => ({
        id: String(item._id),
        name: item.name,
        type: item.type,
        email: item.email,
      }));
    },

    async pricing() {
      return presentPricing(await PlatformPricing.findOne({ key: "public" }));
    },

    async savePricing(input) {
      const saved = await PlatformPricing.findOneAndUpdate(
        { key: "public" },
        { $set: { plans: input.plans, payment: input.payment } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
      return presentPricing(saved);
    },

    async footer() {
      const existing = await PlatformFooter.findOne({ key: "public" });
      if (existing) return presentFooter(existing);
      const created = await PlatformFooter.create({ key: "public", ...defaultFooter() });
      return presentFooter(created);
    },

    async saveFooter(input) {
      const saved = await PlatformFooter.findOneAndUpdate(
        { key: "public" },
        { $set: input },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
      return presentFooter(saved);
    },

    async contactPage() {
      const existing = await PlatformContactPage.findOne({ key: "public" });
      if (existing) return presentContactPage(existing);
      const created = await PlatformContactPage.create({ key: "public", ...defaultContactPage() });
      return presentContactPage(created);
    },

    async saveContactPage(input) {
      const saved = await PlatformContactPage.findOneAndUpdate(
        { key: "public" },
        { $set: input },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
      return presentContactPage(saved);
    },

    async landing() {
      return presentLanding(await PlatformLanding.findOne({ key: "public" }));
    },

    async saveLandingImage(slot, file) {
      const field = landingField(slot);
      if (!file?.buffer?.length) throw new ApiError(400, "Choose an image file.");
      const uploaded = await uploadPlatformImage(field.toLowerCase(), file.buffer, file.mimetype, file.originalname);
      const saved = await PlatformLanding.findOneAndUpdate(
        { key: "public" },
        { $set: { [field]: { url: uploaded.url, publicId: uploaded.publicId } } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
      return presentLanding(saved);
    },

    async removeLandingImage(slot) {
      const field = landingField(slot);
      const existing = await PlatformLanding.findOne({ key: "public" });
      const publicId = existing?.[field]?.publicId || "";
      const saved = await PlatformLanding.findOneAndUpdate(
        { key: "public" },
        { $set: { [field]: { url: "", publicId: "" } } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
      await destroyAsset(publicId);
      return presentLanding(saved);
    },

    async sendEmail(input) {
      const filter = input.institutionId ? { _id: assertId(input.institutionId) } : institutionFilter(input.type, "");
      const institutions = await Institution.find(filter).select("name email");
      const recipients = institutions.filter((item) => item.email).map((item) => ({ name: item.name, email: item.email }));
      if (recipients.length === 0) throw new ApiError(404, "No institution with an email matches that choice.");
      return sendPlatformMail({ subject: input.subject, message: input.message, recipients });
    },
  };
}

function presentLanding(doc) {
  return {
    signupImage: doc?.signupImage?.url || "",
    loginImage: doc?.loginImage?.url || "",
    logoImage: doc?.logoImage?.url || "",
    aboutImage: doc?.aboutImage?.url || "",
  };
}

function defaultFooter() {
  return {
    blurb: "Transforming Schools, Colleges, and Academies Through Pakistan's Smartest Education Management System.",
    email: "hello@smarteducation.example",
    phone: "+92 300 555 0142",
    hours: "Monday to Saturday, 9am to 6pm PKT",
    instagram: "https://www.instagram.com/smarteducation",
    facebook: "https://www.facebook.com/smarteducation",
    tiktok: "https://www.tiktok.com/@smarteducation",
    whatsapp: "+92 300 555 0142",
  };
}

function defaultContactPage() {
  return {
    email: "hello@smarteducation.example",
    whatsapp: "+92 300 555 0142",
    phone: "+92 300 555 0142",
    hours: "Monday to Saturday, 9am to 6pm PKT",
    city: "Lahore, Pakistan",
    instagram: "https://www.instagram.com/smarteducation",
    facebook: "https://www.facebook.com/smarteducation",
    tiktok: "https://www.tiktok.com/@smarteducation",
    placeholder: true,
  };
}

function presentContactPage(doc) {
  const fallback = defaultContactPage();
  return {
    email: doc?.email || fallback.email,
    whatsapp: doc?.whatsapp || fallback.whatsapp,
    phone: doc?.phone || fallback.phone,
    hours: doc?.hours || fallback.hours,
    city: doc?.city || fallback.city,
    instagram: doc?.instagram || "",
    facebook: doc?.facebook || "",
    tiktok: doc?.tiktok || "",
    placeholder: doc?.placeholder !== false,
  };
}

function presentFooter(doc) {
  const fallback = defaultFooter();
  return {
    blurb: doc?.blurb || fallback.blurb,
    email: doc?.email || fallback.email,
    phone: doc?.phone || fallback.phone,
    hours: doc?.hours || fallback.hours,
    instagram: doc?.instagram || "",
    facebook: doc?.facebook || "",
    tiktok: doc?.tiktok || "",
    whatsapp: doc?.whatsapp || "",
  };
}

function presentPricing(doc) {
  // Only cards saved from the platform admin are returned. Nothing is invented here.
  const plans = Array.isArray(doc?.plans) ? doc.plans : [];
  return {
    plans: plans.map((plan) => ({
      name: plan.name,
      audience: plan.audience || "",
      price: plan.price,
      period: plan.period || "",
      points: Array.isArray(plan.points) ? plan.points : [],
      featured: plan.featured === true,
      buttonLabel: plan.buttonLabel || "Get started",
    })),
    payment: {
      accountName: doc?.payment?.accountName || "",
      accountNumber: doc?.payment?.accountNumber || "",
      detail: doc?.payment?.detail || "",
    },
  };
}

module.exports = { platformAdmin: platformAdminService() };
