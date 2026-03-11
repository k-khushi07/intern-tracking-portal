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

function normalizeUpstreamStatus(status) {
  if (status === 525) return 503;
  // Cloudflare uses 52x codes for upstream handshake/availability problems.
  // Map to a more standard "bad gateway" so browsers + clients behave predictably.
  if (status >= 520 && status <= 529) return 502;
  return status;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function requestJson(url, { method, headers, body }) {
  const timeoutMs = Number(process.env.SUPABASE_REQUEST_TIMEOUT_MS || 15000);
  const maxAttempts = Number(process.env.SUPABASE_REQUEST_RETRIES || 2) + 1;

  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const res = await fetchWithTimeout(
        url,
        {
          method,
          headers: {
            "User-Agent": "intern-tracking-portal-api",
            ...(headers || {}),
          },
          body: body ? JSON.stringify(body) : undefined,
        },
        timeoutMs
      );

      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const payload = isJson ? await res.json().catch(() => null) : await res.text();

      if (!res.ok) {
        const status = normalizeUpstreamStatus(res.status);
        const isText = typeof payload === "string";
        const cloudflareHint =
          isText && /cloudflare/i.test(payload)
            ? ` (Upstream Cloudflare error ${res.status})`
            : res.status >= 520 && res.status <= 529
              ? ` (Upstream error ${res.status})`
              : "";

        const message =
          (payload && payload.msg) ||
          (payload && payload.error_description) ||
          (payload && payload.message) ||
          (payload && payload.error) ||
          (res.status === 525
            ? "Supabase upstream SSL handshake failed (Cloudflare 525). Verify SUPABASE_URL is your active project URL and check Supabase project status."
            : null) ||
          `Supabase request failed (${status})${cloudflareHint}`;

        const err = httpError(status, message, true);
        err.supabase = payload;
        err.upstreamStatus = res.status;

        // Retry transient upstream failures (and 429 rate limits).
        if (attempt < maxAttempts && (res.status >= 500 || res.status === 429 || (res.status >= 520 && res.status <= 529))) {
          await sleep(250 * attempt);
          continue;
        }

        throw err;
      }

      return payload;
    } catch (err) {
      lastErr = err;
      const isAbort = err?.name === "AbortError";
      const isFetchTypeError = err instanceof TypeError;
      const retryable = isAbort || isFetchTypeError;

      if (attempt < maxAttempts && retryable) {
        await sleep(250 * attempt);
        continue;
      }

      if (retryable) {
        const hint =
          "Cannot reach Supabase from the API server. Check your internet/VPN/firewall, and confirm SUPABASE_URL is reachable.";
        const wrapped = httpError(503, hint, true);
        wrapped.cause = err;
        throw wrapped;
      }

      throw err;
    }
  }

  throw lastErr || httpError(500, "Supabase request failed", true);
}

function buildUrl(base, path, query) {
  const url = new URL(`${base}${path}`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });
  }
  return url.toString();
}

function authHeaders({ apikey, bearer }) {
  return {
    apikey,
    Authorization: `Bearer ${bearer}`,
    "Content-Type": "application/json",
  };
}

function restHeaders({ apikey, bearer, preferReturn = true }) {
  const headers = {
    apikey,
    Authorization: `Bearer ${bearer}`,
    "Content-Type": "application/json",
  };
  if (preferReturn) headers.Prefer = "return=representation";
  return headers;
}

async function authPasswordGrant({ email, password }) {
  const { url, anonKey } = getSupabaseConfig();
  const endpoint = buildUrl(url, "/auth/v1/token", { grant_type: "password" });
  return requestJson(endpoint, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: { email, password },
  });
}

async function authRefresh({ refreshToken }) {
  const { url, anonKey } = getSupabaseConfig();
  const endpoint = buildUrl(url, "/auth/v1/token", { grant_type: "refresh_token" });
  return requestJson(endpoint, {
    method: "POST",
    headers: { apikey: anonKey, "Content-Type": "application/json" },
    body: { refresh_token: refreshToken },
  });
}

