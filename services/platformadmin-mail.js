const { ApiError } = require("../utils/apiError");

const BREVO_URL = "https://api.brevo.com/v3/smtp/email";
const REQUEST_TIMEOUT_MS = 15000;
const BATCH_SIZE = 5;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Reads MAIL_FROM as either `Name <address>` or a bare address. */
function parseSender(value) {
  const text = String(value || "").trim();
  const match = text.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/);
  if (match) return { name: match[1].trim() || undefined, email: match[2].trim() };
  return { email: text };
}

function mailAccount() {
  const apiKey = String(process.env.BREVO_API_KEY || "").trim();
  const sender = parseSender(process.env.MAIL_FROM);
  if (!apiKey || !sender.email) {
    throw new ApiError(503, "Email is not connected. Add the mail account on the server, then try again.");
  }
  return { apiKey, sender };
}

async function sendOne({ apiKey, sender, subject, message, recipient }) {
  const response = await fetch(BREVO_URL, {
    method: "POST",
    headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify({
      sender,
      to: [{ email: recipient.email, name: recipient.name }],
      subject,
      textContent: message,
      htmlContent: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;white-space:pre-wrap">${escapeHtml(message)}</div>`,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => ({}));
    throw new Error(`Brevo ${response.status}: ${detail.message || response.statusText}`);
  }
}

async function sendPlatformMail({ subject, message, recipients }) {
  const { apiKey, sender } = mailAccount();
  let sent = 0;
  const failed = [];
  for (let start = 0; start < recipients.length; start += BATCH_SIZE) {
    const batch = recipients.slice(start, start + BATCH_SIZE);
    const results = await Promise.allSettled(batch.map((recipient) => sendOne({ apiKey, sender, subject, message, recipient })));
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        sent += 1;
        return;
      }
      console.error("Platform email failed:", result.reason?.message || result.reason);
      failed.push(batch[index].name);
    });
  }
  if (sent === 0) throw new ApiError(502, "The mail service rejected the message. Check the sender address and API key, then try again.");
  return { sent, failed };
}

module.exports = { sendPlatformMail };
