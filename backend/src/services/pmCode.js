const { restSelect } = require("./supabaseRest");

function parsePmSequence(pmCode) {
  const value = String(pmCode || "").trim();
  if (!value) return null;
  const match = value.match(/(\d+)(?!.*\d)/);
  if (!match) return null;
  const sequence = Number(match[1]);
  return Number.isFinite(sequence) ? sequence : null;
}

async function generateNextPmCode({ width = 3 } = {}) {
  const rows = await restSelect({
    table: "profiles",
    select: "pm_code",
    filters: { role: "eq.pm", limit: 5000 },
    accessToken: null,
    useServiceRole: true,
  }).catch(() => []);

  const maxSequence = (rows || []).reduce((max, row) => {
    const seq = parsePmSequence(row?.pm_code);
    if (!Number.isFinite(seq)) return max;
    return Math.max(max, seq);
  }, 0);

  return String(maxSequence + 1).padStart(Math.max(1, Number(width) || 3), "0");
}

async function checkPmCodeUsage(pmCode, { excludeProfileId = null } = {}) {
  const normalizedPmCode = String(pmCode || "").trim();
  if (!normalizedPmCode) return { exists: false, profileMatch: null };

  const rows = await restSelect({
    table: "profiles",
    select: "id,pm_code",
    filters: { role: "eq.pm", pm_code: `eq.${normalizedPmCode}` },
    accessToken: null,
    useServiceRole: true,
  }).catch(() => []);

  const profileMatch = (rows || []).find((row) => {
    if (!excludeProfileId) return true;
    return String(row.id || "") !== String(excludeProfileId);
  }) || null;

  return { exists: !!profileMatch, profileMatch };
}

module.exports = { generateNextPmCode, checkPmCodeUsage };
