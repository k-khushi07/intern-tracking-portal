const { httpError } = require("../errors");
const { authGetUser, authRefresh, restSelect } = require("../services/supabaseRest");
const { getTokensFromRequest, setAuthCookies, clearAuthCookies } = require("../services/authCookies");

async function loadProfile({ userId, accessToken }) {
    const rows = await restSelect({
      table: "profiles",
      select: "id,email,full_name,role,status,pm_code,intern_id,pm_id,profile_completed,profile_data",
    filters: { id: `eq.${userId}`, limit: 1 },
    accessToken: null,
    useServiceRole: true,
  });
  const profile = rows?.[0] || null;
  if (profile?.role) profile.role = String(profile.role).trim().toLowerCase();
  return profile;
}

function isJwtAuthError(err) {
  const status = Number(err?.status || 0);
  if (![401, 403].includes(status)) return false;
  const msg = String(err?.message || "").toLowerCase();
  return (
    msg.includes("invalid jwt") ||
    msg.includes("jwt expired") ||
    msg.includes("token is expired") ||
    msg.includes("expired")
  );
}

async function loadSession(req, res) {
  const { accessToken, refreshToken, rememberMe } = getTokensFromRequest(req);
  if (!accessToken) return null;

  try {
    const user = await authGetUser({ accessToken });
    const profile = await loadProfile({ userId: user.id, accessToken });
    return profile ? { user, profile, accessToken, refreshToken } : null;
  } catch (err) {
    if (!refreshToken) return null;
    const status = Number(err?.status || 0);
    const shouldRefresh = status === 401 || isJwtAuthError(err);
    if (!shouldRefresh) return null;

    try {
      const refreshed = await authRefresh({ refreshToken });
      setAuthCookies(
        res,
        { accessToken: refreshed.access_token, refreshToken: refreshed.refresh_token },
        { rememberMe: !!rememberMe }
      );
      const user = await authGetUser({ accessToken: refreshed.access_token });
      const profile = await loadProfile({ userId: user.id, accessToken: refreshed.access_token });
      return profile
        ? { user, profile, accessToken: refreshed.access_token, refreshToken: refreshed.refresh_token }
        : null;
    } catch {
      return null;
    }
  }
}

function createAuthMiddleware() {
  async function requireAuth(req, res, next) {
    try {
      const session = await loadSession(req, res);
      if (!session) return next(httpError(401, "Unauthorized", true));
      req.auth = session;
      return next();
    } catch (err) {
      return next(httpError(401, "Unauthorized", true));
    }
  }

  async function requireAuthOptional(req, res, next) {
    try {
      req.auth = await loadSession(req, res);
      return next();
    } catch (err) {
      // Optional auth must never block requests like `/api/auth/login`.
      // If cookies contain an expired/invalid JWT, treat as anonymous and continue.
      try {
        clearAuthCookies(res);
      } catch {
        // ignore
      }
      req.auth = null;
      return next();
    }
  }

  function requireRole(...roles) {
    return (req, res, next) => {
      const currentRole = String(req.auth?.profile?.role || "")
        .trim()
        .toLowerCase();
      if (!currentRole) return next(httpError(401, "Unauthorized", true));
      const required = roles.map((r) => String(r).trim().toLowerCase());
      if (!required.includes(currentRole)) {
        return next(httpError(403, `Forbidden (requires: ${required.join(", ")}; current: ${currentRole})`, true));
      }
      return next();
    };
  }

  return { requireAuth, requireAuthOptional, requireRole };
}

module.exports = { createAuthMiddleware };
