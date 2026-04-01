const express = require("express");
const { httpError } = require("../errors");
const { restSelect, restUpdate, restInsert, restDelete } = require("../services/supabaseRest");
const { uploadProfileFile } = require("../services/supabaseStorage");
const { createAuthMiddleware } = require("../middleware/auth");
const { computeLifecycleStatus } = require("../services/internLifecycle");
const { createNotifications, toClientNotification, isMissingTableError } = require("../services/notifications");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function hasAudience(announcement, role) {
  return Array.isArray(announcement?.audience_roles) && announcement.audience_roles.includes(role);
}

function sumNumeric(list, field) {
  return (list || []).reduce((sum, row) => sum + (Number(row?.[field]) || 0), 0);
}

async function loadPmReports(pmId) {
  const withRecipientRoles =
    "id,intern_profile_id,pm_profile_id,recipient_roles,report_type,week_number,month,period_start,period_end,total_hours,days_worked,summary,data,status,submitted_at,is_late,reviewed_by,reviewed_at,review_reason,review_score,intern:intern_profile_id(id,email,full_name,intern_id)";
  const withRecipientRolesNoScore =
    "id,intern_profile_id,pm_profile_id,recipient_roles,report_type,week_number,month,period_start,period_end,total_hours,days_worked,summary,data,status,submitted_at,is_late,reviewed_at,review_reason,intern:intern_profile_id(id,email,full_name,intern_id)";
  const noRecipientRoles =
    "id,intern_profile_id,pm_profile_id,report_type,week_number,month,period_start,period_end,total_hours,days_worked,summary,data,status,submitted_at,is_late,reviewed_by,reviewed_at,review_reason,review_score,intern:intern_profile_id(id,email,full_name,intern_id)";
  const noRecipientRolesNoScore =
    "id,intern_profile_id,pm_profile_id,report_type,week_number,month,period_start,period_end,total_hours,days_worked,summary,data,status,submitted_at,is_late,reviewed_at,review_reason,intern:intern_profile_id(id,email,full_name,intern_id)";

  const attempts = [
    { select: withRecipientRoles, filters: { pm_profile_id: `eq.${pmId}`, recipient_roles: "cs.{pm}", order: "submitted_at.desc" } },
    { select: withRecipientRolesNoScore, filters: { pm_profile_id: `eq.${pmId}`, recipient_roles: "cs.{pm}", order: "submitted_at.desc" } },
    { select: noRecipientRoles, filters: { pm_profile_id: `eq.${pmId}`, order: "submitted_at.desc" } },
    { select: noRecipientRolesNoScore, filters: { pm_profile_id: `eq.${pmId}`, order: "submitted_at.desc" } },
  ];

  // eslint-disable-next-line no-restricted-syntax
  for (const attempt of attempts) {
    try {
      // eslint-disable-next-line no-await-in-loop
      return await restSelect({
        table: "reports",
        select: attempt.select,
        filters: attempt.filters,
        accessToken: null,
        useServiceRole: true,
      });
    } catch (err) {
      const msg = String(err?.message || "").toLowerCase();
      const isSchemaError =
        msg.includes("recipient_roles") || msg.includes("review_score") || msg.includes("reviewed_by") || msg.includes("is_late");
      if (!isSchemaError) throw err;
    }
  }

  return [];
}

