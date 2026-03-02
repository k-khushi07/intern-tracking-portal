const nodemailer = require("nodemailer");

function normalizeBase64Content(dataUrlOrBase64) {
  if (!dataUrlOrBase64) return null;
  const commaIdx = dataUrlOrBase64.indexOf(",");
  if (commaIdx !== -1) return dataUrlOrBase64.slice(commaIdx + 1);
  return dataUrlOrBase64;
}

function createEmailService() {
  const { EMAIL_USER, EMAIL_PASS } = process.env;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  transporter.verify((error) => {
    if (error) console.log("Email transporter error:", error);
    else console.log("Email service is ready");
  });

  async function sendEmail({ to, cc, bcc, subject, html, attachments }) {
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

    return transporter.sendMail(mailOptions);
  }

  return { sendEmail };
}

module.exports = { createEmailService };

