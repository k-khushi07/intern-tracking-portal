const express = require("express");
const { restSelect } = require("../services/supabaseRest");
const { createAuthMiddleware } = require("../middleware/auth");

function createAnnouncementsRouter() {
  const router = express.Router();
  const auth = createAuthMiddleware();

  router.use(auth.requireAuth);

  router.get("/", async (req, res, next) => {
    try {
      const role = req.auth.profile.role;

      const rows = await restSelect({
        table: "announcements",
        select: "id,title,content,priority,audience_roles,pinned,created_at,updated_at,created_by:created_by_profile_id(id,email,full_name,role)",
        filters: { order: "pinned.desc,created_at.desc" },
        accessToken: null,
        useServiceRole: true,
      });

      const filtered =
        role === "hr" || role === "admin"
          ? rows || []
          : (rows || []).filter((a) => Array.isArray(a.audience_roles) && a.audience_roles.includes(role));

      res.status(200).json({ success: true, announcements: filtered });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createAnnouncementsRouter };

