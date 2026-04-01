const { restSelect } = require("./supabaseRest");


function isValidIsoDate(value) {
  const raw = String(value || "").trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return false;
  const [year, month, day] = raw.split("-").map((part) => Number(part));
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return false;
  const dt = new Date(Date.UTC(year, month - 1, day));
  return dt.getUTCFullYear() === year && dt.getUTCMonth() === month - 1 && dt.getUTCDate() === day;
}

function parseIsoDate(value) {
  if (!isValidIsoDate(value)) return null;
  const [year, month, day] = value.split("-").map((part) => Number(part));
  return new Date(year, month - 1, day);
}

async function loadApprovedIntern(profileId) {
  if (!profileId) return null;
  try {
    const rows = await restSelect({
      table: "approved_interns",
      select: "id,profile_id,start_date,end_date,status,override_reason,override_at",
      filters: { profile_id: `eq.${profileId}`, limit: 1 },
      accessToken: null,
      useServiceRole: true,
    });
    return rows?.[0] || null;
  } catch {
    return null;
  }
}

function computeLifecycleStatus(approvedIntern, profileData) {
  const startDate =
    approvedIntern?.start_date ||
    profileData?.startDate ||
    profileData?.start_date;
  const endDate =
    approvedIntern?.end_date ||
    profileData?.endDate ||
    profileData?.end_date;

  if (!startDate || !endDate) return "no_dates";

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = isValidIsoDate(startDate) ? parseIsoDate(startDate) : new Date(startDate);
  const end = isValidIsoDate(endDate) ? parseIsoDate(endDate) : new Date(endDate);
  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "no_dates";
  }

  const graceEnd = new Date(end);
  graceEnd.setDate(graceEnd.getDate() + 7);

  if (today < start) return "pending";
  if (today <= end) return "active";
  if (today <= graceEnd) return "grace";
  return "inactive";
}

async function syncInternLifecycle({
  profileId,
  profileEmail,
  approvedIntern,
  profileData,
}) {
  const row = approvedIntern || (await loadApprovedIntern(profileId));
  const status = computeLifecycleStatus(row, profileData);
  return { lifecycleStatus: status };
}

module.exports = {
  computeLifecycleStatus,
  syncInternLifecycle,
  loadApprovedIntern,
};
