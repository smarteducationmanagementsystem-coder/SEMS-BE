const nodemailer = require("nodemailer");
const { ApiError } = require("../utils/apiError");

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function mailAccount() {
  const host = String(process.env.SMTP_HOST || "").trim();
  const user = String(process.env.SMTP_USER || "").trim();
  const pass = String(process.env.SMTP_PASS || "");
  const port = Number(process.env.SMTP_PORT || 587);
  if (!host || !user || !pass || !Number.isFinite(port)) {
    throw new ApiError(503, "Email is not connected. Add the mail account on the server, then try again.");
  }
  return {
    from: String(process.env.MAIL_FROM || user).trim() || user,
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    }),
  };
}

async function sendPlatformMail({ subject, message, recipients }) {
  const { from, transporter } = mailAccount();
  let sent = 0;
  const failed = [];
  for (const recipient of recipients) {
    try {
      await transporter.sendMail({
        from,
        to: recipient.email,
        subject,
        text: message,
        html: `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6;white-space:pre-wrap">${escapeHtml(message)}</div>`,
      });
      sent += 1;
    } catch (error) {
      console.error("Platform email failed:", error?.message || error);
      failed.push(recipient.name);
    }
  }
  if (sent === 0) throw new ApiError(502, "The mail server rejected the message. Check the mail account and try again.");
  return { sent, failed };
}

module.exports = { sendPlatformMail };
