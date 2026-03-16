const { restSelect } = require("./supabaseRest");

function parseHrSequence(hrCode) {
  const value = String(hrCode || "").trim();
  if (!value) return null;
  const match = value.match(/(\d+)(?!.*\d)/);
  if (!match) return null;
  const sequence = Number(match[1]);
  return Number.isFinite(sequence) ? sequence : null;
}

function normalizeHrCode(value, { width = 3 } = {}) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const body = raw.replace(/^hr-/i, "").trim();
  const paddedWidth = Math.max(1, Number(width) || 3);
  if (/^\d+$/.test(body)) return `HR-${String(body).padStart(paddedWidth, "0")}`;
  if (/^\d+$/.test(raw)) return `HR-${String(raw).padStart(paddedWidth, "0")}`;
  return raw.toUpperCase().startsWith("HR-") ? raw : `HR-${raw}`;
}

async function generateNextHrCode({ width = 3 } = {}) {
  const rows = await restSelect({
    table: "profiles",
    select: "pm_code",
    filters: { role: "eq.hr", limit: 5000 },
    accessToken: null,
    useServiceRole: true,
  }).catch(() => []);

  const maxSequence = (rows || []).reduce((max, row) => {
    const seq = parseHrSequence(row?.pm_code);
    if (!Number.isFinite(seq)) return max;
    return Math.max(max, seq);
  }, 0);

  const padded = String(maxSequence + 1).padStart(Math.max(1, Number(width) || 3), "0");
  return `HR-${padded}`;
}

async function checkHrCodeUsage(hrCode, { excludeProfileId = null } = {}) {
  const normalized = normalizeHrCode(hrCode);
  if (!normalized) return { exists: false, profileMatch: null };

  const rows = await restSelect({
    table: "profiles",
    select: "id,pm_code,role",
    filters: { pm_code: `eq.${normalized}`, limit: 10 },
    accessToken: null,
    useServiceRole: true,
  }).catch(() => []);

  const profileMatch =
    (rows || []).find((row) => {
      if (!excludeProfileId) return true;
      return String(row.id || "") !== String(excludeProfileId);
    }) || null;

  return { exists: !!profileMatch, profileMatch };
}

module.exports = { generateNextHrCode, normalizeHrCode, checkHrCodeUsage };

