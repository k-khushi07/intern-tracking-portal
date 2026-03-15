const express = require("express");
const { httpError } = require("../errors");
const { restSelect, restInsert, restUpdate, restDelete } = require("../services/supabaseRest");

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

function isIsoDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());
}

function normalizeTime(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  const secs = match[3] ? Number(match[3]) : 0;
  if (hours < 0 || hours > 23 || mins < 0 || mins > 59 || secs < 0 || secs > 59) return null;
  return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}${match[3] ? `:${String(secs).padStart(2, "0")}` : ""}`;
}

function timeHmsToSeconds(value) {
  const normalized = normalizeTime(value);
  if (!normalized) return null;
  const parts = normalized.split(":").map((p) => Number(p));
  const hh = parts[0] || 0;
  const mm = parts[1] || 0;
  const ss = parts[2] || 0;
  return hh * 3600 + mm * 60 + ss;
}

const ALLOWED_STATUSES = new Set(["present", "absent", "leave", "half_day", "remote"]);

function normalizeStatus(value) {
  const status = String(value || "").trim().toLowerCase();
  return ALLOWED_STATUSES.has(status) ? status : null;
}

function startOfMonthIsoDate(input = new Date()) {
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  const start = new Date(d.getFullYear(), d.getMonth(), 1);
  const yyyy = start.getFullYear();
  const mm = String(start.getMonth() + 1).padStart(2, "0");
  const dd = String(start.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function todayIsoDate() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function dateIsoToUtcMs(isoDate) {
  if (!isIsoDateString(isoDate)) return null;
  const [yyyy, mm, dd] = String(isoDate).split("-").map((p) => Number(p));
  if (!yyyy || !mm || !dd) return null;
  return Date.UTC(yyyy, mm - 1, dd);
}

function utcMsToIsoDate(ms) {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function enumerateIsoDates(startIso, endIso) {
  const startMs = dateIsoToUtcMs(startIso);
  const endMs = dateIsoToUtcMs(endIso);
  if (startMs == null || endMs == null) return [];
  const out = [];
  for (let ms = startMs; ms <= endMs; ms += 86400000) {
    const iso = utcMsToIsoDate(ms);
    if (iso) out.push(iso);
  }
  return out;
}

function resolvePunchDate(requestedDateIso) {
  const serverToday = todayIsoDate();
  if (!requestedDateIso) return serverToday;

  const normalized = String(requestedDateIso || "").trim();
  if (!isIsoDateString(normalized)) throw httpError(400, "date must be in YYYY-MM-DD format", true);

  const serverMs = dateIsoToUtcMs(serverToday);
  const reqMs = dateIsoToUtcMs(normalized);
  if (serverMs == null || reqMs == null) throw httpError(400, "date must be in YYYY-MM-DD format", true);

  const diffDays = Math.round((reqMs - serverMs) / 86400000);
  if (Math.abs(diffDays) > 1) {
    throw httpError(400, `date must be within 1 day of server date (${serverToday})`, true);
  }
  return normalized;
}

function nowTimeHmsLocal() {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

function parseRange({ start, end }) {
  const startDate = start ? String(start).trim() : "";
  const endDate = end ? String(end).trim() : "";

  const fallbackStart = startOfMonthIsoDate();
  const fallbackEnd = todayIsoDate();

  const resolvedStart = startDate || fallbackStart;
  const resolvedEnd = endDate || fallbackEnd;

  if (!isIsoDateString(resolvedStart) || !isIsoDateString(resolvedEnd)) {
    throw httpError(400, "start and end must be in YYYY-MM-DD format", true);
  }
  if (resolvedEnd < resolvedStart) throw httpError(400, "end must be on or after start", true);

  return { start: resolvedStart, end: resolvedEnd };
}

async function assertInternExists(internId) {
  const rows = await restSelect({
    table: "profiles",
    select: "id,role,pm_id",
    filters: { id: `eq.${internId}`, limit: 1 },
    accessToken: null,
    useServiceRole: true,
  });
  const intern = rows?.[0] || null;
  if (!intern || String(intern.role || "").toLowerCase() !== "intern") throw httpError(404, "Intern not found", true);
  return intern;
}

async function assertInternBelongsToPm({ pmId, internId }) {
  const rows = await restSelect({
    table: "profiles",
    select: "id,role,pm_id",
    filters: { id: `eq.${internId}`, limit: 1 },
    accessToken: null,
    useServiceRole: true,
  });
  const intern = rows?.[0] || null;
  if (!intern || String(intern.role || "").toLowerCase() !== "intern") throw httpError(404, "Intern not found", true);
  if (intern.pm_id !== pmId) throw httpError(403, "Forbidden", true);
  return true;
}

function mapAttendanceRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    internId: row.intern_profile_id,
    date: row.attendance_date,
    status: row.status,
    checkIn: row.check_in || null,
    checkOut: row.check_out || null,
    notes: row.notes || "",
    markedBy: row.marked_by || null,
    markedAt: row.marked_at || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function missingAttendanceTable(err) {
  if (!isMissingTableError(err, "attendance")) return err;
  const next = httpError(
    400,
    "Attendance table not found. Run Supabase migration 014_add_attendance.sql (or re-run supabase/schema.sql).",
    true
  );
  next.cause = err;
  return next;
}

function missingLeaveRequestsTable(err) {
  if (!isMissingTableError(err, "leave_requests")) return err;
  const next = httpError(
    400,
    "Leave requests table not found. Run Supabase migration 015_add_leave_requests.sql (or re-run supabase/schema.sql).",
    true
  );
  next.cause = err;
  return next;
}

function mapLeaveRequestRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    internId: row.intern_profile_id,
    startDate: row.start_date,
    endDate: row.end_date,
    reason: row.reason || "",
    status: row.status,
    requestedAt: row.requested_at || row.created_at || null,
    reviewedBy: row.reviewed_by || null,
    reviewedAt: row.reviewed_at || null,
    reviewNotes: row.review_notes || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function createAttendanceRouter() {
  const router = express.Router();

  router.post("/self/punch-in", async (req, res, next) => {
    try {
      const role = String(req.auth?.profile?.role || "").trim().toLowerCase();
      if (role !== "intern") throw httpError(403, "Forbidden", true);

      const internId = req.auth.profile.id;
      const { status, notes, date: requestedDate } = req.body || {};
      const date = resolvePunchDate(requestedDate);

      const normalizedStatus = normalizeStatus(status || "present");
      if (!normalizedStatus || !["present", "remote", "half_day"].includes(normalizedStatus)) {
        throw httpError(400, "status must be one of: present, remote, half_day", true);
      }

      const existing = await restSelect({
        table: "attendance",
        select: "*",
        filters: { intern_profile_id: `eq.${internId}`, attendance_date: `eq.${date}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      }).catch((err) => {
        throw missingAttendanceTable(err);
      });

      const nowIso = new Date().toISOString();
      const timeNow = nowTimeHmsLocal();

      const patch = {
        status: normalizedStatus,
        check_in: timeNow,
        updated_at: nowIso,
        marked_by: internId,
        marked_at: nowIso,
      };
      if (notes !== undefined) patch.notes = String(notes || "");

      let saved;
      if (existing?.[0]?.id) {
        if (existing[0].check_in) throw httpError(409, "Already punched in for today", true);
        saved = await restUpdate({
          table: "attendance",
          patch,
          matchQuery: { id: `eq.${existing[0].id}` },
          accessToken: null,
          useServiceRole: true,
        }).catch((err) => {
          throw missingAttendanceTable(err);
        });
      } else {
        saved = await restInsert({
          table: "attendance",
          rows: {
            intern_profile_id: internId,
            attendance_date: date,
            notes: "",
            ...patch,
            created_at: nowIso,
          },
          accessToken: null,
          useServiceRole: true,
        }).catch((err) => {
          throw missingAttendanceTable(err);
        });
      }

      const row = Array.isArray(saved) ? saved[0] : saved;
      const io = req.app.get("io");
      if (io) {
        io.to(`user:${internId}`).emit("itp:changed", { entity: "attendance", action: "upsert", internId, date });
        io.to("role:hr").emit("itp:changed", { entity: "attendance", action: "upsert", internId, date });
      }

      res.status(existing?.[0]?.id ? 200 : 201).json({ success: true, attendance: mapAttendanceRow(row) });
    } catch (err) {
      next(err);
    }
  });

  router.post("/self/punch-out", async (req, res, next) => {
    try {
      const role = String(req.auth?.profile?.role || "").trim().toLowerCase();
      if (role !== "intern") throw httpError(403, "Forbidden", true);

      const internId = req.auth.profile.id;
      const { notes, date: requestedDate } = req.body || {};
      const date = resolvePunchDate(requestedDate);

      const existing = await restSelect({
        table: "attendance",
        select: "*",
        filters: { intern_profile_id: `eq.${internId}`, attendance_date: `eq.${date}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      }).catch((err) => {
        throw missingAttendanceTable(err);
      });

      const row = existing?.[0] || null;
      if (!row?.id) throw httpError(409, "Punch in first", true);
      if (!row.check_in) throw httpError(409, "Punch in first", true);
      if (row.check_out) throw httpError(409, "Already punched out for today", true);

      const nowIso = new Date().toISOString();
      const timeNow = nowTimeHmsLocal();

      const inSeconds = timeHmsToSeconds(row.check_in);
      const outSeconds = timeHmsToSeconds(timeNow);
      if (inSeconds != null && outSeconds != null) {
        if (outSeconds <= inSeconds) {
          throw httpError(
            409,
            "Punch out must be after punch in (same day). If you worked past midnight, contact admin to adjust.",
            true
          );
        }
        if (outSeconds - inSeconds < 60) {
          throw httpError(409, "Punch out is available after at least 1 minute.", true);
        }
      }

      const patch = {
        check_out: timeNow,
        updated_at: nowIso,
        marked_by: internId,
        marked_at: nowIso,
      };
      if (notes !== undefined) patch.notes = String(notes || "");

      const saved = await restUpdate({
        table: "attendance",
        patch,
        matchQuery: { id: `eq.${row.id}` },
        accessToken: null,
        useServiceRole: true,
      }).catch((err) => {
        throw missingAttendanceTable(err);
      });

      const updated = Array.isArray(saved) ? saved[0] : saved;
      const io = req.app.get("io");
      if (io) {
        io.to(`user:${internId}`).emit("itp:changed", { entity: "attendance", action: "upsert", internId, date });
        io.to("role:hr").emit("itp:changed", { entity: "attendance", action: "upsert", internId, date });
      }

      res.status(200).json({ success: true, attendance: mapAttendanceRow(updated) });
    } catch (err) {
      next(err);
    }
  });

  router.get("/self", async (req, res, next) => {
    try {
      const role = String(req.auth?.profile?.role || "").toLowerCase();
      if (role !== "intern") throw httpError(403, "Forbidden", true);

      const { start, end } = parseRange({ start: req.query.start, end: req.query.end });
      const internId = req.auth.profile.id;

      const rows = await restSelect({
        table: "attendance",
        select: "*",
        filters: {
          intern_profile_id: `eq.${internId}`,
          and: `(attendance_date.gte.${start},attendance_date.lte.${end})`,
          order: "attendance_date.desc",
        },
        accessToken: null,
        useServiceRole: true,
      }).catch((err) => {
        throw missingAttendanceTable(err);
      });

      res.status(200).json({ success: true, attendance: (rows || []).map(mapAttendanceRow) });
    } catch (err) {
      next(err);
    }
  });

  router.get("/intern/:internId", async (req, res, next) => {
    try {
      const role = String(req.auth?.profile?.role || "").trim().toLowerCase();
      const requesterId = req.auth?.profile?.id;
      const internId = req.params.internId;
      if (!internId) throw httpError(400, "internId is required", true);

      if (role === "intern") {
        if (String(internId) !== String(requesterId)) throw httpError(403, "Forbidden", true);
      } else if (role === "pm") {
        await assertInternBelongsToPm({ pmId: requesterId, internId });
      } else if (role === "hr" || role === "admin") {
        await assertInternExists(internId);
      } else {
        throw httpError(403, "Forbidden", true);
      }

      const { start, end } = parseRange({ start: req.query.start, end: req.query.end });

      const rows = await restSelect({
        table: "attendance",
        select: "*",
        filters: {
          intern_profile_id: `eq.${internId}`,
          and: `(attendance_date.gte.${start},attendance_date.lte.${end})`,
          order: "attendance_date.desc",
        },
        accessToken: null,
        useServiceRole: true,
      }).catch((err) => {
        throw missingAttendanceTable(err);
      });

      res.status(200).json({ success: true, attendance: (rows || []).map(mapAttendanceRow) });
    } catch (err) {
      next(err);
    }
  });

  router.post("/intern/:internId", async (req, res, next) => {
    try {
      const role = String(req.auth?.profile?.role || "").trim().toLowerCase();
      if (role !== "admin") throw httpError(403, "Forbidden", true);

      const internId = req.params.internId;
      if (!internId) throw httpError(400, "internId is required", true);

      const { date, status, checkIn, checkOut, notes } = req.body || {};
      const normalizedDate = String(date || "").trim();
      if (!isIsoDateString(normalizedDate)) throw httpError(400, "date must be in YYYY-MM-DD format", true);

      const normalizedStatus = normalizeStatus(status);
      if (!normalizedStatus) {
        throw httpError(400, "status must be one of: present, absent, leave, half_day, remote", true);
      }

      const normalizedCheckIn = checkIn === undefined ? undefined : normalizeTime(checkIn);
      const normalizedCheckOut = checkOut === undefined ? undefined : normalizeTime(checkOut);
      const checkInProvided = checkIn !== undefined;
      const checkOutProvided = checkOut !== undefined;
      const checkInNonEmpty = checkInProvided && String(checkIn || "").trim() !== "";
      const checkOutNonEmpty = checkOutProvided && String(checkOut || "").trim() !== "";
      if (checkInNonEmpty && normalizedCheckIn === null) throw httpError(400, "checkIn must be HH:MM", true);
      if (checkOutNonEmpty && normalizedCheckOut === null) throw httpError(400, "checkOut must be HH:MM", true);

      if ((normalizedStatus === "leave" || normalizedStatus === "absent") && (checkInNonEmpty || checkOutNonEmpty)) {
        throw httpError(400, `checkIn/checkOut cannot be set when status is ${normalizedStatus}`, true);
      }
      if (checkInNonEmpty && checkOutNonEmpty) {
        const inSeconds = timeHmsToSeconds(normalizedCheckIn);
        const outSeconds = timeHmsToSeconds(normalizedCheckOut);
        if (inSeconds != null && outSeconds != null && outSeconds <= inSeconds) {
          throw httpError(400, "checkOut must be after checkIn", true);
        }
      }

      const intern = await assertInternExists(internId);

      const existing = await restSelect({
        table: "attendance",
        select: "id",
        filters: { intern_profile_id: `eq.${internId}`, attendance_date: `eq.${normalizedDate}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      }).catch((err) => {
        throw missingAttendanceTable(err);
      });

      const now = new Date().toISOString();
      const patch = {
        status: normalizedStatus,
        updated_at: now,
        marked_by: req.auth.profile.id,
        marked_at: now,
      };
      if (notes !== undefined) patch.notes = String(notes || "");
      if (normalizedCheckIn !== undefined) patch.check_in = normalizedCheckIn;
      if (normalizedCheckOut !== undefined) patch.check_out = normalizedCheckOut;

      let saved;
      if (existing?.[0]?.id) {
        saved = await restUpdate({
          table: "attendance",
          patch,
          matchQuery: { id: `eq.${existing[0].id}` },
          accessToken: null,
          useServiceRole: true,
        }).catch((err) => {
          throw missingAttendanceTable(err);
        });
      } else {
        saved = await restInsert({
          table: "attendance",
          rows: {
            intern_profile_id: internId,
            attendance_date: normalizedDate,
            ...patch,
            created_at: now,
          },
          accessToken: null,
          useServiceRole: true,
        }).catch((err) => {
          throw missingAttendanceTable(err);
        });
      }

      const row = Array.isArray(saved) ? saved[0] : saved;
      const io = req.app.get("io");
      if (io) {
        io.to(`user:${internId}`).emit("itp:changed", { entity: "attendance", action: "upsert", internId, date: normalizedDate });
        if (intern?.pm_id) io.to(`user:${intern.pm_id}`).emit("itp:changed", { entity: "attendance", action: "upsert", internId, date: normalizedDate });
        io.to("role:hr").emit("itp:changed", { entity: "attendance", action: "upsert", internId, date: normalizedDate });
        io.to("role:admin").emit("itp:changed", { entity: "attendance", action: "upsert", internId, date: normalizedDate });
      }

      res.status(existing?.[0]?.id ? 200 : 201).json({ success: true, attendance: mapAttendanceRow(row) });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/intern/:internId/:date", async (req, res, next) => {
    try {
      const role = String(req.auth?.profile?.role || "").trim().toLowerCase();
      if (role !== "admin") throw httpError(403, "Forbidden", true);

      const internId = req.params.internId;
      const date = String(req.params.date || "").trim();
      if (!internId) throw httpError(400, "internId is required", true);
      if (!isIsoDateString(date)) throw httpError(400, "date must be in YYYY-MM-DD format", true);

      await assertInternExists(internId);

      const existing = await restSelect({
        table: "attendance",
        select: "id",
        filters: { intern_profile_id: `eq.${internId}`, attendance_date: `eq.${date}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      }).catch((err) => {
        throw missingAttendanceTable(err);
      });

      const rowId = existing?.[0]?.id;
      if (!rowId) {
        res.status(200).json({ success: true });
        return;
      }

      await restDelete({
        table: "attendance",
        matchQuery: { id: `eq.${rowId}` },
        accessToken: null,
        useServiceRole: true,
      }).catch((err) => {
        throw missingAttendanceTable(err);
      });

      const io = req.app.get("io");
      if (io) {
        io.to(`user:${internId}`).emit("itp:changed", { entity: "attendance", action: "delete", internId, date });
        io.to("role:hr").emit("itp:changed", { entity: "attendance", action: "delete", internId, date });
        io.to("role:admin").emit("itp:changed", { entity: "attendance", action: "delete", internId, date });
      }

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.get("/self/leave-requests", async (req, res, next) => {
    try {
      const role = String(req.auth?.profile?.role || "").trim().toLowerCase();
      if (role !== "intern") throw httpError(403, "Forbidden", true);

      const internId = req.auth.profile.id;
      const status = String(req.query.status || "").trim().toLowerCase();

      const filters = {
        intern_profile_id: `eq.${internId}`,
        order: "requested_at.desc",
      };
      if (status) filters.status = `eq.${status}`;

      const rows = await restSelect({
        table: "leave_requests",
        select: "*",
        filters,
        accessToken: null,
        useServiceRole: true,
      }).catch((err) => {
        throw missingLeaveRequestsTable(err);
      });

      res.status(200).json({ success: true, leaveRequests: (rows || []).map(mapLeaveRequestRow) });
    } catch (err) {
      next(err);
    }
  });

  router.post("/self/leave-requests", async (req, res, next) => {
    try {
      const role = String(req.auth?.profile?.role || "").trim().toLowerCase();
      if (role !== "intern") throw httpError(403, "Forbidden", true);

      const internId = req.auth.profile.id;
      const { startDate, endDate, reason } = req.body || {};
      const start = String(startDate || "").trim();
      const end = String(endDate || startDate || "").trim();
      if (!isIsoDateString(start) || !isIsoDateString(end)) throw httpError(400, "startDate/endDate must be YYYY-MM-DD", true);
      if (end < start) throw httpError(400, "endDate must be on or after startDate", true);

      const today = todayIsoDate();
      const todayMs = dateIsoToUtcMs(today);
      const startMs = dateIsoToUtcMs(start);
      const endMs = dateIsoToUtcMs(end);
      if (todayMs == null || startMs == null || endMs == null) throw httpError(400, "Invalid dates", true);

      const pastLimitMs = todayMs - 30 * 86400000;
      const futureLimitMs = todayMs + 180 * 86400000;
      if (startMs < pastLimitMs) throw httpError(400, "startDate is too far in the past (limit: 30 days)", true);
      if (endMs > futureLimitMs) throw httpError(400, "endDate is too far in the future (limit: 180 days)", true);

      const now = new Date().toISOString();
      const inserted = await restInsert({
        table: "leave_requests",
        rows: {
          intern_profile_id: internId,
          start_date: start,
          end_date: end,
          reason: String(reason || ""),
          status: "pending",
          requested_at: now,
          created_at: now,
          updated_at: now,
        },
        accessToken: null,
        useServiceRole: true,
      }).catch((err) => {
        throw missingLeaveRequestsTable(err);
      });

      const row = Array.isArray(inserted) ? inserted[0] : inserted;
      const io = req.app.get("io");
      if (io) {
        io.to(`user:${internId}`).emit("itp:changed", { entity: "leave_requests", action: "create", internId, id: row?.id });
        io.to("role:hr").emit("itp:changed", { entity: "leave_requests", action: "create", internId, id: row?.id });
        io.to("role:admin").emit("itp:changed", { entity: "leave_requests", action: "create", internId, id: row?.id });
      }

      res.status(201).json({ success: true, leaveRequest: mapLeaveRequestRow(row) });
    } catch (err) {
      next(err);
    }
  });

  router.post("/self/leave-requests/:id/cancel", async (req, res, next) => {
    try {
      const role = String(req.auth?.profile?.role || "").trim().toLowerCase();
      if (role !== "intern") throw httpError(403, "Forbidden", true);

      const internId = req.auth.profile.id;
      const id = String(req.params.id || "").trim();
      if (!id) throw httpError(400, "id is required", true);

      const existing = await restSelect({
        table: "leave_requests",
        select: "*",
        filters: { id: `eq.${id}`, intern_profile_id: `eq.${internId}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      }).catch((err) => {
        throw missingLeaveRequestsTable(err);
      });

      const row = existing?.[0] || null;
      if (!row?.id) throw httpError(404, "Leave request not found", true);
      if (String(row.status || "").toLowerCase() !== "pending") throw httpError(409, "Only pending requests can be cancelled", true);

      const now = new Date().toISOString();
      const updated = await restUpdate({
        table: "leave_requests",
        patch: { status: "cancelled", updated_at: now },
        matchQuery: { id: `eq.${id}` },
        accessToken: null,
        useServiceRole: true,
      }).catch((err) => {
        throw missingLeaveRequestsTable(err);
      });

      const saved = Array.isArray(updated) ? updated[0] : updated;
      const io = req.app.get("io");
      if (io) {
        io.to(`user:${internId}`).emit("itp:changed", { entity: "leave_requests", action: "cancel", internId, id });
        io.to("role:hr").emit("itp:changed", { entity: "leave_requests", action: "cancel", internId, id });
        io.to("role:admin").emit("itp:changed", { entity: "leave_requests", action: "cancel", internId, id });
      }

      res.status(200).json({ success: true, leaveRequest: mapLeaveRequestRow(saved) });
    } catch (err) {
      next(err);
    }
  });

  router.get("/leave-requests", async (req, res, next) => {
    try {
      const role = String(req.auth?.profile?.role || "").trim().toLowerCase();
      if (role !== "hr" && role !== "admin") throw httpError(403, "Forbidden", true);

      const status = String(req.query.status || "").trim().toLowerCase();
      const internId = String(req.query.internId || "").trim();

      const filters = { order: "requested_at.desc" };
      if (status) filters.status = `eq.${status}`;
      if (internId) filters.intern_profile_id = `eq.${internId}`;

      const rows = await restSelect({
        table: "leave_requests",
        select: "*",
        filters,
        accessToken: null,
        useServiceRole: true,
      }).catch((err) => {
        throw missingLeaveRequestsTable(err);
      });

      const uniqueInternIds = Array.from(new Set((rows || []).map((r) => String(r?.intern_profile_id || "")).filter(Boolean)));
      const internProfiles =
        uniqueInternIds.length === 0
          ? []
          : await restSelect({
              table: "profiles",
              select: "id,full_name,email",
              filters: { id: `in.(${uniqueInternIds.join(",")})` },
              accessToken: null,
              useServiceRole: true,
            });
      const byInternId = new Map((internProfiles || []).map((p) => [String(p.id), p]));

      res.status(200).json({
        success: true,
        leaveRequests: (rows || []).map((row) => {
          const mapped = mapLeaveRequestRow(row);
          const intern = byInternId.get(String(mapped.internId)) || null;
          return { ...mapped, intern: intern ? { id: intern.id, fullName: intern.full_name || "", email: intern.email || "" } : null };
        }),
      });
    } catch (err) {
      next(err);
    }
  });

  router.post("/leave-requests/:id/decision", async (req, res, next) => {
    try {
      const role = String(req.auth?.profile?.role || "").trim().toLowerCase();
      if (role !== "hr" && role !== "admin") throw httpError(403, "Forbidden", true);

      const id = String(req.params.id || "").trim();
      if (!id) throw httpError(400, "id is required", true);

      const decision = String(req.body?.decision || "").trim().toLowerCase();
      const reviewNotes = req.body?.reviewNotes;
      if (!["approved", "rejected"].includes(decision)) throw httpError(400, "decision must be approved or rejected", true);

      const existing = await restSelect({
        table: "leave_requests",
        select: "*",
        filters: { id: `eq.${id}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      }).catch((err) => {
        throw missingLeaveRequestsTable(err);
      });

      const row = existing?.[0] || null;
      if (!row?.id) throw httpError(404, "Leave request not found", true);
      if (String(row.status || "").toLowerCase() !== "pending") throw httpError(409, "Only pending requests can be decided", true);

      const internId = String(row.intern_profile_id || "");
      const start = String(row.start_date || "").trim();
      const end = String(row.end_date || "").trim();
      if (!internId || !isIsoDateString(start) || !isIsoDateString(end)) throw httpError(400, "Leave request is invalid", true);

      const now = new Date().toISOString();
      const reviewerId = req.auth.profile.id;

      if (decision === "approved") {
        const dates = enumerateIsoDates(start, end);
        for (const date of dates) {
          const existingAttendance = await restSelect({
            table: "attendance",
            select: "id,check_in,check_out",
            filters: { intern_profile_id: `eq.${internId}`, attendance_date: `eq.${date}`, limit: 1 },
            accessToken: null,
            useServiceRole: true,
          }).catch((err) => {
            throw missingAttendanceTable(err);
          });

          const attRow = existingAttendance?.[0] || null;
          if (attRow?.check_in || attRow?.check_out) {
            throw httpError(409, `Cannot approve leave: attendance already has punches for ${date}`, true);
          }

          const attendancePatch = {
            status: "leave",
            check_in: null,
            check_out: null,
            updated_at: now,
            marked_by: reviewerId,
            marked_at: now,
          };

          if (attRow?.id) {
            await restUpdate({
              table: "attendance",
              patch: attendancePatch,
              matchQuery: { id: `eq.${attRow.id}` },
              accessToken: null,
              useServiceRole: true,
            }).catch((err) => {
              throw missingAttendanceTable(err);
            });
          } else {
            await restInsert({
              table: "attendance",
              rows: {
                intern_profile_id: internId,
                attendance_date: date,
                notes: "",
                ...attendancePatch,
                created_at: now,
              },
              accessToken: null,
              useServiceRole: true,
            }).catch((err) => {
              throw missingAttendanceTable(err);
            });
          }
        }
      }

      const updated = await restUpdate({
        table: "leave_requests",
        patch: {
          status: decision,
          reviewed_by: reviewerId,
          reviewed_at: now,
          review_notes: reviewNotes !== undefined ? String(reviewNotes || "") : "",
          updated_at: now,
        },
        matchQuery: { id: `eq.${id}` },
        accessToken: null,
        useServiceRole: true,
      }).catch((err) => {
        throw missingLeaveRequestsTable(err);
      });

      const saved = Array.isArray(updated) ? updated[0] : updated;
      const io = req.app.get("io");
      if (io) {
        io.to(`user:${internId}`).emit("itp:changed", { entity: "leave_requests", action: decision, internId, id });
        io.to("role:hr").emit("itp:changed", { entity: "leave_requests", action: decision, internId, id });
        io.to("role:admin").emit("itp:changed", { entity: "leave_requests", action: decision, internId, id });
        if (decision === "approved") {
          const dates = enumerateIsoDates(start, end);
          dates.forEach((date) => {
            io.to(`user:${internId}`).emit("itp:changed", { entity: "attendance", action: "upsert", internId, date });
            io.to("role:hr").emit("itp:changed", { entity: "attendance", action: "upsert", internId, date });
            io.to("role:admin").emit("itp:changed", { entity: "attendance", action: "upsert", internId, date });
          });
        }
      }

      res.status(200).json({ success: true, leaveRequest: mapLeaveRequestRow(saved) });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createAttendanceRouter };
