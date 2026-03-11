const { restRpc, restSelect } = require("./supabaseRest");

function parseInternSequence(internId, { prefix, year }) {
  const value = String(internId || "").trim();
  if (!value) return null;
  const safePrefix = String(prefix || "")
    .trim()
    .toUpperCase()
    .replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const safeYear = Number(year);
  const pattern = new RegExp(`^${safePrefix}-${safeYear}-(\\d+)$`, "i");
  const match = value.match(pattern);
  if (!match) return null;
  const seq = Number(match[1]);
  return Number.isFinite(seq) ? seq : null;
}

function parseRpcResponse(rpcRes) {
  if (typeof rpcRes === "string" && rpcRes.trim()) return rpcRes.trim();
  if (Array.isArray(rpcRes) && rpcRes[0]?.next_intern_id) return String(rpcRes[0].next_intern_id).trim();
  if (rpcRes?.next_intern_id) return String(rpcRes.next_intern_id).trim();
  return null;
}

async function loadLatestSequence({ prefix, year, table, extraFilters = {} }) {
  const rows = await restSelect({
    table,
    select: "intern_id",
    filters: {
      ...extraFilters,
      intern_id: `like.${prefix}-${year}-%`,
      order: "intern_id.desc",
      limit: 1,
    },
    accessToken: null,
    useServiceRole: true,
  }).catch(() => []);

  const latest = rows?.[0]?.intern_id || "";
  return parseInternSequence(latest, { prefix, year }) || 0;
}

async function generateNextInternId({ prefix = "EDCS", year = new Date().getFullYear() } = {}) {
  const normalizedPrefix = String(prefix || "EDCS").trim().toUpperCase();
  const normalizedYear = Number(year) || new Date().getFullYear();

  try {
    const rpcRes = await restRpc({
      fn: "next_intern_id",
      body: { p_prefix: normalizedPrefix },
      accessToken: null,
      useServiceRole: true,
    });
    const fromRpc = parseRpcResponse(rpcRes);
    if (fromRpc) return fromRpc;
  } catch {
    // Fall back to table scan.
  }

  const [latestFromProfiles, latestFromApproved] = await Promise.all([
    loadLatestSequence({
      prefix: normalizedPrefix,
      year: normalizedYear,
      table: "profiles",
      extraFilters: { role: "eq.intern" },
    }),
    loadLatestSequence({
      prefix: normalizedPrefix,
      year: normalizedYear,
      table: "approved_interns",
    }),
  ]);

  const next = Math.max(latestFromProfiles, latestFromApproved) + 1;
  return `${normalizedPrefix}-${normalizedYear}-${String(next).padStart(3, "0")}`;
}

async function peekNextInternId({ prefix = "EDCS", year = new Date().getFullYear() } = {}) {
  const normalizedPrefix = String(prefix || "EDCS").trim().toUpperCase();
  const normalizedYear = Number(year) || new Date().getFullYear();

  // Prefer the sequence table used by `public.next_intern_id` (no mutation).
  const sequenceRows = await restSelect({
    table: "intern_id_sequences",
    select: "year,last_number",
    filters: { year: `eq.${normalizedYear}`, limit: 1 },
    accessToken: null,
    useServiceRole: true,
  }).catch(() => []);

  const lastNumber = Number(sequenceRows?.[0]?.last_number || 0);
  if (Number.isFinite(lastNumber) && lastNumber >= 0) {
    const next = lastNumber + 1;
    return `${normalizedPrefix}-${normalizedYear}-${String(next).padStart(3, "0")}`;
  }

  // Fallback: scan existing IDs without incrementing anything.
  const [latestFromProfiles, latestFromApproved] = await Promise.all([
    loadLatestSequence({
      prefix: normalizedPrefix,
      year: normalizedYear,
      table: "profiles",
      extraFilters: { role: "eq.intern" },
    }),
    loadLatestSequence({
      prefix: normalizedPrefix,
      year: normalizedYear,
      table: "approved_interns",
    }),
  ]);

  const next = Math.max(latestFromProfiles, latestFromApproved) + 1;
  return `${normalizedPrefix}-${normalizedYear}-${String(next).padStart(3, "0")}`;
}

async function checkInternIdUsage(internId, { excludeProfileId = null } = {}) {
  const normalizedInternId = String(internId || "").trim();
  if (!normalizedInternId) return { exists: false, profileMatch: null, approvedMatch: null };

  const [profileRows, approvedRows] = await Promise.all([
    restSelect({
      table: "profiles",
      select: "id,intern_id",
      filters: { role: "eq.intern", intern_id: `eq.${normalizedInternId}` },
      accessToken: null,
      useServiceRole: true,
    }).catch(() => []),
    restSelect({
      table: "approved_interns",
      select: "id,profile_id,intern_id",
      filters: { intern_id: `eq.${normalizedInternId}` },
      accessToken: null,
      useServiceRole: true,
    }).catch(() => []),
  ]);

  const profileMatch = (profileRows || []).find((row) => {
    if (!excludeProfileId) return true;
    return String(row.id || "") !== String(excludeProfileId);
  }) || null;

  const approvedMatch = (approvedRows || []).find((row) => {
    if (!excludeProfileId) return true;
    return String(row.profile_id || "") !== String(excludeProfileId);
  }) || null;

  return {
    exists: !!(profileMatch || approvedMatch),
    profileMatch,
    approvedMatch,
  };
}

module.exports = { generateNextInternId, peekNextInternId, checkInternIdUsage };
