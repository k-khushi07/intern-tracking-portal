const { httpError } = require("../errors");

function requireEnv(name) {
  const value = process.env[name];
  if (!value) throw httpError(500, `Missing required env var: ${name}`, true);
  return String(value).trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
}

function readOptionalEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim().replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
  return trimmed ? trimmed : null;
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

function normalizeSupabaseUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(String(url));
    // Most callers want an origin like https://xyz.supabase.co (no path/query).
    return parsed.origin.replace(/\/$/, "");
  } catch {
    return null;
  }
}

function getSupabaseConfig() {
  const anonKey = requireEnv("SUPABASE_ANON_KEY");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const anonRef = decodeJwtPayload(anonKey)?.ref || null;
  const serviceRef = decodeJwtPayload(serviceRoleKey)?.ref || null;
  const tokenRef = anonRef || serviceRef || null;

  const strictUrl = String(process.env.SUPABASE_URL_STRICT || "").trim().toLowerCase() === "true";
  const rawUrl = readOptionalEnv("SUPABASE_URL");
  const normalizedUrl = normalizeSupabaseUrl(rawUrl);
  const urlRef = getProjectRefFromUrl(normalizedUrl);

  let url = normalizedUrl;
  if (!url && tokenRef) url = `https://${tokenRef}.supabase.co`;

  if (!url) {
    throw httpError(
      500,
      "Missing required env var: SUPABASE_URL (or provide valid SUPABASE_*_KEY so the URL can be inferred)",
      true
    );
  }

  if (urlRef && anonRef && urlRef !== anonRef) {
    if (strictUrl) throw httpError(500, "SUPABASE_URL and SUPABASE_ANON_KEY belong to different projects", true);
    url = `https://${anonRef}.supabase.co`;
    console.warn(
      "[supabase] SUPABASE_URL does not match SUPABASE_ANON_KEY; using URL inferred from SUPABASE_ANON_KEY ref instead."
    );
  }
  if (urlRef && serviceRef && urlRef !== serviceRef) {
    if (strictUrl) throw httpError(500, "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY belong to different projects", true);
    url = `https://${serviceRef}.supabase.co`;
    console.warn(
      "[supabase] SUPABASE_URL does not match SUPABASE_SERVICE_ROLE_KEY; using URL inferred from service role ref instead."
    );
  }

  return { url, anonKey, serviceRoleKey };
}

module.exports = {
  getSupabaseConfig,
  requireEnv,
};
