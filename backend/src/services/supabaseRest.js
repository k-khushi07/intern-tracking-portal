const { httpError } = require("../errors");
const { getSupabaseConfig } = require("./supabaseConfig");
const http = require("node:http");
const https = require("node:https");

function normalizeUpstreamStatus(status) {
  if (status === 525) return 503;
  // Cloudflare uses 52x codes for upstream handshake/availability problems.
  // Map to a more standard "bad gateway" so browsers + clients behave predictably.
  if (status >= 520 && status <= 529) return 502;
  return status;
}

function safeUrlHost(url) {
  try {
    return new URL(String(url)).host || null;
  } catch {
    return null;
  }
}

function extractNetworkErrorCode(err) {
  const directCode = err?.code || err?.cause?.code;
  if (directCode) return String(directCode);

  const cause = err?.cause;
  const nestedErrors = Array.isArray(cause?.errors) ? cause.errors : null;
  const nestedCode = nestedErrors?.[0]?.code;
  return nestedCode ? String(nestedCode) : null;
}

function buildConnectivityHint({ url, err }) {
  const host = safeUrlHost(url);
  const code = extractNetworkErrorCode(err);

  const base =
    "Cannot reach Supabase from the API server. Check your internet/VPN/firewall, and confirm SUPABASE_URL is reachable.";

  if (!code && !host) return base;

  const details = [];
  if (host) details.push(`host: ${host}`);
  if (code) details.push(`code: ${code}`);

  const extra =
    code === "EACCES" || code === "EPERM"
      ? "Outbound HTTPS connections appear blocked for this Node process (firewall/policy). Allow Node.js to access the internet, or run the API in an environment with outbound access."
      : code === "ENOTFOUND"
        ? "DNS lookup failed for the Supabase host. Verify SUPABASE_URL is correct."
        : code === "ETIMEDOUT" || code === "UND_ERR_CONNECT_TIMEOUT"
          ? "Connection timed out. Check VPN/proxy/firewall rules (some networks block Supabase/Cloudflare)."
        : code === "ECONNREFUSED"
          ? "Connection refused. Check network policy and that SUPABASE_URL is correct."
          : null;

  return `${base} (${details.join(", ")})${extra ? ` ${extra}` : ""}`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestRaw(url, { method, headers, body }, timeoutMs) {
  const target = new URL(String(url));
  const isHttps = target.protocol === "https:";
  const transport = isHttps ? https : http;

  const payload = body ? JSON.stringify(body) : null;

  const requestOptions = {
    protocol: target.protocol,
    hostname: target.hostname,
    port: target.port || (isHttps ? 443 : 80),
    method,
    path: `${target.pathname}${target.search}`,
    headers: {
      "User-Agent": "intern-tracking-portal-api",
      ...(headers || {}),
      ...(payload ? { "Content-Length": Buffer.byteLength(payload) } : {}),
    },
  };

  return new Promise((resolve, reject) => {
    const req = transport.request(requestOptions, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const buf = Buffer.concat(chunks);
        resolve({
          status: res.statusCode || 0,
          headers: res.headers || {},
          bodyText: buf.toString("utf8"),
        });
      });
    });

    const timer = setTimeout(() => {
      const timeoutErr = new Error(`Request timed out after ${timeoutMs}ms`);
      timeoutErr.name = "TimeoutError";
      timeoutErr.code = "ETIMEDOUT";
      req.destroy(timeoutErr);
    }, timeoutMs);

    req.on("error", (err) => reject(err));
    req.on("close", () => clearTimeout(timer));

    if (payload) req.write(payload);
    req.end();
  });
}

async function requestJson(url, { method, headers, body }) {
  const timeoutMs = Number(process.env.SUPABASE_REQUEST_TIMEOUT_MS || 15000);
  const maxAttempts = Number(process.env.SUPABASE_REQUEST_RETRIES || 2) + 1;

  let lastErr = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const res = await requestRaw(url, { method, headers, body }, timeoutMs);

      const contentType = String(res.headers?.["content-type"] || "");
      const isJson = contentType.includes("application/json");
      const payload = isJson
        ? (() => {
            try {
              return JSON.parse(res.bodyText || "null");
            } catch {
              return null;
            }
          })()
        : res.bodyText;

      if (res.status < 200 || res.status >= 300) {
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
        if (
          attempt < maxAttempts &&
          (res.status >= 500 || res.status === 429 || (res.status >= 520 && res.status <= 529))
        ) {
          await sleep(250 * attempt);
          continue;
        }

        throw err;
      }

      return payload;
    } catch (err) {
      lastErr = err;
      const code = String(extractNetworkErrorCode(err) || "");
      const retryableCodes = new Set([
        "ETIMEDOUT",
        "UND_ERR_CONNECT_TIMEOUT",
        "ENOTFOUND",
        "EAI_AGAIN",
        "ECONNREFUSED",
        "ECONNRESET",
        "EHOSTUNREACH",
        "ENETUNREACH",
        "EACCES",
        "EPERM",
      ]);
      const retryable =
        err?.name === "TimeoutError" ||
        retryableCodes.has(code) ||
        err instanceof TypeError;

      if (attempt < maxAttempts && retryable) {
        await sleep(250 * attempt);
        continue;
      }

      if (retryable) {
        const hint = buildConnectivityHint({ url, err });
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
