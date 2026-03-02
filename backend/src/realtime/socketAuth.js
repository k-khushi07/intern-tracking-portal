const { authGetUser, authRefresh, restSelect } = require("../services/supabaseRest");

function parseCookies(cookieHeader) {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(";").forEach((part) => {
    const [rawKey, ...rawVal] = part.trim().split("=");
    if (!rawKey) return;
    cookies[rawKey] = decodeURIComponent(rawVal.join("="));
  });
  return cookies;
}

const ACCESS_COOKIE = "itp_access_token";
const REFRESH_COOKIE = "itp_refresh_token";

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

function createSocketAuthMiddleware() {
  return async (socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie || "");
      let accessToken = cookies[ACCESS_COOKIE];
      const refreshToken = cookies[REFRESH_COOKIE];
      if (!accessToken) return next(new Error("Not authenticated"));

      let user;
      try {
        user = await authGetUser({ accessToken });
      } catch (err) {
        if (!refreshToken || !isJwtAuthError(err)) throw err;
        const refreshed = await authRefresh({ refreshToken });
        accessToken = refreshed.access_token;
        user = await authGetUser({ accessToken });
      }

      const profile = await loadProfile({ userId: user.id, accessToken });
      if (!profile) return next(new Error("No profile configured for this user"));

      socket.data.auth = { user, profile, accessToken };
      return next();
    } catch (err) {
      return next(new Error(err?.message || "Not authenticated"));
    }
  };
}

module.exports = { createSocketAuthMiddleware };
