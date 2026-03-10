const express = require("express");
const { httpError } = require("../errors");
const { authPasswordGrant, authGetUser, restSelect } = require("../services/supabaseRest");
const { setAuthCookies, clearAuthCookies } = require("../services/authCookies");

async function loadProfile({ userId, accessToken }) {
  const rows = await restSelect({
    table: "profiles",
    select: "id,email,full_name,role,status,pm_code,intern_id,pm_id,profile_completed",
    filters: { id: `eq.${userId}`, limit: 1 },
    accessToken: null,
    useServiceRole: true,
  });
  const profile = rows?.[0] || null;
  if (profile?.role) profile.role = String(profile.role).trim().toLowerCase();
  return profile;
}

function createAuthRouter() {
  const router = express.Router();

  router.post("/login", async (req, res, next) => {
    try {
      const { email, password, expectedRole, rememberMe } = req.body || {};
      if (!email || !password) throw httpError(400, "Email and password are required", true);

      const session = await authPasswordGrant({ email, password });
      const user = await authGetUser({ accessToken: session.access_token });
      const profile = await loadProfile({ userId: user.id, accessToken: session.access_token });
      if (!profile) throw httpError(403, "No profile configured for this user", true);
      if (expectedRole && String(profile.role || "").trim().toLowerCase() !== String(expectedRole).trim().toLowerCase()) {
        throw httpError(403, `This account is not a ${expectedRole} account`, true);
      }

      setAuthCookies(
        res,
        { accessToken: session.access_token, refreshToken: session.refresh_token },
        { rememberMe: !!rememberMe }
      );

      res.status(200).json({ success: true, user: { id: user.id, email: user.email }, profile });
    } catch (err) {
      next(err);
    }
  });

  router.get("/me", async (req, res, next) => {
    try {
      if (!req.auth) throw httpError(401, "Not authenticated", true);
      res.status(200).json({
        success: true,
        user: { id: req.auth.user.id, email: req.auth.user.email },
        profile: req.auth.profile,
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/logout", async (req, res) => {
    clearAuthCookies(res);
    res.status(200).json({ success: true });
  });

  return router;
}

module.exports = { createAuthRouter };
