const express = require("express");
const { httpError } = require("../errors");
const { adminCreateUser, restSelect, restUpdate, restInsert, restDelete } = require("../services/supabaseRest");
const { createAuthMiddleware } = require("../middleware/auth");

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

function mapApplicationToUser(app) {
  const data = app.data || {};
  return {
    applicationId: app.id,
    role: "intern",
    status: app.status || "",
    email: app.applicant_email,
    fullName: app.full_name || data.fullName,
    name: app.full_name || data.fullName,
    degree: data.degree,
    phone: data.phone,
    registeredAt: app.created_at,
    internshipDomain: app.domain || data.internshipDomain,
    ...data,
  };
}

function createHrRouter({ emailService }) {
  const router = express.Router();
  const auth = createAuthMiddleware();

  router.use(auth.requireRole("hr"));

  router.get("/users", async (req, res, next) => {
    try {
      const applications = await restSelect({
        table: "intern_applications",
        select: "id,created_at,applicant_email,full_name,domain,status,data",
        filters: {},
        accessToken: null,
        useServiceRole: true,
      });

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

      const users = [
        ...(applications || []).filter((a) => (a.status || "") !== "approved").map(mapApplicationToUser),
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

  router.patch("/applications/:id/status", async (req, res, next) => {
    try {
      const { status } = req.body || {};
      if (status === undefined) throw httpError(400, "status is required", true);
      await restUpdate({
        table: "intern_applications",
        patch: { status, updated_at: new Date().toISOString() },
        matchQuery: { id: `eq.${req.params.id}` },
        accessToken: null,
        useServiceRole: true,
      });

      const io = req.app.get("io");
      if (io) io.to("role:hr").emit("itp:changed", { entity: "intern_applications", action: "update" });

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.post("/applications/:id/reject", async (req, res, next) => {
    try {
      const { reason } = req.body || {};
      await restUpdate({
        table: "intern_applications",
        patch: {
          status: "rejected",
          reject_reason: reason || null,
          reviewed_by: req.auth.profile.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        matchQuery: { id: `eq.${req.params.id}` },
        accessToken: null,
        useServiceRole: true,
      });

      const io = req.app.get("io");
      if (io) io.to("role:hr").emit("itp:changed", { entity: "intern_applications", action: "update" });

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.post("/applications/:id/approve", async (req, res, next) => {
    try {
      const { internId, password, email } = req.body || {};

      const apps = await restSelect({
        table: "intern_applications",
        select: "id,applicant_email,full_name,status",
        filters: { id: `eq.${req.params.id}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });
      const app = apps?.[0];
      if (!app) throw httpError(404, "Application not found", true);
      if ((app.status || "") !== "pending") throw httpError(400, "Application is not pending", true);

      const generatedInternId = internId || `INT${Date.now()}`;
      const generatedPassword = password || Math.random().toString(36).slice(2, 10) + "A1!";

      const created = await adminCreateUser({
        email: app.applicant_email,
        password: generatedPassword,
        userMetadata: { full_name: app.full_name || "" },
      });
      const createdId = created?.id || created?.user?.id;
      if (!createdId) throw httpError(502, "Unexpected Supabase response (missing user id)", true);

      await restInsert({
        table: "profiles",
        rows: {
          id: createdId,
          email: app.applicant_email,
          full_name: app.full_name || "",
          role: "intern",
          status: "active",
          intern_id: generatedInternId,
          pm_id: null,
          profile_completed: false,
        },
        accessToken: null,
        useServiceRole: true,
      });

      await restUpdate({
        table: "intern_applications",
        patch: {
          status: "approved",
          reviewed_by: req.auth.profile.id,
          reviewed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        matchQuery: { id: `eq.${app.id}` },
        accessToken: null,
        useServiceRole: true,
      });

      const io = req.app.get("io");
      if (io) {
        io.to("role:hr").emit("itp:changed", { entity: "intern_applications", action: "update" });
        io.to("role:hr").emit("itp:changed", { entity: "profiles", action: "insert" });
        io.to(`user:${createdId}`).emit("itp:changed", { entity: "profiles", action: "insert" });
      }

      let emailSent = false;
      if (email?.to && email?.subject && email?.html) {
        await emailService.sendEmail({
          to: email.to,
          cc: email.cc,
          bcc: email.bcc,
          subject: email.subject,
          html: email.html,
          attachments: email.attachments,
        });
        emailSent = true;
      }

      res.status(200).json({
        success: true,
        intern: { email: app.applicant_email, fullName: app.full_name, internId: generatedInternId },
        credentials: { password: generatedPassword },
        emailSent,
      });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/interns/:id/assign-pm", async (req, res, next) => {
    try {
      const { pmCode } = req.body || {};
      if (!pmCode) throw httpError(400, "pmCode is required", true);

      // Fetch current intern state (for chat archival on reassignment).
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

      // If reassigned, archive old direct conversations (intern <-> old PM, intern <-> old teammates).
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

  router.get("/stats", async (req, res, next) => {
    try {
      const applications = await restSelect({
        table: "intern_applications",
        select: "id,status,created_at",
        filters: {},
        accessToken: null,
        useServiceRole: true,
      });

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
      const newRegistrations = (applications || []).filter((a) => (a.status || "") === "").length;
      const active = (interns || []).filter((i) => (i.status || "active") === "active").length;

      res.status(200).json({
        success: true,
        stats: {
          pending,
          active,
          total: (interns || []).length,
          newRegistrations,
          pms: (pms || []).length,
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
      // Back-compat if migration hasn't run yet: no HR recipients, so return empty.
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

      // Surrounding context: 8 before + 8 after.
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

  return router;
}

module.exports = { createHrRouter };
