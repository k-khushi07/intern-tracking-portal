const nodemailer = require("nodemailer");
const { httpError } = require("../errors");

function normalizeBase64Content(dataUrlOrBase64) {
  if (!dataUrlOrBase64) return null;
  const commaIdx = dataUrlOrBase64.indexOf(",");
  if (commaIdx !== -1) return dataUrlOrBase64.slice(commaIdx + 1);
  return dataUrlOrBase64;
}

function createEmailService() {
  const rawEmailUser = process.env.EMAIL_USER;
  const rawEmailPass = process.env.EMAIL_PASS;

  const EMAIL_USER = String(rawEmailUser || "").trim();
  const EMAIL_PASS = String(rawEmailPass || "")
    .trim()
    .replace(/^['"]|['"]$/g, "");

  const maskEmail = (email) => {
    const s = String(email || "");
    const at = s.indexOf("@");
    if (at <= 1) return s ? "***" : "";
    const name = s.slice(0, at);
    const domain = s.slice(at + 1);
    return `${name.slice(0, 2)}***@${domain}`;
  };

  if (!EMAIL_USER || !EMAIL_PASS) {
    console.warn(
      "[email] Email service is not configured. Set EMAIL_USER and EMAIL_PASS in backend/.env (Gmail requires an App Password)."
    );

    async function sendEmail() {
      throw httpError(
        500,
        "Email service not configured on server. Set EMAIL_USER and EMAIL_PASS in backend/.env (Gmail App Password).",
        true
      );
    }

    return { sendEmail };
  }

  const passLen = EMAIL_PASS.length;
  if (passLen < 8) {
    console.warn(`[email] EMAIL_PASS looks too short (len=${passLen}). If using Gmail, this must be a 16-char App Password.`);
  }
  if (/\s/.test(rawEmailPass || "")) {
    console.warn("[email] EMAIL_PASS contains whitespace. Remove spaces/newlines from the value in backend/.env.");
  }
  console.log(`[email] Configured EMAIL_USER=${maskEmail(EMAIL_USER)} EMAIL_PASS_LEN=${passLen}`);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  let verifyError = null;
  transporter.verify((error) => {
    verifyError = error || null;
    if (error) console.log("Email transporter error:", error);
    else console.log("Email service is ready");
  });

  function toProviderHelpMessage(err) {
    const code = String(err?.code || "");
    const responseCode = Number(err?.responseCode || 0);
    const raw = String(err?.message || "");

    // Gmail: normal passwords are not accepted; App Password is required.
    if (code === "EAUTH" || responseCode === 535 || raw.includes("Username and Password not accepted")) {
      return (
        "Invalid email login. If you're using Gmail, set `EMAIL_USER` to your full Gmail address and set `EMAIL_PASS` " +
        "to a Gmail App Password (not your normal password). App Passwords require 2‑Step Verification on the account."
      );
    }

    return raw || "Email provider error";
  }

  async function sendEmail({ to, cc, bcc, subject, html, attachments }) {
    if (verifyError) {
      throw httpError(502, `Email send failed: ${toProviderHelpMessage(verifyError)}`, true);
    }

    const mailOptions = {
      from: EMAIL_USER,
      to,
      cc: cc || undefined,
      bcc: bcc || undefined,
      subject,
      html,
      attachments:
        attachments?.map((att) => ({
          filename: att.filename,
          content: normalizeBase64Content(att.content),
          encoding: "base64",
        })) || [],
    };

    try {
      return await transporter.sendMail(mailOptions);
    } catch (err) {
      throw httpError(502, `Email send failed: ${toProviderHelpMessage(err)}`, true);
    }
  }

  return { sendEmail };
}

module.exports = { createEmailService };

