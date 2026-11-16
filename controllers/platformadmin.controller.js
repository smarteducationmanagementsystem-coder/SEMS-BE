const { asyncHandler } = require("../utils/asyncHandler");
const { platformAdmin } = require("../services/platformadmin.service");
const { parseTypeFilter, parseCityFilter, parseMonth, parseMonthRange } = require("../validators/platformadmin.validator");

const login = asyncHandler(async (req, res) => {
  res.json({ data: await platformAdmin.login(req.body) });
});

const dashboard = asyncHandler(async (req, res) => {
  res.json({ data: await platformAdmin.dashboard() });
});

const institutions = asyncHandler(async (req, res) => {
  res.json({ data: await platformAdmin.list(parseTypeFilter(req.query.type)) });
});

const updateInstitution = asyncHandler(async (req, res) => {
  res.json({ data: await platformAdmin.update(req.params.id, req.body) });
});

const institutionStorage = asyncHandler(async (req, res) => {
  res.json({ data: await platformAdmin.storage(req.params.id) });
});

const deleteInstitution = asyncHandler(async (req, res) => {
  await platformAdmin.remove(req.params.id);
  res.json({ ok: true });
});

const payments = asyncHandler(async (req, res) => {
  res.json({ data: await platformAdmin.payments(parseTypeFilter(req.query.type), parseCityFilter(req.query.city), parseMonth(req.query.month)) });
});

const markPayment = asyncHandler(async (req, res) => {
  res.json({ data: await platformAdmin.markPayment(req.params.id, req.body.status, req.body.month) });
});

const deletePayments = asyncHandler(async (req, res) => {
  const range = parseMonthRange(req.query);
  res.json({ data: await platformAdmin.deletePayments(range.from, range.to) });
});

const account = asyncHandler(async (req, res) => {
  res.json({ data: await platformAdmin.account() });
});

const updateAccount = asyncHandler(async (req, res) => {
  res.json({ data: await platformAdmin.updateAccount(req.body) });
});

const pendingPayments = asyncHandler(async (req, res) => {
  res.json({ data: await platformAdmin.pendingPayments() });
});

const recipients = asyncHandler(async (req, res) => {
  res.json({ data: await platformAdmin.recipients(parseTypeFilter(req.query.type)) });
});

const sendEmail = asyncHandler(async (req, res) => {
  res.json({ data: await platformAdmin.sendEmail(req.body) });
});

const saveContact = asyncHandler(async (req, res) => {
  res.status(201).json({ data: await platformAdmin.saveContact(req.body) });
});

const contacts = asyncHandler(async (req, res) => {
  res.json({ data: await platformAdmin.contacts() });
});

const pricing = asyncHandler(async (req, res) => {
  res.json({ data: await platformAdmin.pricing() });
});

const savePricing = asyncHandler(async (req, res) => {
  res.json({ data: await platformAdmin.savePricing(req.body) });
});

const footer = asyncHandler(async (req, res) => {
  res.json({ data: await platformAdmin.footer() });
});

const saveFooter = asyncHandler(async (req, res) => {
  res.json({ data: await platformAdmin.saveFooter(req.body) });
});

const contactPage = asyncHandler(async (req, res) => {
  res.json({ data: await platformAdmin.contactPage() });
});

const saveContactPage = asyncHandler(async (req, res) => {
  res.json({ data: await platformAdmin.saveContactPage(req.body) });
});

const landing = asyncHandler(async (req, res) => {
  res.json({ data: await platformAdmin.landing() });
});

const saveLandingImage = asyncHandler(async (req, res) => {
  res.json({ data: await platformAdmin.saveLandingImage(req.params.slot, req.file) });
});

const removeLandingImage = asyncHandler(async (req, res) => {
  res.json({ data: await platformAdmin.removeLandingImage(req.params.slot) });
});

module.exports = { landing, saveLandingImage, removeLandingImage, login, dashboard, institutions, updateInstitution, institutionStorage, deleteInstitution, payments, markPayment, deletePayments, pendingPayments, recipients, sendEmail, account, updateAccount, saveContact, contacts, pricing, savePricing, footer, saveFooter, contactPage, saveContactPage };
