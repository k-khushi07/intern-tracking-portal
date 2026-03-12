// backend/src/routes/hr.js
const express = require("express");
const { httpError } = require("../errors");
const { adminCreateUser, restSelect, restUpdate, restInsert, restDelete } = require("../services/supabaseRest");
const { createAuthMiddleware } = require("../middleware/auth");
const { generateNextInternId, peekNextInternId } = require("../services/internId");

async function assertInternExists(internId) {
  const rows = await restSelect({
    table: "profiles",
    select: "id,role,email,full_name,intern_id,pm_id",
    filters: { id: `eq.${internId}`, limit: 1 },
    accessToken: null,
    useServiceRole: true,
  });
  const intern = rows?.[0] || null;
  if (!intern || String(intern.role || "").toLowerCase() !== "intern") throw httpError(404, "Intern not found", true);
  return intern;
}

function normalizeApplicationStatus(value) {
  const status = String(value || "").trim().toLowerCase();
  if (["pending", "under_review", "approved", "rejected"].includes(status)) return status;
  return null;
}

function isIsoDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function validateApprovalDateRange({ startDate, endDate }) {
  const normalizedStart = String(startDate || "").trim();
  const normalizedEnd = String(endDate || "").trim();
  if (!normalizedStart || !normalizedEnd) {
    throw httpError(400, "startDate and endDate are required", true);
  }
  if (!isIsoDateString(normalizedStart) || !isIsoDateString(normalizedEnd)) {
    throw httpError(400, "Dates must be in YYYY-MM-DD format", true);
  }

  const today = todayIsoDate();
  if (normalizedStart < today) throw httpError(400, "Start date cannot be in the past", true);
  if (normalizedEnd < today) throw httpError(400, "End date cannot be in the past", true);
  if (normalizedEnd < normalizedStart) throw httpError(400, "End date must be on or after start date", true);

  return { startDate: normalizedStart, endDate: normalizedEnd };
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

function generatePassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$!";
  let output = "";
  for (let index = 0; index < length; index += 1) {
    output += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (!/[A-Z]/.test(output)) output = `A${output.slice(1)}`;
  if (!/[0-9]/.test(output)) output = `${output.slice(0, -1)}7`;
  if (!/[@#$!]/.test(output)) output = `${output.slice(0, -2)}@${output.slice(-1)}`;
  return output;
}

function sendItpChanged(io, entity, action, id = null) {
  if (!io) return;
  const payload = { entity, action };
  if (id) payload.id = id;
  io.to("role:hr").emit("itp:changed", payload);
}

function mapApplicationToUser(app) {
  const name = app.applicant_name || app.full_name || "";
  const rawStatus = String(app.status || "").trim().toLowerCase();
  let normalizedStatus = normalizeApplicationStatus(rawStatus) || "";
  if (normalizedStatus === "pending" && !app.reviewed_by && !app.reviewed_at) {
    normalizedStatus = "";
  }

  const payload = app.data && typeof app.data === "object" ? app.data : {};

  return {
    applicationId: app.id,
    role: "intern",
    status: normalizedStatus,
    email: app.email || app.applicant_email,
    fullName: name,
    name,
    phone: app.phone || payload.phone || null,
    college: app.college || payload.collegeName || null,
    cgpa: app.cgpa || payload.cgpa || null,
    internshipDomain: app.domain || payload.internshipDomain || null,
    resumeUrl: app.resume_url || payload.resumeLink || null,
    applicationPDF: payload.applicationPDF || null,
    resumeFileName: payload.resumeFileName || null,
    resumeFileType: payload.resumeFileType || null,
    skills: app.skills || (payload.technicalSkills ? String(payload.technicalSkills).split(",").map((value) => value.trim()).filter(Boolean) : []),
    registeredAt: app.submitted_at || app.created_at,
    submittedAt: app.submitted_at || app.created_at,
    hrNotes: app.hr_notes || null,
    rejectionReason: app.rejection_reason || app.reject_reason || null,
  };
}

async function createOfferLetterPdf({ approvedIntern, profile, application }) {
  let PDFDocument;
  try {
    PDFDocument = require("pdfkit");
  } catch {
    throw httpError(500, "PDF generation dependency missing. Install `pdfkit` in backend.", true);
  }

  const doc = new PDFDocument({ margin: 48 });
  const chunks = [];
  return await new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("Offer Letter", { align: "center" });
    doc.moveDown(1.2);
    doc.fontSize(11).text(`Date: ${new Date().toLocaleDateString("en-US")}`);
    doc.moveDown(1.2);
    doc.text(`Dear ${application?.applicant_name || profile?.full_name || "Intern"},`);
    doc.moveDown(0.8);
    doc.text(
      `We are pleased to offer you an internship with our organization. Your internship details are as follows:`
    );
    doc.moveDown(0.8);
    doc.text(`Intern Name: ${application?.applicant_name || profile?.full_name || "-"}`);
    doc.text(`Intern ID: ${approvedIntern?.intern_id || "-"}`);
    doc.text(`College: ${application?.college || "-"}`);
    doc.text(`Department: ${approvedIntern?.department || "-"}`);
    doc.text(`Mentor: ${approvedIntern?.mentor || "-"}`);
    doc.text(`Stipend: ${approvedIntern?.stipend || "N/A"}`);
    doc.text(`Start Date: ${approvedIntern?.start_date || "-"}`);
    doc.text(`End Date: ${approvedIntern?.end_date || "-"}`);
    doc.moveDown(1.2);
    doc.text("We look forward to your contribution.");
    doc.moveDown(2.0);
    doc.text("HR Signature: ____________________", { align: "right" });
    doc.end();
  });
}

async function createCertificatePdf({ approvedIntern, profile, application, performanceNote }) {
  let PDFDocument;
  try {
    PDFDocument = require("pdfkit");
  } catch {
    throw httpError(500, "PDF generation dependency missing. Install `pdfkit` in backend.", true);
  }

  const doc = new PDFDocument({ margin: 48, layout: "landscape" });
  const chunks = [];
  return await new Promise((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(28).text("Certificate of Completion", { align: "center" });
    doc.moveDown(1.2);
    doc
      .fontSize(14)
      .text(
        `This is to certify that ${application?.applicant_name || profile?.full_name || "Intern"} successfully completed internship`,
        { align: "center" }
      );
    doc.moveDown(0.5);
    doc
      .fontSize(13)
      .text(
        `in the ${approvedIntern?.department || "-"} department from ${approvedIntern?.start_date || "-"} to ${approvedIntern?.end_date || "-"}.`,
        { align: "center" }
      );
    if (performanceNote) {
      doc.moveDown(0.9);
      doc.fontSize(12).text(`Performance Note: ${performanceNote}`, { align: "center" });
    }
    doc.moveDown(2.5);
    doc.fontSize(12).text("HR Signature: ____________________", { align: "right" });
    doc.end();
  });
}

function createHrRouter({ emailService }) {
  const router = express.Router();
  const auth = createAuthMiddleware();

  router.use(auth.requireRole("hr", "admin"));

  async function loadApplicationById(applicationId) {
    const rows = await restSelect({
      table: "internship_applications",
      select:
        "id,applicant_name,email,phone,college,cgpa,domain,skills,resume_url,status,submitted_at,reviewed_by,reviewed_at,hr_notes,rejection_reason,created_at,updated_at",
      filters: { id: `eq.${applicationId}`, limit: 1 },
      accessToken: null,
      useServiceRole: true,
    });
    return rows?.[0] || null;
  }

  async function insertStatusHistory({ applicationId, fromStatus, toStatus, changedBy, reason }) {
    await restInsert({
      table: "application_status_history",
      rows: {
        application_id: applicationId,
        from_status: fromStatus || null,
        to_status: toStatus,
        changed_by: changedBy || null,
        reason: reason || null,
        changed_at: new Date().toISOString(),
      },
      accessToken: null,
      useServiceRole: true,
    }).catch(() => {});
  }

  async function approveApplicationRecord({
    applicationId,
    approvedByProfileId,
    startDate,
    endDate,
    department,
    mentorName,
    stipend,
    password,
    sendEmail = true,
  }) {
    if (!department || !mentorName) {
      throw httpError(400, "startDate, endDate, department, mentorName are required", true);
    }
    const validatedDates = validateApprovalDateRange({ startDate, endDate });

    const app = await loadApplicationById(applicationId);
    if (!app) throw httpError(404, "Application not found", true);
    const currentStatus = normalizeApplicationStatus(app.status) || "pending";
    if (currentStatus === "approved") throw httpError(400, "Application already approved", true);
    if (currentStatus === "rejected") throw httpError(400, "Rejected application cannot be approved", true);

    const generatedInternId = await generateNextInternId({ prefix: "EDCS" });
    const generatedPassword = password || generatePassword();
    const createdAt = new Date().toISOString();

    const created = await adminCreateUser({
      email: app.email,
      password: generatedPassword,
      userMetadata: { full_name: app.applicant_name || "" },
    });
    const createdId = created?.id || created?.user?.id;
    if (!createdId) throw httpError(502, "Unexpected Supabase response (missing user id)", true);

    await restInsert({
      table: "profiles",
      rows: {
        id: createdId,
        email: app.email,
        full_name: app.applicant_name || "",
        role: "intern",
        status: "active",
        intern_id: generatedInternId,
        pm_id: null,
        profile_completed: false,
        created_at: createdAt,
        updated_at: createdAt,
      },
      accessToken: null,
      useServiceRole: true,
    });

    const approvedRow = await restInsert({
      table: "approved_interns",
      rows: {
        intern_id: generatedInternId,
        application_id: app.id,
        profile_id: createdId,
        start_date: validatedDates.startDate,
        end_date: validatedDates.endDate,
        department: String(department).trim(),
        mentor: String(mentorName).trim(),
        stipend: stipend ? String(stipend) : null,
        status: "active",
        approved_by: approvedByProfileId,
        approved_at: createdAt,
        created_at: createdAt,
        updated_at: createdAt,
      },
      accessToken: null,
      useServiceRole: true,
    });

    await restUpdate({
      table: "internship_applications",
      patch: {
        status: "approved",
        reviewed_by: approvedByProfileId,
        reviewed_at: createdAt,
        updated_at: createdAt,
        rejection_reason: null,
      },
      matchQuery: { id: `eq.${app.id}` },
      accessToken: null,
      useServiceRole: true,
    });

    await insertStatusHistory({
      applicationId: app.id,
      fromStatus: currentStatus,
      toStatus: "approved",
      changedBy: approvedByProfileId,
      reason: null,
    });

    let emailSent = false;
    if (emailService && app.email && sendEmail !== false) {
      await emailService
        .sendEmail({
          to: app.email,
          subject: "Internship application approved",
          html: `<p>Hi ${app.applicant_name || "Intern"},</p>
<p>Your internship application has been approved.</p>
<p><strong>Intern ID:</strong> ${generatedInternId}<br/>
<strong>Email:</strong> ${app.email}<br/>
<strong>Password:</strong> ${generatedPassword}</p>
<p><strong>Department:</strong> ${department}<br/>
<strong>Mentor:</strong> ${mentorName}<br/>
<strong>Start Date:</strong> ${validatedDates.startDate}<br/>
<strong>End Date:</strong> ${validatedDates.endDate}</p>`,
        })
        .then(() => {
          emailSent = true;
        })
        .catch(() => {});
    }

    return {
      app,
      createdId,
      generatedInternId,
      generatedPassword,
      emailSent,
      approvedIntern: approvedRow?.[0] || approvedRow,
    };
  }

  async function loadApprovedInternBundle(profileId) {
    const approvedRows = await restSelect({
      table: "approved_interns",
      select: "id,intern_id,application_id,profile_id,start_date,end_date,department,mentor,stipend,status,approved_by,approved_at,created_at,updated_at",
      filters: { profile_id: `eq.${profileId}`, limit: 1 },
      accessToken: null,
      useServiceRole: true,
    });
    const approvedIntern = approvedRows?.[0] || null;
    if (!approvedIntern) return null;

    const [profileRows, applicationRows] = await Promise.all([
      restSelect({
        table: "profiles",
        select: "id,email,full_name,role,status,intern_id,pm_id",
        filters: { id: `eq.${approvedIntern.profile_id}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      }),
      restSelect({
        table: "internship_applications",
        select: "id,applicant_name,email,college,domain,status,submitted_at",
        filters: { id: `eq.${approvedIntern.application_id}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      }),
    ]);

    return {
      approvedIntern,
      profile: profileRows?.[0] || null,
      application: applicationRows?.[0] || null,
    };
  }

  router.get("/users", async (req, res, next) => {
    try {
      let applications = [];
      let loadedFromLegacyOnly = false;
      try {
        applications = await restSelect({
          table: "internship_applications",
          select:
            "id,applicant_name,email,phone,college,cgpa,domain,skills,resume_url,status,submitted_at,reviewed_by,reviewed_at,hr_notes,rejection_reason,created_at,updated_at",
          filters: {},
          accessToken: null,
          useServiceRole: true,
        });
      } catch (err) {
        if (!isMissingTableError(err, "internship_applications")) throw err;
        applications = await restSelect({
          table: "intern_applications",
          select: "id,applicant_email,full_name,domain,status,data,reject_reason,reviewed_by,reviewed_at,created_at,updated_at",
          filters: {},
          accessToken: null,
          useServiceRole: true,
        });
        loadedFromLegacyOnly = true;
      }

      if (!loadedFromLegacyOnly) {
        const legacyRows = await restSelect({
          table: "intern_applications",
          select: "id,applicant_email,full_name,domain,status,data,reject_reason,reviewed_by,reviewed_at,created_at,updated_at",
          filters: {},
          accessToken: null,
          useServiceRole: true,
        }).catch(() => []);

        const legacyById = new Map();
        const legacyByEmail = new Map();
        (legacyRows || []).forEach((row) => {
          if (row?.id) legacyById.set(String(row.id), row);
          const email = String(row?.applicant_email || "").trim().toLowerCase();
          if (email && !legacyByEmail.has(email)) legacyByEmail.set(email, row);
        });

        applications = (applications || []).map((row) => {
          const byId = row?.id ? legacyById.get(String(row.id)) : null;
          const byEmail = row?.email ? legacyByEmail.get(String(row.email).trim().toLowerCase()) : null;
          const legacy = byId || byEmail || null;
          if (!legacy) return row;
          const mergedData = row?.data && typeof row.data === "object" ? row.data : legacy.data;
          return {
            ...legacy,
            ...row,
            data: mergedData,
            full_name: row?.applicant_name || legacy.full_name || null,
            applicant_email: row?.email || legacy.applicant_email || null,
            domain: row?.domain || legacy.domain || null,
            status: row?.status || legacy.status || null,
            reject_reason: row?.rejection_reason || legacy.reject_reason || null,
          };
        });
      }

      const approvedInterns = await restSelect({
        table: "approved_interns",
        select: "id,application_id,profile_id,intern_id,start_date,end_date,department,mentor,stipend,status,approved_by,approved_at",
        filters: {},
        accessToken: null,
        useServiceRole: true,
      }).catch(() => []);

      const interns = await restSelect({
        table: "profiles",
        select: "id,email,full_name,role,status,intern_id,pm_id,pm:pm_id(id,email,full_name,pm_code)",
        filters: { role: "eq.intern" },
        accessToken: null,
        useServiceRole: true,
      });

      const pms = await restSelect({
        table: "profiles",
        select: "id,email,full_name,role,status,pm_code",
        filters: { role: "eq.pm" },
        accessToken: null,
        useServiceRole: true,
      });

      const approvedByProfileId = new Map((approvedInterns || []).map((row) => [row.profile_id, row]));

      const users = [
        ...(applications || [])
          .filter((row) => normalizeApplicationStatus(row.status) !== "approved")
          .map(mapApplicationToUser),
        ...(interns || []).map((p) => ({
          id: p.id,
          role: "intern",
          status: p.status || "active",
          email: p.email,
          fullName: p.full_name,
          name: p.full_name,
          internId: p.intern_id,
          pmId: p.pm_id,
          pmCode: p.pm?.pm_code || null,
          approvedIntern: approvedByProfileId.get(p.id) || null,
          department: approvedByProfileId.get(p.id)?.department || null,
          mentor: approvedByProfileId.get(p.id)?.mentor || null,
          startDate: approvedByProfileId.get(p.id)?.start_date || null,
          endDate: approvedByProfileId.get(p.id)?.end_date || null,
          stipend: approvedByProfileId.get(p.id)?.stipend || null,
          approvalStatus: approvedByProfileId.get(p.id)?.status || "active",
        })),
        ...(pms || []).map((p) => ({
          id: p.id,
          role: "pm",
          status: p.status || "active",
          email: p.email,
          fullName: p.full_name,
          name: p.full_name,
          pmCode: p.pm_code || null,
        })),
      ];

      res.status(200).json({ success: true, users });
    } catch (err) {
      next(err);
    }
  });

  router.get("/intern-id/next", async (req, res, next) => {
    try {
      const internId = await peekNextInternId({ prefix: "EDCS" });
      res.status(200).json({ success: true, internId });
    } catch (err) {
      next(err);
    }
  });

  router.get("/applications", async (req, res, next) => {
    try {
      const status = normalizeApplicationStatus(req.query.status);
      const domain = req.query.domain ? String(req.query.domain).trim() : "";
      const college = req.query.college ? String(req.query.college).trim() : "";
      const search = req.query.search ? String(req.query.search).trim() : "";
      const fromDate = req.query.from ? String(req.query.from) : "";
      const toDate = req.query.to ? String(req.query.to) : "";
      const sortByMap = {
        date: "submitted_at",
        submitted_at: "submitted_at",
        cgpa: "cgpa",
        name: "applicant_name",
      };
      const sortBy = sortByMap[String(req.query.sortBy || "date").toLowerCase()] || "submitted_at";
      const sortDir = String(req.query.sortDir || "desc").toLowerCase() === "asc" ? "asc" : "desc";
      const limit = Math.min(200, Math.max(1, Number(req.query.limit || 100)));
      const offset = Math.max(0, Number(req.query.offset || 0));

      const filters = {
        order: `${sortBy}.${sortDir}.nullslast,submitted_at.desc`,
        limit,
        offset,
      };
      if (status) filters.status = `eq.${status}`;
      if (domain) filters.domain = `ilike.*${domain}*`;
      if (college) filters.college = `ilike.*${college}*`;
      if (fromDate && toDate) {
        filters.and = `(submitted_at.gte.${fromDate},submitted_at.lte.${toDate})`;
      } else if (fromDate) {
        filters.submitted_at = `gte.${fromDate}`;
      } else if (toDate) {
        filters.submitted_at = `lte.${toDate}`;
      }
      if (search) {
        const pattern = search.replace(/,/g, " ");
        filters.or = `(applicant_name.ilike.*${pattern}*,email.ilike.*${pattern}*,college.ilike.*${pattern}*)`;
      }

      const rows = await restSelect({
        table: "internship_applications",
        select:
          "id,applicant_name,email,phone,college,cgpa,domain,skills,resume_url,status,submitted_at,reviewed_by,reviewed_at,hr_notes,rejection_reason,created_at,updated_at",
        filters,
        accessToken: null,
        useServiceRole: true,
      });

      const applications = (rows || []).map((row) => ({
        id: row.id,
        applicantName: row.applicant_name || "",
        email: row.email,
        phone: row.phone || "",
        college: row.college || "",
        cgpa: row.cgpa,
        domain: row.domain || "",
        skills: row.skills || [],
        resumeUrl: row.resume_url || "",
        status: normalizeApplicationStatus(row.status) || "pending",
        submittedAt: row.submitted_at || row.created_at,
        reviewedBy: row.reviewed_by || null,
        reviewedAt: row.reviewed_at || null,
        hrNotes: row.hr_notes || "",
        rejectionReason: row.rejection_reason || "",
      }));

      res.status(200).json({ success: true, applications });
    } catch (err) {
      next(err);
    }
  });

  router.get("/applications/export", async (req, res, next) => {
    try {
      const rows = await restSelect({
        table: "internship_applications",
        select:
          "id,applicant_name,email,phone,college,cgpa,domain,skills,resume_url,status,submitted_at,reviewed_at,rejection_reason",
        filters: { order: "submitted_at.desc", limit: 5000 },
        accessToken: null,
        useServiceRole: true,
      });

      const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
      const header = [
        "Application ID",
        "Name",
        "Email",
        "Phone",
        "College",
        "CGPA",
        "Domain",
        "Skills",
        "Resume URL",
        "Status",
        "Submitted At",
        "Reviewed At",
        "Rejection Reason",
      ];
      const lines = [header.map(escapeCsv).join(",")];
      (rows || []).forEach((row) => {
        lines.push(
          [
            row.id,
            row.applicant_name || "",
            row.email || "",
            row.phone || "",
            row.college || "",
            row.cgpa ?? "",
            row.domain || "",
            Array.isArray(row.skills) ? row.skills.join("; ") : "",
            row.resume_url || "",
            normalizeApplicationStatus(row.status) || "pending",
            row.submitted_at || "",
            row.reviewed_at || "",
            row.rejection_reason || "",
          ]
            .map(escapeCsv)
            .join(",")
        );
      });

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="applications_export_${Date.now()}.csv"`);
      res.status(200).send(lines.join("\n"));
    } catch (err) {
      next(err);
    }
  });

  router.get("/applications/:id", async (req, res, next) => {
    try {
      const application = await loadApplicationById(req.params.id);
      if (!application) throw httpError(404, "Application not found", true);

      const timeline = await restSelect({
        table: "application_status_history",
        select: "id,application_id,from_status,to_status,changed_by,reason,changed_at,changed_by_profile:changed_by(id,email,full_name,role)",
        filters: { application_id: `eq.${req.params.id}`, order: "changed_at.desc" },
        accessToken: null,
        useServiceRole: true,
      }).catch(() => []);

      res.status(200).json({
        success: true,
        application: {
          id: application.id,
          applicantName: application.applicant_name || "",
          email: application.email,
          phone: application.phone || "",
          college: application.college || "",
          cgpa: application.cgpa,
          domain: application.domain || "",
          skills: application.skills || [],
          resumeUrl: application.resume_url || "",
          status: normalizeApplicationStatus(application.status) || "pending",
          submittedAt: application.submitted_at || application.created_at,
          reviewedBy: application.reviewed_by || null,
          reviewedAt: application.reviewed_at || null,
          hrNotes: application.hr_notes || "",
          rejectionReason: application.rejection_reason || "",
        },
        timeline: (timeline || []).map((item) => ({
          id: item.id,
          fromStatus: item.from_status || null,
          toStatus: item.to_status,
          reason: item.reason || null,
          changedAt: item.changed_at,
          changedBy: item.changed_by_profile
            ? {
                id: item.changed_by_profile.id,
                email: item.changed_by_profile.email,
                fullName: item.changed_by_profile.full_name,
                role: item.changed_by_profile.role,
              }
            : null,
        })),
      });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/applications/:id/notes", async (req, res, next) => {
    try {
      const { hrNotes } = req.body || {};
      await restUpdate({
        table: "internship_applications",
        patch: { hr_notes: hrNotes || "", updated_at: new Date().toISOString() },
        matchQuery: { id: `eq.${req.params.id}` },
        accessToken: null,
        useServiceRole: true,
      });

      sendItpChanged(req.app.get("io"), "internship_applications", "update", req.params.id);
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/applications/:id/status", async (req, res, next) => {
    try {
      const { status, reason } = req.body || {};
      const nextStatus = normalizeApplicationStatus(status);
      if (!nextStatus) throw httpError(400, "Invalid status", true);
      if (nextStatus === "rejected" && !String(reason || "").trim()) {
        throw httpError(400, "rejection_reason is required when status is rejected", true);
      }

      const existing = await loadApplicationById(req.params.id);
      if (!existing) throw httpError(404, "Application not found", true);

      const now = new Date().toISOString();
      await restUpdate({
        table: "internship_applications",
        patch: {
          status: nextStatus,
          reviewed_by: req.auth.profile.id,
          reviewed_at: now,
          rejection_reason: nextStatus === "rejected" ? String(reason).trim() : null,
          updated_at: now,
        },
        matchQuery: { id: `eq.${req.params.id}` },
        accessToken: null,
        useServiceRole: true,
      });

      await insertStatusHistory({
        applicationId: req.params.id,
        fromStatus: normalizeApplicationStatus(existing.status),
        toStatus: nextStatus,
        changedBy: req.auth.profile.id,
        reason: nextStatus === "rejected" ? String(reason).trim() : null,
      });

      sendItpChanged(req.app.get("io"), "internship_applications", "update", req.params.id);

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.post("/applications/:id/reject", async (req, res, next) => {
    try {
      const { reason } = req.body || {};
      const rejectionReason = String(reason || "").trim();
      if (!rejectionReason) throw httpError(400, "rejection_reason is required", true);

      const existing = await loadApplicationById(req.params.id);
      if (!existing) throw httpError(404, "Application not found", true);

      const now = new Date().toISOString();
      await restUpdate({
        table: "internship_applications",
        patch: {
          status: "rejected",
          rejection_reason: rejectionReason,
          reviewed_by: req.auth.profile.id,
          reviewed_at: now,
          updated_at: now,
        },
        matchQuery: { id: `eq.${req.params.id}` },
        accessToken: null,
        useServiceRole: true,
      });

      await insertStatusHistory({
        applicationId: req.params.id,
        fromStatus: normalizeApplicationStatus(existing.status),
        toStatus: "rejected",
        changedBy: req.auth.profile.id,
        reason: rejectionReason,
      });

      sendItpChanged(req.app.get("io"), "internship_applications", "update", req.params.id);

      if (emailService && existing.email) {
        const shouldSend = req.body?.sendEmail !== false;
        if (shouldSend) {
          await emailService
            .sendEmail({
              to: existing.email,
              subject: "Internship application update",
              html: `<p>Hi ${existing.applicant_name || "Candidate"},</p><p>Your internship application has been rejected.</p><p><strong>Reason:</strong> ${rejectionReason}</p>`,
            })
            .catch(() => {});
        }
      }

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.post("/applications/:id/approve", async (req, res, next) => {
    try {
      const { startDate, endDate, department, mentorName, stipend, password, sendEmail } = req.body || {};
      const approval = await approveApplicationRecord({
        applicationId: req.params.id,
        approvedByProfileId: req.auth.profile.id,
        startDate,
        endDate,
        department,
        mentorName,
        stipend,
        password,
        sendEmail,
      });

      const io = req.app.get("io");
      if (io) {
        io.to("role:hr").emit("itp:changed", { entity: "internship_applications", action: "update", id: approval.app.id });
        io.to("role:hr").emit("itp:changed", { entity: "approved_interns", action: "insert" });
        io.to("role:hr").emit("itp:changed", { entity: "profiles", action: "insert", id: approval.createdId });
        io.to(`user:${approval.createdId}`).emit("itp:changed", { entity: "profiles", action: "insert" });
      }

      res.status(200).json({
        success: true,
        approvedIntern: approval.approvedIntern,
        intern: {
          id: approval.createdId,
          email: approval.app.email,
          fullName: approval.app.applicant_name || "",
          internId: approval.generatedInternId,
        },
        credentials: { password: approval.generatedPassword },
        emailSent: approval.emailSent,
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/applications/bulk-status", async (req, res, next) => {
    try {
      const { applicationIds, action, startDate, endDate, department, mentorName, stipend, rejectionReason } = req.body || {};
      const ids = Array.isArray(applicationIds) ? applicationIds.filter(Boolean) : [];
      if (!ids.length) throw httpError(400, "applicationIds is required", true);
      if (ids.length > 50) throw httpError(400, "Bulk actions are limited to 50 records", true);

      const normalizedAction = String(action || "").trim().toLowerCase();
      if (!["approve", "reject", "under_review", "pending"].includes(normalizedAction)) {
        throw httpError(400, "Invalid action", true);
      }

      const results = [];
      for (const applicationId of ids) {
        try {
          if (normalizedAction === "under_review" || normalizedAction === "pending") {
            const existing = await loadApplicationById(applicationId);
            if (!existing) throw httpError(404, "Application not found", true);
            const targetStatus = normalizedAction === "pending" ? "pending" : "under_review";
            await restUpdate({
              table: "internship_applications",
              patch: {
                status: targetStatus,
                reviewed_by: req.auth.profile.id,
                reviewed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
              matchQuery: { id: `eq.${applicationId}` },
              accessToken: null,
              useServiceRole: true,
            });
            await insertStatusHistory({
              applicationId,
              fromStatus: normalizeApplicationStatus(existing.status),
              toStatus: targetStatus,
              changedBy: req.auth.profile.id,
              reason: null,
            });
            results.push({ applicationId, success: true });
            continue;
          }

          if (normalizedAction === "reject") {
            const reason = String(rejectionReason || "").trim();
            if (!reason) throw httpError(400, "rejection_reason is required for bulk reject", true);
            const existing = await loadApplicationById(applicationId);
            if (!existing) throw httpError(404, "Application not found", true);
            const now = new Date().toISOString();
            await restUpdate({
              table: "internship_applications",
              patch: {
                status: "rejected",
                rejection_reason: reason,
                reviewed_by: req.auth.profile.id,
                reviewed_at: now,
                updated_at: now,
              },
              matchQuery: { id: `eq.${applicationId}` },
              accessToken: null,
              useServiceRole: true,
            });
            await insertStatusHistory({
              applicationId,
              fromStatus: normalizeApplicationStatus(existing.status),
              toStatus: "rejected",
              changedBy: req.auth.profile.id,
              reason,
            });
            results.push({ applicationId, success: true });
            continue;
          }

          if (!startDate || !endDate || !department || !mentorName) {
            throw httpError(400, "startDate, endDate, department, mentorName are required for bulk approve", true);
          }
          const approval = await approveApplicationRecord({
            applicationId,
            approvedByProfileId: req.auth.profile.id,
            startDate,
            endDate,
            department,
            mentorName,
            stipend,
            sendEmail: false,
          });
          results.push({
            applicationId,
            success: true,
            internId: approval.generatedInternId,
            profileId: approval.createdId,
          });
        } catch (err) {
          results.push({ applicationId, success: false, error: err?.message || "Failed" });
        }
      }

      const io = req.app.get("io");
      if (io) {
        io.to("role:hr").emit("itp:changed", { entity: "internship_applications", action: "bulk_update" });
        if (normalizedAction === "approve") {
          io.to("role:hr").emit("itp:changed", { entity: "approved_interns", action: "bulk_insert" });
          io.to("role:hr").emit("itp:changed", { entity: "profiles", action: "bulk_insert" });
        }
      }
      res.status(200).json({ success: true, results });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/interns/:id/assign-pm", async (req, res, next) => {
    try {
      const { pmCode } = req.body || {};
      if (!pmCode) throw httpError(400, "pmCode is required", true);

      const internRows = await restSelect({
        table: "profiles",
        select: "id,role,pm_id,status",
        filters: { id: `eq.${req.params.id}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });
      const intern = internRows?.[0];
      if (!intern || String(intern.role || "").toLowerCase() !== "intern") throw httpError(404, "Intern not found", true);
      const oldPmId = intern.pm_id || null;

      const pmRows = await restSelect({
        table: "profiles",
        select: "id,pm_code",
        filters: { pm_code: `eq.${pmCode}`, role: "eq.pm", limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });
      const pm = pmRows?.[0];
      if (!pm) throw httpError(404, "PM not found", true);

      await restUpdate({
        table: "profiles",
        patch: { pm_id: pm.id, updated_at: new Date().toISOString() },
        matchQuery: { id: `eq.${req.params.id}` },
        accessToken: null,
        useServiceRole: true,
      });

      if (oldPmId && String(oldPmId) !== String(pm.id)) {
        const now = new Date().toISOString();
        const [a, b] = String(req.params.id) < String(oldPmId) ? [req.params.id, oldPmId] : [oldPmId, req.params.id];

        try {
          await restUpdate({
            table: "conversations",
            patch: { status: "archived", read_only_reason: "Intern reassigned to a new PM", updated_at: now },
            matchQuery: { type: "eq.direct", direct_a: `eq.${a}`, direct_b: `eq.${b}` },
            accessToken: null,
            useServiceRole: true,
          });
        } catch {
          // ignore if messaging tables not migrated yet
        }

        try {
          const oldTeammates = await restSelect({
            table: "profiles",
            select: "id",
            filters: { role: "eq.intern", pm_id: `eq.${oldPmId}`, status: "eq.active" },
            accessToken: null,
            useServiceRole: true,
          });

          for (const t of oldTeammates || []) {
            if (!t?.id || String(t.id) === String(req.params.id)) continue;
            const [x, y] = String(req.params.id) < String(t.id) ? [req.params.id, t.id] : [t.id, req.params.id];
            await restUpdate({
              table: "conversations",
              patch: { status: "archived", read_only_reason: "Intern reassigned to a new PM", updated_at: now },
              matchQuery: { type: "eq.direct", direct_a: `eq.${x}`, direct_b: `eq.${y}` },
              accessToken: null,
              useServiceRole: true,
            });
          }
        } catch {
          // ignore if messaging tables not migrated yet
        }
      }

      const io = req.app.get("io");
      if (io) {
        io.to("role:hr").emit("itp:changed", { entity: "profiles", action: "update" });
        io.to(`user:${req.params.id}`).emit("itp:changed", { entity: "profiles", action: "update" });
        io.to(`user:${pm.id}`).emit("itp:changed", { entity: "profiles", action: "update" });
      }

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.get("/active-interns", async (req, res, next) => {
    try {
      const status = req.query.status ? String(req.query.status).trim().toLowerCase() : "";
      const department = req.query.department ? String(req.query.department).trim() : "";
      const mentor = req.query.mentor ? String(req.query.mentor).trim() : "";
      const joinedFrom = req.query.joinedFrom ? String(req.query.joinedFrom).trim() : "";
      const joinedTo = req.query.joinedTo ? String(req.query.joinedTo).trim() : "";
      const search = req.query.search ? String(req.query.search).trim() : "";

      const approvedFilters = { order: "approved_at.desc", limit: 5000 };
      if (["active", "completed"].includes(status)) approvedFilters.status = `eq.${status}`;
      if (department) approvedFilters.department = `ilike.*${department}*`;
      if (mentor) approvedFilters.mentor = `ilike.*${mentor}*`;
      if (joinedFrom && joinedTo) {
        approvedFilters.and = `(start_date.gte.${joinedFrom},start_date.lte.${joinedTo})`;
      } else if (joinedFrom) {
        approvedFilters.start_date = `gte.${joinedFrom}`;
      } else if (joinedTo) {
        approvedFilters.start_date = `lte.${joinedTo}`;
      }

      const [approvedRows, profileRows, appRows] = await Promise.all([
        restSelect({
          table: "approved_interns",
          select: "id,intern_id,application_id,profile_id,start_date,end_date,department,mentor,stipend,status,approved_by,approved_at",
          filters: approvedFilters,
          accessToken: null,
          useServiceRole: true,
        }),
        restSelect({
          table: "profiles",
          select: "id,email,full_name,role,status,intern_id,pm_id,pm:pm_id(id,email,full_name,pm_code)",
          filters: { role: "eq.intern" },
          accessToken: null,
          useServiceRole: true,
        }),
        restSelect({
          table: "internship_applications",
          select: "id,applicant_name,email,college,domain,cgpa,resume_url",
          filters: {},
          accessToken: null,
          useServiceRole: true,
        }),
      ]);

      const profileById = new Map((profileRows || []).map((row) => [row.id, row]));
      const appById = new Map((appRows || []).map((row) => [row.id, row]));

      let interns = (approvedRows || []).map((row) => {
        const profile = profileById.get(row.profile_id) || {};
        const app = appById.get(row.application_id) || {};
        return {
          approvedInternId: row.id,
          profileId: row.profile_id,
          applicationId: row.application_id,
          internId: row.intern_id || profile.intern_id || null,
          fullName: profile.full_name || app.applicant_name || "",
          email: profile.email || app.email || "",
          college: app.college || "",
          domain: app.domain || "",
          cgpa: app.cgpa ?? null,
          resumeUrl: app.resume_url || "",
          department: row.department || "",
          mentor: row.mentor || "",
          stipend: row.stipend || null,
          startDate: row.start_date,
          endDate: row.end_date,
          status: row.status || "active",
          approvedAt: row.approved_at,
          pmId: profile.pm_id || null,
          pmCode: profile.pm?.pm_code || null,
          pmName: profile.pm?.full_name || profile.pm?.email || null,
          profileStatus: profile.status || "active",
        };
      });

      if (search) {
        const pattern = search.toLowerCase();
        interns = interns.filter((row) => {
          return (
            String(row.fullName || "").toLowerCase().includes(pattern) ||
            String(row.email || "").toLowerCase().includes(pattern) ||
            String(row.department || "").toLowerCase().includes(pattern) ||
            String(row.mentor || "").toLowerCase().includes(pattern) ||
            String(row.internId || "").toLowerCase().includes(pattern)
          );
        });
      }

      res.status(200).json({ success: true, interns });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/active-interns/:profileId/status", async (req, res, next) => {
    try {
      const nextStatus = String(req.body?.status || "").trim().toLowerCase();
      if (!["active", "completed"].includes(nextStatus)) throw httpError(400, "Invalid status", true);

      const approvedRows = await restSelect({
        table: "approved_interns",
        select: "id,profile_id,status",
        filters: { profile_id: `eq.${req.params.profileId}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });
      const approvedIntern = approvedRows?.[0];
      if (!approvedIntern) throw httpError(404, "Active intern not found", true);

      const now = new Date().toISOString();
      await restUpdate({
        table: "approved_interns",
        patch: { status: nextStatus, updated_at: now },
        matchQuery: { id: `eq.${approvedIntern.id}` },
        accessToken: null,
        useServiceRole: true,
      });

      await restUpdate({
        table: "profiles",
        patch: { status: nextStatus, updated_at: now },
        matchQuery: { id: `eq.${req.params.profileId}` },
        accessToken: null,
        useServiceRole: true,
      }).catch(() => {});

      const io = req.app.get("io");
      if (io) {
        io.to("role:hr").emit("itp:changed", { entity: "approved_interns", action: "update", id: approvedIntern.id });
        io.to("role:hr").emit("itp:changed", { entity: "profiles", action: "update", id: req.params.profileId });
        io.to(`user:${req.params.profileId}`).emit("itp:changed", { entity: "profiles", action: "update" });
      }

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.post("/active-interns/:profileId/mark-completed", async (req, res, next) => {
    try {
      const approvedRows = await restSelect({
        table: "approved_interns",
        select: "id",
        filters: { profile_id: `eq.${req.params.profileId}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });
      const approvedIntern = approvedRows?.[0];
      if (!approvedIntern) throw httpError(404, "Active intern not found", true);

      const now = new Date().toISOString();
      await restUpdate({
        table: "approved_interns",
        patch: { status: "completed", updated_at: now },
        matchQuery: { id: `eq.${approvedIntern.id}` },
        accessToken: null,
        useServiceRole: true,
      });
      await restUpdate({
        table: "profiles",
        patch: { status: "completed", updated_at: now },
        matchQuery: { id: `eq.${req.params.profileId}` },
        accessToken: null,
        useServiceRole: true,
      }).catch(() => {});

      const io = req.app.get("io");
      if (io) {
        io.to("role:hr").emit("itp:changed", { entity: "approved_interns", action: "update", id: approvedIntern.id });
        io.to("role:hr").emit("itp:changed", { entity: "profiles", action: "update", id: req.params.profileId });
        io.to(`user:${req.params.profileId}`).emit("itp:changed", { entity: "profiles", action: "update" });
      }

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.get("/active-interns/:profileId/offer-letter.pdf", async (req, res, next) => {
    try {
      const bundle = await loadApprovedInternBundle(req.params.profileId);
      if (!bundle) throw httpError(404, "Active intern not found", true);

      const buffer = await createOfferLetterPdf({
        approvedIntern: bundle.approvedIntern,
        profile: bundle.profile,
        application: bundle.application,
      });

      const safeId = (bundle.approvedIntern?.intern_id || "intern").replace(/[^a-zA-Z0-9-_]/g, "_");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="offer-letter-${safeId}.pdf"`);
      res.status(200).send(buffer);
    } catch (err) {
      next(err);
    }
  });

  router.get("/active-interns/:profileId/certificate.pdf", async (req, res, next) => {
    try {
      const bundle = await loadApprovedInternBundle(req.params.profileId);
      if (!bundle) throw httpError(404, "Active intern not found", true);

      const buffer = await createCertificatePdf({
        approvedIntern: bundle.approvedIntern,
        profile: bundle.profile,
        application: bundle.application,
        performanceNote: req.query.performanceNote ? String(req.query.performanceNote) : "",
      });

      const safeId = (bundle.approvedIntern?.intern_id || "intern").replace(/[^a-zA-Z0-9-_]/g, "_");
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="certificate-${safeId}.pdf"`);
      res.status(200).send(buffer);
    } catch (err) {
      next(err);
    }
  });

  router.get("/analytics", async (req, res, next) => {
    try {
      const [applications, approvedInterns] = await Promise.all([
        restSelect({
          table: "internship_applications",
          select: "id,status,domain,college,submitted_at",
          filters: { limit: 5000, order: "submitted_at.desc" },
          accessToken: null,
          useServiceRole: true,
        }),
        restSelect({
          table: "approved_interns",
          select: "id,department,status,approved_at",
          filters: { limit: 5000, order: "approved_at.desc" },
          accessToken: null,
          useServiceRole: true,
        }),
      ]);

      const rows = applications || [];
      const totalApplications = rows.length;
      const pendingCount = rows.filter((row) => normalizeApplicationStatus(row.status) === "pending").length;
      const approvedCount = rows.filter((row) => normalizeApplicationStatus(row.status) === "approved").length;
      const rejectedCount = rows.filter((row) => normalizeApplicationStatus(row.status) === "rejected").length;
      const approvalRate = totalApplications > 0 ? Number(((approvedCount / totalApplications) * 100).toFixed(1)) : 0;

      const countBy = (list, keyResolver) => {
        const map = new Map();
        list.forEach((row) => {
          const key = keyResolver(row);
          if (!key) return;
          map.set(key, (map.get(key) || 0) + 1);
        });
        return Array.from(map.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count);
      };

      const domainWise = countBy(rows, (row) => String(row.domain || "").trim() || "Unspecified");
      const topColleges = countBy(rows, (row) => String(row.college || "").trim() || "Unspecified").slice(0, 10);
      const departmentWise = countBy(approvedInterns || [], (row) => String(row.department || "").trim() || "Unassigned");

      const monthlyMap = new Map();
      rows.forEach((row) => {
        const date = row.submitted_at ? new Date(row.submitted_at) : null;
        if (!date || Number.isNaN(date.getTime())) return;
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        monthlyMap.set(key, (monthlyMap.get(key) || 0) + 1);
      });
      const monthlyTrend = Array.from(monthlyMap.entries())
        .sort(([a], [b]) => (a < b ? -1 : 1))
        .map(([month, count]) => ({ month, count }));

      res.status(200).json({
        success: true,
        stats: { totalApplications, pendingCount, approvedCount, rejectedCount, approvalRate },
        charts: { domainWise, monthlyTrend, topColleges, departmentWise },
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/stats", async (req, res, next) => {
    try {
      const applications = await restSelect({
        table: "internship_applications",
        select: "id,status,submitted_at",
        filters: {},
        accessToken: null,
        useServiceRole: true,
      });

      const approvedInterns = await restSelect({
        table: "approved_interns",
        select: "id,status",
        filters: {},
        accessToken: null,
        useServiceRole: true,
      }).catch(() => []);

      const interns = await restSelect({
        table: "profiles",
        select: "id,role,status",
        filters: { role: "eq.intern" },
        accessToken: null,
        useServiceRole: true,
      });

      const pms = await restSelect({
        table: "profiles",
        select: "id,role,status",
        filters: { role: "eq.pm" },
        accessToken: null,
        useServiceRole: true,
      });

      const pending = (applications || []).filter((a) => (a.status || "") === "pending").length;
      const approved = (applications || []).filter((a) => (a.status || "") === "approved").length;
      const rejected = (applications || []).filter((a) => (a.status || "") === "rejected").length;
      const underReview = (applications || []).filter((a) => (a.status || "") === "under_review").length;
      const newRegistrations = pending;
      const active = (approvedInterns || []).filter((i) => (i.status || "active") === "active").length;

      res.status(200).json({
        success: true,
        stats: {
          pending,
          active,
          total: (interns || []).length,
          newRegistrations,
          pms: (pms || []).length,
          approved,
          rejected,
          underReview,
          totalApplications: (applications || []).length,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/reports", async (req, res, next) => {
    try {
      const rows = await restSelect({
        table: "reports",
        select:
          "id,intern_profile_id,pm_profile_id,recipient_roles,report_type,week_number,month,period_start,period_end,total_hours,days_worked,summary,data,status,submitted_at,reviewed_at,review_reason,intern:intern_profile_id(id,email,full_name,intern_id),pm:pm_profile_id(id,email,full_name,pm_code)",
        filters: { recipient_roles: "cs.{hr}", order: "submitted_at.desc" },
        accessToken: null,
        useServiceRole: true,
      });

      const mapped = (rows || []).map((r) => {
        const intern = r.intern || {};
        const pm = r.pm || {};
        const periodLabel =
          r.period_start && r.period_end
            ? `${new Date(r.period_start).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(
                r.period_end
              ).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
            : null;
        const daysWorked = r.days_worked || 0;
        const totalHours = r.total_hours || 0;
        return {
          id: r.id,
          internId: intern.id || r.intern_profile_id,
          internName: intern.full_name || intern.email || "Intern",
          internEmail: intern.email || "",
          internInternId: intern.intern_id || null,
          pmId: pm.id || r.pm_profile_id || null,
          pmName: pm.full_name || pm.email || null,
          pmEmail: pm.email || null,
          pmCode: pm.pm_code || null,
          recipientRoles: r.recipient_roles || [],
          reportType: r.report_type,
          weekNumber: r.week_number || null,
          month: r.month || null,
          dateRange: periodLabel || r.data?.dateRange || "",
          totalHours,
          daysWorked,
          totalDays: daysWorked,
          avgHoursPerDay: daysWorked > 0 ? (totalHours / daysWorked).toFixed(1) : "0.0",
          summary: r.summary || "",
          status: r.status,
          submittedAt: r.submitted_at,
          reviewedAt: r.reviewed_at,
          reviewReason: r.review_reason || null,
          data: r.data || {},
        };
      });

      res.status(200).json({ success: true, reports: mapped });
    } catch (err) {
      if (String(err.message || "").includes("recipient_roles")) {
        res.status(200).json({ success: true, reports: [] });
        return;
      }
      next(err);
    }
  });

  // ==================== Messaging moderation (privacy-first) ====================
  router.get("/message-reports", async (req, res, next) => {
    try {
      const status = req.query.status ? String(req.query.status) : "pending";
      const filters = { order: "created_at.desc", limit: 100 };
      if (["pending", "reviewed", "resolved"].includes(status)) filters.status = `eq.${status}`;

      const rows = await restSelect({
        table: "message_reports",
        select:
          "id,conversation_id,message_id,reported_by_profile_id,reason,status,created_at,reviewed_by_profile_id,reviewed_at,resolution,reported_by:reported_by_profile_id(id,email,full_name,role)",
        filters,
        accessToken: null,
        useServiceRole: true,
      });

      res.status(200).json({ success: true, reports: rows || [] });
    } catch (err) {
      if (String(err.message || "").includes("message_reports")) {
        res.status(200).json({ success: true, reports: [] });
        return;
      }
      next(err);
    }
  });

  router.get("/message-reports/:id/context", async (req, res, next) => {
    try {
      const reason = String(req.query.reason || "").trim();
      if (!reason) throw httpError(400, "reason query param is required", true);

      const reportRows = await restSelect({
        table: "message_reports",
        select: "id,conversation_id,message_id,status,created_at",
        filters: { id: `eq.${req.params.id}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });
      const report = reportRows?.[0];
      if (!report) throw httpError(404, "Report not found", true);

      const msgRows = await restSelect({
        table: "messages",
        select: "id,conversation_id,sender_profile_id,body,created_at,deleted_at,deleted_by_profile_id,delete_reason",
        filters: { id: `eq.${report.message_id}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });
      const msg = msgRows?.[0];
      if (!msg) throw httpError(404, "Message not found", true);

      const before = await restSelect({
        table: "messages",
        select: "id,conversation_id,sender_profile_id,body,created_at,deleted_at,deleted_by_profile_id,delete_reason",
        filters: { conversation_id: `eq.${msg.conversation_id}`, created_at: `lt.${msg.created_at}`, order: "created_at.desc", limit: 8 },
        accessToken: null,
        useServiceRole: true,
      });
      const after = await restSelect({
        table: "messages",
        select: "id,conversation_id,sender_profile_id,body,created_at,deleted_at,deleted_by_profile_id,delete_reason",
        filters: { conversation_id: `eq.${msg.conversation_id}`, created_at: `gt.${msg.created_at}`, order: "created_at.asc", limit: 8 },
        accessToken: null,
        useServiceRole: true,
      });

      await restInsert({
        table: "hr_investigation_audit",
        rows: { conversation_id: msg.conversation_id, hr_profile_id: req.auth.profile.id, action: "view_context", reason, created_at: new Date().toISOString() },
        accessToken: null,
        useServiceRole: true,
      }).catch(() => {});

      const messages = [...(before || []).slice().reverse(), msg, ...(after || [])].map((m) => ({
        id: m.id,
        conversationId: m.conversation_id,
        senderProfileId: m.sender_profile_id,
        body: m.deleted_at ? "" : m.body,
        deleted: !!m.deleted_at,
        createdAt: m.created_at,
        isReported: m.id === report.message_id,
      }));

      res.status(200).json({ success: true, report, messages });
    } catch (err) {
      next(err);
    }
  });

  router.post("/message-reports/:id/delete-message", async (req, res, next) => {
    try {
      const { reason } = req.body || {};
      const why = String(reason || "").trim();
      if (!why) throw httpError(400, "reason is required", true);

      const reportRows = await restSelect({
        table: "message_reports",
        select: "id,conversation_id,message_id,status",
        filters: { id: `eq.${req.params.id}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });
      const report = reportRows?.[0];
      if (!report) throw httpError(404, "Report not found", true);

      const now = new Date().toISOString();
      await restUpdate({
        table: "messages",
        patch: { deleted_at: now, deleted_by_profile_id: req.auth.profile.id, delete_reason: "hr_moderation" },
        matchQuery: { id: `eq.${report.message_id}` },
        accessToken: null,
        useServiceRole: true,
      });

      await restInsert({
        table: "hr_investigation_audit",
        rows: { conversation_id: report.conversation_id, hr_profile_id: req.auth.profile.id, action: "delete_message", reason: why, created_at: now },
        accessToken: null,
        useServiceRole: true,
      }).catch(() => {});

      await restUpdate({
        table: "message_reports",
        patch: { status: "reviewed", reviewed_by_profile_id: req.auth.profile.id, reviewed_at: now, resolution: `Deleted message: ${why}` },
        matchQuery: { id: `eq.${report.id}` },
        accessToken: null,
        useServiceRole: true,
      }).catch(() => {});

      const io = req.app.get("io");
      if (io) {
        io.to(`conv:${report.conversation_id}`).emit("chat:message_deleted", { messageId: report.message_id, conversationId: report.conversation_id });
      }

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.get("/interns/:internId/tna", async (req, res, next) => {
    try {
      const internId = req.params.internId;
      await assertInternExists(internId);

      const rows = await restSelect({
        table: "tna_items",
        select:
          "id,week_number,task,planned_date,plan_of_action,executed_date,status,reason,deliverable,sort_order,created_at,updated_at",
        filters: { intern_profile_id: `eq.${internId}`, order: "sort_order.asc,created_at.asc" },
        accessToken: null,
        useServiceRole: true,
      });

      res.status(200).json({ success: true, items: rows || [] });
    } catch (err) {
      if (String(err.message || "").includes("tna_items")) {
        res.status(200).json({ success: true, items: [] });
        return;
      }
      next(err);
    }
  });

  router.get("/interns/:internId/blueprint", async (req, res, next) => {
    try {
      const internId = req.params.internId;
      await assertInternExists(internId);

      const rows = await restSelect({
        table: "intern_blueprints",
        select: "id,data,updated_at,created_at",
        filters: { intern_profile_id: `eq.${internId}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });
      const row = rows?.[0] || null;
      res.status(200).json({ success: true, blueprint: row ? { id: row.id, data: row.data || {}, updatedAt: row.updated_at } : null });
    } catch (err) {
      if (String(err.message || "").includes("intern_blueprints")) {
        res.status(200).json({ success: true, blueprint: null });
        return;
      }
      next(err);
    }
  });

  router.get("/interns/:internId/report-links", async (req, res, next) => {
    try {
      const internId = req.params.internId;
      await assertInternExists(internId);

      let rows;
      try {
        rows = await restSelect({
          table: "report_links",
          select:
            "id,tna_sheet_url,blueprint_doc_url,last_synced_from_google_at,last_synced_to_google_at,last_sync_error,updated_at,created_at",
          filters: { intern_profile_id: `eq.${internId}`, limit: 1 },
          accessToken: null,
          useServiceRole: true,
        });
      } catch (err) {
        const msg = String(err?.message || "");
        if (msg.includes("last_synced_from_google_at") || msg.includes("last_synced_to_google_at") || msg.includes("last_sync_error")) {
          rows = await restSelect({
            table: "report_links",
            select: "id,tna_sheet_url,blueprint_doc_url,updated_at,created_at",
            filters: { intern_profile_id: `eq.${internId}`, limit: 1 },
            accessToken: null,
            useServiceRole: true,
          });
        } else {
          throw err;
        }
      }
      const row = rows?.[0] || null;
      res.status(200).json({
        success: true,
        links: row
          ? { id: row.id, tnaSheetUrl: row.tna_sheet_url || "", blueprintDocUrl: row.blueprint_doc_url || "", updatedAt: row.updated_at }
          : { tnaSheetUrl: "", blueprintDocUrl: "" },
        meta: row
          ? {
              lastSyncedFromGoogleAt: row.last_synced_from_google_at || null,
              lastSyncedToGoogleAt: row.last_synced_to_google_at || null,
              lastSyncError: row.last_sync_error || null,
            }
          : { lastSyncedFromGoogleAt: null, lastSyncedToGoogleAt: null, lastSyncError: null },
      });
    } catch (err) {
      if (String(err.message || "").includes("report_links")) {
        res.status(200).json({
          success: true,
          links: { tnaSheetUrl: "", blueprintDocUrl: "" },
          meta: { lastSyncedFromGoogleAt: null, lastSyncedToGoogleAt: null, lastSyncError: null },
        });
        return;
      }
      next(err);
    }
  });

  router.get("/interns/:id", async (req, res, next) => {
    try {
      const rows = await restSelect({
        table: "profiles",
        select: "id,full_name,email,role,status,intern_id,pm_id,profile_data,profile_completed,created_at",
        filters: { id: `eq.${req.params.id}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });
      if (!rows?.[0]) throw httpError(404, "Intern not found", true);
      res.status(200).json({ success: true, intern: rows[0] });
    } catch (err) {
      next(err);
    }
  });

  router.post("/announcements", async (req, res, next) => {
    try {
      const { title, content, priority, audienceRoles, pinned } = req.body || {};
      if (!title || !content) throw httpError(400, "title and content are required", true);

      const roles = Array.isArray(audienceRoles)
        ? audienceRoles.filter((r) => ["intern", "pm"].includes(r))
        : [];
      if (!roles.length) throw httpError(400, "audienceRoles must include intern and/or pm", true);

      const inserted = await restInsert({
        table: "announcements",
        rows: {
          created_by_profile_id: req.auth.profile.id,
          title,
          content,
          priority: ["low", "medium", "high"].includes(priority) ? priority : "medium",
          audience_roles: roles,
          pinned: !!pinned,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        accessToken: null,
        useServiceRole: true,
      });

      const io = req.app.get("io");
      if (io) {
        io.to("role:hr").emit("itp:changed", { entity: "announcements", action: "insert" });
        roles.forEach((r) => io.to(`role:${r}`).emit("itp:changed", { entity: "announcements", action: "insert" }));
      }

      res.status(201).json({ success: true, announcement: inserted?.[0] || inserted });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/announcements/:id", async (req, res, next) => {
    try {
      const { title, content, priority, audienceRoles, pinned } = req.body || {};

      const patch = { updated_at: new Date().toISOString() };
      if (title !== undefined) patch.title = title;
      if (content !== undefined) patch.content = content;
      if (pinned !== undefined) patch.pinned = !!pinned;
      if (priority !== undefined) {
        patch.priority = ["low", "medium", "high"].includes(priority) ? priority : "medium";
      }
      if (audienceRoles !== undefined) {
        const roles = Array.isArray(audienceRoles)
          ? audienceRoles.filter((r) => ["intern", "pm"].includes(r))
          : [];
        if (!roles.length) throw httpError(400, "audienceRoles must include intern and/or pm", true);
        patch.audience_roles = roles;
      }

      await restUpdate({
        table: "announcements",
        patch,
        matchQuery: { id: `eq.${req.params.id}` },
        accessToken: null,
        useServiceRole: true,
      });

      const io = req.app.get("io");
      if (io) io.to("role:hr").emit("itp:changed", { entity: "announcements", action: "update" });
      if (io) io.to("role:intern").emit("itp:changed", { entity: "announcements", action: "update" });
      if (io) io.to("role:pm").emit("itp:changed", { entity: "announcements", action: "update" });

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/announcements/:id", async (req, res, next) => {
    try {
      await restDelete({
        table: "announcements",
        matchQuery: { id: `eq.${req.params.id}` },
        accessToken: null,
        useServiceRole: true,
      });

      const io = req.app.get("io");
      if (io) io.to("role:hr").emit("itp:changed", { entity: "announcements", action: "delete" });
      if (io) io.to("role:intern").emit("itp:changed", { entity: "announcements", action: "delete" });
      if (io) io.to("role:pm").emit("itp:changed", { entity: "announcements", action: "delete" });

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.get("/project-submissions", async (req, res, next) => {
    try {
      const rows = await restSelect({
        table: "project_submissions",
        select:
          "id,title,description,github_link,demo_link,status,review_comment,reviewed_at,submitted_at,intern_profile_id,pm_profile_id,intern:intern_profile_id(id,full_name,email,intern_id)",
        filters: { order: "submitted_at.desc" },
        accessToken: null,
        useServiceRole: true,
      });
      res.status(200).json({ success: true, submissions: rows || [] });
    } catch (err) {
      next(err);
    }
  });

  // ==================== PROJECT SUBMISSION REVIEW ====================
  router.patch("/project-submissions/:id/review", async (req, res, next) => {
    try {
      const { status, comment } = req.body || {};
      if (!["approved", "rejected"].includes(status)) {
        throw httpError(400, "status must be approved or rejected", true);
      }
      await restUpdate({
        table: "project_submissions",
        patch: {
          status,
          review_comment: comment || null,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        matchQuery: { id: `eq.${req.params.id}` },
        accessToken: null,
        useServiceRole: true,
      });
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.get("/interns/:id/daily-logs", async (req, res, next) => {
    try {
      await assertInternExists(req.params.id);
      const rows = await restSelect({
        table: "daily_logs",
        select: "id,log_date,hours_worked,tasks_completed,status,created_at",
        filters: { intern_profile_id: `eq.${req.params.id}`, order: "log_date.desc", limit: 20 },
        accessToken: null,
        useServiceRole: true,
      });
      res.status(200).json({ success: true, logs: rows || [] });
    } catch (err) {
      next(err);
    }
  });

  router.get("/interns/:id/reports", async (req, res, next) => {
    try {
      await assertInternExists(req.params.id);
      const rows = await restSelect({
        table: "reports",
        select: "id,report_type,status,submitted_at,created_at",
        filters: { intern_profile_id: `eq.${req.params.id}`, order: "submitted_at.desc", limit: 20 },
        accessToken: null,
        useServiceRole: true,
      });
      res.status(200).json({ success: true, reports: rows || [] });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createHrRouter };