function mapReportRow(r) {
  const intern = r.intern || {};
  const periodLabel =
    r.period_start && r.period_end
      ? `${new Date(r.period_start).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(
          r.period_end
        ).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
      : null;
  const daysWorked = Number(r.days_worked) || 0;
  const totalHours = Number(r.total_hours) || 0;
  return {
    id: r.id,
    internId: intern.id || r.intern_profile_id,
    internName: intern.full_name || intern.email || "Intern",
    internEmail: intern.email || "",
    internInternId: intern.intern_id || null,
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
    isLate: !!r.is_late,
    reviewedAt: r.reviewed_at,
    reviewReason: r.review_reason || null,
    reviewScore: r.review_score ?? null,
    data: r.data || {},
  };
}

async function emitPmAnnouncementUpdate(io, pmId, action, announcementId = null) {
  if (!io || !pmId) return;
  const payload = { entity: "announcements", action };
  if (announcementId) payload.id = announcementId;

  io.to(`user:${pmId}`).emit("itp:changed", payload);

  const internRows = await restSelect({
    table: "profiles",
    select: "id",
    filters: { role: "eq.intern", pm_id: `eq.${pmId}` },
    accessToken: null,
    useServiceRole: true,
  }).catch(() => []);

  (internRows || []).forEach((row) => {
    if (row?.id) io.to(`user:${row.id}`).emit("itp:changed", payload);
  });
}

async function assertInternBelongsToPm({ pmId, internId }) {
  const rows = await restSelect({
    table: "profiles",
    select: "id,pm_id,role",
    filters: { id: `eq.${internId}`, limit: 1 },
    accessToken: null,
    useServiceRole: true,
  });
  const intern = rows?.[0];
  if (!intern || String(intern.role || "").toLowerCase() !== "intern") throw httpError(404, "Intern not found", true);
  if (intern.pm_id !== pmId) throw httpError(403, "Forbidden", true);
  return true;
}

function createPmRouter() {
  const router = express.Router();
  const auth = createAuthMiddleware();

  router.use(auth.requireRole("pm"));

  router.get("/interns", async (req, res, next) => {
    try {
      const pmId = req.auth.profile.id;

      let interns;
      try {
        interns = await restSelect({
          table: "profiles",
          select:
            "id,email,full_name,role,status,intern_id,pm_id,profile_completed,profile_data,created_at,updated_at",
          filters: { role: "eq.intern", pm_id: `eq.${pmId}` },
          accessToken: null,
          useServiceRole: true,
        });
      } catch (err) {
        if (String(err.message || "").includes("profile_data")) {
          interns = await restSelect({
            table: "profiles",
            select: "id,email,full_name,role,status,intern_id,pm_id,profile_completed,created_at,updated_at",
            filters: { role: "eq.intern", pm_id: `eq.${pmId}` },
            accessToken: null,
            useServiceRole: true,
          });
        } else {
          throw err;
        }
      }

      const internList = interns || [];
      const internIds = internList.map((i) => i.id).filter(Boolean);

      let approvedInterns = [];
      if (internIds.length) {
        approvedInterns = await restSelect({
          table: "approved_interns",
          select: "profile_id,start_date,end_date,department,mentor,stipend,status,override_reason,override_at",
          filters: { profile_id: `in.(${internIds.join(",")})` },
          accessToken: null,
          useServiceRole: true,
        }).catch(() => []);
      }
      const approvedByProfileId = new Map((approvedInterns || []).map((row) => [row.profile_id, row]));

      let logs = [];
      if (internIds.length) {
        logs = await restSelect({
          table: "daily_logs",
          select: "intern_profile_id,hours_worked,tasks_completed,status,log_date",
          filters: { intern_profile_id: `in.(${internIds.join(",")})` },
          accessToken: null,
          useServiceRole: true,
        }).catch(() => []);
      }

      const reports = (await loadPmReports(pmId).catch(() => [])) || [];

      const logByIntern = new Map();
      (logs || []).forEach((log) => {
        const key = log.intern_profile_id;
        if (!key) return;
        const item = logByIntern.get(key) || { totalHours: 0, tasksCompleted: 0, lastLogDate: null };
        const status = String(log.status || "").toLowerCase();
        if (status === "submitted" || status === "approved") {
          item.totalHours += Number(log.hours_worked) || 0;
          item.tasksCompleted += Number(log.tasks_completed) || 0;
        }
        if (log.log_date && (!item.lastLogDate || log.log_date > item.lastLogDate)) item.lastLogDate = log.log_date;
        logByIntern.set(key, item);
      });

      const reportByIntern = new Map();
      (reports || []).forEach((report) => {
        const key = report.intern_profile_id;
        if (!key) return;
        const item = reportByIntern.get(key) || { total: 0, pending: 0, approved: 0, rejected: 0, lastSubmittedAt: null };
        const status = String(report.status || "").toLowerCase();
        item.total += 1;
        if (status === "pending") item.pending += 1;
        if (status === "approved") item.approved += 1;
        if (status === "rejected") item.rejected += 1;
        if (report.submitted_at && (!item.lastSubmittedAt || report.submitted_at > item.lastSubmittedAt)) {
          item.lastSubmittedAt = report.submitted_at;
        }
        reportByIntern.set(key, item);
      });

      const enriched = internList.map((intern) => {
        const logStats = logByIntern.get(intern.id) || { totalHours: 0, tasksCompleted: 0, lastLogDate: null };
        const reportStats = reportByIntern.get(intern.id) || { total: 0, pending: 0, approved: 0, rejected: 0, lastSubmittedAt: null };
        const progressScore = Math.min(100, Math.round(reportStats.approved * 20 + logStats.tasksCompleted * 1.5));
        const approvedIntern = approvedByProfileId.get(intern.id) || null;
        const profileData = intern.profile_data && typeof intern.profile_data === "object" ? intern.profile_data : {};
        const lifecycleStatus = computeLifecycleStatus(approvedIntern, profileData);
        return {
          ...intern,
          approved_intern: approvedIntern,
          start_date: approvedIntern?.start_date || null,
          end_date: approvedIntern?.end_date || null,
          department: approvedIntern?.department || null,
          mentor: approvedIntern?.mentor || null,
          stipend: approvedIntern?.stipend ?? null,
          approved_intern_status: approvedIntern?.status || null,
          override_reason: approvedIntern?.override_reason || null,
          override_at: approvedIntern?.override_at || null,
          lifecycle_status: lifecycleStatus,
          status: lifecycleStatus,
          totalHours: Number(logStats.totalHours.toFixed(2)),
          tasksCompleted: logStats.tasksCompleted,
          reportsTotal: reportStats.total,
          pendingReports: reportStats.pending,
          approvedReports: reportStats.approved,
          rejectedReports: reportStats.rejected,
          lastLogDate: logStats.lastLogDate,
          lastReportSubmittedAt: reportStats.lastSubmittedAt,
          performance: progressScore,
        };
      });

      res.status(200).json({ success: true, interns: enriched });
    } catch (err) {
      next(err);
    }
  });

  router.get("/interns/:id", async (req, res, next) => {
    try {
      if (!UUID_REGEX.test(req.params.id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      const pmId = req.auth.profile.id;
      const rows = await restSelect({
        table: "profiles",
        select: "id,full_name,email,role,status,intern_id,pm_id,profile_data,profile_completed,created_at",
        filters: { id: `eq.${req.params.id}`, pm_id: `eq.${pmId}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });
      if (!rows?.[0]) throw httpError(404, "Intern not found", true);
      const intern = rows[0];
      const approvedRows = await restSelect({
        table: "approved_interns",
        select: "id,intern_id,application_id,profile_id,start_date,end_date,department,mentor,stipend,status,approved_by,approved_at,updated_at,override_reason,override_at",
        filters: { profile_id: `eq.${req.params.id}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      }).catch(() => []);
      const approvedIntern = approvedRows?.[0] || null;
      if (approvedIntern) {
        intern.approved_intern = approvedIntern;
        intern.start_date = approvedIntern.start_date || null;
        intern.end_date = approvedIntern.end_date || null;
        intern.department = approvedIntern.department || null;
        intern.mentor = approvedIntern.mentor || null;
        intern.stipend = approvedIntern.stipend ?? null;
        intern.approved_intern_status = approvedIntern.status || null;
      }
      res.status(200).json({ success: true, intern });
    } catch (err) {
      next(err);
    }
  });

  router.get("/me", async (req, res) => {
    const profile = req.auth.profile;
    res.status(200).json({
      success: true,
      pm: {
        id: profile.id,
        email: profile.email,
        fullName: profile.full_name,
        pmCode: profile.pm_code || null,
        status: profile.status,
        profileData: profile.profile_data || {},
      },
    });
  });

  router.patch("/me", async (req, res, next) => {
    try {
      const pmId = req.auth.profile.id;
      const { profilePicture } = req.body || {};
      if (!profilePicture) throw httpError(400, "profilePicture is required", true);

      const url = await uploadProfileFile({
        profileId: pmId,
        field: "profile-picture",
        filePayload: profilePicture,
      });
      if (!url) throw httpError(500, "Failed to upload profile picture", true);

      let existingProfileData = {};
      try {
        const rows = await restSelect({
          table: "profiles",
          select: "profile_data",
          filters: { id: `eq.${pmId}`, limit: 1 },
          accessToken: null,
          useServiceRole: true,
        });
        const raw = rows?.[0]?.profile_data;
        if (raw && typeof raw === "object") existingProfileData = raw;
      } catch {
        existingProfileData = {};
      }

      const patch = {
        profile_data: {
          ...existingProfileData,
          profilePictureUrl: url,
          profilePictureMeta: {
            filename: profilePicture.name || null,
            type: profilePicture.type || null,
            uploadedAt: new Date().toISOString(),
          },
        },
        updated_at: new Date().toISOString(),
      };

      let updated;
      try {
        updated = await restUpdate({
          table: "profiles",
          patch,
          matchQuery: { id: `eq.${pmId}` },
          accessToken: null,
          useServiceRole: true,
        });
      } catch (err) {
        if (String(err.message || "").includes("profile_data")) {
          const { profile_data, ...fallbackPatch } = patch;
          updated = await restUpdate({
            table: "profiles",
            patch: fallbackPatch,
            matchQuery: { id: `eq.${pmId}` },
            accessToken: null,
            useServiceRole: true,
          });
        } else {
          throw err;
        }
      }

      const io = req.app.get("io");
      if (io) {
        io.emit("itp:changed", { type: "profile_updated", profileId: pmId });
      }

      res.status(200).json({ success: true, profile: updated?.[0] || updated });
    } catch (err) {
      next(err);
    }
  });

  router.post("/announcements", async (req, res, next) => {
    try {
      const pmId = req.auth.profile.id;
      const { title, content, priority, audienceRoles, pinned, department } = req.body || {};
      if (!title || !content) throw httpError(400, "title and content are required", true);

      const roles = Array.isArray(audienceRoles)
        ? audienceRoles.map((r) => normalizeRole(r)).filter((r) => ["intern", "pm"].includes(r))
        : ["intern"];
      const finalRoles = roles.includes("intern") ? roles : ["intern", ...roles];

      const rawDepartment = String(department || "").trim();
      const normalizedDepartment = rawDepartment && !["all", "*", "any"].includes(rawDepartment.toLowerCase()) ? rawDepartment : null;

      let inserted;
      const baseRow = {
        created_by_profile_id: pmId,
        title: String(title).trim(),
        content: String(content).trim(),
        priority: ["low", "medium", "high"].includes(priority) ? priority : "medium",
        audience_roles: Array.from(new Set(finalRoles)),
        pinned: !!pinned,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      try {
        inserted = await restInsert({
          table: "announcements",
          rows: { ...baseRow, department: normalizedDepartment },
          accessToken: null,
          useServiceRole: true,
        });
      } catch (err) {
        const msg = String(err?.message || "").toLowerCase();
        if (!msg.includes("department")) throw err;
        inserted = await restInsert({
          table: "announcements",
          rows: baseRow,
          accessToken: null,
          useServiceRole: true,
        });
      }

      const announcement = inserted?.[0] || inserted || null;
      const io = req.app.get("io");
      await emitPmAnnouncementUpdate(io, pmId, "insert", announcement?.id || null);

      res.status(201).json({ success: true, announcement });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/announcements/:id", async (req, res, next) => {
    try {
      if (!UUID_REGEX.test(req.params.id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      const pmId = req.auth.profile.id;
      const announcementId = req.params.id;

      const existing = await restSelect({
        table: "announcements",
        select: "id,created_by_profile_id",
        filters: { id: `eq.${announcementId}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });
      const row = existing?.[0] || null;
      if (!row) throw httpError(404, "Announcement not found", true);
      if (String(row.created_by_profile_id) !== String(pmId)) throw httpError(403, "Forbidden", true);

      const { title, content, priority, audienceRoles, pinned, department } = req.body || {};
      const patch = { updated_at: new Date().toISOString() };
      if (title !== undefined) patch.title = String(title || "").trim();
      if (content !== undefined) patch.content = String(content || "").trim();
      if (priority !== undefined) patch.priority = ["low", "medium", "high"].includes(priority) ? priority : "medium";
      if (pinned !== undefined) patch.pinned = !!pinned;
      if (department !== undefined) {
        const rawDepartment = String(department || "").trim();
        patch.department = rawDepartment && !["all", "*", "any"].includes(rawDepartment.toLowerCase()) ? rawDepartment : null;
      }
      if (audienceRoles !== undefined) {
        const roles = Array.isArray(audienceRoles)
          ? audienceRoles.map((r) => normalizeRole(r)).filter((r) => ["intern", "pm"].includes(r))
          : ["intern"];
        patch.audience_roles = Array.from(new Set(roles.includes("intern") ? roles : ["intern", ...roles]));
      }

      try {
        await restUpdate({
          table: "announcements",
          patch,
          matchQuery: { id: `eq.${announcementId}` },
          accessToken: null,
          useServiceRole: true,
        });
      } catch (err) {
        const msg = String(err?.message || "").toLowerCase();
        if (!msg.includes("department")) throw err;
        // Back-compat if department column hasn't been migrated yet.
        // eslint-disable-next-line no-unused-vars
        const { department: _department, ...fallbackPatch } = patch;
        await restUpdate({
          table: "announcements",
          patch: fallbackPatch,
          matchQuery: { id: `eq.${announcementId}` },
          accessToken: null,
          useServiceRole: true,
        });
      }

      const io = req.app.get("io");
      await emitPmAnnouncementUpdate(io, pmId, "update", announcementId);

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/announcements/:id", async (req, res, next) => {
    try {
      if (!UUID_REGEX.test(req.params.id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      const pmId = req.auth.profile.id;
      const announcementId = req.params.id;

      const existing = await restSelect({
        table: "announcements",
        select: "id,created_by_profile_id",
        filters: { id: `eq.${announcementId}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });
      const row = existing?.[0] || null;
      if (!row) throw httpError(404, "Announcement not found", true);
      if (String(row.created_by_profile_id) !== String(pmId)) throw httpError(403, "Forbidden", true);

      await restDelete({
        table: "announcements",
        matchQuery: { id: `eq.${announcementId}` },
        accessToken: null,
        useServiceRole: true,
      });

      const io = req.app.get("io");
      await emitPmAnnouncementUpdate(io, pmId, "delete", announcementId);

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.get("/interns/:internId/tna", async (req, res, next) => {
    try {
      const pmId = req.auth.profile.id;
      const internId = req.params.internId;
      await assertInternBelongsToPm({ pmId, internId });

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
      const pmId = req.auth.profile.id;
      const internId = req.params.internId;
      await assertInternBelongsToPm({ pmId, internId });

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
      const pmId = req.auth.profile.id;
      const internId = req.params.internId;
      await assertInternBelongsToPm({ pmId, internId });

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

  router.get("/reports", async (req, res, next) => {
    try {
      const pmId = req.auth.profile.id;
      const rows = await loadPmReports(pmId);
      const mapped = (rows || []).map(mapReportRow);

      res.status(200).json({ success: true, reports: mapped });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/reports/:id/review", async (req, res, next) => {
    try {
      if (!UUID_REGEX.test(req.params.id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      const pmId = req.auth.profile.id;
      const { status, reason, remarks, reviewReason, score, reviewScore, rating } = req.body || {};
      const finalRemarks = reason ?? remarks ?? reviewReason ?? null;
      const rawScore = score ?? reviewScore ?? rating ?? null;
      const normalizedScore = rawScore === null || rawScore === undefined || rawScore === "" ? null : Number(rawScore);
      if (normalizedScore !== null && (!Number.isFinite(normalizedScore) || normalizedScore < 0 || normalizedScore > 100)) {
        throw httpError(400, "score must be a number between 0 and 100", true);
      }
      if (!status || !["approved", "rejected"].includes(status)) {
        throw httpError(400, "status must be approved or rejected", true);
      }

      let updated;
      const patch = {
        status,
        reviewed_by: pmId,
        reviewed_at: new Date().toISOString(),
        review_reason: finalRemarks || null,
        review_score: normalizedScore === null ? null : Math.round(normalizedScore),
        updated_at: new Date().toISOString(),
      };
      try {
        updated = await restUpdate({
          table: "reports",
          patch,
          matchQuery: { id: `eq.${req.params.id}`, pm_profile_id: `eq.${pmId}` },
          accessToken: null,
          useServiceRole: true,
        });
      } catch (err) {
        if (!String(err?.message || "").toLowerCase().includes("review_score")) throw err;
        // Back-compat if review_score column hasn't been migrated yet.
        // eslint-disable-next-line no-unused-vars
        const { review_score, ...fallbackPatch } = patch;
        updated = await restUpdate({
          table: "reports",
          patch: fallbackPatch,
          matchQuery: { id: `eq.${req.params.id}`, pm_profile_id: `eq.${pmId}` },
          accessToken: null,
          useServiceRole: true,
        });
      }

      const reportRow = Array.isArray(updated) ? updated[0] : updated;
      const internId = reportRow?.intern_profile_id;
      const io = req.app.get("io");
      if (io) {
        io.to(`user:${pmId}`).emit("itp:changed", { entity: "reports", action: "update" });
        if (internId) io.to(`user:${internId}`).emit("itp:changed", { entity: "reports", action: "update" });
        io.to("role:admin").emit("itp:changed", { entity: "reports", action: "update" });
      }

      if (io && internId) {
        try {
          const title = status === "approved" ? "Report approved" : "Report needs revision";
          const message =
            status === "approved"
              ? "Your report has been approved."
              : finalRemarks
                ? `Remarks: ${String(finalRemarks).slice(0, 180)}`
                : "Your report was rejected. Please review remarks and resubmit.";

          const insertedNotifs = await createNotifications({
            rows: {
              recipient_profile_id: internId,
              title,
              message,
              type: status === "approved" ? "success" : "warning",
              category: "report",
              metadata: { reportId: reportRow?.id || null, status, pmId },
            },
          });
          const row = Array.isArray(insertedNotifs) ? insertedNotifs[0] : insertedNotifs;
          if (row?.recipient_profile_id) {
            io.to(`user:${row.recipient_profile_id}`).emit("itp:notification", { notification: toClientNotification(row) });
          }
        } catch (err) {
          if (!isMissingTableError(err, "notifications")) console.error("Failed to notify report review:", err);
        }
      }

      res.status(200).json({ success: true, report: reportRow ? mapReportRow(reportRow) : null });
    } catch (err) {
      next(err);
    }
  });

  router.get("/stats", async (req, res, next) => {
    try {
      const pmId = req.auth.profile.id;

      const interns = await restSelect({
        table: "profiles",
        select: "id,status,full_name,email,intern_id,profile_data",
        filters: { role: "eq.intern", pm_id: `eq.${pmId}` },
        accessToken: null,
        useServiceRole: true,
      });
      const internIds = (interns || []).map((i) => i.id);
      const approvedRows = internIds.length
        ? await restSelect({
            table: "approved_interns",
            select: "profile_id,start_date,end_date,status",
            filters: { profile_id: `in.(${internIds.join(",")})` },
            accessToken: null,
            useServiceRole: true,
          }).catch(() => [])
        : [];
      const approvedByProfile = new Map((approvedRows || []).map((row) => [row.profile_id, row]));
      const activeInterns = (interns || []).filter((i) => {
        const approved = approvedByProfile.get(i.id) || null;
        const profileData = i.profile_data && typeof i.profile_data === "object" ? i.profile_data : {};
        const lifecycleStatus = computeLifecycleStatus(approved, profileData);
        return lifecycleStatus === "active";
      }).length;

      let totalHours = 0;
      let totalTasks = 0;
      if (internIds.length) {
        const logs = await restSelect({
          table: "daily_logs",
          select: "hours_worked,tasks_completed,status,intern_profile_id",
          filters: { intern_profile_id: `in.(${internIds.join(",")})` },
          accessToken: null,
          useServiceRole: true,
        });
        const approved = (logs || []).filter((l) => (l.status || "") === "approved" || (l.status || "") === "submitted");
        totalHours = approved.reduce((sum, l) => sum + (Number(l.hours_worked) || 0), 0);
        totalTasks = approved.reduce((sum, l) => sum + (Number(l.tasks_completed) || 0), 0);
      }

      const reportRows = await loadPmReports(pmId);
      const pendingReports = (reportRows || []).filter((r) => String(r.status || "").toLowerCase() === "pending").length;
      const approvedReports = (reportRows || []).filter((r) => String(r.status || "").toLowerCase() === "approved").length;
      const rejectedReports = (reportRows || []).filter((r) => String(r.status || "").toLowerCase() === "rejected").length;

      const byIntern = new Map();
      (interns || []).forEach((intern) => {
        byIntern.set(intern.id, {
          internId: intern.id,
          internName: intern.full_name || intern.email || "Intern",
          email: intern.email || "",
          code: intern.intern_id || null,
          status: intern.status || "active",
          totalHours: 0,
          totalTasks: 0,
          reportsTotal: 0,
          pendingReports: 0,
          approvedReports: 0,
          rejectedReports: 0,
          lastReportAt: null,
        });
      });

      if (internIds.length) {
        const logs = await restSelect({
          table: "daily_logs",
          select: "intern_profile_id,hours_worked,tasks_completed,status",
          filters: { intern_profile_id: `in.(${internIds.join(",")})` },
          accessToken: null,
          useServiceRole: true,
        }).catch(() => []);

        (logs || []).forEach((log) => {
          const target = byIntern.get(log.intern_profile_id);
          if (!target) return;
          const status = String(log.status || "").toLowerCase();
          if (status === "approved" || status === "submitted") {
            target.totalHours += Number(log.hours_worked) || 0;
            target.totalTasks += Number(log.tasks_completed) || 0;
          }
        });
      }

      (reportRows || []).forEach((row) => {
        const target = byIntern.get(row.intern_profile_id);
        if (!target) return;
        const status = String(row.status || "").toLowerCase();
        target.reportsTotal += 1;
        if (status === "pending") target.pendingReports += 1;
        if (status === "approved") target.approvedReports += 1;
        if (status === "rejected") target.rejectedReports += 1;
        if (row.submitted_at && (!target.lastReportAt || row.submitted_at > target.lastReportAt)) target.lastReportAt = row.submitted_at;
      });

      const internsSummary = Array.from(byIntern.values()).map((row) => ({
        ...row,
        totalHours: Number(row.totalHours.toFixed(2)),
        performance: Math.min(100, Math.round(row.approvedReports * 20 + row.totalTasks * 1.5)),
      }));

      res.status(200).json({
        success: true,
        stats: {
          activeInterns,
          totalHours: Number(totalHours.toFixed(2)),
          totalTasks,
          pendingReports,
          approvedReports,
          rejectedReports,
          totalReports: (reportRows || []).length,
          interns: internsSummary,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/project-submissions", async (req, res, next) => {
    try {
      const pmId = req.auth.profile.id;
      const rows = await restSelect({
        table: "project_submissions",
        select:
          "id,title,description,github_link,demo_link,status,submitted_at,intern_profile_id,intern:intern_profile_id(id,full_name,email,intern_id,profile_data)",
        filters: { pm_profile_id: `eq.${pmId}`, order: "submitted_at.desc" },
        accessToken: null,
        useServiceRole: true,
      });
      res.status(200).json({ success: true, submissions: rows || [] });
    } catch (err) {
      next(err);
    }
  });


  router.patch("/project-submissions/:id/review", async (req, res, next) => {
    try {
      if (!UUID_REGEX.test(req.params.id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
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

  return router;
}

module.exports = { createPmRouter };
