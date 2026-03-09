const express = require("express");
const { httpError } = require("../errors");
const { restInsert } = require("../services/supabaseRest");

function splitSkills(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((value) => String(value).trim()).filter(Boolean);
  return String(raw)
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function isMissingTableError(err, tableName) {
  const message = String(err?.message || "");
  const supabaseMessage = String(err?.supabase?.message || err?.supabase?.error || "");
  const combined = `${message} ${supabaseMessage}`.toLowerCase();
  const table = String(tableName || "").toLowerCase();
  if (!table) return false;
  return (
    combined.includes(`could not find the table 'public.${table}'`) ||
    combined.includes(`relation "public.${table}" does not exist`) ||
    combined.includes(`relation "${table}" does not exist`) ||
    (String(err?.supabase?.code || "") === "PGRST205" && combined.includes(table))
  );
}

function createApplicationsRouter() {
  const router = express.Router();

  router.post("/", async (req, res, next) => {
    try {
      const { formData, applicationPDF } = req.body || {};
      if (!formData || !formData.email || !formData.fullName) {
        throw httpError(400, "Missing required fields: fullName, email", true);
      }

      const now = new Date().toISOString();
      const row = {
        applicant_name: formData.fullName || null,
        email: formData.email,
        phone: formData.phone || null,
        college: formData.collegeName || null,
        cgpa: formData.cgpa ? Number(formData.cgpa) : null,
        domain: formData.internshipDomain || null,
        skills: splitSkills(formData.technicalSkills),
        resume_url: formData.resumeLink || null,
        status: "pending",
        submitted_at: now,
        created_at: now,
        updated_at: now,
        hr_notes: null,
        rejection_reason: null,
      };

      let inserted = null;
      let usedLegacyTable = false;

      try {
        inserted = await restInsert({
          table: "internship_applications",
          rows: row,
          accessToken: null,
          useServiceRole: true,
        });
      } catch (err) {
        if (!isMissingTableError(err, "internship_applications")) throw err;
        inserted = await restInsert({
          table: "intern_applications",
          rows: {
            applicant_email: formData.email,
            full_name: formData.fullName,
            domain: formData.internshipDomain || null,
            status: "pending",
            data: { ...formData, applicationPDF: applicationPDF || null },
            created_at: now,
            updated_at: now,
          },
          accessToken: null,
          useServiceRole: true,
        });
        usedLegacyTable = true;
      }

      if (!usedLegacyTable) {
        try {
          await restInsert({
            table: "intern_applications",
            rows: {
              id: inserted?.[0]?.id || inserted?.id,
              applicant_email: formData.email,
              full_name: formData.fullName,
              domain: formData.internshipDomain || null,
              status: "pending",
              data: { ...formData, applicationPDF: applicationPDF || null },
              created_at: now,
              updated_at: now,
            },
            accessToken: null,
            useServiceRole: true,
          });
        } catch {
        }
      }

      res.status(201).json({
        success: true,
        application: inserted?.[0] || inserted,
        legacyTableUsed: usedLegacyTable,
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createApplicationsRouter };