async function authGetUser({ accessToken }) {
  const { url, anonKey } = getSupabaseConfig();
  const endpoint = `${url}/auth/v1/user`;
  return requestJson(endpoint, {
    method: "GET",
    headers: authHeaders({ apikey: anonKey, bearer: accessToken }),
  });
}

async function adminCreateUser({ email, password, userMetadata, appMetadata }) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const endpoint = `${url}/auth/v1/admin/users`;
  return requestJson(endpoint, {
    method: "POST",
    headers: authHeaders({ apikey: serviceRoleKey, bearer: serviceRoleKey }),
    body: {
      email,
      password,
      email_confirm: true,
      user_metadata: userMetadata || {},
      app_metadata: appMetadata || {},
    },
  });
}

async function adminDeleteUser({ userId, softDelete = false }) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const endpoint = `${url}/auth/v1/admin/users/${userId}`;
  return requestJson(endpoint, {
    method: "DELETE",
    headers: authHeaders({ apikey: serviceRoleKey, bearer: serviceRoleKey }),
    body: { should_soft_delete: !!softDelete },
  });
}

async function restSelect({ table, select, filters, accessToken, useServiceRole = false }) {
  const { url, anonKey, serviceRoleKey } = getSupabaseConfig();
  const endpoint = new URL(`${url}/rest/v1/${table}`);
  endpoint.searchParams.set("select", select || "*");
  Object.entries(filters || {}).forEach(([k, v]) => endpoint.searchParams.set(k, v));

  const bearer = useServiceRole ? serviceRoleKey : accessToken;
  const apikey = useServiceRole ? serviceRoleKey : anonKey;

  return requestJson(endpoint.toString(), {
    method: "GET",
    headers: restHeaders({ apikey, bearer, preferReturn: false }),
  });
}

async function restInsert({ table, rows, accessToken, useServiceRole = false }) {
  const { url, anonKey, serviceRoleKey } = getSupabaseConfig();
  const bearer = useServiceRole ? serviceRoleKey : accessToken;
  const apikey = useServiceRole ? serviceRoleKey : anonKey;
  const body = Array.isArray(rows) ? rows : [rows];
  return requestJson(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: restHeaders({ apikey, bearer, preferReturn: true }),
    body,
  });
}

async function restUpdate({ table, patch, matchQuery, accessToken, useServiceRole = false }) {
  const { url, anonKey, serviceRoleKey } = getSupabaseConfig();
  const endpoint = new URL(`${url}/rest/v1/${table}`);
  Object.entries(matchQuery || {}).forEach(([k, v]) => endpoint.searchParams.set(k, v));
  const bearer = useServiceRole ? serviceRoleKey : accessToken;
  const apikey = useServiceRole ? serviceRoleKey : anonKey;
  return requestJson(endpoint.toString(), {
    method: "PATCH",
    headers: restHeaders({ apikey, bearer, preferReturn: true }),
    body: patch,
  });
}

async function restDelete({ table, matchQuery, accessToken, useServiceRole = false }) {
  const { url, anonKey, serviceRoleKey } = getSupabaseConfig();
  const endpoint = new URL(`${url}/rest/v1/${table}`);
  Object.entries(matchQuery || {}).forEach(([k, v]) => endpoint.searchParams.set(k, v));
  const bearer = useServiceRole ? serviceRoleKey : accessToken;
  const apikey = useServiceRole ? serviceRoleKey : anonKey;
  return requestJson(endpoint.toString(), {
    method: "DELETE",
    headers: restHeaders({ apikey, bearer, preferReturn: true }),
  });
}

async function restRpc({ fn, body, accessToken, useServiceRole = false }) {
  const { url, anonKey, serviceRoleKey } = getSupabaseConfig();
  const bearer = useServiceRole ? serviceRoleKey : accessToken;
  const apikey = useServiceRole ? serviceRoleKey : anonKey;
  return requestJson(`${url}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: restHeaders({ apikey, bearer, preferReturn: true }),
    body: body || {},
  });
}

module.exports = {
  authPasswordGrant,
  authRefresh,
  authGetUser,
  adminCreateUser,
  adminDeleteUser,
  restSelect,
  restInsert,
  restUpdate,
  restDelete,
  restRpc,
};
