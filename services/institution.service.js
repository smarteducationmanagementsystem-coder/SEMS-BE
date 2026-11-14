const Institution = require("../models/Institution");
const Settings = require("../models/Settings");
const { ApiError } = require("../utils/apiError");
const { presentLocation } = require("./location.service");
const { destroyAsset, imageMime, uploadInstitutionLogo } = require("./cloudinary.service");

function presentCampus(settings) {
  return {
    ownerName: settings.ownerName,
    institutionName: settings.institutionName,
    tagline: settings.tagline || "",
    email: settings.email,
    phone: settings.phone || "",
    city: settings.city,
    address: settings.address || "",
    session: settings.session || "2026–27",
    lateFee: Number.isFinite(settings.lateFee) ? settings.lateFee : 500,
    reminderDays: Number.isFinite(settings.reminderDays) ? settings.reminderDays : 3,
    feeReminders: settings.feeReminders !== false,
    resultAlerts: settings.resultAlerts !== false,
    attendanceAlerts: settings.attendanceAlerts !== false,
    logoUrl: settings.logoUrl || "",
    location1: presentLocation(settings.location1),
    location2: presentLocation(settings.location2),
    locationCheckEnabled: Boolean(settings.locationCheckEnabled),
    profileSaved: Boolean(settings.profileSaved),
  };
}

async function ensureSettings(institution) {
  const existing = await Settings.findOne({ institution: institution._id });
  if (existing) return existing;
  try {
    return await Settings.create({
      institution: institution._id,
      institutionCode: institution.code,
      ownerName: institution.ownerName,
      institutionName: institution.name,
      tagline: "",
      email: institution.email,
      phone: "",
      city: institution.city,
      address: "",
      session: "2026–27",
      lateFee: 500,
      reminderDays: 3,
      feeReminders: true,
      resultAlerts: true,
      attendanceAlerts: true,
      logoUrl: institution.logoUrl || "",
      location1: institution.location1 || { label: "", latitude: null, longitude: null },
      location2: institution.location2 || { label: "", latitude: null, longitude: null },
      locationCheckEnabled: Boolean(institution.locationCheckEnabled),
      profileSaved: false,
    });
  } catch (error) {
    if (error?.code === 11000) {
      const again = await Settings.findOne({ institution: institution._id });
      if (again) return again;
    }
    throw error;
  }
}

async function attachSettings(institution) {
  return presentCampus(await ensureSettings(institution));
}

async function ownedInstitution(auth) {
  const institution = await Institution.findById(auth.institutionId).select("+logoPublicId");
  if (!institution) throw new ApiError(404, "This institution was not found.");
  return institution;
}

function copyCampus(institution, settings) {
  institution.ownerName = settings.ownerName;
  institution.name = settings.institutionName;
  institution.city = settings.city;
  institution.email = settings.email;
  institution.logoUrl = settings.logoUrl || "";
  institution.logoPublicId = settings.logoPublicId || "";
  institution.location1 = presentLocation(settings.location1);
  institution.location2 = presentLocation(settings.location2);
  institution.locationCheckEnabled = Boolean(settings.locationCheckEnabled);
}

async function updateCampus(auth, input) {
  const institution = await ownedInstitution(auth);
  if (input.email !== institution.email) {
    const taken = await Institution.findOne({ email: input.email, _id: { $ne: institution._id } });
    if (taken) throw new ApiError(409, "That email is already registered. Sign in instead.");
  }
  if (input.locationCheckEnabled) {
    const pins = [input.location1, input.location2].filter((pin) => pin.latitude !== null && pin.longitude !== null);
    if (pins.length === 0) throw new ApiError(400, "Capture Location 1 or Location 2 before enabling location.");
  }
  const settings = await ensureSettings(institution);
  settings.ownerName = input.ownerName;
  settings.institutionName = input.institutionName;
  settings.tagline = input.tagline;
  settings.email = input.email;
  settings.phone = input.phone;
  settings.city = input.city;
  settings.address = input.address;
  settings.session = input.session;
  settings.lateFee = input.lateFee;
  settings.reminderDays = input.reminderDays;
  settings.feeReminders = input.feeReminders;
  settings.resultAlerts = input.resultAlerts;
  settings.attendanceAlerts = input.attendanceAlerts;
  settings.location1 = input.location1;
  settings.location2 = input.location2;
  settings.locationCheckEnabled = input.locationCheckEnabled;
  settings.profileSaved = true;
  copyCampus(institution, settings);
  await settings.save();
  await institution.save();
  return presentCampus(settings);
}

async function saveLogo(auth, file) {
  if (!file?.buffer?.length) throw new ApiError(400, "Choose an image file.");
  const institution = await ownedInstitution(auth);
  const settings = await ensureSettings(institution);
  const previousPublicId = settings.logoPublicId || institution.logoPublicId || "";
  let logoUrl = "";
  let logoPublicId = "";
  let storedLocally = false;
  try {
    const uploaded = await uploadInstitutionLogo(institution, file.buffer, file.mimetype, file.originalname);
    logoUrl = uploaded.logoUrl;
    logoPublicId = uploaded.logoPublicId;
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 502) throw error;
    storedLocally = true;
    logoUrl = `/api/institution/brand/${institution.code}/logo?v=${Date.now()}`;
  }
  const mime = imageMime(file.mimetype, file.originalname);
  const update = { $set: { logoUrl, logoPublicId, logoMime: mime } };
  if (storedLocally) update.$set.logoData = file.buffer;
  else update.$unset = { logoData: "" };
  await Settings.updateOne({ _id: settings._id }, update);
  settings.logoUrl = logoUrl;
  settings.logoPublicId = logoPublicId;
  copyCampus(institution, settings);
  await institution.save();
  if (previousPublicId && previousPublicId !== logoPublicId) await destroyAsset(previousPublicId);
  return presentCampus(settings);
}

async function removeLogo(auth) {
  const institution = await ownedInstitution(auth);
  const settings = await ensureSettings(institution);
  const previousPublicId = settings.logoPublicId || institution.logoPublicId || "";
  await Settings.updateOne({ _id: settings._id }, { $set: { logoUrl: "", logoPublicId: "", logoMime: "" }, $unset: { logoData: "" } });
  settings.logoUrl = "";
  settings.logoPublicId = "";
  copyCampus(institution, settings);
  await institution.save();
  await destroyAsset(previousPublicId);
  return presentCampus(settings);
}

async function readLogo(code) {
  const key = String(code || "").trim();
  if (!/^[A-Za-z0-9._-]{2,32}$/.test(key)) throw new ApiError(404, "Logo not found.");
  const settings = await Settings.findOne({ institutionCode: key }).select("+logoData");
  if (!settings) throw new ApiError(404, "Logo not found.");
  if (String(settings.logoUrl || "").startsWith("https://res.cloudinary.com/")) return { redirect: settings.logoUrl };
  if (!settings.logoData?.length) throw new ApiError(404, "Logo not found.");
  return { mime: settings.logoMime || "image/png", buffer: settings.logoData };
}

module.exports = { attachSettings, updateCampus, saveLogo, removeLogo, readLogo };
