const express = require("express");
const { httpError } = require("../errors");
const { restInsert } = require("../services/supabaseRest");

function createApplicationsRouter() {
  const router = express.Router();

  router.post("/", async (req, res, next) => {
    try {
      const { formData, applicationPDF } = req.body || {};
      if (!formData || !formData.email || !formData.fullName) {
        throw httpError(400, "Missing required fields: fullName, email", true);
      }

      const row = {
        applicant_email: formData.email,
        full_name: formData.fullName,
        domain: formData.internshipDomain || null,
        status: "",
        data: { ...formData, applicationPDF: applicationPDF || null },
      };

      const inserted = await restInsert({
        table: "intern_applications",
        rows: row,
        accessToken: null,
        useServiceRole: true,
      });

      res.status(201).json({ success: true, application: inserted?.[0] || inserted });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createApplicationsRouter };

