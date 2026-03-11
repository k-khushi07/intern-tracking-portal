const { restSelect, restInsert, restUpdate } = require("./supabaseRest");

function isoNow() {
  return new Date().toISOString();
}

function isMissingTableError(err, tableName) {
  const message = String(err?.message || "");
  const supabaseMessage = String(err?.supabase?.message || err?.supabase?.error || "");
  const combined = `${message} ${supabaseMessage}`.toLowerCase();
  const table = String(tableName || "").toLowerCase();
  if (!table) return false;
  return (
    combined.includes(`could not find the table 'public.${table}'`) ||
    combined.includes(`relation "public.${table}" does not exist`) ||
    combined.includes(`relation "${table}" does not exist`) ||
    (String(err?.supabase?.code || "") === "PGRST205" && combined.includes(table))
  );
}

async function listNotifications({ profileId, limit = 50 } = {}) {
  const rows = await restSelect({
    table: "notifications",
    select: "id,recipient_profile_id,title,message,type,category,link,metadata,read_at,created_at",
    filters: { recipient_profile_id: `eq.${profileId}`, order: "created_at.desc", limit: Math.min(200, Math.max(1, Number(limit) || 50)) },
    accessToken: null,
    useServiceRole: true,
  });
  return rows || [];
}

async function countUnread({ profileId } = {}) {
  const rows = await restSelect({
    table: "notifications",
    select: "id",
    filters: { recipient_profile_id: `eq.${profileId}`, read_at: "is.null", limit: 500 },
    accessToken: null,
    useServiceRole: true,
  });
  return (rows || []).length;
}

async function createNotifications({ rows } = {}) {
  const payload = Array.isArray(rows) ? rows : [rows];
  const cleaned = payload
    .map((r) => ({
      recipient_profile_id: r.recipient_profile_id,
      title: r.title,
      message: r.message || null,
      type: r.type || "info",
      category: r.category || null,
      link: r.link || null,
      metadata: r.metadata || {},
      read_at: null,
      created_at: r.created_at || isoNow(),
    }))
    .filter((r) => r.recipient_profile_id && r.title);

  if (!cleaned.length) return [];
  return restInsert({
    table: "notifications",
    rows: cleaned,
    accessToken: null,
    useServiceRole: true,
  });
}

async function markRead({ profileId, notificationId } = {}) {
  const now = isoNow();
  const updated = await restUpdate({
    table: "notifications",
    patch: { read_at: now },
    matchQuery: { id: `eq.${notificationId}`, recipient_profile_id: `eq.${profileId}` },
    accessToken: null,
    useServiceRole: true,
  });
  return Array.isArray(updated) ? updated[0] : updated;
}

async function markAllRead({ profileId } = {}) {
  const now = isoNow();
  return restUpdate({
    table: "notifications",
    patch: { read_at: now },
    matchQuery: { recipient_profile_id: `eq.${profileId}`, read_at: "is.null" },
    accessToken: null,
    useServiceRole: true,
  });
}

async function listProfilesByRole(role) {
  const rows = await restSelect({
    table: "profiles",
    select: "id",
    filters: { role: `eq.${String(role || "").trim().toLowerCase()}` },
    accessToken: null,
    useServiceRole: true,
  });
  return (rows || []).map((r) => r.id).filter(Boolean);
}

function toClientNotification(row) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    message: row.message || "",
    type: row.type || "info",
    category: row.category || null,
    link: row.link || null,
    metadata: row.metadata || {},
    readAt: row.read_at || null,
    createdAt: row.created_at || null,
    read: !!row.read_at,
  };
}

module.exports = {
  isoNow,
  isMissingTableError,
  listNotifications,
  countUnread,
  createNotifications,
  markRead,
  markAllRead,
  listProfilesByRole,
  toClientNotification,
};

