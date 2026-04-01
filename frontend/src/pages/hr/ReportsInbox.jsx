import React, { useEffect, useMemo, useState } from "react";
import { FileText, X } from "lucide-react";
import { hrApi } from "../../lib/apiClient";
import { getRealtimeSocket } from "../../lib/realtime";
import { COLORS, glassCardStyle } from "./HRConstants";

const formatLateSubmission = (iso) => {
  const d = new Date(iso || "");
  if (Number.isNaN(d.getTime())) return "";
  const datePart = d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  const timePart = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return `${datePart} at ${timePart}`;
};

export default function ReportsInbox() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await hrApi.reports();
      setReports(res?.reports || []);
    } catch (e) {
      setError(e?.message || "Failed to load reports");
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const socket = getRealtimeSocket();
    const onChanged = (payload) => {
      if (!payload || payload.entity === "reports") load();
    };
    socket.on("itp:changed", onChanged);
    return () => socket.off("itp:changed", onChanged);
  }, []);

  const stats = useMemo(() => {
    const pending = reports.filter((r) => (r.status || "") === "pending").length;
    const weekly = reports.filter((r) => (r.reportType || "") === "weekly").length;
    const monthly = reports.filter((r) => (r.reportType || "") === "monthly").length;
    return { total: reports.length, pending, weekly, monthly };
  }, [reports]);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ marginBottom: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.textPrimary }}>Reports Inbox</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 6 }}>
              Weekly/monthly reports submitted by interns (to HR).
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[
              { label: "Total", value: stats.total },
              { label: "Pending", value: stats.pending },
              { label: "Weekly", value: stats.weekly },
              { label: "Monthly", value: stats.monthly },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: `1px solid ${COLORS.borderGlass}`,
                  borderRadius: 12,
                  padding: "10px 12px",
                  minWidth: 90,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.textPrimary }}>{s.value}</div>
                <div style={{ fontSize: 11, color: COLORS.textMuted }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ ...glassCardStyle, padding: 18, color: COLORS.textSecondary }}>Loading reports…</div>
      )}
      {!loading && error && (
        <div style={{ ...glassCardStyle, padding: 18, borderLeft: `4px solid ${COLORS.orange}` }}>
          <div style={{ color: COLORS.textPrimary, fontWeight: 700 }}>Could not load reports</div>
          <div style={{ color: COLORS.textMuted, marginTop: 6, fontSize: 13 }}>{error}</div>
        </div>
      )}
      {!loading && !error && reports.length === 0 && (
        <div style={{ ...glassCardStyle, padding: 26, textAlign: "center", color: COLORS.textMuted }}>
          No reports yet.
        </div>
      )}

      {!loading && !error && reports.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 12 }}>
          {reports.map((r) => {
            const title =
              r.reportType === "weekly"
                ? `Weekly Report • Week ${r.weekNumber || "?"}`
                : `Monthly Report • ${r.month || "Month"}`;
            const submitted = r.submittedAt ? new Date(r.submittedAt).toLocaleString() : "";
            const lateLabel = r.isLate && r.submittedAt
              ? `Late Submission — Submitted on ${formatLateSubmission(r.submittedAt)}`
              : r.isLate
                ? "Late Submission"
                : "";
            return (
              <button
                key={r.id}
                onClick={() => setSelected(r)}
                style={{
                  ...glassCardStyle,
                  padding: 16,
                  textAlign: "left",
                  cursor: "pointer",
                  border: `1px solid ${COLORS.borderGlass}`,
                  background: "rgba(255,255,255,0.05)",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.08)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: COLORS.jungleTeal,
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={18} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ color: COLORS.textPrimary, fontWeight: 800, fontSize: 14 }}>{title}</div>
                      <div style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 6 }}>
                        {r.internName} • {r.internEmail}
                      </div>
                      <div style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 4 }}>
                        {r.dateRange || ""} {submitted ? `• ${submitted}` : ""}
                      </div>
                      {lateLabel && (
                        <div style={{ color: COLORS.warning, fontSize: 12, marginTop: 6, fontWeight: 700 }}>
                          {lateLabel}
                        </div>
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      color: "white",
                      background:
                        r.status === "approved"
                          ? "rgba(16,185,129,0.25)"
                          : r.status === "rejected"
                            ? "rgba(239,68,68,0.25)"
                            : "rgba(245,158,11,0.25)",
                      border:
                        r.status === "approved"
                          ? "1px solid rgba(16,185,129,0.35)"
                          : r.status === "rejected"
                            ? "1px solid rgba(239,68,68,0.35)"
                            : "1px solid rgba(245,158,11,0.35)",
                      flexShrink: 0,
                      textTransform: "capitalize",
                    }}
                  >
                    {r.status || "pending"}
                  </div>
                </div>
                <div style={{ marginTop: 12, color: "rgba(255,255,255,0.7)", fontSize: 12, lineHeight: 1.6 }}>
                  {String(r.summary || "").slice(0, 220)}
                  {String(r.summary || "").length > 220 ? "…" : ""}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            padding: 18,
          }}
          onClick={() => setSelected(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 860,
              maxHeight: "90vh",
              overflowY: "auto",
              borderRadius: 18,
              background: COLORS.bgSecondary,
              border: `1px solid ${COLORS.borderGlass}`,
              padding: 18,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ color: COLORS.textPrimary, fontWeight: 900, fontSize: 16 }}>
                  {selected.reportType === "weekly"
                    ? `Weekly Report • Week ${selected.weekNumber || "?"}`
                    : `Monthly Report • ${selected.month || "Month"}`}
                </div>
                <div style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 6 }}>
                  {selected.internName} • {selected.internEmail}
                  {selected.pmEmail ? ` • PM: ${selected.pmEmail}` : ""}
                </div>
                {selected.dateRange && (
                  <div style={{ color: COLORS.textMuted, fontSize: 12, marginTop: 4 }}>{selected.dateRange}</div>
                )}
                {selected.isLate && (
                  <div style={{ color: COLORS.warning, fontSize: 12, marginTop: 6, fontWeight: 700 }}>
                    {selected.submittedAt
                      ? `Late Submission — Submitted on ${formatLateSubmission(selected.submittedAt)}`
                      : "Late Submission"}
                  </div>
                )}
              </div>
              <button
                onClick={() => setSelected(null)}
                style={{
                  border: `1px solid ${COLORS.borderGlass}`,
                  background: "rgba(255,255,255,0.06)",
                  color: COLORS.textSecondary,
                  borderRadius: 10,
                  width: 38,
                  height: 38,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginTop: 14, ...glassCardStyle, padding: 14 }}>
              <div style={{ color: COLORS.textPrimary, fontWeight: 800, marginBottom: 8 }}>Summary</div>
              <pre style={{ whiteSpace: "pre-wrap", margin: 0, color: "rgba(255,255,255,0.78)", fontSize: 12, lineHeight: 1.7 }}>
                {selected.summary || ""}
              </pre>
            </div>

            {selected.reviewReason && (
              <div style={{ marginTop: 12, ...glassCardStyle, padding: 14, borderLeft: "4px solid rgba(245,158,11,0.7)" }}>
                <div style={{ color: COLORS.textPrimary, fontWeight: 800, marginBottom: 8 }}>Review note</div>
                <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 13, lineHeight: 1.6 }}>{selected.reviewReason}</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

