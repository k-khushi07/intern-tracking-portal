const express = require("express");
const { httpError } = require("../errors");

function createEmailRouter({ emailService }) {
  const router = express.Router();

  function assertRole(req) {
    const role = req.auth?.profile?.role;
    if (!role) throw httpError(401, "Not authenticated", true);
    if (!["hr", "pm", "admin"].includes(role)) throw httpError(403, "Forbidden", true);
  }

  router.post("/send-email", async (req, res, next) => {
    try {
      assertRole(req);

      const { to, cc, bcc, subject, html, attachments } = req.body || {};
      if (!to || !subject || !html) throw httpError(400, "to, subject, html are required", true);

      const info = await emailService.sendEmail({ to, cc, bcc, subject, html, attachments });
      res.status(200).json({ success: true, messageId: info.messageId });
    } catch (err) {
      next(err);
    }
  });

  router.post("/emails/approve", async (req, res, next) => {
    try {
      assertRole(req);
      const { to, internName, pmEmail, type, item } = req.body || {};
      if (!to || !type) throw httpError(400, "to and type are required", true);

      const subject = `✅ ${type} Approved`;
      const details =
        type === "Weekly Report"
          ? `<li><strong>Week:</strong> ${item?.weekNumber ?? "-"}</li><li><strong>Period:</strong> ${item?.dateRange ?? "-"}</li><li><strong>Total Hours:</strong> ${item?.totalHours ?? "-"}h</li>`
          : type === "Monthly Report"
            ? `<li><strong>Month:</strong> ${item?.month ?? "-"}</li><li><strong>Total Hours:</strong> ${item?.totalHours ?? "-"}h</li><li><strong>Total Days:</strong> ${item?.totalDays ?? "-"}</li>`
            : `<li><strong>Item:</strong> ${item?.projectName || item?.title || "-"}</li>`;

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <h2>Approved</h2>
          <p>Hi ${internName || ""},</p>
          <p>Your <strong>${type}</strong> has been approved.</p>
          <ul>${details}</ul>
          <p><small>Approved on ${new Date().toLocaleDateString()}</small></p>
        </div>
      `;

      const info = await emailService.sendEmail({
        to,
        cc: pmEmail || undefined,
        subject,
        html,
      });
      res.status(200).json({ success: true, messageId: info.messageId });
    } catch (err) {
      next(err);
    }
  });

  router.post("/emails/reject", async (req, res, next) => {
    try {
      assertRole(req);
      const { to, internName, pmEmail, type, reason, item } = req.body || {};
      if (!to || !type) throw httpError(400, "to and type are required", true);

      const subject = `⚠️ ${type} Requires Revision`;
      const itemLine =
        type === "Weekly Report"
          ? `Week ${item?.weekNumber ?? "-"} (${item?.dateRange ?? "-"})`
          : type === "Monthly Report"
            ? `Month ${item?.month ?? "-"}`
            : item?.projectName || item?.title || "";

      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111;">
          <h2>Revision Required</h2>
          <p>Hi ${internName || ""},</p>
          <p>Your <strong>${type}</strong>${itemLine ? ` (${itemLine})` : ""} needs revision.</p>
          ${reason ? `<p><strong>Feedback:</strong> ${reason}</p>` : ""}
          <p>Please update and resubmit.</p>
        </div>
      `;

      const info = await emailService.sendEmail({
        to,
        cc: pmEmail || undefined,
        subject,
        html,
      });
      res.status(200).json({ success: true, messageId: info.messageId });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createEmailRouter };
