import React, { useMemo, useState } from "react";
import { Search, Mail, Eye, MessageCircle, Calendar, Briefcase, Clock, FileText, Users } from "lucide-react";

const DEPARTMENTS = ["SAP", "Oracle", "Accounts", "HR"];

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

function resolveDepartment(intern) {
  const profileData = intern?.profile_data && typeof intern.profile_data === "object" ? intern.profile_data : {};
  const raw =
    intern?.department ||
    profileData.department ||
    profileData.domain ||
    profileData.team ||
    "";
  const text = String(raw || "").trim();
  const normalized = text.toLowerCase();
  if (normalized === "sap") return "SAP";
  if (normalized === "oracle") return "Oracle";
  if (normalized === "accounts") return "Accounts";
  if (normalized === "hr") return "HR";
  if (!text) return "Unassigned";
  return "Other";
}

export default function MyInternsPage({ onNavigateToMessages, onViewProfile, onViewReports, interns = [] }) {
  const [query, setQuery] = useState("");

  const enriched = useMemo(
    () =>
      (interns || []).map((intern) => ({
        ...intern,
        departmentResolved: resolveDepartment(intern),
      })),
    [interns]
  );

  const totals = useMemo(() => {
    const all = enriched || [];
    return {
      total: all.length,
      active: all.filter((item) => String(item.status || "").toLowerCase() === "active").length,
      pendingReports: all.reduce((sum, item) => sum + (Number(item.pendingReports) || 0), 0),
      totalHours: all.reduce((sum, item) => sum + (Number(item.totalHours) || 0), 0),
    };
  }, [enriched]);

  const searchFiltered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (enriched || []).filter((intern) => {
      if (!q) return true;
      return (
        String(intern.full_name || intern.fullName || "").toLowerCase().includes(q) ||
        String(intern.email || "").toLowerCase().includes(q) ||
        String(intern.intern_id || intern.internId || "").toLowerCase().includes(q) ||
        String(intern.departmentResolved || "").toLowerCase().includes(q)
      );
    });
  }, [enriched, query]);

  const filteredInterns = searchFiltered;

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
        <TopStat label="Total Interns (Overall)" value={totals.total} />
        <TopStat label="Active" value={totals.active} />
        <TopStat label="Pending Reports" value={totals.pendingReports} />
        <TopStat label="Total Hours" value={`${totals.totalHours.toFixed(1)}h`} />
      </div>

      <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 12, display: "grid", gap: 10 }}>
        <div style={{ position: "relative" }}>
          <Search size={16} color={COLORS.muted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, intern ID, department"
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

      {filteredInterns.length > 0 && (
        <>
          <style>{`
            .intern-card {
              background: rgba(255, 255, 255, 0.03);
              border: 1px solid rgba(255, 255, 255, 0.08);
              border-radius: 16px;
              padding: 20px;
              transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
              position: relative;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              gap: 16px;
            }
            .intern-card:hover {
              transform: translateY(-4px);
              border-color: rgba(103, 146, 137, 0.4);
              background: rgba(255, 255, 255, 0.05);
              box-shadow: 0 12px 24px -10px rgba(0, 0, 0, 0.5), 0 0 20px rgba(103, 146, 137, 0.1);
            }
            .intern-card::before {
              content: '';
              position: absolute;
              top: 0; left: 0; right: 0; height: 4px;
              background: linear-gradient(90deg, #679289, #1d7874);
              opacity: 0;
              transition: opacity 0.3s ease;
            }
            .intern-card:hover::before {
              opacity: 1;
            }
            .stat-box {
              background: rgba(0, 0, 0, 0.2);
              border: 1px solid rgba(255, 255, 255, 0.04);
              border-radius: 12px;
              padding: 10px;
              text-align: center;
              transition: background 0.2s;
            }
            .intern-card:hover .stat-box {
              background: rgba(255, 255, 255, 0.02);
              border-color: rgba(255, 255, 255, 0.08);
            }
            .action-btn {
              flex: 1;
              display: inline-flex;
              justify-content: center;
              align-items: center;
              gap: 6px;
              padding: 10px;
              border-radius: 10px;
              font-weight: 600;
              font-size: 13px;
              cursor: pointer;
              transition: all 0.2s ease;
            }
            .action-btn.primary {
              background: linear-gradient(135deg, #679289, #1d7874);
              color: white;
              border: none;
            }
            .action-btn.primary:hover {
              background: linear-gradient(135deg, #74a399, #238b87);
              transform: scale(1.02);
            }
            .action-btn.reports {
              background: rgba(245, 158, 11, 0.15);
              color: #fde68a;
              border: 1px solid rgba(245, 158, 11, 0.3);
            }
            .action-btn.reports:hover {
              background: rgba(245, 158, 11, 0.25);
              transform: scale(1.02);
            }
            .action-btn.secondary {
              background: rgba(255, 255, 255, 0.05);
              color: #ffe5d9;
              border: 1px solid rgba(255, 255, 255, 0.1);
            }
            .action-btn.secondary:hover {
              background: rgba(255, 255, 255, 0.1);
              border-color: rgba(255, 255, 255, 0.2);
              transform: scale(1.02);
            }
          `}</style>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(340px,1fr))", gap: 16 }}>
            {filteredInterns.map((intern) => {
              const name = intern.full_name || intern.fullName || intern.name || intern.email || "Intern";
              const avatar = name
                .split(" ")
                .filter(Boolean)
                .slice(0, 2)
                .map((value) => value[0])
                .join("")
                .toUpperCase();
              const status = intern.status || "active";
              const color = statusColor(status);
              const reportsPending = Number(intern.pendingReports) || 0;
              const hours = Number(intern.totalHours) || 0;
              const tasks = Number(intern.tasksCompleted) || 0;

              return (
                <div key={intern.id} className="intern-card">

                  {/* Header Row */}
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ position: "relative" }}>
                      <div style={{ width: 52, height: 52, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.accent}, #1d7874)`, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 18, color: "white", boxShadow: "0 4px 10px rgba(0,0,0,0.3)" }}>
                        {avatar || "IN"}
                      </div>
                      {/* Status Indicator Dot */}
                      <div style={{ position: "absolute", bottom: 0, right: 0, width: 14, height: 14, borderRadius: "50%", background: color, border: `2px solid ${COLORS.panel}` }} title={status} />
                    </div>

                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ color: COLORS.text, fontWeight: 800, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{name}</div>
                      <div style={{ color: COLORS.muted, fontSize: 13, marginTop: 2 }}>{intern.email}</div>
                    </div>

                    <div style={{ padding: "4px 10px", borderRadius: 8, background: `${color}15`, border: `1px solid ${color}40`, color, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                      {status}
                    </div>
                  </div>

                  {/* Info Row */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, fontSize: 12, color: "rgba(255,255,255,0.7)", background: "rgba(0,0,0,0.15)", borderRadius: 12, padding: "12px 14px", border: "1px solid rgba(255,255,255,0.03)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Briefcase size={14} color={COLORS.accent} /> <span>{intern.intern_id || intern.internId || "-"}</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Users size={14} color={COLORS.accent} /> <span>{intern.departmentResolved}</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Calendar size={14} color={COLORS.accent} /> <span>{intern.created_at ? new Date(intern.created_at).toLocaleDateString() : "-"}</span></div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Clock size={14} color={COLORS.accent} /> <span>{intern.lastLogDate ? new Date(intern.lastLogDate).toLocaleDateString() : "No logs"}</span></div>
                  </div>

                  {/* Stats Grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                    <div className="stat-box">
                      <div style={{ color: COLORS.muted, fontSize: 10, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>Hours</div>
                      <div style={{ marginTop: 4, color: COLORS.text, fontWeight: 800, fontSize: 15 }}>{hours.toFixed(1)}</div>
                    </div>
                    <div className="stat-box">
                      <div style={{ color: COLORS.muted, fontSize: 10, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>Tasks</div>
                      <div style={{ marginTop: 4, color: COLORS.text, fontWeight: 800, fontSize: 15 }}>{tasks}</div>
                    </div>
                    <div className="stat-box">
                      <div style={{ color: COLORS.muted, fontSize: 10, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>Reports</div>
                      <div style={{ marginTop: 4, color: COLORS.text, fontWeight: 800, fontSize: 15 }}>{reportsPending}</div>
                    </div>
                    <div className="stat-box">
                      <div style={{ color: COLORS.muted, fontSize: 10, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.5px" }}>Perform</div>
                      <div style={{ marginTop: 4, color: COLORS.success, fontWeight: 800, fontSize: 15 }}>{Math.max(0, Math.min(100, Number(intern.performance) || 0))}%</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                    <button onClick={() => onViewProfile?.(intern)} className="action-btn primary">
                      <Eye size={15} /> Profile
                    </button>
                    <button onClick={() => onViewReports?.(intern)} className="action-btn reports">
                      <FileText size={15} /> Reports
                    </button>
                    <button onClick={() => onNavigateToMessages?.(intern)} className="action-btn secondary">
                      <MessageCircle size={15} /> Message
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {filteredInterns.length === 0 && (
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
