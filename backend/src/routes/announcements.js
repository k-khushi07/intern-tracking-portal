const express = require("express");
const { restSelect } = require("../services/supabaseRest");
const { createAuthMiddleware } = require("../middleware/auth");

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function normalizeDepartment(department) {
  const raw = String(department || "").trim();
  if (!raw) return null;
  const normalized = raw.replace(/\s+/g, " ").trim();
  if (!normalized) return null;
  const lowered = normalized.toLowerCase();
  if (["all", "*", "any"].includes(lowered)) return null;
  // Canonical labels (keep storage flexible but comparisons consistent)
  if (lowered === "sap") return "SAP";
  if (lowered === "oracle") return "Oracle";
  if (lowered === "accounts") return "Accounts";
  if (lowered === "hr") return "HR";
  if (lowered === "pm") return "PM";
  return normalized;
}

function hasAudience(announcement, role) {
  return Array.isArray(announcement?.audience_roles) && announcement.audience_roles.includes(role);
}

function createAnnouncementsRouter() {
  const router = express.Router();
  const auth = createAuthMiddleware();

  router.use(auth.requireAuth);

  router.get("/", async (req, res, next) => {
    try {
      const role = normalizeRole(req.auth.profile.role);
      const profileId = req.auth.profile.id;
      const assignedPmId = req.auth.profile.pm_id || null;
      const profileData = req.auth.profile.profile_data && typeof req.auth.profile.profile_data === "object" ? req.auth.profile.profile_data : {};
      const viewerDepartment =
        normalizeDepartment(profileData.department) ||
        (role === "hr" ? "HR" : role === "pm" ? "PM" : null);
      const requestedDepartment = normalizeDepartment(req.query.department);

      let rows = [];
      try {
        rows = await restSelect({
          table: "announcements",
          select: "id,title,content,priority,audience_roles,pinned,department,created_at,updated_at,created_by:created_by_profile_id(id,email,full_name,role)",
          filters: { order: "pinned.desc,created_at.desc" },
          accessToken: null,
          useServiceRole: true,
        });
      } catch (err) {
        const msg = String(err?.message || "").toLowerCase();
        if (!msg.includes("department")) throw err;
        rows = await restSelect({
          table: "announcements",
          select: "id,title,content,priority,audience_roles,pinned,created_at,updated_at,created_by:created_by_profile_id(id,email,full_name,role)",
          filters: { order: "pinned.desc,created_at.desc" },
          accessToken: null,
          useServiceRole: true,
        });
      }

      let filtered = (rows || []).filter((a) => {
        const creatorRole = normalizeRole(a?.created_by?.role);
        const creatorId = a?.created_by?.id || null;

        // PM should always see their own announcements regardless of department targeting.
        if (role === "pm" && creatorRole === "pm" && creatorId && creatorId === profileId) return true;

        const annDept = normalizeDepartment(a?.department);
        if (!annDept) return true; // Global announcement
        if (["hr", "admin"].includes(role)) {
          if (requestedDepartment) return annDept === requestedDepartment;
          return true;
        }
        if (!viewerDepartment) return false; // unknown dept -> only global
        return annDept === viewerDepartment;
      });
      if (role === "intern") {
        filtered = filtered.filter((a) => {
          if (!hasAudience(a, "intern")) return false;
          const creatorRole = normalizeRole(a?.created_by?.role);
          const creatorId = a?.created_by?.id || null;
          if (["hr", "admin"].includes(creatorRole)) return true;
          // PM announcements are visible only from the intern's assigned PM.
          if (creatorRole === "pm" && assignedPmId && creatorId === assignedPmId) return true;
          return false;
        });
      } else if (role === "pm") {
        filtered = filtered.filter((a) => {
          const creatorRole = normalizeRole(a?.created_by?.role);
          const creatorId = a?.created_by?.id || null;
          // PM should see own announcements and HR/Admin-to-PM announcements.
          if (creatorRole === "pm" && creatorId === profileId) return true;
          if (["hr", "admin"].includes(creatorRole) && hasAudience(a, "pm")) return true;
          return false;
        });
      } else if (!["hr", "admin"].includes(role)) {
        filtered = filtered.filter((a) => hasAudience(a, role));
      }

      res.status(200).json({ success: true, announcements: filtered });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createAnnouncementsRouter };
