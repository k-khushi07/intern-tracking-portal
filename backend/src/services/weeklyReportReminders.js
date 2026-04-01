const { restSelect } = require("./supabaseRest");
const { createNotifications, listProfilesByRole, toClientNotification, isMissingTableError } = require("./notifications");

const IST_TIMEZONE = "Asia/Kolkata";
const IST_OFFSET_MINUTES = 330;
const WEEKDAY_INDEX = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatYmd({ year, month, day }) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function getTimeParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    hourCycle: "h23",
  }).formatToParts(date);
  const out = {};
  parts.forEach((p) => {
    if (p.type && p.value) out[p.type] = p.value;
  });
  return {
    year: Number(out.year),
    month: Number(out.month),
    day: Number(out.day),
    hour: Number(out.hour),
    minute: Number(out.minute),
    second: Number(out.second),
    weekday: String(out.weekday || "").toLowerCase(),
  };
}

function istParts(date = new Date()) {
  return getTimeParts(date, IST_TIMEZONE);
}

function istDateTimeToUtcMs({ year, month, day, hour, minute, second }) {
  if (!year || !month || !day) return null;
  const utcMs = Date.UTC(year, month - 1, day, hour || 0, minute || 0, second || 0);
  return utcMs - IST_OFFSET_MINUTES * 60 * 1000;
}

function addDaysToIsoDate(isoDate, days) {
  if (!isoDate) return null;
  const base = new Date(`${isoDate}T00:00:00Z`);
  if (Number.isNaN(base.getTime())) return null;
  base.setUTCDate(base.getUTCDate() + Number(days || 0));
  return base.toISOString().slice(0, 10);
}

function computeNextFridayReminder(now = new Date()) {
  const parts = istParts(now);
  const weekdayKey = parts.weekday.slice(0, 3);
  const weekday = WEEKDAY_INDEX[weekdayKey];
  const targetWeekday = WEEKDAY_INDEX.fri;
  const isFriday = weekday === targetWeekday;
  const afterCutoff =
    parts.hour > 15 || (parts.hour === 15 && (parts.minute > 0 || parts.second > 0));
  let daysUntil = (targetWeekday - weekday + 7) % 7;
  if (daysUntil === 0 && afterCutoff) daysUntil = 7;

  const todayIso = formatYmd(parts);
  const targetIso = addDaysToIsoDate(todayIso, daysUntil) || todayIso;
  const targetParts = {
    year: Number(targetIso.slice(0, 4)),
    month: Number(targetIso.slice(5, 7)),
    day: Number(targetIso.slice(8, 10)),
    hour: 15,
    minute: 0,
    second: 0,
  };
  const targetUtcMs = istDateTimeToUtcMs(targetParts);
  return { targetUtcMs, targetIso, isFriday, todayIso };
}

async function sendWeeklyReportReminders({ io } = {}) {
  const { todayIso } = computeNextFridayReminder(new Date());
  try {
    const internIds = await listProfilesByRole("intern");
    if (!internIds.length) return;

    let submitted = [];
    try {
      submitted = await restSelect({
        table: "reports",
        select: "intern_profile_id",
        filters: {
          report_type: "eq.weekly",
          period_start: `lte.${todayIso}`,
          period_end: `gte.${todayIso}`,
          limit: 500,
        },
        accessToken: null,
        useServiceRole: true,
      });
    } catch (err) {
      if (!String(err?.message || "").includes("reports")) throw err;
    }

    const submittedIds = new Set((submitted || []).map((r) => r.intern_profile_id).filter(Boolean));
    const targets = (internIds || []).filter((id) => !submittedIds.has(id));
    if (!targets.length) return;

    const notifications = await createNotifications({
      rows: targets.map((id) => ({
        recipient_profile_id: id,
        title: "Weekly report reminder",
        message: "Intern, submit your weekly report.",
        type: "reminder",
        category: "report",
        metadata: { kind: "weekly_report_reminder", dueDate: todayIso },
      })),
    });

    if (io) {
      const rows = Array.isArray(notifications) ? notifications : [notifications];
      rows.filter(Boolean).forEach((row) => {
        io.to(`user:${row.recipient_profile_id}`).emit("itp:notification", { notification: toClientNotification(row) });
      });
    }
  } catch (err) {
    if (!isMissingTableError(err, "notifications")) {
      console.error("Failed to send weekly report reminders:", err);
    }
  }
}

function scheduleWeeklyReportReminders({ io } = {}) {
  let timer = null;

  const scheduleNext = () => {
    const { targetUtcMs } = computeNextFridayReminder(new Date());
    if (!targetUtcMs) return;
    const delayMs = Math.max(1000, targetUtcMs - Date.now());
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      await sendWeeklyReportReminders({ io });
      scheduleNext();
    }, delayMs);
  };

  scheduleNext();
  return () => {
    if (timer) clearTimeout(timer);
  };
}

module.exports = { scheduleWeeklyReportReminders, sendWeeklyReportReminders };
