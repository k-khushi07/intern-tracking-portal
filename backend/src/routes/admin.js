const express = require("express");
const { httpError } = require("../errors");
const { adminCreateUser, restInsert } = require("../services/supabaseRest");
const { createAuthMiddleware } = require("../middleware/auth");

function createAdminRouter() {
  const router = express.Router();
  const auth = createAuthMiddleware();

  router.use(auth.requireRole("admin"));

  router.post("/users", async (req, res, next) => {
    try {
      const { email, password, role, fullName, pmCode } = req.body || {};
      if (!email || !password || !role) throw httpError(400, "email, password, role are required", true);
      if (!["hr", "pm", "admin"].includes(role)) throw httpError(400, "Invalid role", true);
      if (role === "pm" && !pmCode) throw httpError(400, "pmCode is required for PM accounts", true);

      const created = await adminCreateUser({
        email,
        password,
        userMetadata: { full_name: fullName || "" },
      });
      const createdId = created?.id || created?.user?.id;
      if (!createdId) throw httpError(502, "Unexpected Supabase response (missing user id)", true);

      const profileRow = {
        id: createdId,
        email,
        full_name: fullName || "",
        role,
        status: "active",
        pm_code: role === "pm" ? pmCode : null,
      };

      await restInsert({
        table: "profiles",
        rows: profileRow,
        accessToken: null,
        useServiceRole: true,
      });

      res.status(201).json({ success: true, userId: createdId });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createAdminRouter };
