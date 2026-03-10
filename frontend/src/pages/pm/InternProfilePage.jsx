import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Mail, Calendar, Briefcase, Clock, FileText, CheckCircle2, XCircle, MessageSquare, Link2, ListChecks, User } from "lucide-react";
import { pmApi } from "../../lib/apiClient";
import { getRealtimeSocket } from "../../lib/realtime";

const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
  panel: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.14)",
  success: "#4ade80",
  warning: "#f59e0b",
  danger: "#ef4444",
};

function resolveDepartment(intern) {
  const profileData = intern?.profile_data && typeof intern.profile_data === "object" ? intern.profile_data : {};
  const raw = intern?.department || profileData.department || profileData.domain || profileData.team || "";
  const text = String(raw || "").trim();
  const normalized = text.toLowerCase();
  if (normalized === "sap") return "SAP";
  if (normalized === "oracle") return "Oracle";
  if (normalized === "accounts") return "Accounts";
  if (normalized === "hr") return "HR";
  return text || "Unassigned";
}

function normalizeReportsForIntern(reports, internId) {
  return (Array.isArray(reports) ? reports : [])
    .map((report) => ({
      ...report,
      status: String(report.status || "").toLowerCase(),
      reportType: report.reportType || (report.weekNumber ? "weekly" : "monthly"),
      submittedAt: report.submittedAt || report.submitted_at || null,
      periodStart: report.periodStart || report.period_start || null,
      periodEnd: report.periodEnd || report.period_end || null,
      totalHours: report.totalHours ?? report.total_hours ?? 0,
      daysWorked: report.daysWorked ?? report.days_worked ?? null,
      weekNumber: report.weekNumber ?? report.week_number ?? null,
      month: report.month ?? null,
      reviewReason: report.reviewReason ?? report.review_reason ?? null,
      reviewedAt: report.reviewedAt ?? report.reviewed_at ?? null,
      internId: report.internId || report.intern_profile_id || null,
    }))
    .filter((report) => String(report.internId || "") === String(internId || ""))
    .sort((a, b) => new Date(b.submittedAt || 0).getTime() - new Date(a.submittedAt || 0).getTime());
}

function statusColor(status) {
  const s = String(status || "").toLowerCase();
  if (s === "approved") return COLORS.success;
  if (s === "rejected") return COLORS.danger;
  return COLORS.warning;
}

