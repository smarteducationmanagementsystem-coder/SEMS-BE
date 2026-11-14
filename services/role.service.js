const Role = require("../models/Role");
const { GRANTABLE_PAGES } = require("../constants/pages");

const OWNER_PAGES = ["/dashboard/permissions", ...GRANTABLE_PAGES];

const ROLE_COPY = {
  super_admin: {
    label: "Super Admin",
    title: "Institution owner",
    description: "Institution owner. Opens every page of this campus and decides which pages teachers, staff, and students can use.",
  },
  teacher: {
    label: "Teacher",
    title: "Teacher",
    description: "Opens the pages assigned to teachers, marks attendance, and enters student marks.",
  },
  staff: {
    label: "Staff",
    title: "Staff",
    description: "Opens the pages the institution owner assigns to staff.",
  },
  student: {
    label: "Student",
    title: "Student",
    description: "Sees the pages assigned to students, including personal attendance, fee slips, and published results.",
  },
};

function pagesFor(key, access) {
  if (key === "super_admin") return OWNER_PAGES;
  return Array.isArray(access?.[key]) ? access[key] : [];
}

function serialize(doc) {
  return {
    id: String(doc._id),
    key: doc.key,
    label: doc.label,
    title: doc.title || "",
    description: doc.description || "",
    pages: doc.pages || [],
  };
}

async function syncRoles(institution, access) {
  if (!institution?._id) return [];
  const writes = Object.keys(ROLE_COPY).map((key) =>
    Role.findOneAndUpdate(
      { institution: institution._id, key },
      {
        $set: {
          institutionCode: institution.code,
          label: ROLE_COPY[key].label,
          title: ROLE_COPY[key].title,
          description: ROLE_COPY[key].description,
          pages: pagesFor(key, access),
        },
      },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    ),
  );
  const saved = await Promise.all(writes);
  return saved.filter(Boolean).map(serialize);
}

async function listRoles(institutionId) {
  const rows = await Role.find({ institution: institutionId }).sort({ key: 1 });
  return rows.map(serialize);
}

module.exports = { syncRoles, listRoles };
