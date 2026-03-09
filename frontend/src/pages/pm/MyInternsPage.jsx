import React, { useMemo, useState } from "react";
import { Search, Mail, Eye, MessageCircle, Calendar, Briefcase, ClipboardCheck, Clock } from "lucide-react";

const COLORS = {
  panel: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.14)",
  text: "#ffe5d9",
  muted: "rgba(255,229,217,0.65)",
  accent: "#679289",
  success: "#4ade80",
  warning: "#f59e0b",
  danger: "#ef4444",
};

function statusColor(status) {
  const s = String(status || "").toLowerCase();
  if (s === "active") return COLORS.success;
  if (s === "completed") return COLORS.accent;
  if (s === "inactive") return COLORS.warning;
  return COLORS.danger;
}

export default function MyInternsPage({ onNavigateToMessages, onViewProfile, interns = [] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (interns || []).filter((intern) => {
      if (!q) return true;
      return (
        String(intern.full_name || intern.fullName || "").toLowerCase().includes(q) ||
        String(intern.email || "").toLowerCase().includes(q) ||
        String(intern.intern_id || intern.internId || "").toLowerCase().includes(q)
      );
    });
  }, [interns, query]);

  const totals = useMemo(() => {
    const all = interns || [];
    return {
      total: all.length,
      active: all.filter((i) => String(i.status || "").toLowerCase() === "active").length,
      pendingReports: all.reduce((sum, i) => sum + (Number(i.pendingReports) || 0), 0),
      totalHours: all.reduce((sum, i) => sum + (Number(i.totalHours) || 0), 0),
    };
  }, [interns]);

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
        <TopStat label="Total Interns" value={totals.total} />
        <TopStat label="Active" value={totals.active} />
        <TopStat label="Pending Reports" value={totals.pendingReports} />
        <TopStat label="Total Hours" value={`${totals.totalHours.toFixed(1)}h`} />
      </div>

      <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 12 }}>
        <div style={{ position: "relative" }}>
          <Search size={16} color={COLORS.muted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, intern ID"
            style={{
              width: "100%",
              padding: "10px 10px 10px 34px",
              borderRadius: 10,
              border: `1px solid ${COLORS.border}`,
              background: "rgba(255,255,255,0.04)",
              color: "white",
              outline: "none",
            }}
          />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(330px,1fr))", gap: 12 }}>
        {filtered.map((intern) => {
          const name = intern.full_name || intern.fullName || intern.name || intern.email || "Intern";
          const avatar = name
            .split(" ")
            .filter(Boolean)
            .slice(0, 2)
            .map((v) => v[0])
            .join("")
            .toUpperCase();
          const status = intern.status || "active";
          const color = statusColor(status);
          const reportsTotal = Number(intern.reportsTotal) || 0;
          const reportsPending = Number(intern.pendingReports) || 0;
          const approvedReports = Number(intern.approvedReports) || 0;
          const rejectedReports = Number(intern.rejectedReports) || 0;
          const hours = Number(intern.totalHours) || 0;
          const tasks = Number(intern.tasksCompleted) || 0;

          return (
            <div key={intern.id} style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 14 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.accent}, #1d7874)`, display: "grid", placeItems: "center", fontWeight: 800 }}>
                  {avatar || "IN"}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ color: COLORS.text, fontWeight: 800, fontSize: 15, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
                  <div style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>{intern.email}</div>
                </div>
                <div style={{ padding: "4px 8px", borderRadius: 999, background: `${color}20`, border: `1px solid ${color}55`, color, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>
                  {status}
                </div>
              </div>

              <div style={{ marginTop: 12, display: "grid", gap: 6, fontSize: 12, color: COLORS.muted }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Mail size={14} /> {intern.email || "-"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Briefcase size={14} /> Intern ID: {intern.intern_id || intern.internId || "-"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Calendar size={14} /> Joined: {intern.created_at ? new Date(intern.created_at).toLocaleDateString() : "-"}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Clock size={14} /> Last Log: {intern.lastLogDate ? new Date(intern.lastLogDate).toLocaleDateString() : "No logs yet"}</div>
              </div>

              <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                <Mini title="Hours" value={`${hours.toFixed(1)}h`} />
                <Mini title="Tasks" value={tasks} />
                <Mini title="Reports" value={`${reportsPending}/${reportsTotal}`} hint="pending/total" />
              </div>

              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
                <Mini title="Approved" value={approvedReports} />
                <Mini title="Rejected" value={rejectedReports} />
                <Mini title="Performance" value={`${Math.max(0, Math.min(100, Number(intern.performance) || 0))}%`} />
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <button onClick={() => onViewProfile?.(intern)} style={btnStyle("primary")}>
                  <Eye size={15} /> Profile
                </button>
                <button onClick={() => onNavigateToMessages?.(intern)} style={btnStyle("secondary")}>
                  <MessageCircle size={15} /> Message
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 20, color: COLORS.muted, textAlign: "center" }}>
          No interns found.
        </div>
      )}
    </div>
  );
}

function TopStat({ label, value }) {
  return (
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 12 }}>
      <div style={{ color: COLORS.muted, fontSize: 11 }}>{label}</div>
      <div style={{ marginTop: 6, color: COLORS.text, fontSize: 22, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function Mini({ title, value, hint = "" }) {
  return (
    <div style={{ padding: 8, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.border}` }}>
      <div style={{ color: COLORS.muted, fontSize: 10 }}>{title}</div>
      <div style={{ marginTop: 4, color: COLORS.text, fontWeight: 800, fontSize: 14 }}>{value}</div>
      {hint ? <div style={{ marginTop: 2, color: COLORS.muted, fontSize: 9 }}>{hint}</div> : null}
    </div>
  );
}

function btnStyle(type) {
  if (type === "primary") {
    return {
      flex: 1,
      border: "none",
      borderRadius: 10,
      background: `linear-gradient(135deg, ${COLORS.accent}, #1d7874)`,
      color: "white",
      padding: "10px 12px",
      cursor: "pointer",
      fontWeight: 700,
      display: "inline-flex",
      justifyContent: "center",
      alignItems: "center",
      gap: 6,
    };
  }
  return {
    flex: 1,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 10,
    background: "rgba(255,255,255,0.05)",
    color: COLORS.text,
    padding: "10px 12px",
    cursor: "pointer",
    fontWeight: 700,
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  };
}