const InternProfilePage = ({ intern, onBack, reports = [], initialSection = "profile" }) => {
  const [tnaItems, setTnaItems] = useState([]);
  const [blueprint, setBlueprint] = useState(null);
  const [links, setLinks] = useState({ tnaSheetUrl: "", blueprintDocUrl: "" });
  const [profileError, setProfileError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [savingReviewId, setSavingReviewId] = useState("");
  const [remarks, setRemarks] = useState({});
  const [internReports, setInternReports] = useState([]);
  const reportsSectionRef = useRef(null);
  const [activeTab, setActiveTab] = useState(initialSection === "reports" ? "reports" : "profile");

  const internId = intern?.id || null;

  useEffect(() => {
    setInternReports(normalizeReportsForIntern(reports, internId));
  }, [reports, internId]);

  const loadInternArtifacts = useCallback(async () => {
    if (!internId) return;
    setProfileError("");
    try {
      const [tnaRes, blueprintRes, linksRes] = await Promise.all([
        pmApi.internTna(internId),
        pmApi.internBlueprint(internId),
        pmApi.internReportLinks(internId),
      ]);
      setTnaItems(tnaRes?.items || []);
      setBlueprint(blueprintRes?.blueprint || null);
      setLinks({
        tnaSheetUrl: linksRes?.links?.tnaSheetUrl || "",
        blueprintDocUrl: linksRes?.links?.blueprintDocUrl || "",
      });
    } catch (err) {
      setProfileError(err?.message || "Failed to load intern profile details.");
      setTnaItems([]);
      setBlueprint(null);
      setLinks({ tnaSheetUrl: "", blueprintDocUrl: "" });
    }
  }, [internId]);

  useEffect(() => {
    if (!internId) return;
    if (activeTab !== "reports") return;
    const timeoutId = window.setTimeout(() => {
      loadInternArtifacts();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [internId, loadInternArtifacts, activeTab]);

  useEffect(() => {
    if (activeTab !== "reports") return;
    const socket = getRealtimeSocket();
    const onChanged = (payload) => {
      if (!payload) return;
      if (payload.internId && internId && String(payload.internId) !== String(internId)) return;
      if (!["tna", "blueprint", "report_links", "reports"].includes(payload.entity)) return;
      loadInternArtifacts();
    };
    socket.on("itp:changed", onChanged);
    return () => socket.off("itp:changed", onChanged);
  }, [internId, loadInternArtifacts, activeTab]);

  useEffect(() => {
    setActiveTab(initialSection === "reports" ? "reports" : "profile");
  }, [initialSection, internId]);

  useEffect(() => {
    if (initialSection !== "reports") return;
    const timer = window.setTimeout(() => {
      reportsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialSection, internId]);

  const reportSummary = useMemo(() => {
    const rows = internReports || [];
    return {
      total: rows.length,
      pending: rows.filter((row) => row.status === "pending").length,
      approved: rows.filter((row) => row.status === "approved").length,
      rejected: rows.filter((row) => row.status === "rejected").length,
    };
  }, [internReports]);

  const weeklyReports = useMemo(
    () => (internReports || []).filter((r) => String(r.reportType || "").toLowerCase() === "weekly"),
    [internReports]
  );
  const monthlyReports = useMemo(
    () => (internReports || []).filter((r) => String(r.reportType || "").toLowerCase() === "monthly"),
    [internReports]
  );

  const tnaByWeek = useMemo(() => {
    const buckets = new Map();
    (Array.isArray(tnaItems) ? tnaItems : []).forEach((item) => {
      const raw = item.week_number ?? item.weekNumber ?? null;
      const label = raw ? `Week ${raw}` : "Unassigned";
      if (!buckets.has(label)) buckets.set(label, []);
      buckets.get(label).push(item);
    });
    const labels = Array.from(buckets.keys());
    labels.sort((a, b) => {
      if (a === "Unassigned") return 1;
      if (b === "Unassigned") return -1;
      const na = Number(String(a).replace("Week", "").trim());
      const nb = Number(String(b).replace("Week", "").trim());
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
      return a.localeCompare(b);
    });
    return labels.map((label) => ({ label, items: buckets.get(label) || [] }));
  }, [tnaItems]);

  async function reviewReport(reportId, statusValue) {
    try {
      setSavingReviewId(reportId);
      setReviewError("");
      const text = String(remarks[reportId] || "").trim();
      await pmApi.reviewReport(reportId, { status: statusValue, remarks: text || null });
      setInternReports((prev) =>
        prev.map((report) =>
          report.id === reportId
            ? {
                ...report,
                status: statusValue,
                reviewReason: text || null,
                reviewedAt: new Date().toISOString(),
              }
            : report
        )
      );
      setRemarks((prev) => ({ ...prev, [reportId]: "" }));
    } catch (err) {
      setReviewError(err?.message || "Failed to review report.");
    } finally {
      setSavingReviewId("");
    }
  }

  if (!intern) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,229,217,0.7)" }}>
        No intern selected.
      </div>
    );
  }

  const name = intern.full_name || intern.fullName || intern.name || intern.email || "Intern";
  const avatar = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const status = String(intern.status || "active").toLowerCase();
  const department = resolveDepartment(intern);

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <button
        onClick={onBack}
        style={{
          width: "fit-content",
          padding: "10px 18px",
          borderRadius: 12,
          border: `1px solid ${COLORS.jungleTeal}`,
          background: "rgba(103,146,137,0.18)",
          color: COLORS.peachGlow,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        <ArrowLeft size={16} />
        Back to Interns
      </button>

      <div
        style={{
          padding: 22,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
          border: `1px solid rgba(255,255,255,0.2)`,
        }}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              border: "2px solid rgba(255,255,255,0.35)",
              display: "grid",
              placeItems: "center",
              color: "white",
              fontWeight: 800,
              fontSize: 24,
            }}
          >
            {avatar || "IN"}
          </div>
          <div style={{ minWidth: 260, flex: 1 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "white" }}>{name}</div>
            <div style={{ marginTop: 4, fontSize: 13, color: "rgba(255,255,255,0.9)" }}>
              {intern.email || "-"} | Intern ID: {intern.intern_id || intern.internId || "-"} | Department: {department}
            </div>
            <div style={{ marginTop: 8 }}>
              <span
                style={{
                  display: "inline-block",
                  borderRadius: 999,
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  border: `1px solid ${status === "active" ? "rgba(74,222,128,0.55)" : "rgba(239,68,68,0.55)"}`,
                  background: status === "active" ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.18)",
                  color: status === "active" ? "#dcfce7" : "#fecaca",
                }}
              >
                {status}
              </span>
            </div>
          </div>
        </div>

      </div>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveTab("profile")}
          style={{
            border: `1px solid ${activeTab === "profile" ? "rgba(255,229,217,0.4)" : COLORS.border}`,
            background: activeTab === "profile" ? "rgba(255,229,217,0.12)" : "rgba(255,255,255,0.04)",
            color: activeTab === "profile" ? COLORS.peachGlow : "rgba(255,229,217,0.75)",
            borderRadius: 999,
            padding: "10px 14px",
            fontWeight: 900,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <User size={16} />
          Profile
        </button>
        <button
          onClick={() => setActiveTab("reports")}
          style={{
            border: `1px solid ${activeTab === "reports" ? "rgba(20,184,166,0.55)" : COLORS.border}`,
            background: activeTab === "reports" ? "rgba(20,184,166,0.18)" : "rgba(255,255,255,0.04)",
            color: activeTab === "reports" ? "#dcfce7" : "rgba(255,229,217,0.75)",
            borderRadius: 999,
            padding: "10px 14px",
            fontWeight: 900,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <FileText size={16} />
          Reports
        </button>
      </div>

      {activeTab === "profile" && (
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16 }}>
          <div style={{ color: COLORS.peachGlow, fontWeight: 900, fontSize: 18 }}>
            Intern Profile
          </div>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
            <ProfileField icon={<Mail size={15} />} label="Email" value={intern.email || "-"} />
            <ProfileField icon={<Briefcase size={15} />} label="Intern ID" value={intern.intern_id || intern.internId || "-"} />
            <ProfileField icon={<ListChecks size={15} />} label="Department" value={department || "-"} />
            <ProfileField icon={<Calendar size={15} />} label="Joined" value={intern.created_at ? new Date(intern.created_at).toLocaleDateString() : "-"} />
            <ProfileField icon={<Clock size={15} />} label="Last Activity" value={intern.lastLogDate ? new Date(intern.lastLogDate).toLocaleDateString() : "No logs"} />
          </div>
        </div>
      )}

      {activeTab === "reports" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px,1fr))", gap: 10 }}>
            <MiniStat icon={<FileText size={16} />} label="Total Reports" value={reportSummary.total} />
            <MiniStat icon={<Clock size={16} />} label="Pending" value={reportSummary.pending} />
            <MiniStat icon={<CheckCircle2 size={16} />} label="Approved" value={reportSummary.approved} />
            <MiniStat icon={<XCircle size={16} />} label="Rejected" value={reportSummary.rejected} />
          </div>

          <div ref={reportsSectionRef} style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 14 }}>
            <div style={{ color: COLORS.peachGlow, fontWeight: 900, fontSize: 18, marginBottom: 10 }}>
              Reports (This Intern)
            </div>

            {reviewError ? (
              <div style={{ marginBottom: 10, color: "#fecaca", fontSize: 12 }}>{reviewError}</div>
            ) : null}

            <div style={{ display: "grid", gap: 12 }}>
              <ReportsSection
                title="Weekly Reports"
                reports={weeklyReports}
                remarks={remarks}
                setRemarks={setRemarks}
                savingReviewId={savingReviewId}
                onApprove={(id) => reviewReport(id, "approved")}
                onReject={(id) => reviewReport(id, "rejected")}
              />
              <ReportsSection
                title="Monthly Reports"
                reports={monthlyReports}
                remarks={remarks}
                setRemarks={setRemarks}
                savingReviewId={savingReviewId}
                onApprove={(id) => reviewReport(id, "approved")}
                onReject={(id) => reviewReport(id, "rejected")}
              />
            </div>
          </div>

      <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ color: COLORS.peachGlow, fontWeight: 800, fontSize: 17 }}>
            TNA & Blueprint
          </div>
          <button
            onClick={loadInternArtifacts}
            style={{
              border: `1px solid rgba(103,146,137,0.45)`,
              background: "rgba(103,146,137,0.18)",
              color: "white",
              borderRadius: 9,
              padding: "8px 12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Refresh
          </button>
        </div>

        {profileError ? (
          <div style={{ marginTop: 10, color: "#fecaca", fontSize: 12 }}>{profileError}</div>
        ) : null}

        <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 10, background: "rgba(255,255,255,0.03)" }}>
            <div style={{ color: "rgba(255,229,217,0.7)", fontSize: 11, marginBottom: 7, display: "flex", alignItems: "center", gap: 6 }}>
              <Link2 size={13} />
              External Links
            </div>
            <div style={{ color: "rgba(255,229,217,0.85)", fontSize: 12 }}>
              TNA Sheet:{" "}
              {links.tnaSheetUrl ? (
                <a href={links.tnaSheetUrl} target="_blank" rel="noreferrer" style={{ color: COLORS.jungleTeal, fontWeight: 700 }}>
                  Open
                </a>
              ) : "—"}
            </div>
            <div style={{ color: "rgba(255,229,217,0.85)", fontSize: 12, marginTop: 6 }}>
              Blueprint Doc:{" "}
              {links.blueprintDocUrl ? (
                <a href={links.blueprintDocUrl} target="_blank" rel="noreferrer" style={{ color: COLORS.jungleTeal, fontWeight: 700 }}>
                  Open
                </a>
              ) : "—"}
            </div>
          </div>

          <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 10, background: "rgba(255,255,255,0.03)" }}>
            <div style={{ color: "rgba(255,229,217,0.7)", fontSize: 11, marginBottom: 7 }}>
              Blueprint Summary
            </div>
            <div style={{ color: "rgba(255,229,217,0.9)", fontSize: 12, lineHeight: 1.6 }}>
              <div><strong>Objective:</strong> {blueprint?.data?.objective || "—"}</div>
              <div style={{ marginTop: 6 }}><strong>Scope:</strong> {blueprint?.data?.scope || "—"}</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ color: "rgba(255,229,217,0.7)", fontSize: 11, marginBottom: 7 }}>
            TNA Phases (Week Wise)
          </div>

          {tnaByWeek.length === 0 ? (
            <div style={{ color: "rgba(255,229,217,0.7)", fontSize: 12 }}>
              No TNA rows yet.
            </div>
          ) : (
            <div style={{ display: "grid", gap: 10 }}>
              {tnaByWeek.map((bucket) => (
                <div key={bucket.label} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 12, background: "rgba(255,255,255,0.03)" }}>
                  <div style={{ color: COLORS.peachGlow, fontWeight: 900, fontSize: 13 }}>{bucket.label}</div>
                  <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                    {bucket.items.map((item) => (
                      <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 8 }}>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ color: "rgba(255,229,217,0.95)", fontWeight: 800, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {item.task || "-"}
                          </div>
                          <div style={{ color: "rgba(255,229,217,0.65)", fontSize: 11, marginTop: 2 }}>
                            Planned: {item.planned_date || "-"}
                          </div>
                        </div>
                        <div style={{ color: item.status === "completed" ? COLORS.success : item.status === "blocked" ? COLORS.warning : COLORS.jungleTeal, fontWeight: 900, fontSize: 11, textTransform: "uppercase" }}>
                          {(item.status || "pending").replace(/_/g, " ")}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ color: "rgba(255,229,217,0.7)", fontSize: 11, marginBottom: 7 }}>
            Latest TNA Rows
          </div>
          {(tnaItems || []).slice(0, 8).map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ color: "rgba(255,229,217,0.9)", fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {item.task || "—"}
                </div>
                <div style={{ color: "rgba(255,229,217,0.6)", fontSize: 11, marginTop: 3 }}>
                  Week {item.week_number || "—"} | Planned: {item.planned_date || "—"}
                </div>
              </div>
              <div style={{ color: item.status === "completed" ? COLORS.success : item.status === "blocked" ? COLORS.warning : COLORS.jungleTeal, fontWeight: 800, fontSize: 11 }}>
                {(item.status || "pending").replace("_", " ")}
              </div>
            </div>
          ))}
          {(tnaItems || []).length === 0 && (
            <div style={{ color: "rgba(255,229,217,0.7)", fontSize: 12 }}>
              No TNA rows yet.
            </div>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
};

function ProfileField({ icon, label, value }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 12, background: "rgba(255,255,255,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,229,217,0.75)", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {icon}
        {label}
      </div>
      <div style={{ marginTop: 8, color: "white", fontWeight: 800, fontSize: 13 }}>
        {value}
      </div>
    </div>
  );
}

