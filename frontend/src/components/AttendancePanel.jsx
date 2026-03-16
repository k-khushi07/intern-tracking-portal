import React, { useCallback, useEffect, useMemo, useState } from "react";
import { attendanceApi } from "../lib/apiClient";

function pad2(value) {
  return String(value).padStart(2, "0");
}

function toIsoDateLocal(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfMonthIsoLocal() {
  const now = new Date();
  return toIsoDateLocal(new Date(now.getFullYear(), now.getMonth(), 1));
}

function todayIsoLocal() {
  return toIsoDateLocal(new Date());
}

function daysAgoIsoLocal(days) {
  const d = new Date();
  d.setDate(d.getDate() - Math.max(0, Number(days) || 0));
  return toIsoDateLocal(d);
}

function timeHmsToSeconds(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  const match = raw.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;
  const hh = Number(match[1]);
  const mm = Number(match[2]);
  const ss = match[3] ? Number(match[3]) : 0;
  if ([hh, mm, ss].some((n) => Number.isNaN(n))) return null;
  return hh * 3600 + mm * 60 + ss;
}

const STATUS_OPTIONS = [
  { value: "present", label: "Present" },
  { value: "absent", label: "Absent" },
  { value: "leave", label: "Leave" },
  { value: "half_day", label: "Half day" },
  { value: "remote", label: "Remote" },
];

function statusLabel(value) {
  return STATUS_OPTIONS.find((o) => o.value === value)?.label || value || "-";
}

function statusColor(value) {
  const status = String(value || "").toLowerCase();
  if (status === "present") return "#10b981";
  if (status === "remote") return "#22d3ee";
  if (status === "half_day") return "#f59e0b";
  if (status === "leave") return "#a78bfa";
  if (status === "absent") return "#ef4444";
  return "rgba(255,255,255,0.7)";
}

export default function AttendancePanel({
  internId = null,
  variant = "intern", // "intern" | "pm" | "hr" | "admin"
  canEdit = false,
  title = "Attendance",
  initialStart = "",
  initialEnd = "",
}) {
  const isSelf = variant === "intern" && !internId;
  const today = todayIsoLocal();
  const defaultStart = isSelf ? today : startOfMonthIsoLocal();
  const defaultEnd = today;

  const [startInput, setStartInput] = useState(initialStart || defaultStart);
  const [endInput, setEndInput] = useState(initialEnd || defaultEnd);
  const [range, setRange] = useState({
    start: initialStart || defaultStart,
    end: initialEnd || defaultEnd,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  const [editDate, setEditDate] = useState(todayIsoLocal());
  const [editStatus, setEditStatus] = useState("present");
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [punching, setPunching] = useState(false);
  const [punchStatus, setPunchStatus] = useState("present");
  const [punchNotes, setPunchNotes] = useState("");
  const [clockTick, setClockTick] = useState(0);

  const byDate = useMemo(() => {
    const map = new Map();
    (rows || []).forEach((row) => {
      if (row?.date) map.set(row.date, row);
    });
    return map;
  }, [rows]);

  const selectedRow = byDate.get(editDate) || null;
  const todayRow = byDate.get(today) || null;
  const canPunchIn = isSelf && !todayRow?.checkIn;

  useEffect(() => {
    if (!isSelf) return undefined;
    const id = setInterval(() => setClockTick((v) => v + 1), 15000);
    return () => clearInterval(id);
  }, [isSelf]);

  const punchTiming = useMemo(() => {
    if (!isSelf) return { canPunchOut: false, hint: "" };
    if (!todayRow?.checkIn || todayRow?.checkOut) return { canPunchOut: false, hint: "" };

    const inSeconds = timeHmsToSeconds(todayRow.checkIn);
    if (inSeconds == null) return { canPunchOut: true, hint: "" };

    const now = new Date();
    const nowSeconds = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    const diff = nowSeconds - inSeconds;
    if (diff < 0) return { canPunchOut: false, hint: "Punch out must be on the same day. If you worked past midnight, ask an admin to adjust." };
    if (diff < 60) return { canPunchOut: false, hint: `Punch out available in ${60 - diff}s.` };
    return { canPunchOut: true, hint: "" };
  }, [clockTick, isSelf, todayRow?.checkIn, todayRow?.checkOut]);

  const canPunchOut = isSelf && !!todayRow?.checkIn && !todayRow?.checkOut && punchTiming.canPunchOut;

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, leave: 0, half_day: 0, remote: 0, total: 0 };
    (rows || []).forEach((row) => {
      const status = String(row?.status || "").toLowerCase();
      if (c[status] !== undefined) c[status] += 1;
      c.total += 1;
    });
    return c;
  }, [rows]);

  const load = useCallback(async () => {
    if (!isSelf && !internId) return;
    setLoading(true);
    setError("");
    try {
      const res = isSelf
        ? await attendanceApi.self({ start: range.start, end: range.end })
        : await attendanceApi.intern(internId, { start: range.start, end: range.end });
      setRows(res?.attendance || []);
    } catch (e) {
      setError(e?.message || "Failed to load attendance.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [internId, isSelf, range.end, range.start]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!canEdit) return;
    const existing = byDate.get(editDate);
    if (!existing) {
      setEditStatus("present");
      setEditCheckIn("");
      setEditCheckOut("");
      setEditNotes("");
      return;
    }
    setEditStatus(existing.status || "present");
    setEditCheckIn(existing.checkIn || "");
    setEditCheckOut(existing.checkOut || "");
    setEditNotes(existing.notes || "");
  }, [byDate, canEdit, editDate]);

  const applyRange = () => {
    setRange({ start: startInput || defaultStart, end: endInput || defaultEnd });
  };

  const punchIn = async () => {
    if (!isSelf) return;
    setPunching(true);
    setError("");
    try {
      await attendanceApi.punchIn({ date: today, status: punchStatus, notes: punchNotes });
      await load();
      setPunchNotes("");
    } catch (e) {
      setError(e?.message || "Failed to punch in.");
    } finally {
      setPunching(false);
    }
  };

  const punchOut = async () => {
    if (!isSelf) return;
    setPunching(true);
    setError("");
    try {
      await attendanceApi.punchOut({ date: today, notes: punchNotes });
      await load();
      setPunchNotes("");
    } catch (e) {
      setError(e?.message || "Failed to punch out.");
    } finally {
      setPunching(false);
    }
  };

  const save = async () => {
    if (!internId) return;
    setSaving(true);
    setError("");
    try {
      const res = await attendanceApi.upsert(internId, {
        date: editDate,
        status: editStatus,
        checkIn: editCheckIn,
        checkOut: editCheckOut,
        notes: editNotes,
      });
      const saved = res?.attendance || null;
      if (saved?.date) {
        setRows((prev) => {
          const next = Array.isArray(prev) ? [...prev] : [];
          const idx = next.findIndex((r) => r?.date === saved.date);
          if (idx >= 0) next[idx] = saved;
          else next.unshift(saved);
          return next;
        });
      } else {
        await load();
      }
    } catch (e) {
      setError(e?.message || "Failed to save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!internId) return;
    setDeleting(true);
    setError("");
    try {
      await attendanceApi.remove(internId, editDate);
      setRows((prev) => (Array.isArray(prev) ? prev.filter((r) => r?.date !== editDate) : []));
      setEditStatus("present");
      setEditCheckIn("");
      setEditCheckOut("");
      setEditNotes("");
    } catch (e) {
      setError(e?.message || "Failed to delete attendance.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "white" }}>{title}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
            {range.start} to {range.end}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            type="date"
            value={startInput}
            onChange={(e) => setStartInput(e.target.value)}
            style={dateInputStyle}
          />
          <input type="date" value={endInput} onChange={(e) => setEndInput(e.target.value)} style={dateInputStyle} />
          <button type="button" onClick={applyRange} style={btnStyle("secondary")} disabled={loading}>
            Apply
          </button>
          <button type="button" onClick={load} style={btnStyle("primary")} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        <MiniStat label="Present" value={counts.present} color={statusColor("present")} />
        <MiniStat label="Remote" value={counts.remote} color={statusColor("remote")} />
        <MiniStat label="Half day" value={counts.half_day} color={statusColor("half_day")} />
        <MiniStat label="Leave" value={counts.leave} color={statusColor("leave")} />
        <MiniStat label="Absent" value={counts.absent} color={statusColor("absent")} />
      </div>

      {isSelf && (
        <div style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ color: "rgba(255,255,255,0.9)", fontWeight: 900 }}>Today ({today})</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
              In: {todayRow?.checkIn || "-"} · Out: {todayRow?.checkOut || "-"}
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 10, padding: 10, borderRadius: 10, border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.12)", color: "#fecaca", fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.4 }}>
            Punch rules: You can punch in once per day (today only). Punch out is enabled only after you punch in, and at least 1 minute later. If you miss a punch out, ask an admin to correct it.
          </div>
          {!canPunchOut && punchTiming.hint && (
            <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>{punchTiming.hint}</div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 10 }}>
            <select value={punchStatus} onChange={(e) => setPunchStatus(e.target.value)} style={fieldStyle} disabled={!canPunchIn || punching}>
              <option value="present">Present</option>
              <option value="remote">Remote</option>
              <option value="half_day">Half day</option>
            </select>
            <input
              value={punchNotes}
              onChange={(e) => setPunchNotes(e.target.value)}
              placeholder="Notes (optional)"
              style={fieldStyle}
              disabled={punching}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button type="button" onClick={punchIn} disabled={!canPunchIn || punching} style={btnStyle("primary")}>
                {punching && canPunchIn ? "Punching..." : "Punch In"}
              </button>
              <button type="button" onClick={punchOut} disabled={!canPunchOut || punching} style={btnStyle("secondary")}>
                {punching && canPunchOut ? "Punching..." : "Punch Out"}
              </button>
            </div>
          </div>
        </div>
      )}

      {canEdit && (
        <div style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
            <div style={{ color: "rgba(255,255,255,0.9)", fontWeight: 800 }}>Mark attendance</div>
            {selectedRow && (
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                Last updated: {selectedRow.updatedAt ? new Date(selectedRow.updatedAt).toLocaleString() : "-"}
              </div>
            )}
          </div>

          {error && (
            <div style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.12)", color: "#fecaca", fontSize: 13 }}>
              {error}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10, marginTop: error ? 10 : 0 }}>
            <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} style={fieldStyle} />
            <select value={editStatus} onChange={(e) => setEditStatus(e.target.value)} style={fieldStyle}>
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <input type="time" value={editCheckIn} onChange={(e) => setEditCheckIn(e.target.value)} style={fieldStyle} />
            <input type="time" value={editCheckOut} onChange={(e) => setEditCheckOut(e.target.value)} style={fieldStyle} />
          </div>
          <textarea
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            rows={2}
            placeholder="Notes (optional)"
            style={{ ...fieldStyle, marginTop: 10, minHeight: 68, resize: "vertical" }}
          />

          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap", marginTop: 10 }}>
            <button type="button" onClick={remove} disabled={deleting || saving || !selectedRow} style={btnStyle("danger")}>
              {deleting ? "Deleting..." : "Delete"}
            </button>
            <button type="button" onClick={save} disabled={saving} style={btnStyle("primary")}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      )}

      {!canEdit && error && (
        <div style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.12)", color: "#fecaca", fontSize: 13 }}>{error}</div>
      )}

      <div style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.18)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "130px 120px 90px 90px 1fr", gap: 10, padding: "10px 12px", fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.55)", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
          <div>Date</div>
          <div>Status</div>
          <div>In</div>
          <div>Out</div>
          <div>Notes</div>
        </div>
        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          {loading && rows.length === 0 && (
            <div style={{ padding: 14, color: "rgba(255,255,255,0.6)" }}>Loading...</div>
          )}
          {!loading && rows.length === 0 && (
            <div style={{ padding: 14, color: "rgba(255,255,255,0.6)" }}>No attendance records found.</div>
          )}
          {(rows || []).map((row) => (
            <div
              key={row.id || row.date}
              style={{
                display: "grid",
                gridTemplateColumns: "130px 120px 90px 90px 1fr",
                gap: 10,
                padding: "10px 12px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                alignItems: "center",
              }}
            >
              <div style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700, fontSize: 12 }}>{row.date}</div>
              <div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 900,
                    background: `${statusColor(row.status)}18`,
                    border: `1px solid ${statusColor(row.status)}55`,
                    color: statusColor(row.status),
                    textTransform: "uppercase",
                    letterSpacing: "0.4px",
                  }}
                >
                  {statusLabel(row.status)}
                </span>
              </div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>{row.checkIn || "-"}</div>
              <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>{row.checkOut || "-"}</div>
              <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row.notes || "-"}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 12 }}>
      <div style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, fontWeight: 900 }}>{label}</div>
      <div style={{ marginTop: 6, display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: "white" }}>{value}</div>
        <div style={{ width: 10, height: 10, borderRadius: 999, background: color }} />
      </div>
    </div>
  );
}

const fieldStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  outline: "none",
  fontSize: 13,
  boxSizing: "border-box",
};

const dateInputStyle = {
  ...fieldStyle,
  padding: "9px 10px",
  fontSize: 12,
  minWidth: 150,
};

function btnStyle(kind) {
  if (kind === "primary") {
    return {
      border: "none",
      background: "linear-gradient(135deg, rgba(20,184,166,0.9), rgba(15,118,110,0.9))",
      color: "white",
      padding: "9px 12px",
      borderRadius: 10,
      fontWeight: 900,
      cursor: "pointer",
      fontSize: 12,
    };
  }
  if (kind === "danger") {
    return {
      border: "1px solid rgba(239,68,68,0.45)",
      background: "rgba(239,68,68,0.15)",
      color: "#fecaca",
      padding: "9px 12px",
      borderRadius: 10,
      fontWeight: 900,
      cursor: "pointer",
      fontSize: 12,
    };
  }
  return {
    border: "1px solid rgba(255,255,255,0.14)",
    background: "transparent",
    color: "rgba(255,255,255,0.85)",
    padding: "9px 12px",
    borderRadius: 10,
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 12,
  };
}
