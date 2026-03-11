import React, { useMemo, useState } from "react";
import { CheckCircle2, XCircle, MessageSquare, Filter } from "lucide-react";
import { pmApi } from "../../lib/apiClient";

const COLORS = {
  panel: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.14)",
  text: "#ffe5d9",
  muted: "rgba(255,229,217,0.65)",
  success: "#4ade80",
  danger: "#ef4444",
  warning: "#f59e0b",
  accent: "#679289",
};

export default function ReviewLogsPage({ interns = [], weeklyReports = [], monthlyReports = [] }) {
  const [savingId, setSavingId] = useState("");
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedInternId, setSelectedInternId] = useState("all");
  const [remarks, setRemarks] = useState({});
  const [error, setError] = useState("");
  const [reportsData, setReportsData] = useState([]);

  const allReports = useMemo(() => {
    if (reportsData.length) return reportsData;
    const rows = [...(weeklyReports || []), ...(monthlyReports || [])];
    return rows
      .map((r) => ({
        ...r,
        reportType: r.reportType || (r.weekNumber ? "weekly" : "monthly"),
        submittedAt: r.submittedAt || r.submitted_at || null,
      }))
      .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
  }, [monthlyReports, reportsData, weeklyReports]);

  React.useEffect(() => {
    const rows = [...(weeklyReports || []), ...(monthlyReports || [])];
    const mapped = rows
      .map((r) => ({
        ...r,
        reportType: r.reportType || (r.weekNumber ? "weekly" : "monthly"),
        submittedAt: r.submittedAt || r.submitted_at || null,
      }))
      .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
    setReportsData(mapped);
  }, [weeklyReports, monthlyReports]);

  const filtered = useMemo(() => {
    return allReports.filter((r) => {
      if (statusFilter !== "all" && String(r.status || "").toLowerCase() !== statusFilter) return false;
      if (typeFilter !== "all" && String(r.reportType || "").toLowerCase() !== typeFilter) return false;
      if (selectedInternId !== "all" && String(r.internId || "") !== selectedInternId) return false;
      return true;
    });
  }, [allReports, selectedInternId, statusFilter, typeFilter]);

  const summary = useMemo(() => {
    const pending = allReports.filter((r) => String(r.status || "").toLowerCase() === "pending").length;
    const approved = allReports.filter((r) => String(r.status || "").toLowerCase() === "approved").length;
    const rejected = allReports.filter((r) => String(r.status || "").toLowerCase() === "rejected").length;
    return { total: allReports.length, pending, approved, rejected };
  }, [allReports]);

  async function review(report, status) {
    try {
      setSavingId(report.id);
      setError("");
      const text = String(remarks[report.id] || "").trim();
      await pmApi.reviewReport(report.id, {
        status,
        remarks: text || null,
      });
      setReportsData((prev) =>
        prev.map((r) =>
          r.id === report.id
            ? { ...r, status, reviewReason: text || null, reviewedAt: new Date().toISOString() }
            : r
        )
      );
      setRemarks((prev) => ({ ...prev, [report.id]: "" }));
    } catch (err) {
      setError(err?.message || "Failed to update report review.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 10 }}>
        <Stat label="Total Reports" value={summary.total} />
        <Stat label="Pending" value={summary.pending} />
        <Stat label="Approved" value={summary.approved} />
        <Stat label="Rejected" value={summary.rejected} />
      </div>

      <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.muted, fontSize: 12 }}>
          <Filter size={14} /> Filters
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={inputStyle}>
          <option value="all" style={{ color: "black" }}>all status</option>
          <option value="pending" style={{ color: "black" }}>pending</option>
          <option value="approved" style={{ color: "black" }}>approved</option>
          <option value="rejected" style={{ color: "black" }}>rejected</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} style={inputStyle}>
          <option value="all" style={{ color: "black" }}>all types</option>
          <option value="weekly" style={{ color: "black" }}>weekly</option>
          <option value="monthly" style={{ color: "black" }}>monthly</option>
        </select>
        <select value={selectedInternId} onChange={(e) => setSelectedInternId(e.target.value)} style={inputStyle}>
          <option value="all" style={{ color: "black" }}>all interns</option>
          {(interns || []).map((i) => (
            <option key={i.id} value={i.id} style={{ color: "black" }}>
              {i.full_name || i.fullName || i.email}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.45)", borderRadius: 10, padding: 10, color: "#fecaca", fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ display: "grid", gap: 10 }}>
        {filtered.map((report) => {
          const status = String(report.status || "").toLowerCase();
          const readonly = status !== "pending";
          const label = report.reportType === "weekly" ? `Week ${report.weekNumber || "-"}` : report.month || "Monthly";
          return (
            <div key={report.id} style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start", flexWrap: "wrap" }}>
                <div>
                  <div style={{ color: COLORS.text, fontWeight: 800 }}>{report.internName || report.internEmail || "Intern"}</div>
                  <div style={{ marginTop: 3, color: COLORS.muted, fontSize: 12 }}>
                    {report.internInternId || "-"} • {label} • {report.dateRange || "-"}
                  </div>
                </div>
                <StatusBadge status={status} />
              </div>

              <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 8 }}>
                <Mini label="Hours" value={report.totalHours || 0} />
                <Mini label="Days Worked" value={report.daysWorked || 0} />
                <Mini label="Avg/Day" value={report.avgHoursPerDay || "0.0"} />
                <Mini label="Submitted" value={report.submittedAt ? new Date(report.submittedAt).toLocaleDateString() : "-"} />
              </div>

              <div style={{ marginTop: 10, color: "rgba(255,229,217,0.85)", fontSize: 13, whiteSpace: "pre-wrap" }}>{report.summary || "No summary"}</div>

              <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                <div style={{ color: COLORS.muted, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                  <MessageSquare size={14} /> PM Remarks
                </div>
                <textarea
                  value={remarks[report.id] ?? report.reviewReason ?? ""}
                  onChange={(e) => setRemarks((prev) => ({ ...prev, [report.id]: e.target.value }))}
                  rows={3}
                  disabled={readonly}
                  style={{ ...inputStyle, resize: "vertical", opacity: readonly ? 0.75 : 1 }}
                  placeholder={readonly ? "Already reviewed" : "Add remarks for intern (optional)"}
                />
              </div>

              {!readonly && (
                <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={() => review(report, "approved")} disabled={savingId === report.id} style={btn("approve")}>
                    <CheckCircle2 size={15} /> {savingId === report.id ? "Saving..." : "Approve"}
                  </button>
                  <button onClick={() => review(report, "rejected")} disabled={savingId === report.id} style={btn("reject")}>
                    <XCircle size={15} /> {savingId === report.id ? "Saving..." : "Reject"}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 16, color: COLORS.muted, textAlign: "center" }}>
          No reports found for selected filters.
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 12 }}>
      <div style={{ fontSize: 11, color: COLORS.muted }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 22, color: COLORS.text, fontWeight: 800 }}>{value}</div>
    </div>
  );
}

function Mini({ label, value }) {
  return (
    <div style={{ padding: 8, borderRadius: 10, background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.border}` }}>
      <div style={{ fontSize: 10, color: COLORS.muted }}>{label}</div>
      <div style={{ marginTop: 4, fontSize: 13, color: COLORS.text, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function StatusBadge({ status }) {
  let color = COLORS.warning;
  if (status === "approved") color = COLORS.success;
  if (status === "rejected") color = COLORS.danger;
  return (
    <div style={{ padding: "4px 10px", borderRadius: 999, background: `${color}20`, border: `1px solid ${color}55`, color, fontSize: 11, fontWeight: 800, textTransform: "uppercase" }}>
      {status || "pending"}
    </div>
  );
}

function btn(type) {
  if (type === "approve") {
    return {
      border: "none",
      background: "rgba(74,222,128,0.22)",
      color: "#bbf7d0",
      borderRadius: 10,
      padding: "9px 12px",
      fontWeight: 700,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
    };
  }
  return {
    border: "none",
    background: "rgba(239,68,68,0.2)",
    color: "#fecaca",
    borderRadius: 10,
    padding: "9px 12px",
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${COLORS.border}`,
  background: "rgba(255,255,255,0.04)",
  color: "white",
  boxSizing: "border-box",
  outline: "none",
};
