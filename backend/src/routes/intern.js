const express = require("express");
const { httpError } = require("../errors");
const { restSelect, restUpdate, restInsert, restDelete } = require("../services/supabaseRest");
const { uploadProfileFile } = require("../services/supabaseStorage");
const { createAuthMiddleware } = require("../middleware/auth");
const { syncTnaFromPublicGoogle, syncBlueprintFromPublicGoogle } = require("../services/googlePublicSync");
const { createNotifications, listProfilesByRole, toClientNotification, isMissingTableError } = require("../services/notifications");
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isIsoDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());
}

function isGoogleSyncEnabled() {
  return String(process.env.GOOGLE_SYNC_ENABLED || "").toLowerCase() === "true";
}

function dateIsoToUtcMs(isoDate) {
  if (!isIsoDateString(isoDate)) return null;
  const [yyyy, mm, dd] = String(isoDate).split("-").map((p) => Number(p));
  if (!yyyy || !mm || !dd) return null;
  return Date.UTC(yyyy, mm - 1, dd);
}

function utcMsToIsoDate(ms) {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function createInternRouter() {
  const router = express.Router();
  const auth = createAuthMiddleware();
  const pendingGoogleSyncTimers = new Map();

  router.use(auth.requireRole("intern"));

  function loadGoogleSync() {
    try {
      // Lazy-load so the backend can still run without the optional dependency.
      // `backend/package.json` should include `googleapis` when enabling sync-to-Google.
      // eslint-disable-next-line global-require
      return require("../services/googleSync");
    } catch (err) {
      const e = new Error(
        "Google sync dependency missing. Install `googleapis` in backend and restart the server to enable sync to Google Sheets/Docs."
      );
      e.status = 400;
      e.expose = true;
      e.cause = err;
      throw e;
    }
  }

  function scheduleGoogleSync(internId, pmId, io, kind) {
    if (!isGoogleSyncEnabled()) return;
    if (!internId) return;

    const key = `${internId}:${kind}`;
    const existing = pendingGoogleSyncTimers.get(key);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(async () => {
      pendingGoogleSyncTimers.delete(key);
      try {
        const { syncTnaToGoogle, syncBlueprintToGoogle } = loadGoogleSync();
        if (kind === "tna") {
          const links = await getReportLinksRow(internId);
          const tnaSheetUrl = links?.tna_sheet_url || "";
          if (!String(tnaSheetUrl || "").trim()) return;

          const rows = await restSelect({
            table: "tna_items",
            select:
              "week_number,task,planned_date,plan_of_action,executed_date,status,reason,deliverable,sort_order,created_at,updated_at",
            filters: { intern_profile_id: `eq.${internId}`, order: "sort_order.asc,created_at.asc" },
            accessToken: null,
            useServiceRole: true,
          });
          await syncTnaToGoogle({ tnaSheetUrl, items: rows || [] });
        } else if (kind === "blueprint") {
          const links = await getReportLinksRow(internId);
          const blueprintDocUrl = links?.blueprint_doc_url || "";
          if (!String(blueprintDocUrl || "").trim()) return;

          const bpRows = await restSelect({
            table: "intern_blueprints",
            select: "data",
            filters: { intern_profile_id: `eq.${internId}`, limit: 1 },
            accessToken: null,
            useServiceRole: true,
          });
          const data = bpRows?.[0]?.data && typeof bpRows[0].data === "object" ? bpRows[0].data : {};
          await syncBlueprintToGoogle({ blueprintDocUrl, data });
        } else {
          return;
        }

        const now = new Date().toISOString();
        await updateReportLinksMeta(internId, { last_synced_to_google_at: now, last_sync_error: null });
        if (io) {
          io.to(`user:${internId}`).emit("itp:changed", { entity: "report_links", action: "sync_to_google", internId });
          if (pmId) io.to(`user:${pmId}`).emit("itp:changed", { entity: "report_links", action: "sync_to_google", internId });
          io.to("role:hr").emit("itp:changed", { entity: "report_links", action: "sync_to_google", internId });
        }
      } catch (err) {
        try {
          await updateReportLinksMeta(internId, { last_sync_error: String(err?.message || "Sync failed") });
          if (io) {
            io.to(`user:${internId}`).emit("itp:changed", { entity: "report_links", action: "sync_to_google_failed", internId });
            if (pmId) io.to(`user:${pmId}`).emit("itp:changed", { entity: "report_links", action: "sync_to_google_failed", internId });
            io.to("role:hr").emit("itp:changed", { entity: "report_links", action: "sync_to_google_failed", internId });
          }
        } catch {
          // ignore
        }
      }
    }, 1500);

    pendingGoogleSyncTimers.set(key, timer);
  }

  router.get("/me", async (req, res, next) => {
    try {
      const internId = req.auth.profile.id;

      let rows;
      try {
        rows = await restSelect({
          table: "profiles",
          select:
            "id,email,full_name,role,status,intern_id,pm_id,profile_completed,profile_data,pm:pm_id(id,email,full_name,pm_code)",
          filters: { id: `eq.${internId}`, limit: 1 },
          accessToken: null,
          useServiceRole: true,
        });
      } catch (err) {
        if (String(err.message || "").includes("profile_data")) {
          rows = await restSelect({
            table: "profiles",
            select:
              "id,email,full_name,role,status,intern_id,pm_id,profile_completed,pm:pm_id(id,email,full_name,pm_code)",
            filters: { id: `eq.${internId}`, limit: 1 },
            accessToken: null,
            useServiceRole: true,
          });
        } else {
          throw err;
        }
      }

      const profile = rows?.[0];
      if (!profile) throw httpError(404, "Intern profile not found", true);

      res.status(200).json({ success: true, profile });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/me", async (req, res, next) => {
    try {
      const internId = req.auth.profile.id;
      const { profileData, profileCompleted, fileUploads } = req.body || {};

      if (fileUploads && Object.values(fileUploads).some(Boolean) && profileData === undefined) {
        throw httpError(400, "profileData is required when uploading files", true);
      }

      let prevCompleted = null;
      if (profileCompleted !== undefined) {
        try {
          const prevRows = await restSelect({
            table: "profiles",
            select: "profile_completed",
            filters: { id: `eq.${internId}`, limit: 1 },
            accessToken: null,
            useServiceRole: true,
          });
          prevCompleted = prevRows?.[0]?.profile_completed ?? null;
        } catch {
          prevCompleted = null;
        }
      }

      const patch = {
        updated_at: new Date().toISOString(),
      };

      const cleanedProfileData = profileData !== undefined ? { ...profileData } : {};
      delete cleanedProfileData.profilePicture;
      delete cleanedProfileData.resume;

      let hasProfileDataPatch = profileData !== undefined;

      if (fileUploads?.profilePicture) {
        const url = await uploadProfileFile({
          profileId: internId,
          field: "profile-picture",
          filePayload: fileUploads.profilePicture,
        });
        if (url) {
          cleanedProfileData.profilePictureUrl = url;
          cleanedProfileData.profilePictureMeta = {
            filename: fileUploads.profilePicture.name || null,
            type: fileUploads.profilePicture.type || null,
            uploadedAt: new Date().toISOString(),
          };
          hasProfileDataPatch = true;
        }
      }

      if (fileUploads?.resume) {
        const url = await uploadProfileFile({
          profileId: internId,
          field: "resume",
          filePayload: fileUploads.resume,
        });
        if (url) {
          cleanedProfileData.resumeUrl = url;
          cleanedProfileData.resumeMeta = {
            filename: fileUploads.resume.name || null,
            type: fileUploads.resume.type || null,
            uploadedAt: new Date().toISOString(),
          };
          hasProfileDataPatch = true;
        }
      }

      if (hasProfileDataPatch) patch.profile_data = cleanedProfileData;
      if (profileCompleted !== undefined) patch.profile_completed = !!profileCompleted;

      let updated;
      try {
        updated = await restUpdate({
          table: "profiles",
          patch,
          matchQuery: { id: `eq.${internId}` },
          accessToken: null,
          useServiceRole: true,
        });
      } catch (err) {
        if (patch.profile_data !== undefined && String(err.message || "").includes("profile_data")) {
          const { profile_data, ...fallbackPatch } = patch;
          updated = await restUpdate({
            table: "profiles",
            patch: fallbackPatch,
            matchQuery: { id: `eq.${internId}` },
            accessToken: null,
            useServiceRole: true,
          });
        } else {
          throw err;
        }
      }

      const io = req.app.get("io");
      const pmId = req.auth.profile.pm_id;
      if (io) {
        io.to(`user:${internId}`).emit("itp:changed", { entity: "profiles", action: "update" });
        if (pmId) io.to(`user:${pmId}`).emit("itp:changed", { entity: "profiles", action: "update", internId });
        io.to("role:hr").emit("itp:changed", { entity: "profiles", action: "update", internId });
      }

      // Notify PM + HR when intern completes profile.
      if (io && profileCompleted === true && prevCompleted === false) {
        try {
          const hrIds = await listProfilesByRole("hr");
          const recipients = new Set([...(pmId ? [pmId] : []), ...(hrIds || [])].filter(Boolean));
          const internLabel = req.auth.profile.full_name || req.auth.profile.email || "An intern";
          const inserted = await createNotifications({
            rows: Array.from(recipients).map((rid) => ({
              recipient_profile_id: rid,
              title: "Profile completed",
              message: `${internLabel} completed their profile.`,
              type: "success",
              category: "profile",
              metadata: { internId },
            })),
          });
          const rows = Array.isArray(inserted) ? inserted : [inserted];
          rows.filter(Boolean).forEach((row) => {
            io.to(`user:${row.recipient_profile_id}`).emit("itp:notification", { notification: toClientNotification(row) });
          });
        } catch (err) {
          if (!isMissingTableError(err, "notifications")) console.error("Failed to notify profile completion:", err);
        }
      }

      res.status(200).json({ success: true, profile: updated?.[0] || updated });
    } catch (err) {
      next(err);
    }
  });

  router.get("/daily-logs", async (req, res, next) => {
    try {
      const internId = req.auth.profile.id;
      const rows = await restSelect({
        table: "daily_logs",
        select: "id,log_date,hours_worked,tasks,learnings,blockers,tasks_completed,status,reviewed_at,review_reason,created_at,updated_at",
        filters: { intern_profile_id: `eq.${internId}`, order: "log_date.desc" },
        accessToken: null,
        useServiceRole: true,
      });
      res.status(200).json({ success: true, logs: rows || [] });
    } catch (err) {
      next(err);
    }
  });

  router.post("/daily-logs", async (req, res, next) => {
    try {
      const internId = req.auth.profile.id;
      const { date, logDate, hoursWorked, tasks, learnings, blockers } = req.body || {};
      const actualDate = logDate || date;
      if (!actualDate) throw httpError(400, "logDate is required", true);

      const normalizedDate = String(actualDate || "").trim();
      if (!isIsoDateString(normalizedDate)) throw httpError(400, "logDate must be in YYYY-MM-DD format", true);
      const today = todayIsoDate();
      if (normalizedDate > today) throw httpError(400, "logDate cannot be in the future", true);

      const todayMs = dateIsoToUtcMs(today);
      const logMs = dateIsoToUtcMs(normalizedDate);
      if (todayMs == null || logMs == null) throw httpError(400, "Invalid logDate", true);
      const diffDays = Math.floor((todayMs - logMs) / 86400000);
      if (diffDays > 7) {
        const oldest = utcMsToIsoDate(todayMs - 7 * 86400000) || today;
        throw httpError(403, `Daily logs are editable for 7 days only. Oldest allowed date is ${oldest}.`, true);
      }
      if (!tasks || !learnings) throw httpError(400, "tasks and learnings are required", true);

      const parsedHours = Number.isFinite(Number(hoursWorked)) ? Number(hoursWorked) : 0;
      const patch = {
        hours_worked: parsedHours,
        tasks: String(tasks || ""),
        learnings: String(learnings || ""),
        blockers: String(blockers || ""),
        tasks_completed: 1,
        status: "submitted",
        updated_at: new Date().toISOString(),
      };

      // Upsert-by-date (prevents duplicates during imports).
      const existing = await restSelect({
        table: "daily_logs",
        select: "id",
        filters: { intern_profile_id: `eq.${internId}`, log_date: `eq.${normalizedDate}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });

      let saved;
      if (existing?.[0]?.id) {
        try {
          saved = await restUpdate({
            table: "daily_logs",
            patch,
            matchQuery: { id: `eq.${existing[0].id}` },
            accessToken: null,
            useServiceRole: true,
          });
        } catch (err) {
          // Back-compat: if DB still has integer column, round fractional hours.
          if (!Number.isInteger(parsedHours) && /integer/i.test(String(err.message || ""))) {
            const rounded = Math.round(parsedHours);
            saved = await restUpdate({
              table: "daily_logs",
              patch: { ...patch, hours_worked: rounded },
              matchQuery: { id: `eq.${existing[0].id}` },
              accessToken: null,
              useServiceRole: true,
            });
          } else {
            throw err;
          }
        }
      } else {
        const row = {
          intern_profile_id: internId,
          log_date: normalizedDate,
          ...patch,
          created_at: new Date().toISOString(),
        };

        try {
          saved = await restInsert({
            table: "daily_logs",
            rows: row,
            accessToken: null,
            useServiceRole: true,
          });
        } catch (err) {
          if (!Number.isInteger(parsedHours) && /integer/i.test(String(err.message || ""))) {
            const rounded = Math.round(parsedHours);
            saved = await restInsert({
              table: "daily_logs",
              rows: { ...row, hours_worked: rounded },
              accessToken: null,
              useServiceRole: true,
            });
          } else {
            throw err;
          }
        }
      }

      const io = req.app.get("io");
      const pmId = req.auth.profile.pm_id;
      if (io) {
        io.to(`user:${internId}`).emit("itp:changed", { entity: "daily_logs", action: "upsert" });
        if (pmId) io.to(`user:${pmId}`).emit("itp:changed", { entity: "daily_logs", action: "upsert" });
      }

      if (io) {
        try {
          const hrIds = await listProfilesByRole("hr");
          const recipients = new Set([...(pmId ? [pmId] : []), ...(hrIds || [])].filter(Boolean));
          const internLabel = req.auth.profile.full_name || req.auth.profile.email || "An intern";
          const inserted = await createNotifications({
            rows: Array.from(recipients).map((rid) => ({
              recipient_profile_id: rid,
              title: "Daily log submitted",
              message: `${internLabel} submitted a daily log for ${normalizedDate}.`,
              type: "info",
              category: "daily_log",
              metadata: { internId, logDate: normalizedDate },
            })),
          });
          const rows = Array.isArray(inserted) ? inserted : [inserted];
          rows.filter(Boolean).forEach((row) => {
            io.to(`user:${row.recipient_profile_id}`).emit("itp:notification", { notification: toClientNotification(row) });
          });
        } catch (err) {
          if (!isMissingTableError(err, "notifications")) console.error("Failed to notify daily log:", err);
        }
      }

      res.status(existing?.[0]?.id ? 200 : 201).json({ success: true, log: saved?.[0] || saved });
    } catch (err) {
      next(err);
    }
  });

  router.get("/reports", async (req, res, next) => {
    try {
      const internId = req.auth.profile.id;
      const rows = await restSelect({
        table: "reports",
        select:
          "id,report_type,week_number,month,period_start,period_end,total_hours,days_worked,summary,data,status,submitted_at,reviewed_at,review_reason,created_at,updated_at",
        filters: { intern_profile_id: `eq.${internId}`, order: "submitted_at.desc" },
        accessToken: null,
        useServiceRole: true,
      });
      res.status(200).json({ success: true, reports: rows || [] });
    } catch (err) {
      next(err);
    }
  });

  router.post("/reports", async (req, res, next) => {
    try {
      const internId = req.auth.profile.id;
      const pmId = req.auth.profile.pm_id;

      const {
        reportType,
        weekNumber,
        month,
        periodStart,
        periodEnd,
        totalHours,
        daysWorked,
        summary,
        data,
        recipientRoles,
      } = req.body || {};

      if (!reportType || !["weekly", "monthly"].includes(reportType)) {
        throw httpError(400, "reportType must be weekly or monthly", true);
      }
      if (!summary) throw httpError(400, "summary is required", true);

      const roles = Array.isArray(recipientRoles)
        ? recipientRoles.filter((r) => ["pm", "hr"].includes(r))
        : ["pm"];
      if (!roles.length) throw httpError(400, "recipientRoles must include pm and/or hr", true);
      if (roles.includes("pm") && !pmId) throw httpError(400, "PM is not assigned yet", true);

      const row = {
        intern_profile_id: internId,
        pm_profile_id: pmId || null,
        recipient_roles: roles,
        report_type: reportType,
        week_number: reportType === "weekly" ? weekNumber || null : null,
        month: reportType === "monthly" ? month || null : null,
        period_start: periodStart || null,
        period_end: periodEnd || null,
        total_hours: Number.isFinite(Number(totalHours)) ? Number(totalHours) : 0,
        days_worked: Number.isFinite(Number(daysWorked)) ? Number(daysWorked) : 0,
        summary: String(summary || ""),
        data: data || {},
        status: "pending",
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      let inserted;
      try {
        inserted = await restInsert({
          table: "reports",
          rows: row,
          accessToken: null,
          useServiceRole: true,
        });
      } catch (err) {
        const parsedTotal = row.total_hours;
        if (!Number.isInteger(parsedTotal) && /integer/i.test(String(err.message || ""))) {
          inserted = await restInsert({
            table: "reports",
            rows: { ...row, total_hours: Math.round(parsedTotal) },
            accessToken: null,
            useServiceRole: true,
          });
        } else {
          throw err;
        }
      }

      const io = req.app.get("io");
      if (io) {
        io.to(`user:${internId}`).emit("itp:changed", { entity: "reports", action: "insert" });
        if (pmId && roles.includes("pm")) io.to(`user:${pmId}`).emit("itp:changed", { entity: "reports", action: "insert" });
        if (roles.includes("hr")) io.to("role:hr").emit("itp:changed", { entity: "reports", action: "insert" });
      }

      if (io) {
        try {
          const recipients = new Set();
          if (pmId && roles.includes("pm")) recipients.add(pmId);
          if (roles.includes("hr")) {
            const hrIds = await listProfilesByRole("hr");
            (hrIds || []).forEach((id) => recipients.add(id));
          }
          const internLabel = req.auth.profile.full_name || req.auth.profile.email || "An intern";
          const reportLabel =
            reportType === "weekly"
              ? `Week ${weekNumber || ""} report`
              : reportType === "monthly"
                ? `${month || "Monthly"} report`
                : "report";
          const insertedNotifs = await createNotifications({
            rows: Array.from(recipients).map((rid) => ({
              recipient_profile_id: rid,
              title: "New report submitted",
              message: `${internLabel} submitted a ${reportLabel}.`,
              type: "report",
              category: "report",
              metadata: { internId, reportType, reportId: (inserted?.[0] || inserted)?.id || null },
            })),
          });
          const rows = Array.isArray(insertedNotifs) ? insertedNotifs : [insertedNotifs];
          rows.filter(Boolean).forEach((row) => {
            io.to(`user:${row.recipient_profile_id}`).emit("itp:notification", { notification: toClientNotification(row) });
          });
        } catch (err) {
          if (!isMissingTableError(err, "notifications")) console.error("Failed to notify report submission:", err);
        }
      }

      res.status(201).json({ success: true, report: inserted?.[0] || inserted });
    } catch (err) {
      next(err);
    }
  });

  router.get("/tna", async (req, res, next) => {
    try {
      const internId = req.auth.profile.id;
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

  router.post("/tna", async (req, res, next) => {
    try {
      const internId = req.auth.profile.id;
      const { weekNumber, task, plannedDate, planOfAction, executedDate, status, reason, deliverable, sortOrder } =
        req.body || {};
      if (!task || !String(task).trim()) throw httpError(400, "task is required", true);

      let nextSort = 0;
      if (Number.isFinite(Number(sortOrder))) {
        nextSort = Number(sortOrder);
      } else {
        const last = await restSelect({
          table: "tna_items",
          select: "sort_order",
          filters: { intern_profile_id: `eq.${internId}`, order: "sort_order.desc", limit: 1 },
          accessToken: null,
          useServiceRole: true,
        });
        nextSort = (Number(last?.[0]?.sort_order) || 0) + 1;
      }

      const row = {
        intern_profile_id: internId,
        week_number: Number.isFinite(Number(weekNumber)) ? Number(weekNumber) : null,
        task: String(task || ""),
        planned_date: plannedDate || null,
        plan_of_action: String(planOfAction || ""),
        executed_date: executedDate || null,
        status: ["pending", "in_progress", "completed", "blocked"].includes(status) ? status : "pending",
        reason: reason || null,
        deliverable: deliverable || null,
        sort_order: nextSort,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const inserted = await restInsert({
        table: "tna_items",
        rows: row,
        accessToken: null,
        useServiceRole: true,
      });

      const io = req.app.get("io");
      const pmId = req.auth.profile.pm_id;
      if (io) {
        io.to(`user:${internId}`).emit("itp:changed", { entity: "tna", action: "insert", internId });
        if (pmId) io.to(`user:${pmId}`).emit("itp:changed", { entity: "tna", action: "insert", internId });
        io.to("role:hr").emit("itp:changed", { entity: "tna", action: "insert", internId });
      }

      scheduleGoogleSync(internId, pmId, io, "tna");
      res.status(201).json({ success: true, item: inserted?.[0] || inserted });
    } catch (err) {
      if (String(err.message || "").includes("tna_items")) {
        err.status = err.status || 400;
        err.expose = true;
        err.message = "TNA tables not found. Run Supabase migration 006_add_tna_blueprint_links.sql.";
      }
      next(err);
    }
  });

  router.patch("/tna/:id", async (req, res, next) => {
    try {
      if (!UUID_REGEX.test(req.params.id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      const internId = req.auth.profile.id;
      const { weekNumber, task, plannedDate, planOfAction, executedDate, status, reason, deliverable, sortOrder } =
        req.body || {};

      const patch = { updated_at: new Date().toISOString() };
      if (weekNumber !== undefined) patch.week_number = Number.isFinite(Number(weekNumber)) ? Number(weekNumber) : null;
      if (task !== undefined) patch.task = String(task || "");
      if (plannedDate !== undefined) patch.planned_date = plannedDate || null;
      if (planOfAction !== undefined) patch.plan_of_action = String(planOfAction || "");
      if (executedDate !== undefined) patch.executed_date = executedDate || null;
      if (status !== undefined) {
        patch.status = ["pending", "in_progress", "completed", "blocked"].includes(status) ? status : "pending";
      }
      if (reason !== undefined) patch.reason = reason || null;
      if (deliverable !== undefined) patch.deliverable = deliverable || null;
      if (sortOrder !== undefined) patch.sort_order = Number.isFinite(Number(sortOrder)) ? Number(sortOrder) : 0;

      await restUpdate({
        table: "tna_items",
        patch,
        matchQuery: { id: `eq.${req.params.id}`, intern_profile_id: `eq.${internId}` },
        accessToken: null,
        useServiceRole: true,
      });

      const io = req.app.get("io");
      const pmId = req.auth.profile.pm_id;
      if (io) {
        io.to(`user:${internId}`).emit("itp:changed", { entity: "tna", action: "update", internId });
        if (pmId) io.to(`user:${pmId}`).emit("itp:changed", { entity: "tna", action: "update", internId });
        io.to("role:hr").emit("itp:changed", { entity: "tna", action: "update", internId });
      }

      scheduleGoogleSync(internId, pmId, io, "tna");
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/tna/:id", async (req, res, next) => {
    try {
      if (!UUID_REGEX.test(req.params.id)) {
        return res.status(400).json({ error: "Invalid ID format" });
      }
      const internId = req.auth.profile.id;
      await restDelete({
        table: "tna_items",
        matchQuery: { id: `eq.${req.params.id}`, intern_profile_id: `eq.${internId}` },
        accessToken: null,
        useServiceRole: true,
      });

      const io = req.app.get("io");
      const pmId = req.auth.profile.pm_id;
      if (io) {
        io.to(`user:${internId}`).emit("itp:changed", { entity: "tna", action: "delete", internId });
        if (pmId) io.to(`user:${pmId}`).emit("itp:changed", { entity: "tna", action: "delete", internId });
        io.to("role:hr").emit("itp:changed", { entity: "tna", action: "delete", internId });
      }

      scheduleGoogleSync(internId, pmId, io, "tna");
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  async function getReportLinksRow(internId) {
    const rows = await restSelect({
      table: "report_links",
      select: "id,tna_sheet_url,blueprint_doc_url",
      filters: { intern_profile_id: `eq.${internId}`, limit: 1 },
      accessToken: null,
      useServiceRole: true,
    });
    return rows?.[0] || null;
  }

  async function updateReportLinksMeta(internId, patch) {
    const existing = await restSelect({
      table: "report_links",
      select: "id",
      filters: { intern_profile_id: `eq.${internId}`, limit: 1 },
      accessToken: null,
      useServiceRole: true,
    });

    const basePatch = { ...patch, updated_at: new Date().toISOString() };
    try {
      if (existing?.[0]?.id) {
        await restUpdate({
          table: "report_links",
          patch: basePatch,
          matchQuery: { id: `eq.${existing[0].id}` },
          accessToken: null,
          useServiceRole: true,
        });
      } else {
        await restInsert({
          table: "report_links",
          rows: { intern_profile_id: internId, ...basePatch, created_at: new Date().toISOString() },
          accessToken: null,
          useServiceRole: true,
        });
      }
    } catch (err) {
      // Back-compat if metadata columns are not present yet: keep going.
      const msg = String(err?.message || "");
      if (msg.includes("last_synced_from_google_at") || msg.includes("last_synced_to_google_at") || msg.includes("last_sync_error")) {
        return;
      }
      throw err;
    }
  }

  router.post("/tna/sync/from-google", async (req, res, next) => {
    try {
      const internId = req.auth.profile.id;
      const links = await getReportLinksRow(internId);
      const tnaSheetUrl = links?.tna_sheet_url || "";
      if (!String(tnaSheetUrl || "").trim()) throw httpError(400, "No TNA Sheet URL saved yet.", true);

      const { items } = await syncTnaFromPublicGoogle({ tnaSheetUrl });

      await restDelete({
        table: "tna_items",
        matchQuery: { intern_profile_id: `eq.${internId}` },
        accessToken: null,
        useServiceRole: true,
      });

      const now = new Date().toISOString();
      if (items.length) {
        await restInsert({
          table: "tna_items",
          rows: items.map((i) => ({
            intern_profile_id: internId,
            week_number: i.week_number,
            task: i.task,
            planned_date: i.planned_date,
            plan_of_action: i.plan_of_action,
            executed_date: i.executed_date,
            status: i.status,
            reason: i.reason,
            deliverable: i.deliverable,
            sort_order: i.sort_order,
            created_at: now,
            updated_at: now,
          })),
          accessToken: null,
          useServiceRole: true,
        });
      }

      await updateReportLinksMeta(internId, {
        last_synced_from_google_at: now,
        last_sync_error: null,
      });

      const io = req.app.get("io");
      const pmId = req.auth.profile.pm_id;
      if (io) {
        io.to(`user:${internId}`).emit("itp:changed", { entity: "tna", action: "sync_from_google", internId });
        if (pmId) io.to(`user:${pmId}`).emit("itp:changed", { entity: "tna", action: "sync_from_google", internId });
        io.to("role:hr").emit("itp:changed", { entity: "tna", action: "sync_from_google", internId });
      }

      res.status(200).json({ success: true, imported: items.length });
    } catch (err) {
      try {
        const internId = req.auth?.profile?.id;
        if (internId) {
          await updateReportLinksMeta(internId, { last_sync_error: String(err?.message || "Sync failed") });
        }
      } catch {
        // ignore
      }
      next(err);
    }
  });

  router.post("/tna/sync/to-google", async (req, res, next) => {
    try {
      const internId = req.auth.profile.id;
      if (!isGoogleSyncEnabled()) {
        throw httpError(
          400,
          "Google sync is disabled. Set GOOGLE_SYNC_ENABLED=true and configure a Service Account that has edit access to the sheet.",
          true
        );
      }

      const links = await getReportLinksRow(internId);
      const tnaSheetUrl = links?.tna_sheet_url || "";
      if (!String(tnaSheetUrl || "").trim()) throw httpError(400, "No TNA Sheet URL saved yet.", true);

      const rows = await restSelect({
        table: "tna_items",
        select:
          "week_number,task,planned_date,plan_of_action,executed_date,status,reason,deliverable,sort_order,created_at,updated_at",
        filters: { intern_profile_id: `eq.${internId}`, order: "sort_order.asc,created_at.asc" },
        accessToken: null,
        useServiceRole: true,
      });

      const { syncTnaToGoogle } = loadGoogleSync();
      await syncTnaToGoogle({ tnaSheetUrl, items: rows || [] });
      const now = new Date().toISOString();
      await updateReportLinksMeta(internId, { last_synced_to_google_at: now, last_sync_error: null });

      const io = req.app.get("io");
      const pmId = req.auth.profile.pm_id;
      if (io) {
        io.to(`user:${internId}`).emit("itp:changed", { entity: "report_links", action: "sync_to_google", internId });
        if (pmId) io.to(`user:${pmId}`).emit("itp:changed", { entity: "report_links", action: "sync_to_google", internId });
        io.to("role:hr").emit("itp:changed", { entity: "report_links", action: "sync_to_google", internId });
      }

      res.status(200).json({ success: true });
    } catch (err) {
      try {
        const internId = req.auth?.profile?.id;
        if (internId) {
          await updateReportLinksMeta(internId, { last_sync_error: String(err?.message || "Sync failed") });
        }
      } catch {
        // ignore
      }
      next(err);
    }
  });

  router.get("/blueprint", async (req, res, next) => {
    try {
      const internId = req.auth.profile.id;
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

  router.patch("/blueprint", async (req, res, next) => {
    try {
      const internId = req.auth.profile.id;
      const { data } = req.body || {};
      if (!data || typeof data !== "object") throw httpError(400, "data must be an object", true);

      const existing = await restSelect({
        table: "intern_blueprints",
        select: "id",
        filters: { intern_profile_id: `eq.${internId}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });

      if (existing?.[0]?.id) {
        await restUpdate({
          table: "intern_blueprints",
          patch: { data, updated_at: new Date().toISOString() },
          matchQuery: { id: `eq.${existing[0].id}` },
          accessToken: null,
          useServiceRole: true,
        });
      } else {
        await restInsert({
          table: "intern_blueprints",
          rows: { intern_profile_id: internId, data, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          accessToken: null,
          useServiceRole: true,
        });
      }

      const io = req.app.get("io");
      const pmId = req.auth.profile.pm_id;
      if (io) {
        io.to(`user:${internId}`).emit("itp:changed", { entity: "blueprint", action: "upsert", internId });
        if (pmId) io.to(`user:${pmId}`).emit("itp:changed", { entity: "blueprint", action: "upsert", internId });
        io.to("role:hr").emit("itp:changed", { entity: "blueprint", action: "upsert", internId });
      }

      scheduleGoogleSync(internId, pmId, io, "blueprint");
      res.status(200).json({ success: true });
    } catch (err) {
      if (String(err.message || "").includes("intern_blueprints")) {
        err.status = 400;
        err.expose = true;
        err.message = "Blueprint tables not found. Run Supabase migration 006_add_tna_blueprint_links.sql.";
      }
      next(err);
    }
  });

  router.post("/blueprint/sync/from-google", async (req, res, next) => {
    try {
      const internId = req.auth.profile.id;
      const links = await getReportLinksRow(internId);
      const blueprintDocUrl = links?.blueprint_doc_url || "";
      if (!String(blueprintDocUrl || "").trim()) throw httpError(400, "No Blueprint Doc URL saved yet.", true);

      const { data } = await syncBlueprintFromPublicGoogle({ blueprintDocUrl });

      const existing = await restSelect({
        table: "intern_blueprints",
        select: "id",
        filters: { intern_profile_id: `eq.${internId}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });

      const now = new Date().toISOString();
      if (existing?.[0]?.id) {
        await restUpdate({
          table: "intern_blueprints",
          patch: { data, updated_at: now },
          matchQuery: { id: `eq.${existing[0].id}` },
          accessToken: null,
          useServiceRole: true,
        });
      } else {
        await restInsert({
          table: "intern_blueprints",
          rows: { intern_profile_id: internId, data, created_at: now, updated_at: now },
          accessToken: null,
          useServiceRole: true,
        });
      }

      await updateReportLinksMeta(internId, {
        last_synced_from_google_at: now,
        last_sync_error: null,
      });

      const io = req.app.get("io");
      const pmId = req.auth.profile.pm_id;
      if (io) {
        io.to(`user:${internId}`).emit("itp:changed", { entity: "blueprint", action: "sync_from_google", internId });
        if (pmId) io.to(`user:${pmId}`).emit("itp:changed", { entity: "blueprint", action: "sync_from_google", internId });
        io.to("role:hr").emit("itp:changed", { entity: "blueprint", action: "sync_from_google", internId });
      }

      res.status(200).json({ success: true });
    } catch (err) {
      try {
        const internId = req.auth?.profile?.id;
        if (internId) {
          await updateReportLinksMeta(internId, { last_sync_error: String(err?.message || "Sync failed") });
        }
      } catch {
        // ignore
      }
      next(err);
    }
  });

  router.post("/blueprint/sync/to-google", async (req, res, next) => {
    try {
      const internId = req.auth.profile.id;
      if (!isGoogleSyncEnabled()) {
        throw httpError(
          400,
          "Google sync is disabled. Set GOOGLE_SYNC_ENABLED=true and configure a Service Account that has edit access to the doc.",
          true
        );
      }

      const links = await getReportLinksRow(internId);
      const blueprintDocUrl = links?.blueprint_doc_url || "";
      if (!String(blueprintDocUrl || "").trim()) throw httpError(400, "No Blueprint Doc URL saved yet.", true);

      const bpRows = await restSelect({
        table: "intern_blueprints",
        select: "data",
        filters: { intern_profile_id: `eq.${internId}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });
      const data = bpRows?.[0]?.data && typeof bpRows[0].data === "object" ? bpRows[0].data : {};

      const { syncBlueprintToGoogle } = loadGoogleSync();
      await syncBlueprintToGoogle({ blueprintDocUrl, data });
      const now = new Date().toISOString();
      await updateReportLinksMeta(internId, { last_synced_to_google_at: now, last_sync_error: null });

      const io = req.app.get("io");
      const pmId = req.auth.profile.pm_id;
      if (io) {
        io.to(`user:${internId}`).emit("itp:changed", { entity: "report_links", action: "sync_to_google", internId });
        if (pmId) io.to(`user:${pmId}`).emit("itp:changed", { entity: "report_links", action: "sync_to_google", internId });
        io.to("role:hr").emit("itp:changed", { entity: "report_links", action: "sync_to_google", internId });
      }

      res.status(200).json({ success: true });
    } catch (err) {
      try {
        const internId = req.auth?.profile?.id;
        if (internId) {
          await updateReportLinksMeta(internId, { last_sync_error: String(err?.message || "Sync failed") });
        }
      } catch {
        // ignore
      }
      next(err);
    }
  });

  router.get("/report-links", async (req, res, next) => {
    try {
      const internId = req.auth.profile.id;
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
        // Back-compat if sync metadata columns are not migrated yet.
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

  router.patch("/report-links", async (req, res, next) => {
    try {
      const internId = req.auth.profile.id;
      const { tnaSheetUrl, blueprintDocUrl } = req.body || {};

      const existing = await restSelect({
        table: "report_links",
        select: "id",
        filters: { intern_profile_id: `eq.${internId}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });

      const patch = {
        tna_sheet_url: tnaSheetUrl || null,
        blueprint_doc_url: blueprintDocUrl || null,
        updated_at: new Date().toISOString(),
      };

      if (existing?.[0]?.id) {
        await restUpdate({
          table: "report_links",
          patch,
          matchQuery: { id: `eq.${existing[0].id}` },
          accessToken: null,
          useServiceRole: true,
        });
      } else {
        await restInsert({
          table: "report_links",
          rows: { intern_profile_id: internId, ...patch, created_at: new Date().toISOString() },
          accessToken: null,
          useServiceRole: true,
        });
      }

      const io = req.app.get("io");
      const pmId = req.auth.profile.pm_id;
      if (io) {
        io.to(`user:${internId}`).emit("itp:changed", { entity: "report_links", action: "upsert", internId });
        if (pmId) io.to(`user:${pmId}`).emit("itp:changed", { entity: "report_links", action: "upsert", internId });
        io.to("role:hr").emit("itp:changed", { entity: "report_links", action: "upsert", internId });
      }

      res.status(200).json({ success: true });
    } catch (err) {
      if (String(err.message || "").includes("report_links")) {
        err.status = 400;
        err.expose = true;
        err.message = "Report links table not found. Run Supabase migration 006_add_tna_blueprint_links.sql.";
      }
      next(err);
    }
  });

  router.get("/stats", async (req, res, next) => {
    try {
      const internId = req.auth.profile.id;

      let profileRow;
      try {
        const rows = await restSelect({
          table: "profiles",
          select: "id,profile_data,profile_completed,created_at,updated_at",
          filters: { id: `eq.${internId}`, limit: 1 },
          accessToken: null,
          useServiceRole: true,
        });
        profileRow = rows?.[0] || null;
      } catch (err) {
        profileRow = null;
      }

      const logs = await restSelect({
        table: "daily_logs",
        select: "hours_worked,tasks_completed,status,log_date",
        filters: { intern_profile_id: `eq.${internId}` },
        accessToken: null,
        useServiceRole: true,
      });

      const approvedLogs = (logs || []).filter((l) => (l.status || "") === "approved" || (l.status || "") === "submitted");
      const totalHours = approvedLogs.reduce((sum, l) => sum + (Number(l.hours_worked) || 0), 0);
      const tasksCompleted = approvedLogs.reduce((sum, l) => sum + (Number(l.tasks_completed) || 0), 0);

      const profileData = profileRow?.profile_data || {};
      const startDate = profileData.startDate ? new Date(profileData.startDate) : null;
      const endDate = profileData.endDate ? new Date(profileData.endDate) : null;
      const now = new Date();
      const daysActive = startDate ? Math.max(0, Math.floor((now - startDate) / (1000 * 60 * 60 * 24))) : 0;
      let progressPercent = 0;
      if (startDate && endDate && endDate > startDate) {
        progressPercent = Math.min(100, Math.max(0, Math.round(((now - startDate) / (endDate - startDate)) * 100)));
      }

      const pendingReports = await restSelect({
        table: "reports",
        select: "id",
        filters: { intern_profile_id: `eq.${internId}`, status: "eq.pending" },
        accessToken: null,
        useServiceRole: true,
      });

      res.status(200).json({
        success: true,
        stats: {
          daysActive,
          totalHours,
          tasksCompleted,
          progressPercent,
          pendingReports: (pendingReports || []).length,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/project-submission", async (req, res, next) => {
    try {
      const internId = req.auth.profile.id;
      const pmId = req.auth.profile.pm_id;
      const { title, description, githubLink, demoLink } = req.body || {};

      const safeTitle = String(title || "").trim();
      const safeDescription = String(description || "").trim();
      const safeGithubLink = String(githubLink || "").trim();

      if (!safeTitle) throw httpError(400, "title is required", true);
      if (!safeDescription) throw httpError(400, "description is required", true);
      if (!safeGithubLink) throw httpError(400, "githubLink is required", true);
      if (safeTitle.length < 3 || safeTitle.length > 200) {
        throw httpError(400, "title must be between 3 and 200 characters", true);
      }
      if (safeDescription.length < 10 || safeDescription.length > 5000) {
        throw httpError(400, "description must be between 10 and 5000 characters", true);
      }
      if (!/^https?:\/\//i.test(safeGithubLink)) {
        throw httpError(400, "githubLink must be a valid URL", true);
      }

      const row = {
        intern_profile_id: internId,
        pm_profile_id: pmId || null,
        title: safeTitle,
        description: safeDescription,
        github_link: safeGithubLink,
        demo_link: demoLink ? String(demoLink).trim() : null,
        status: "submitted",
        submitted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const inserted = await restInsert({
        table: "project_submissions",
        rows: row,
        accessToken: null,
        useServiceRole: true,
      });

      const io = req.app.get("io");
      if (io) {
        if (pmId) io.to(`user:${pmId}`).emit("itp:changed", { entity: "project_submissions", action: "insert" });
        io.to("role:hr").emit("itp:changed", { entity: "project_submissions", action: "insert" });
      }

      res.status(201).json({ success: true, submission: inserted?.[0] || inserted });
    } catch (err) {
      next(err);
    }
  });


  router.get("/project-submissions", async (req, res, next) => {
    try {
      const internId = req.auth.profile.id;
      const rows = await restSelect({
        table: "project_submissions",
        select: "id,title,description,github_link,demo_link,status,review_comment,reviewed_at,submitted_at",
        filters: { intern_profile_id: `eq.${internId}`, order: "submitted_at.desc" },
        accessToken: null,
        useServiceRole: true,
      });
      res.status(200).json({ success: true, submissions: rows || [] });
    } catch (err) { next(err); }
  });

  return router;
}

module.exports = { createInternRouter };
