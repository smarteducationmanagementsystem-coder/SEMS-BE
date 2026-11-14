const { ApiError } = require("../utils/apiError");
const { INSTITUTION_TYPES } = require("../constants/institution");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseLogin(body) {
  const source = body && typeof body === "object" ? body : {};
  const email = String(source.email ?? "").trim().toLowerCase();
  const password = String(source.password ?? "");
  if (!EMAIL_PATTERN.test(email) || !password) throw new ApiError(400, "Enter the platform admin email and password.");
  return { email, password };
}

function parseInstitutionUpdate(body) {
  const source = body && typeof body === "object" ? body : {};
  const name = String(source.name ?? "").trim();
  const city = String(source.city ?? "").trim();
  const email = String(source.email ?? "").trim().toLowerCase();
  const phone = String(source.phone ?? "").trim();
  const type = String(source.type ?? "").trim();
  if (name.length < 2 || name.length > 120) throw new ApiError(400, "Enter the institution name.");
  if (city.length < 2 || city.length > 80) throw new ApiError(400, "Enter the city.");
  if (!EMAIL_PATTERN.test(email)) throw new ApiError(400, "Enter a valid email.");
  if (phone.length > 30) throw new ApiError(400, "Phone number is too long.");
  if (!INSTITUTION_TYPES.includes(type)) throw new ApiError(400, "Choose School, College, or Academy.");
  return { name, city, email, phone, type };
}

function parseTypeFilter(value) {
  const type = String(value ?? "").trim();
  if (!type || type.toLowerCase() === "all") return "";
  if (!INSTITUTION_TYPES.includes(type)) throw new ApiError(400, "Choose School, College, or Academy.");
  return type;
}

function parseCityFilter(value) {
  const city = String(value ?? "").trim();
  if (!city || city.toLowerCase() === "all") return "";
  if (city.length > 80) throw new ApiError(400, "City name is too long.");
  return city;
}

function parseMonth(value) {
  const month = String(value ?? "").trim();
  if (!month) return "";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new ApiError(400, "Choose a valid month.");
  return month;
}

function parsePaymentStatus(body) {
  const source = body && typeof body === "object" ? body : {};
  const status = String(source.status ?? "").trim().toLowerCase();
  const month = parseMonth(source.month);
  if (status !== "paid" && status !== "unpaid") throw new ApiError(400, "Choose paid or unpaid.");
  if (!month) throw new ApiError(400, "Choose the month.");
  return { status, month };
}

function parseMonthRange(query) {
  const source = query && typeof query === "object" ? query : {};
  const from = parseMonth(source.from);
  const to = parseMonth(source.to);
  if (!from || !to) throw new ApiError(400, "Choose the start and end month.");
  if (from > to) throw new ApiError(400, "The start month must be the same as or before the end month.");
  return { from, to };
}

function parseAccountUpdate(body) {
  const source = body && typeof body === "object" ? body : {};
  const email = String(source.email ?? "").trim().toLowerCase();
  const password = String(source.password ?? "");
  const currentPassword = String(source.currentPassword ?? "");
  if (!EMAIL_PATTERN.test(email)) throw new ApiError(400, "Enter a valid email.");
  if (!currentPassword) throw new ApiError(400, "Enter the current password.");
  if (password && password.length < 8) throw new ApiError(400, "Use at least 8 characters for the new password.");
  if (password.length > 80) throw new ApiError(400, "The new password is too long.");
  return { email, password, currentPassword };
}

function parseEmailMessage(body) {
  const source = body && typeof body === "object" ? body : {};
  const subject = String(source.subject ?? "").trim();
  const message = String(source.message ?? "").trim();
  const type = parseTypeFilter(source.type);
  const institutionId = String(source.institutionId ?? "").trim();
  if (subject.length < 2 || subject.length > 160) throw new ApiError(400, "Enter a subject.");
  if (message.length < 2 || message.length > 5000) throw new ApiError(400, "Enter the message.");
  if (institutionId && institutionId.toLowerCase() !== "all" && !/^[a-f\d]{24}$/i.test(institutionId)) {
    throw new ApiError(400, "Choose an institution.");
  }
  return { subject, message, type, institutionId: !institutionId || institutionId.toLowerCase() === "all" ? "" : institutionId };
}

function parseContact(body) {
  const source = body && typeof body === "object" ? body : {};
  const name = String(source.name ?? "").trim();
  const email = String(source.email ?? "").trim().toLowerCase();
  const institution = String(source.institution ?? "").trim();
  const message = String(source.message ?? "").trim();
  if (name.length < 2 || name.length > 120) throw new ApiError(400, "Enter your name.");
  if (!EMAIL_PATTERN.test(email)) throw new ApiError(400, "Enter a valid email.");
  if (institution.length > 120) throw new ApiError(400, "Institution name is too long.");
  if (message.length < 10 || message.length > 5000) throw new ApiError(400, "Tell us a little more (at least 10 characters).");
  return { name, email, institution, message };
}

