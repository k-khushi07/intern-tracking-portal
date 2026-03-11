const { restSelect } = require("./supabaseRest");

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

function formatInternId({ prefix, year, seq }) {
  const normalizedPrefix = String(prefix || "EDCS").trim().toUpperCase();
  const normalizedYear = Number(year) || new Date().getFullYear();
  const normalizedSeq = Number(seq) || 0;
  return `${normalizedPrefix}-${normalizedYear}-${String(normalizedSeq).padStart(3, "0")}`;
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

async function loadMaxInternSequence({ prefix, year }) {
  const normalizedPrefix = String(prefix || "EDCS").trim().toUpperCase();
  const normalizedYear = Number(year) || new Date().getFullYear();

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

  return Math.max(latestFromProfiles, latestFromApproved) || 0;
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

async function generateNextInternId({ prefix = "EDCS", year = new Date().getFullYear() } = {}) {
  const normalizedPrefix = String(prefix || "EDCS").trim().toUpperCase();
  const normalizedYear = Number(year) || new Date().getFullYear();

  const maxSeq = await loadMaxInternSequence({ prefix: normalizedPrefix, year: normalizedYear });
  const startSeq = maxSeq + 1;

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidateSeq = startSeq + attempt;
    const candidateId = formatInternId({ prefix: normalizedPrefix, year: normalizedYear, seq: candidateSeq });
    const check = await checkInternIdUsage(candidateId);
    if (!check.exists) return candidateId;
  }

  throw new Error("Unable to generate a unique intern ID (too many collisions)");
}

async function peekNextInternId({ prefix = "EDCS", year = new Date().getFullYear() } = {}) {
  const normalizedPrefix = String(prefix || "EDCS").trim().toUpperCase();
  const normalizedYear = Number(year) || new Date().getFullYear();

  const maxSeq = await loadMaxInternSequence({ prefix: normalizedPrefix, year: normalizedYear });
  const next = maxSeq + 1;
  return formatInternId({ prefix: normalizedPrefix, year: normalizedYear, seq: next });
}

module.exports = { generateNextInternId, peekNextInternId, checkInternIdUsage };
