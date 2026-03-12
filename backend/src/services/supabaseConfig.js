const { httpError } = require("../errors");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw httpError(500, `Missing required env var: ${name}`, true);
  return String(value).trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
}

function decodeJwtPayload(token) {
  try {
    const payload = String(token || "").split(".")[1];
    if (!payload) return null;
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

function getProjectRefFromUrl(url) {
  const match = String(url || "").match(/^https?:\/\/([^.]+)\.supabase\.co\/?$/i);
  return match?.[1] || null;
}

function getSupabaseConfig() {
  const url = requireEnv("SUPABASE_URL").replace(/\/$/, "");
  const anonKey = requireEnv("SUPABASE_ANON_KEY");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const urlRef = getProjectRefFromUrl(url);
  const anonRef = decodeJwtPayload(anonKey)?.ref || null;
  const serviceRef = decodeJwtPayload(serviceRoleKey)?.ref || null;

  if (urlRef && anonRef && urlRef !== anonRef) {
    throw httpError(500, "SUPABASE_URL and SUPABASE_ANON_KEY belong to different projects", true);
  }
  if (urlRef && serviceRef && urlRef !== serviceRef) {
    throw httpError(500, "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY belong to different projects", true);
  }

  return { url, anonKey, serviceRoleKey };
}

module.exports = {
  getSupabaseConfig,
  requireEnv,
};
