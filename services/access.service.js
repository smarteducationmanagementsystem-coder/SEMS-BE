const Institution = require("../models/Institution");
const { ApiError } = require("../utils/apiError");
const { DEFAULT_ACCESS, GRANTABLE_PAGES } = require("../constants/pages");
const { syncRoles } = require("./role.service");

function savedPages(value, fallback) {
  if (!Array.isArray(value)) return [...fallback];
  return value.filter((href) => GRANTABLE_PAGES.includes(href));
}

function presentAccess(institution) {
  if (!institution?.accessSet) {
    return {
      teacher: [...DEFAULT_ACCESS.teacher],
      staff: [...DEFAULT_ACCESS.staff],
      student: [...DEFAULT_ACCESS.student],
    };
  }
  const saved = institution.access || {};
  return {
    teacher: savedPages(saved.teacher, []),
    staff: savedPages(saved.staff, []),
    student: savedPages(saved.student, []),
  };
}

async function loadInstitution(auth) {
  const institution = await Institution.findById(auth.institutionId);
  if (!institution) throw new ApiError(401, "This account is no longer active.");
  return institution;
}

async function getAccess(auth) {
  return presentAccess(await loadInstitution(auth));
}

async function saveAccess(auth, input) {
  const institution = await loadInstitution(auth);
  institution.access = {
    teacher: input.teacher,
    staff: input.staff,
    student: input.student,
  };
  institution.accessSet = true;
  institution.markModified("access");
  await institution.save();
  const access = presentAccess(institution);
  await syncRoles(institution, access);
  return access;
}

module.exports = { presentAccess, getAccess, saveAccess };
