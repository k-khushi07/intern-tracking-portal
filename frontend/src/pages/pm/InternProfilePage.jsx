import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Mail, Calendar, Briefcase, Clock, FileText, CheckCircle2, XCircle, MessageSquare, Link2, ListChecks, User } from "lucide-react";
import { pmApi } from "../../lib/apiClient";
import { getRealtimeSocket } from "../../lib/realtime";
import AttendancePanel from "../../components/AttendancePanel";

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
  const profileDataRaw = intern?.profile_data || intern?.profileData;
  const profileData = profileDataRaw && typeof profileDataRaw === "object" ? profileDataRaw : {};
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

function getGoogleEmbedUrl(url, type) {
  if (!url) return null;
  try {
    const isDoc = !!url.match(/\/document\//i);
    const isSheet = !!url.match(/\/spreadsheets\//i);
    const idMatch = url.match(/\/(?:d|e)\/([a-zA-Z0-9_-]+)/);
    if (!idMatch) return url;

    const id = idMatch[1];
    const isPublished = url.includes('/e/');
    
    const gidMatch = url.match(/[?&]gid=([0-9]+)/);
    const gid = gidMatch ? `&gid=${gidMatch[1]}` : '';

    if (isDoc || type === 'doc') {
      if (isPublished) return `https://docs.google.com/document/d/e/${id}/pub?embedded=true`;
      return `https://docs.google.com/document/d/${id}/preview`;
    }
    
    if (isSheet || type === 'sheet') {
      if (isPublished) return `https://docs.google.com/spreadsheets/d/e/${id}/pubhtml?widget=true&headers=false${gid}`;
      return `https://docs.google.com/spreadsheets/d/${id}/htmlembed?widget=true${gid}`;
    }
  } catch {
    return url;
  }
  return url;
}

function resolveMonthLabel(report) {
  const raw = String(report?.month || "").trim();
  if (raw) return raw;

  const iso =
    report?.submittedAt ||
    report?.submitted_at ||
    report?.createdAt ||
    report?.created_at ||
    null;

  if (!iso) return "Unknown Month";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return "Unknown Month";
  return dt.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

const InternProfilePage = ({ intern, onBack, reports = [], initialSection = "profile", api = pmApi }) => {
  const params = useParams();
  const internIdParam = params?.id || params?.internId || null;
  const [internDetails, setInternDetails] = useState(intern || null);
  const [internLoading, setInternLoading] = useState(false);
  const [internLoadError, setInternLoadError] = useState("");
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
  const [reportTab, setReportTab] = useState("weekly");

  const internId = internIdParam || internDetails?.id || intern?.id || null;
  const profileData = useMemo(() => {
    const raw = internDetails?.profile_data || internDetails?.profileData;
    return raw && typeof raw === "object" ? raw : {};
  }, [internDetails]);

  useEffect(() => {
    if (!intern) return;
    setInternDetails(intern);
  }, [intern]);

  useEffect(() => {
    let cancelled = false;
    const loadIntern = async () => {
      if (!internId) return;
      setInternLoading(true);
      setInternLoadError("");
      try {
        if (typeof api?.getIntern !== "function") throw new Error("getIntern is not available");
        const res = await api.getIntern(internId);
        if (cancelled) return;
        setInternDetails(res?.intern || null);
      } catch (err) {
        if (cancelled) return;
        setInternLoadError(err?.message || "Failed to load intern profile.");
      } finally {
        if (!cancelled) setInternLoading(false);
      }
    };
    loadIntern();
    return () => {
      cancelled = true;
    };
  }, [internId, api]);

  useEffect(() => {
    let cancelled = false;

    const fromProps = Array.isArray(reports) ? reports : [];
    if (fromProps.length > 0) {
      setInternReports(normalizeReportsForIntern(fromProps, internId));
      return () => {
        cancelled = true;
      };
    }

    const load = async () => {
      if (!internId) return;
      if (typeof api?.getInternReports !== "function") return;
      try {
        const res = await api.getInternReports(internId);
        if (cancelled) return;
        const rows = Array.isArray(res?.reports) ? res.reports : [];
        setInternReports(normalizeReportsForIntern(rows, internId));
      } catch {
        // ignore
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [reports, internId, api]);

  const loadInternArtifacts = useCallback(async () => {
    if (!internId) return;
    setProfileError("");
    try {
      const [tnaRes, blueprintRes, linksRes] = await Promise.all([
        api.internTna(internId),
        api.internBlueprint(internId),
        api.internReportLinks(internId),
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
  }, [internId, api]);

  useEffect(() => {
    if (!internId) return;
    const timeoutId = window.setTimeout(() => {
      loadInternArtifacts();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [internId, loadInternArtifacts]);

  useEffect(() => {
    const socket = getRealtimeSocket();
    const onChanged = (payload) => {
      if (!payload) return;
      if (payload.internId && internId && String(payload.internId) !== String(internId)) return;
      if (!["tna", "blueprint", "report_links", "reports"].includes(payload.entity)) return;
      loadInternArtifacts();
    };
    socket.on("itp:changed", onChanged);
    return () => socket.off("itp:changed", onChanged);
  }, [internId, loadInternArtifacts]);

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
      if (typeof api?.reviewReport !== "function") throw new Error("reviewReport is not available");
      await api.reviewReport(reportId, { status: statusValue, remarks: text || null });
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

  if (!internDetails && !internLoading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: "rgba(255,229,217,0.7)" }}>
        No intern selected.
      </div>
    );
  }

  const name =
    profileData.full_name ||
    profileData.fullName ||
    profileData.name ||
    internDetails?.full_name ||
    internDetails?.fullName ||
    internDetails?.name ||
    internDetails?.email ||
    "Intern";
  const avatar = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const status = String(internDetails?.status || intern?.status || "active").toLowerCase();
  const department = resolveDepartment({ ...internDetails, profile_data: profileData });
  const profilePictureUrl = profileData.profilePictureUrl || profileData.profile_picture_url || null;
  const resumeUrl =
    profileData.resumeUrl ||
    profileData.resume_url ||
    internDetails?.resumeUrl ||
    internDetails?.resume_url ||
    intern?.resumeUrl ||
    intern?.resume_url ||
    null;
  const displayEmail = profileData.email || internDetails?.email || "-";
  const displayInternId = profileData.internId || profileData.intern_id || internDetails?.intern_id || internDetails?.internId || "-";
  const joinedAt = profileData.joinedAt || profileData.joinDate || internDetails?.created_at || null;
  const lastActivity = profileData.lastLogDate || profileData.lastActivity || internDetails?.lastLogDate || null;

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
              overflow: "hidden",
              position: "relative",
            }}
          >
            <span>{avatar || "IN"}</span>
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt="Intern profile"
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            ) : null}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "white" }}>{name}</div>
            <div style={{ marginTop: 4, fontSize: 13, color: "rgba(255,255,255,0.9)", overflowWrap: "anywhere", wordBreak: "break-word", lineHeight: 1.4 }}>
              {displayEmail} | Intern ID: {displayInternId} | Department: {department}
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
          onClick={() => setActiveTab("tracking")}
          style={{
            border: `1px solid ${activeTab === "tracking" ? "rgba(103,146,137,0.55)" : COLORS.border}`,
            background: activeTab === "tracking" ? "rgba(103,146,137,0.18)" : "rgba(255,255,255,0.04)",
            color: activeTab === "tracking" ? "#a7f3d0" : "rgba(255,229,217,0.75)",
            borderRadius: 999,
            padding: "10px 14px",
            fontWeight: 900,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <ListChecks size={16} />
          Tracking Sheet
        </button>
        <button
          onClick={() => setActiveTab("blueprint")}
          style={{
            border: `1px solid ${activeTab === "blueprint" ? "rgba(103,146,137,0.55)" : COLORS.border}`,
            background: activeTab === "blueprint" ? "rgba(103,146,137,0.18)" : "rgba(255,255,255,0.04)",
            color: activeTab === "blueprint" ? "#e0e7ff" : "rgba(255,229,217,0.75)",
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
          Blueprint
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
        <button
          onClick={() => setActiveTab("attendance")}
          style={{
            border: `1px solid ${activeTab === "attendance" ? "rgba(34,211,238,0.45)" : COLORS.border}`,
            background: activeTab === "attendance" ? "rgba(34,211,238,0.14)" : "rgba(255,255,255,0.04)",
            color: activeTab === "attendance" ? "#cffafe" : "rgba(255,229,217,0.75)",
            borderRadius: 999,
            padding: "10px 14px",
            fontWeight: 900,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Calendar size={16} />
          Attendance
        </button>
      </div>

      {activeTab === "profile" && (
        <div style={{ display: "grid", gap: 16 }}>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            {resumeUrl ? (
              <button
                type="button"
                onClick={() => window.open(resumeUrl, "_blank", "noopener,noreferrer")}
                style={{
                  border: `1px solid ${COLORS.border}`,
                  background: "rgba(255,255,255,0.06)",
                  color: COLORS.peachGlow,
                  borderRadius: 12,
                  padding: "10px 12px",
                  fontWeight: 900,
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 12,
                }}
              >
                <FileText size={14} /> Open Resume
              </button>
            ) : (
              <div style={{ fontSize: 12, color: "rgba(255,229,217,0.7)", fontWeight: 800 }}>
                Resume not uploaded (profile setup pending)
              </div>
            )}
          </div>
          <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ color: COLORS.peachGlow, fontWeight: 900, fontSize: 18 }}>
              Intern Information
            </div>
            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
              <ProfileField icon={<Mail size={15} />} label="Email" value={displayEmail} />
              <ProfileField icon={<Briefcase size={15} />} label="Intern ID" value={displayInternId} />
              <ProfileField icon={<ListChecks size={15} />} label="Department" value={department || "-"} />
              <ProfileField icon={<Calendar size={15} />} label="Joined" value={joinedAt ? new Date(joinedAt).toLocaleDateString() : "-"} />
              <ProfileField icon={<Clock size={15} />} label="Last Activity" value={lastActivity ? new Date(lastActivity).toLocaleDateString() : "No logs"} />
            </div>
          </div>

          <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
              <div style={{ color: COLORS.peachGlow, fontWeight: 900, fontSize: 18 }}>
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
                  fontSize: 12,
                  cursor: "pointer",
                }}
              >
                Refresh Data
              </button>
            </div>

            {profileError && (
              <div style={{ marginBottom: 12, padding: 10, borderRadius: 8, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fecaca", fontSize: 12 }}>
                {profileError}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
              {/* Links Card */}
              <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14, background: "rgba(255,255,255,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,229,217,0.75)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
                  <Link2 size={14} color={COLORS.jungleTeal} />
                  External Links
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(0,0,0,0.2)", borderRadius: 8, fontSize: 13 }}>
                    <span style={{ color: "rgba(255,229,217,0.9)" }}>TNA Sheet</span>
                    {links.tnaSheetUrl ? (
                      <a href={links.tnaSheetUrl} target="_blank" rel="noreferrer" style={{ color: COLORS.jungleTeal, fontWeight: 800, textDecoration: "none" }}>Open ↗</a>
                    ) : <span style={{ color: COLORS.muted }}>Not set</span>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(0,0,0,0.2)", borderRadius: 8, fontSize: 13 }}>
                    <span style={{ color: "rgba(255,229,217,0.9)" }}>Blueprint Doc</span>
                    {links.blueprintDocUrl ? (
                      <a href={links.blueprintDocUrl} target="_blank" rel="noreferrer" style={{ color: COLORS.jungleTeal, fontWeight: 800, textDecoration: "none" }}>Open ↗</a>
                    ) : <span style={{ color: COLORS.muted }}>Not set</span>}
                  </div>
                </div>
              </div>

              {/* Blueprint Summary Card */}
              <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14, background: "rgba(255,255,255,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,229,217,0.75)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
                  <FileText size={14} color={COLORS.jungleTeal} />
                  Blueprint Details
                </div>
                <div style={{ color: "rgba(255,229,217,0.9)", fontSize: 13, lineHeight: 1.6, display: "grid", gap: 8 }}>
                  <div>
                    <strong style={{ color: COLORS.peachGlow }}>Objective:</strong>
                    <div style={{ color: COLORS.muted, marginTop: 2 }}>{blueprint?.data?.objective || "No objective defined yet."}</div>
                  </div>
                  <div>
                    <strong style={{ color: COLORS.peachGlow }}>Scope:</strong>
                    <div style={{ color: COLORS.muted, marginTop: 2 }}>{blueprint?.data?.scope || "No scope defined yet."}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* TNA Tracker */}
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,229,217,0.75)", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
                <ListChecks size={14} color={COLORS.jungleTeal} />
                TNA Phased Tracking
              </div>

              {tnaByWeek.length === 0 ? (
                <div style={{ padding: 20, textAlign: "center", background: "rgba(0,0,0,0.15)", borderRadius: 12, color: COLORS.muted, fontSize: 13 }}>
                  No TNA progress rows available.
                </div>
              ) : (
                <div style={{ display: "grid", gap: 12 }}>
                  {tnaByWeek.map((bucket) => (
                    <div key={bucket.label} style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: "hidden" }}>
                      <div style={{ background: "rgba(255,255,255,0.05)", padding: "10px 14px", borderBottom: `1px solid ${COLORS.border}`, color: COLORS.peachGlow, fontWeight: 800, fontSize: 14 }}>
                        {bucket.label}
                      </div>
                      <div style={{ background: "rgba(0,0,0,0.15)", padding: 0 }}>
                        <div style={{ overflowX: "auto" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                            <thead>
                              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                                <th style={{ textAlign: "left", padding: 12, color: "rgba(255,255,255,0.7)", fontWeight: 800 }}>Task</th>
                                <th style={{ textAlign: "left", padding: 12, color: "rgba(255,255,255,0.7)", fontWeight: 800 }}>Planned Date</th>
                                <th style={{ textAlign: "right", padding: 12, color: "rgba(255,255,255,0.7)", fontWeight: 800 }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {bucket.items.map((item, idx) => (
                                <tr key={item.id} style={{ borderBottom: idx < bucket.items.length - 1 ? `1px solid ${COLORS.border}` : "none" }}>
                                  <td style={{ padding: "12px", color: "white", fontWeight: 600, minWidth: 200 }}>
                                    {item.task || "Unnamed Task"}
                                  </td>
                                  <td style={{ padding: "12px", color: COLORS.muted, fontSize: 12, minWidth: 120 }}>
                                    {item.planned_date || "Not set"}
                                  </td>
                                  <td style={{ padding: "12px", textAlign: "right", minWidth: 120 }}>
                                    <span style={{
                                      padding: "4px 8px",
                                      borderRadius: 6,
                                      fontSize: 10,
                                      fontWeight: 800,
                                      textTransform: "uppercase",
                                      background: item.status === "completed" ? "rgba(74,222,128,0.15)" : item.status === "blocked" ? "rgba(245,158,11,0.15)" : "rgba(103,146,137,0.15)",
                                      color: item.status === "completed" ? COLORS.success : item.status === "blocked" ? COLORS.warning : COLORS.peachGlow,
                                      border: `1px solid ${item.status === "completed" ? "rgba(74,222,128,0.3)" : item.status === "blocked" ? "rgba(245,158,11,0.3)" : "rgba(103,146,137,0.3)"}`
                                    }}>
                                      {(item.status || "pending").replace(/_/g, " ")}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "tracking" && (
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ color: COLORS.peachGlow, fontWeight: 900, fontSize: 18 }}>
              TNA Tracking Sheet
            </div>
            {links.tnaSheetUrl && (
              <a href={links.tnaSheetUrl} target="_blank" rel="noreferrer" style={{ color: COLORS.jungleTeal, fontSize: 13, fontWeight: 800, textDecoration: "none" }}>Open in New Tab ↗</a>
            )}
          </div>
          {links.tnaSheetUrl ? (
            <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${COLORS.border}` }}>
              <iframe
                src={getGoogleEmbedUrl(links.tnaSheetUrl, "sheet")}
                style={{ width: "100%", height: "70vh", minHeight: 600, border: "none" }}
                title="TNA Tracking Sheet"
              />
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: COLORS.muted }}>
              No Tracking Sheet link set for this intern yet.
            </div>
          )}
        </div>
      )}

      {activeTab === "blueprint" && (
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ color: COLORS.peachGlow, fontWeight: 900, fontSize: 18 }}>
              Blueprint Document
            </div>
            {links.blueprintDocUrl && (
              <a href={links.blueprintDocUrl} target="_blank" rel="noreferrer" style={{ color: COLORS.jungleTeal, fontSize: 13, fontWeight: 800, textDecoration: "none" }}>Open in New Tab ↗</a>
            )}
          </div>
          {links.blueprintDocUrl ? (
            <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${COLORS.border}` }}>
              <iframe
                src={getGoogleEmbedUrl(links.blueprintDocUrl, "doc")}
                style={{ width: "100%", height: "70vh", minHeight: 600, border: "none" }}
                title="Blueprint Document"
              />
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: COLORS.muted }}>
              No Blueprint Document link set for this intern yet.
            </div>
          )}
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

            {reviewError && (
              <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fecaca", fontSize: 13 }}>
                {reviewError}
              </div>
            )}

            <div style={{ display: "grid", gap: 20 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 4, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 16 }}>
                <button
                  onClick={() => setReportTab("weekly")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 12,
                    border: "none",
                    background: reportTab === "weekly" ? "rgba(103,146,137,0.2)" : "transparent",
                    color: reportTab === "weekly" ? COLORS.jungleTeal : "rgba(255,255,255,0.6)",
                    cursor: "pointer",
                    fontWeight: reportTab === "weekly" ? 800 : 600,
                    fontSize: 14,
                    transition: "all 0.2s"
                  }}
                >
                  Weekly Reports
                </button>
                <button
                  onClick={() => setReportTab("monthly")}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 12,
                    border: "none",
                    background: reportTab === "monthly" ? "rgba(245,158,11,0.2)" : "transparent",
                    color: reportTab === "monthly" ? COLORS.warning : "rgba(255,255,255,0.6)",
                    cursor: "pointer",
                    fontWeight: reportTab === "monthly" ? 800 : 600,
                    fontSize: 14,
                    transition: "all 0.2s"
                  }}
                >
                  Monthly Reports
                </button>
              </div>

              {reportTab === "weekly" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                  {(() => {
                    const weeklies = weeklyReports;
                    if (weeklies.length === 0) return <div style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", padding: 20 }}>No weekly reports found.</div>;

                    const byMonth = weeklies.reduce((acc, r) => {
                      const m = resolveMonthLabel(r);
                      if (!acc[m]) acc[m] = [];
                      acc[m].push(r);
                      return acc;
                    }, {});

                    return Object.entries(byMonth).map(([monthName, monthReports]) => (
                      <div key={monthName}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: "rgba(255,255,255,0.7)", marginBottom: 12, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 8 }}>
                          {monthName}
                        </h3>
                        <div style={{ display: "grid", gap: 16 }}>
                          {monthReports.map(report => (
                            <ReportCard
                              key={report.id}
                              report={report}
                              remarks={remarks}
                              setRemarks={setRemarks}
                              savingReviewId={savingReviewId}
                              onApprove={(id) => reviewReport(id, "approved")}
                              onReject={(id) => reviewReport(id, "rejected")}
                            />
                          ))}
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}

              {reportTab === "monthly" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {(() => {
                    const monthlies = monthlyReports;
                    if (monthlies.length === 0) return <div style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", padding: 20 }}>No monthly reports found.</div>;

                    return (
                      <div style={{ display: "grid", gap: 16 }}>
                        {monthlies.map(report => (
                          <ReportCard
                            key={report.id}
                            report={report}
                            remarks={remarks}
                            setRemarks={setRemarks}
                            savingReviewId={savingReviewId}
                            onApprove={(id) => reviewReport(id, "approved")}
                            onReject={(id) => reviewReport(id, "rejected")}
                          />
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}

            </div>
          </div>


        </>
      )}

      {activeTab === "attendance" && (
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16 }}>
          <AttendancePanel internId={internId} variant="pm" title="Attendance" />
        </div>
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
      <div style={{ marginTop: 8, color: "white", fontWeight: 800, fontSize: 13, overflowWrap: "anywhere", wordBreak: "break-word", lineHeight: 1.4 }}>
        {value}
      </div>
    </div>
  );
}

function ReportsSection({ title, bgAccent, borderAccent, reports = [], remarks, setRemarks, savingReviewId, onApprove, onReject }) {
  const items = Array.isArray(reports) ? reports : [];
  return (
    <div style={{ border: `1px solid ${borderAccent || COLORS.border}`, borderRadius: 14, overflow: "hidden", background: "rgba(255,255,255,0.02)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px", background: bgAccent || "rgba(255,255,255,0.05)", borderBottom: `1px solid ${borderAccent || COLORS.border}` }}>
        <div style={{ color: "white", fontWeight: 800, fontSize: 15, letterSpacing: "0.3px" }}>
          {title}
        </div>
        <div style={{ background: "rgba(0,0,0,0.3)", color: "rgba(255,229,217,0.9)", fontSize: 12, fontWeight: 900, padding: "4px 10px", borderRadius: 999 }}>
          {items.length} {items.length === 1 ? 'Report' : 'Reports'}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {items.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", background: "rgba(0,0,0,0.15)", borderRadius: 12, color: "rgba(255,229,217,0.6)", fontSize: 13 }}>
            No matching reports found for this intern.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 16 }}>
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
    </div>
  );
}

function ReportCard({ report, remarks, setRemarks, savingReviewId, onApprove, onReject }) {
  const readOnly = String(report.status || "").toLowerCase() !== "pending";
  const currentStatusColor = statusColor(report.status);
  const isWeekly = String(report.reportType || "").toLowerCase() === "weekly";
  const label = isWeekly ? `Week ${report.weekNumber || "-"}` : resolveMonthLabel(report);
  const extra = report?.data && typeof report.data === "object" ? report.data : {};
  const attendanceSummary = extra.attendanceSummary && typeof extra.attendanceSummary === "object" ? extra.attendanceSummary : null;
  const progressSummary = extra.progressSummary && typeof extra.progressSummary === "object" ? extra.progressSummary : null;

  const meta = [
    report.periodStart && report.periodEnd ? `${report.periodStart} to ${report.periodEnd}` : null,
    report.submittedAt ? `Submitted: ${new Date(report.submittedAt).toLocaleDateString()}` : null,
  ].filter(Boolean).join(" • ");

  const statsList = [
    `Hours: ${Number(report.totalHours || 0)}`,
    report.daysWorked != null ? `Days: ${report.daysWorked}` : null,
  ].filter(Boolean).join(" | ");

  return (
    <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, background: "rgba(0,0,0,0.2)", position: "relative", overflow: "hidden" }}>
      {/* Top Status Accent Bar */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "4px", height: "100%", background: currentStatusColor }}></div>

      <div style={{ padding: 16, paddingLeft: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "flex-start" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ color: "white", fontWeight: 900, fontSize: 16 }}>{label}</div>
              <span
                style={{
                  border: `1px solid ${currentStatusColor}66`,
                  background: `${currentStatusColor}20`,
                  color: currentStatusColor,
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 10,
                  fontWeight: 900,
                  textTransform: "uppercase",
                }}
              >
                {report.status || "pending"}
              </span>
            </div>
            <div style={{ color: "rgba(255,229,217,0.6)", fontSize: 12, marginTop: 4 }}>{meta || "-"}</div>
          </div>
          <div style={{ background: "rgba(255,255,255,0.06)", padding: "6px 12px", borderRadius: 8, color: COLORS.peachGlow, fontSize: 12, fontWeight: 700, border: `1px solid ${COLORS.border}` }}>
            {statsList}
          </div>
        </div>

        <div style={{ marginTop: 14, background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ color: "rgba(255,229,217,0.6)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Intern Summary</div>
          <div style={{ color: "rgba(255,229,217,0.95)", fontSize: 13, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
            {report.summary || "No summary provided."}
          </div>
        </div>

        {(attendanceSummary || progressSummary) && (
          <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
            {attendanceSummary && !attendanceSummary.error && (
              <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ color: "rgba(255,229,217,0.6)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                  Attendance (recorded)
                </div>
                <div style={{ color: "rgba(255,229,217,0.85)", fontSize: 12, lineHeight: 1.55 }}>
                  Present: {attendanceSummary.counts?.present ?? 0} • Remote: {attendanceSummary.counts?.remote ?? 0} • Half day: {attendanceSummary.counts?.half_day ?? 0} • Leave: {attendanceSummary.counts?.leave ?? 0} • Absent: {attendanceSummary.counts?.absent ?? 0}
                  <div style={{ color: "rgba(255,229,217,0.55)", marginTop: 4 }}>
                    Total recorded days: {attendanceSummary.totalRecordedDays ?? 0}
                  </div>
                </div>
              </div>
            )}
            {attendanceSummary?.error && (
              <div style={{ background: "rgba(245,158,11,0.08)", padding: 12, borderRadius: 8, border: "1px solid rgba(245,158,11,0.25)", color: "rgba(255,229,217,0.85)", fontSize: 12 }}>
                Attendance: {attendanceSummary.error}
              </div>
            )}

            {progressSummary?.tna && !progressSummary.tna.error && (
              <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ color: "rgba(255,229,217,0.6)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                  Progress (TNA)
                </div>
                <div style={{ color: "rgba(255,229,217,0.85)", fontSize: 12, lineHeight: 1.55 }}>
                  Completion: {progressSummary.tna.completionPercent ?? 0}% • Completed: {progressSummary.tna.counts?.completed ?? 0}/{progressSummary.tna.counts?.total ?? 0} • Blocked: {progressSummary.tna.counts?.blocked ?? 0}
                </div>
              </div>
            )}
            {progressSummary?.tna?.error && (
              <div style={{ background: "rgba(245,158,11,0.08)", padding: 12, borderRadius: 8, border: "1px solid rgba(245,158,11,0.25)", color: "rgba(255,229,217,0.85)", fontSize: 12 }}>
                TNA progress: {progressSummary.tna.error}
              </div>
            )}

            {progressSummary?.blueprint?.milestones && !progressSummary.blueprint?.error && (
              <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ color: "rgba(255,229,217,0.6)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                  Progress (Blueprint)
                </div>
                <div style={{ color: "rgba(255,229,217,0.85)", fontSize: 12, lineHeight: 1.55 }}>
                  Milestones: {progressSummary.blueprint.milestones.completed ?? 0}/{progressSummary.blueprint.milestones.total ?? 0} ({progressSummary.blueprint.milestones.completionPercent ?? 0}%)
                </div>
              </div>
            )}
            {progressSummary?.blueprint?.error && (
              <div style={{ background: "rgba(245,158,11,0.08)", padding: 12, borderRadius: 8, border: "1px solid rgba(245,158,11,0.25)", color: "rgba(255,229,217,0.85)", fontSize: 12 }}>
                Blueprint progress: {progressSummary.blueprint.error}
              </div>
            )}
          </div>
        )}

        <div style={{ marginTop: 16 }}>
          <div style={{ color: "rgba(255,229,217,0.7)", fontSize: 11, marginBottom: 8, display: "flex", alignItems: "center", gap: 6, fontWeight: 700 }}>
            <MessageSquare size={13} />
            PM Feedback Remarks
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
              border: `1px solid ${readOnly ? "transparent" : COLORS.border}`,
              background: readOnly ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.3)",
              color: "white",
              padding: "12px",
              fontSize: 13,
              outline: "none",
              resize: "vertical",
              transition: "border 0.2s ease",
            }}
            placeholder={readOnly ? "None provided." : "Add remarks here before approving or rejecting..."}
            onFocus={(e) => {
              if (!readOnly) e.target.style.border = `1px solid ${COLORS.jungleTeal}`;
            }}
            onBlur={(e) => {
              if (!readOnly) e.target.style.border = `1px solid ${COLORS.border}`;
            }}
          />
        </div>

        {!readOnly && (
          <div style={{ marginTop: 14, display: "flex", gap: 10, flexWrap: "wrap", borderTop: `1px solid ${COLORS.border}`, paddingTop: 14 }}>
            <button
              onClick={() => onApprove?.(report.id)}
              disabled={savingReviewId === report.id}
              style={{
                background: "linear-gradient(135deg, rgba(74,222,128,0.2), rgba(74,222,128,0.1))",
                border: "1px solid rgba(74,222,128,0.4)",
                color: "#dcfce7",
                borderRadius: 9,
                padding: "8px 16px",
                fontWeight: 800,
                fontSize: 12,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                flex: "1 1 auto",
                justifyContent: "center"
              }}
            >
              <CheckCircle2 size={15} />
              {savingReviewId === report.id ? "Saving..." : "Approve Report"}
            </button>
            <button
              onClick={() => onReject?.(report.id)}
              disabled={savingReviewId === report.id}
              style={{
                background: "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))",
                border: "1px solid rgba(239,68,68,0.4)",
                color: "#fecaca",
                borderRadius: 9,
                padding: "8px 16px",
                fontWeight: 800,
                fontSize: 12,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                flex: "1 1 auto",
                justifyContent: "center"
              }}
            >
              <XCircle size={15} />
              {savingReviewId === report.id ? "Saving..." : "Reject Report"}
            </button>
          </div>
        )}
      </div>
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
