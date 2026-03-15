import React, { useCallback, useEffect, useMemo, useState } from "react";
import { leaveRequestsApi } from "../lib/apiClient";

function pad2(value) {
  return String(value).padStart(2, "0");
}

function toIsoDateLocal(date) {
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function todayIsoLocal() {
  return toIsoDateLocal(new Date());
}

function statusPillStyle(status) {
  const s = String(status || "").toLowerCase();
  const color =
    s === "approved" ? "#10b981" : s === "pending" ? "#f59e0b" : s === "rejected" ? "#ef4444" : "rgba(255,255,255,0.7)";
  return {
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 900,
    background: `${color}18`,
    border: `1px solid ${color}55`,
    color,
    textTransform: "uppercase",
    letterSpacing: "0.4px",
    whiteSpace: "nowrap",
  };
}

export default function LeaveRequestsPanel({
  variant = "intern", // "intern" | "hr" | "admin"
  internId = "",
  title = "Leave requests",
  defaultStatus = "",
}) {
  const isSelf = variant === "intern" && !internId;
  const canReview = variant === "admin" || variant === "hr";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState([]);

  const [statusFilter, setStatusFilter] = useState(defaultStatus);

  const [applyStart, setApplyStart] = useState(todayIsoLocal());
  const [applyEnd, setApplyEnd] = useState(todayIsoLocal());
  const [applyReason, setApplyReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [reviewNotesById, setReviewNotesById] = useState({});
  const [decidingId, setDecidingId] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = isSelf
        ? await leaveRequestsApi.selfList(statusFilter ? { status: statusFilter } : {})
        : await leaveRequestsApi.list({
            ...(statusFilter ? { status: statusFilter } : {}),
            ...(internId ? { internId } : {}),
          });
      setRows(res?.leaveRequests || []);
    } catch (e) {
      setError(e?.message || "Failed to load leave requests.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [internId, isSelf, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const createRequest = async () => {
    if (!isSelf) return;
    setSubmitting(true);
    setError("");
    try {
      await leaveRequestsApi.selfCreate({ startDate: applyStart, endDate: applyEnd, reason: applyReason });
      setApplyReason("");
      await load();
    } catch (e) {
      setError(e?.message || "Failed to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRequest = async (id) => {
    if (!isSelf) return;
    setDecidingId(String(id));
    setError("");
    try {
      await leaveRequestsApi.selfCancel(id);
      await load();
    } catch (e) {
      setError(e?.message || "Failed to cancel leave request.");
    } finally {
      setDecidingId("");
    }
  };

  const decide = async (id, decision) => {
    if (!canReview) return;
    setDecidingId(String(id));
    setError("");
    try {
      await leaveRequestsApi.decide(id, { decision, reviewNotes: reviewNotesById?.[id] || "" });
      setReviewNotesById((prev) => {
        const next = { ...(prev || {}) };
        delete next[id];
        return next;
      });
      await load();
    } catch (e) {
      setError(e?.message || "Failed to update leave request.");
    } finally {
      setDecidingId("");
    }
  };

  const filteredRows = useMemo(() => Array.isArray(rows) ? rows : [], [rows]);

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 900, color: "white" }}>{title}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
            {canReview ? "Review and approve leave requests" : "Request leave and track approvals"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={fieldStyle} disabled={loading}>
            <option value="">All</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button type="button" onClick={load} style={btnStyle("primary")} disabled={loading}>
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 10, borderRadius: 10, border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.12)", color: "#fecaca", fontSize: 13 }}>
          {error}
        </div>
      )}

      {isSelf && (
        <div style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.04)", borderRadius: 14, padding: 12 }}>
          <div style={{ color: "rgba(255,255,255,0.9)", fontWeight: 900 }}>Apply for leave</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginTop: 10 }}>
            <input type="date" value={applyStart} onChange={(e) => setApplyStart(e.target.value)} style={fieldStyle} disabled={submitting} />
            <input type="date" value={applyEnd} onChange={(e) => setApplyEnd(e.target.value)} style={fieldStyle} disabled={submitting} />
            <input value={applyReason} onChange={(e) => setApplyReason(e.target.value)} placeholder="Reason (optional)" style={fieldStyle} disabled={submitting} />
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button type="button" onClick={createRequest} style={btnStyle("primary")} disabled={submitting}>
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>
            After approval, these days are marked as <span style={{ color: "#a78bfa", fontWeight: 900 }}>Leave</span> automatically in attendance.
          </div>
        </div>
      )}

      <div style={{ border: "1px solid rgba(255,255,255,0.12)", background: "rgba(0,0,0,0.18)", borderRadius: 14, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: canReview ? "150px 140px 120px 1fr 260px" : "150px 140px 120px 1fr 140px", gap: 10, padding: "10px 12px", fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.55)", borderBottom: "1px solid rgba(255,255,255,0.10)" }}>
          <div>From</div>
          <div>To</div>
          <div>Status</div>
          <div>Reason</div>
          <div>{canReview ? "Review" : "Actions"}</div>
        </div>
        <div style={{ maxHeight: 360, overflowY: "auto" }}>
          {loading && filteredRows.length === 0 && <div style={{ padding: 14, color: "rgba(255,255,255,0.6)" }}>Loading...</div>}
          {!loading && filteredRows.length === 0 && <div style={{ padding: 14, color: "rgba(255,255,255,0.6)" }}>No leave requests found.</div>}
          {filteredRows.map((row) => {
            const canCancel = isSelf && String(row.status || "").toLowerCase() === "pending";
            const isDeciding = decidingId && String(decidingId) === String(row.id);
            return (
              <div
                key={row.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: canReview ? "150px 140px 120px 1fr 260px" : "150px 140px 120px 1fr 140px",
                  gap: 10,
                  padding: "10px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                  alignItems: "center",
                }}
              >
                <div style={{ color: "rgba(255,255,255,0.9)", fontWeight: 700, fontSize: 12 }}>{row.startDate}</div>
                <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>{row.endDate}</div>
                <div>
                  <span style={statusPillStyle(row.status)}>{row.status}</span>
                </div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.reason || "-"}
                  {canReview && row?.intern?.fullName && (
                    <span style={{ marginLeft: 8, color: "rgba(255,255,255,0.45)" }}>
                      · {row.intern.fullName}{row.intern.email ? ` (${row.intern.email})` : ""}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", flexWrap: "wrap" }}>
                  {canReview ? (
                    <>
                      <input
                        value={reviewNotesById?.[row.id] || ""}
                        onChange={(e) => setReviewNotesById((prev) => ({ ...(prev || {}), [row.id]: e.target.value }))}
                        placeholder="Review notes (optional)"
                        style={{ ...fieldStyle, minWidth: 160 }}
                        disabled={isDeciding || String(row.status || "").toLowerCase() !== "pending"}
                      />
                      <button type="button" onClick={() => decide(row.id, "approved")} disabled={isDeciding || String(row.status || "").toLowerCase() !== "pending"} style={btnStyle("primary")}>
                        {isDeciding ? "Saving..." : "Approve"}
                      </button>
                      <button type="button" onClick={() => decide(row.id, "rejected")} disabled={isDeciding || String(row.status || "").toLowerCase() !== "pending"} style={btnStyle("danger")}>
                        Reject
                      </button>
                    </>
                  ) : (
                    <button type="button" onClick={() => cancelRequest(row.id)} disabled={!canCancel || isDeciding} style={btnStyle("secondary")}>
                      {isDeciding ? "Cancelling..." : canCancel ? "Cancel" : "-"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
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
      whiteSpace: "nowrap",
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
      whiteSpace: "nowrap",
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
    whiteSpace: "nowrap",
  };
}