function parsePricing(body) {
  const source = body && typeof body === "object" ? body : {};
  const plans = Array.isArray(source.plans) ? source.plans : null;
  if (!plans || plans.length !== 3) throw new ApiError(400, "Enter all three pricing cards.");
  const payment = source.payment && typeof source.payment === "object" ? source.payment : {};
  const accountName = String(payment.accountName ?? "").trim();
  const accountNumber = String(payment.accountNumber ?? "").trim();
  const detail = String(payment.detail ?? "").trim();
  if (accountName.length > 120) throw new ApiError(400, "Account name is too long.");
  if (accountNumber.length > 40) throw new ApiError(400, "Account number is too long.");
  if (detail.length > 500) throw new ApiError(400, "Payment detail is too long.");
  return {
    plans: plans.map((item, index) => {
      const plan = item && typeof item === "object" ? item : {};
      const name = String(plan.name ?? "").trim();
      const audience = String(plan.audience ?? "").trim();
      const price = String(plan.price ?? "").trim();
      const period = String(plan.period ?? "").trim();
      const buttonLabel = String(plan.buttonLabel ?? "").trim();
      const points = Array.isArray(plan.points) ? plan.points.map((point) => String(point ?? "").trim()).filter(Boolean) : [];
      if (name.length < 2 || name.length > 40) throw new ApiError(400, `Enter a name for card ${index + 1}.`);
      if (audience.length > 80) throw new ApiError(400, `The audience line on card ${index + 1} is too long.`);
      if (price.length < 1 || price.length > 40) throw new ApiError(400, `Enter a price for card ${index + 1}.`);
      if (period.length > 40) throw new ApiError(400, `The period on card ${index + 1} is too long.`);
      if (buttonLabel.length < 2 || buttonLabel.length > 40) throw new ApiError(400, `Enter a button label for card ${index + 1}.`);
      if (points.length > 8 || points.some((point) => point.length > 120)) throw new ApiError(400, `Card ${index + 1} can have up to 8 short points.`);
      return { name, audience, price, period, points, featured: plan.featured === true, buttonLabel };
    }),
    payment: { accountName, accountNumber, detail },
  };
}

function parseFooter(body) {
  const source = body && typeof body === "object" ? body : {};
  const blurb = String(source.blurb ?? "").trim();
  const email = String(source.email ?? "").trim().toLowerCase();
  const phone = String(source.phone ?? "").trim();
  const hours = String(source.hours ?? "").trim();
  const instagram = String(source.instagram ?? "").trim();
  const facebook = String(source.facebook ?? "").trim();
  const tiktok = String(source.tiktok ?? "").trim();
  const whatsapp = String(source.whatsapp ?? "").trim();
  if (blurb.length > 400) throw new ApiError(400, "The footer description is too long.");
  if (!EMAIL_PATTERN.test(email)) throw new ApiError(400, "Enter a valid footer email.");
  if (!phone || phone.length > 40) throw new ApiError(400, "Enter the footer phone number.");
  if (hours.length > 120) throw new ApiError(400, "The hours line is too long.");
  for (const [label, value] of [
    ["Instagram", instagram],
    ["Facebook", facebook],
    ["TikTok", tiktok],
  ]) {
    if (value && !/^https?:\/\/\S+$/i.test(value)) throw new ApiError(400, `Enter a full ${label} link, starting with https://.`);
    if (value.length > 200) throw new ApiError(400, `The ${label} link is too long.`);
  }
  if (whatsapp.length > 200) throw new ApiError(400, "The WhatsApp detail is too long.");
  if (whatsapp && !/^https?:\/\/\S+$/i.test(whatsapp) && whatsapp.replace(/\D/g, "").length < 8) {
    throw new ApiError(400, "Enter a WhatsApp number or a full WhatsApp link.");
  }
  return { blurb, email, phone, hours, instagram, facebook, tiktok, whatsapp };
}

function parseContactPage(body) {
  const source = body && typeof body === "object" ? body : {};
  const email = String(source.email ?? "").trim().toLowerCase();
  const whatsapp = String(source.whatsapp ?? "").trim();
  const phone = String(source.phone ?? "").trim();
  const hours = String(source.hours ?? "").trim();
  const city = String(source.city ?? "").trim();
  const instagram = String(source.instagram ?? "").trim();
  const facebook = String(source.facebook ?? "").trim();
  const tiktok = String(source.tiktok ?? "").trim();
  if (!EMAIL_PATTERN.test(email)) throw new ApiError(400, "Enter a valid contact email.");
  if (!phone || phone.length > 40) throw new ApiError(400, "Enter the contact phone number.");
  if (!whatsapp || whatsapp.length > 40) throw new ApiError(400, "Enter the WhatsApp number.");
  if (whatsapp.replace(/\D/g, "").length < 8) throw new ApiError(400, "Enter a WhatsApp number with the country code.");
  if (!hours || hours.length > 120) throw new ApiError(400, "Enter the support hours.");
  if (!city || city.length > 80) throw new ApiError(400, "Enter where the team is based.");
  for (const [label, value] of [
    ["Instagram", instagram],
    ["Facebook", facebook],
    ["TikTok", tiktok],
  ]) {
    if (value && !/^https?:\/\/\S+$/i.test(value)) throw new ApiError(400, `Enter a full ${label} link, starting with https://.`);
    if (value.length > 200) throw new ApiError(400, `The ${label} link is too long.`);
  }
  return { email, whatsapp, phone, hours, city, instagram, facebook, tiktok, placeholder: false };
}

module.exports = { parseLogin, parseInstitutionUpdate, parseTypeFilter, parseCityFilter, parseMonth, parsePaymentStatus, parseMonthRange, parseAccountUpdate, parseEmailMessage, parseContact, parsePricing, parseFooter, parseContactPage };