function ReportsSection({ title, reports = [], remarks, setRemarks, savingReviewId, onApprove, onReject }) {
  const items = Array.isArray(reports) ? reports : [];
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 12, background: "rgba(255,255,255,0.03)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ color: COLORS.peachGlow, fontWeight: 900, fontSize: 14 }}>
          {title}
        </div>
        <div style={{ color: "rgba(255,229,217,0.65)", fontSize: 12, fontWeight: 800 }}>
          {items.length}
        </div>
      </div>

      {items.length === 0 ? (
        <div style={{ marginTop: 10, color: "rgba(255,229,217,0.65)", fontSize: 12 }}>
          No {title.toLowerCase()} submitted yet.
        </div>
      ) : (
        <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
          {items.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              remarks={remarks}
              setRemarks={setRemarks}
              savingReviewId={savingReviewId}
              onApprove={onApprove}
              onReject={onReject}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReportCard({ report, remarks, setRemarks, savingReviewId, onApprove, onReject }) {
  const readOnly = String(report.status || "").toLowerCase() !== "pending";
  const currentStatusColor = statusColor(report.status);
  const isWeekly = String(report.reportType || "").toLowerCase() === "weekly";
  const label = isWeekly ? `Week ${report.weekNumber || "-"}` : report.month || "Monthly";

  const meta = [
    report.periodStart && report.periodEnd ? `Period: ${report.periodStart} to ${report.periodEnd}` : null,
    report.submittedAt ? `Submitted: ${new Date(report.submittedAt).toLocaleDateString()}` : null,
    `Hours: ${Number(report.totalHours || 0)}`,
    report.daysWorked != null ? `Days: ${report.daysWorked}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return (
    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 12, background: "rgba(0,0,0,0.12)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <div style={{ color: COLORS.peachGlow, fontWeight: 800, fontSize: 14 }}>{label}</div>
          <div style={{ color: "rgba(255,229,217,0.65)", fontSize: 11 }}>{meta || "-"}</div>
        </div>
        <span
          style={{
            border: `1px solid ${currentStatusColor}66`,
            background: `${currentStatusColor}20`,
            color: currentStatusColor,
            borderRadius: 999,
            padding: "4px 10px",
            fontSize: 11,
            fontWeight: 900,
            textTransform: "uppercase",
          }}
        >
          {report.status || "pending"}
        </span>
      </div>

      <div style={{ marginTop: 8, color: "rgba(255,229,217,0.92)", fontSize: 13, whiteSpace: "pre-wrap" }}>
        {report.summary || "No summary provided."}
      </div>

      <div style={{ marginTop: 10 }}>
        <div style={{ color: "rgba(255,229,217,0.75)", fontSize: 11, marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <MessageSquare size={13} />
          PM Remarks
        </div>
        <textarea
          value={remarks?.[report.id] ?? report.reviewReason ?? ""}
          onChange={(event) => setRemarks((prev) => ({ ...prev, [report.id]: event.target.value }))}
          disabled={readOnly}
          rows={3}
          style={{
            width: "100%",
            boxSizing: "border-box",
            borderRadius: 10,
            border: `1px solid ${COLORS.border}`,
            background: "rgba(255,255,255,0.04)",
            color: "white",
            padding: "9px 10px",
            outline: "none",
            resize: "vertical",
            opacity: readOnly ? 0.75 : 1,
          }}
          placeholder={readOnly ? "Already reviewed" : "Add remarks (optional)"}
        />
      </div>

      {!readOnly && (
        <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => onApprove?.(report.id)}
            disabled={savingReviewId === report.id}
            style={{
              border: "1px solid rgba(74,222,128,0.45)",
              background: "rgba(74,222,128,0.2)",
              color: "#dcfce7",
              borderRadius: 9,
              padding: "8px 11px",
              fontWeight: 900,
              fontSize: 12,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <CheckCircle2 size={14} />
            {savingReviewId === report.id ? "Saving..." : "Approve"}
          </button>
          <button
            onClick={() => onReject?.(report.id)}
            disabled={savingReviewId === report.id}
            style={{
              border: "1px solid rgba(239,68,68,0.45)",
              background: "rgba(239,68,68,0.2)",
              color: "#fecaca",
              borderRadius: 9,
              padding: "8px 11px",
              fontWeight: 900,
              fontSize: 12,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <XCircle size={14} />
            {savingReviewId === report.id ? "Saving..." : "Reject"}
          </button>
        </div>
      )}
    </div>
  );
}

function MiniStat({ icon, label, value }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.22)", borderRadius: 10, padding: 10, background: "rgba(255,255,255,0.08)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", color: "rgba(255,255,255,0.85)", fontSize: 11 }}>
        <span>{label}</span>
        {icon}
      </div>
      <div style={{ marginTop: 6, color: "white", fontWeight: 900, fontSize: 20 }}>{value}</div>
    </div>
  );
}

export default InternProfilePage;
