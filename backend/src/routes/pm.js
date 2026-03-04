const express = require("express");
const { httpError } = require("../errors");
const { restSelect, restUpdate } = require("../services/supabaseRest");
const { createAuthMiddleware } = require("../middleware/auth");

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

      res.status(200).json({ success: true, interns: interns || [] });
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
      },
    });
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

      let rows;
      try {
        rows = await restSelect({
          table: "reports",
          select:
            "id,intern_profile_id,pm_profile_id,recipient_roles,report_type,week_number,month,period_start,period_end,total_hours,days_worked,summary,data,status,submitted_at,reviewed_at,review_reason,intern:intern_profile_id(id,email,full_name,intern_id)",
          filters: { pm_profile_id: `eq.${pmId}`, recipient_roles: "cs.{pm}", order: "submitted_at.desc" },
          accessToken: null,
          useServiceRole: true,
        });
      } catch (err) {
        // Back-compat if recipient_roles column hasn't been migrated yet.
        if (String(err.message || "").includes("recipient_roles")) {
          rows = await restSelect({
            table: "reports",
            select:
              "id,intern_profile_id,pm_profile_id,report_type,week_number,month,period_start,period_end,total_hours,days_worked,summary,data,status,submitted_at,reviewed_at,review_reason,intern:intern_profile_id(id,email,full_name,intern_id)",
            filters: { pm_profile_id: `eq.${pmId}`, order: "submitted_at.desc" },
            accessToken: null,
            useServiceRole: true,
          });
        } else {
          throw err;
        }
      }

      const mapped = (rows || []).map((r) => {
        const intern = r.intern || {};
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
      next(err);
    }
  });

  router.patch("/reports/:id/review", async (req, res, next) => {
    try {
      const pmId = req.auth.profile.id;
      const { status, reason } = req.body || {};
      if (!status || !["approved", "rejected"].includes(status)) {
        throw httpError(400, "status must be approved or rejected", true);
      }

      const updated = await restUpdate({
        table: "reports",
        patch: {
          status,
          reviewed_by: pmId,
          reviewed_at: new Date().toISOString(),
          review_reason: reason || null,
          updated_at: new Date().toISOString(),
        },
        matchQuery: { id: `eq.${req.params.id}`, pm_profile_id: `eq.${pmId}` },
        accessToken: null,
        useServiceRole: true,
      });

      const reportRow = Array.isArray(updated) ? updated[0] : updated;
      const internId = reportRow?.intern_profile_id;
      const io = req.app.get("io");
      if (io) {
        io.to(`user:${pmId}`).emit("itp:changed", { entity: "reports", action: "update" });
        if (internId) io.to(`user:${internId}`).emit("itp:changed", { entity: "reports", action: "update" });
      }

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.get("/stats", async (req, res, next) => {
    try {
      const pmId = req.auth.profile.id;

      const interns = await restSelect({
        table: "profiles",
        select: "id,status",
        filters: { role: "eq.intern", pm_id: `eq.${pmId}` },
        accessToken: null,
        useServiceRole: true,
      });
      const internIds = (interns || []).map((i) => i.id);
      const activeInterns = (interns || []).filter((i) => (i.status || "").toLowerCase() === "active").length;

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

      let pendingReportsRows;
      try {
        pendingReportsRows = await restSelect({
          table: "reports",
          select: "id",
          filters: { pm_profile_id: `eq.${pmId}`, status: "eq.pending", recipient_roles: "cs.{pm}" },
          accessToken: null,
          useServiceRole: true,
        });
      } catch (err) {
        if (String(err.message || "").includes("recipient_roles")) {
          pendingReportsRows = await restSelect({
            table: "reports",
            select: "id",
            filters: { pm_profile_id: `eq.${pmId}`, status: "eq.pending" },
            accessToken: null,
            useServiceRole: true,
          });
        } else {
          throw err;
        }
      }

      res.status(200).json({
        success: true,
        stats: {
          activeInterns,
          totalHours,
          totalTasks,
          pendingReports: (pendingReportsRows || []).length,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createPmRouter };
