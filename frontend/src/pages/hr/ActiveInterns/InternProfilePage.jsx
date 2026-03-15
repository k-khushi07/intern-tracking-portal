// InternProfilePage.jsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  MapPin,
  Calendar,
  Award,
  TrendingUp,
  Clock,
  Phone,
  Briefcase,
  GraduationCap,
  Target,
  CheckCircle2,
  AlertCircle,
  FileText,
  XCircle,
  Link2,
  ListChecks,
  User,
  Activity,
  Users,
  BookOpen,
  Star,
} from "lucide-react";
import { hrApi } from "../../../lib/apiClient";
import { getRealtimeSocket } from "../../../lib/realtime";
import AttendancePanel from "../../../components/AttendancePanel";

const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
  panel: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.14)",
  muted: "rgba(255,229,217,0.65)",
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

function normalizeReports(reports, internId) {
  return (Array.isArray(reports) ? reports : [])
    .map((r) => ({
      ...r,
      status: String(r.status || "").toLowerCase(),
      reportType: r.reportType || (r.weekNumber ? "weekly" : "monthly"),
      submittedAt: r.submittedAt || r.submitted_at || null,
      periodStart: r.periodStart || r.period_start || null,
      periodEnd: r.periodEnd || r.period_end || null,
      totalHours: r.totalHours ?? r.total_hours ?? 0,
      daysWorked: r.daysWorked ?? r.days_worked ?? null,
      weekNumber: r.weekNumber ?? r.week_number ?? null,
      month: r.month ?? null,
      reviewReason: r.reviewReason ?? r.review_reason ?? null,
      reviewedAt: r.reviewedAt ?? r.reviewed_at ?? null,
      internId: r.internId || r.intern_profile_id || null,
    }))
    .filter((r) => String(r.internId || "") === String(internId || ""))
    .sort((a, b) => new Date(b.submittedAt || 0) - new Date(a.submittedAt || 0));
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
    const isPublished = url.includes("/e/");
    const gidMatch = url.match(/[?&]gid=([0-9]+)/);
    const gid = gidMatch ? `&gid=${gidMatch[1]}` : "";
    if (isDoc || type === "doc") {
      if (isPublished) return `https://docs.google.com/document/d/e/${id}/pub?embedded=true`;
      return `https://docs.google.com/document/d/${id}/preview`;
    }
    if (isSheet || type === "sheet") {
      if (isPublished) return `https://docs.google.com/spreadsheets/d/e/${id}/pubhtml?widget=true&headers=false${gid}`;
      return `https://docs.google.com/spreadsheets/d/${id}/htmlembed?widget=true${gid}`;
    }
  } catch {
    return url;
  }
  return url;
}

const InternProfilePage = ({ intern, onBack }) => {
  const params = useParams();
  const internId = params?.internId || params?.id || intern?.id || null;
  const [internData, setInternData] = useState(intern || null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [activities, setActivities] = useState([]);
  const [tnaItems, setTnaItems] = useState([]);
  const [blueprint, setBlueprint] = useState(null);
  const [links, setLinks] = useState({ tnaSheetUrl: "", blueprintDocUrl: "" });
  const [profileError, setProfileError] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [savingReviewId, setSavingReviewId] = useState("");
  const [remarks, setRemarks] = useState({});
  const [internReports, setInternReports] = useState([]);
  const [activeTab, setActiveTab] = useState("profile");
  const [reportTab, setReportTab] = useState("weekly");
  const reportsSectionRef = useRef(null);

  useEffect(() => {
    if (!intern) return;
    setInternData(intern);
  }, [intern]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!internId) return;
      setLoading(true);
      setLoadError("");
      try {
        const res = await hrApi.getIntern(internId);
        if (cancelled) return;
        setInternData(res?.intern || null);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err?.message || "Failed to load intern profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [internId]);

  const loadArtifacts = useCallback(async () => {
    if (!internId) return;
    setProfileError("");
    try {
      const [tnaRes, blueprintRes, linksRes, reportsRes] = await Promise.all([
        hrApi.internTna(internId),
        hrApi.internBlueprint(internId),
        hrApi.internReportLinks(internId),
        hrApi.reports(),
      ]);
      setTnaItems(tnaRes?.items || []);
      setBlueprint(blueprintRes?.blueprint || null);
      setLinks({
        tnaSheetUrl: linksRes?.links?.tnaSheetUrl || "",
        blueprintDocUrl: linksRes?.links?.blueprintDocUrl || "",
      });
      setInternReports(normalizeReports(reportsRes?.reports || [], internId));
    } catch (err) {
      setProfileError(err?.message || "Failed to load intern data.");
      setTnaItems([]);
      setBlueprint(null);
      setLinks({ tnaSheetUrl: "", blueprintDocUrl: "" });
    }
  }, [internId]);

  useEffect(() => {
    if (!internId) return;
    Promise.all([
      hrApi.getInternDailyLogs(internId),
      hrApi.getInternReports(internId),
    ])
      .then(([logsRes, reportsRes]) => {
        const logs = (logsRes?.logs || []).map((l) => ({
          type: "daily_log",
          label: `Submitted daily log for ${l.logDate || l.log_date}`,
          date: l.createdAt || l.created_at,
        }));
        const reports = (reportsRes?.reports || []).map((r) => ({
          type: "report",
          label: `Submitted ${r.reportType || r.report_type || "report"}`,
          date: r.submittedAt || r.submitted_at,
        }));
        const all = [...logs, ...reports]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 10);
        setActivities(all);
      })
      .catch(() => {});
  }, [internId, internData]);

  const profilePayload = useMemo(() => {
    const pd = internData?.profile_data || internData?.profileData || {};
    return pd && typeof pd === "object" ? pd : {};
  }, [internData]);

  const skills = useMemo(() => {
    const raw = profilePayload.skills ?? profilePayload.technicalSkills ?? [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === "string") {
      return raw.split(",").map((value) => value.trim()).filter(Boolean);
    }
    return [];
  }, [profilePayload]);

  const profileData = useMemo(
    () => ({
      phone: profilePayload.phone || internData?.phone || "?",
      dob: profilePayload.dob || internData?.dob || "?",
      address: profilePayload.address || "?",
      college: profilePayload.collegeName || profilePayload.college || "?",
      degree: profilePayload.degree || internData?.degree || "?",
      skills,
      bio: profilePayload.bio || "?",
      linkedIn: profilePayload.linkedIn || "?",
      github: profilePayload.github || "?",
      bloodGroup: profilePayload.bloodGroup || "?",
      emergencyContactName: profilePayload.emergencyContactName || "?",
      guideName: profilePayload.guideName || "?",
      startDate: profilePayload.startDate || profilePayload.joinDate || internData?.created_at || "",
      performance: Number(profilePayload.performance ?? internData?.performance ?? 0),
      tasksCompleted: Number(profilePayload.tasksCompleted ?? internData?.tasksCompleted ?? 0),
      tasksTotal: Number(profilePayload.tasksTotal ?? internData?.tasksTotal ?? 0),
      weeklyReports: Number(profilePayload.weeklyReports ?? internData?.weeklyReports ?? 0),
      monthlyReports: Number(profilePayload.monthlyReports ?? internData?.monthlyReports ?? 0),
      lastActive: profilePayload.lastActive || internData?.lastActive || "",
    }),
    [profilePayload, internData, skills]
  );

  const internMeta = useMemo(() => {
    const name = internData?.full_name || internData?.fullName || internData?.name || internData?.email || "Intern";
    return {
      name,
      email: internData?.email || "",
      status: String(internData?.status || "active").toLowerCase(),
      role: internData?.role || "Intern",
      department:
        profilePayload.department ||
        profilePayload.domain ||
        profilePayload.team ||
        internData?.department ||
        internData?.internshipDomain ||
        "",
      avatar:
        name
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0])
          .join("")
          .toUpperCase() || "IN",
    };
  }, [internData, profilePayload]);

  const currentIntern = internData || intern || null;

  useEffect(() => {
    if (!internId) return;
    const t = window.setTimeout(() => loadArtifacts(), 0);
    return () => window.clearTimeout(t);
  }, [internId, loadArtifacts]);

  useEffect(() => {
    const socket = getRealtimeSocket();
    const handler = (payload) => {
      if (!payload) return;
      if (payload.internId && internId && String(payload.internId) !== String(internId)) return;
      if (!["tna", "blueprint", "report_links", "reports"].includes(payload.entity)) return;
      loadArtifacts();
    };
    socket.on("itp:changed", handler);
    return () => socket.off("itp:changed", handler);
  }, [internId, loadArtifacts]);

  const tnaByWeek = useMemo(() => {
    const buckets = new Map();
    (Array.isArray(tnaItems) ? tnaItems : []).forEach((item) => {
      const raw = item.week_number ?? item.weekNumber ?? null;
      const label = raw ? `Week ${raw}` : "Unassigned";
      if (!buckets.has(label)) buckets.set(label, []);
      buckets.get(label).push(item);
    });
    const labels = Array.from(buckets.keys()).sort((a, b) => {
      if (a === "Unassigned") return 1;
      if (b === "Unassigned") return -1;
      const na = Number(String(a).replace("Week", "").trim());
      const nb = Number(String(b).replace("Week", "").trim());
      if (Number.isFinite(na) && Number.isFinite(nb)) return na - nb;
      return a.localeCompare(b);
    });
    return labels.map((label) => ({ label, items: buckets.get(label) || [] }));
  }, [tnaItems]);

  const reportSummary = useMemo(() => {
    const rows = internReports || [];
    return {
      total: rows.length,
      pending: rows.filter((r) => r.status === "pending").length,
      approved: rows.filter((r) => r.status === "approved").length,
      rejected: rows.filter((r) => r.status === "rejected").length,
    };
  }, [internReports]);

  const weeklyReports = useMemo(
    () => internReports.filter((r) => String(r.reportType || "").toLowerCase() === "weekly"),
    [internReports]
  );
  const monthlyReports = useMemo(
    () => internReports.filter((r) => String(r.reportType || "").toLowerCase() === "monthly"),
    [internReports]
  );

  async function reviewReport(reportId, statusValue) {
    try {
      setSavingReviewId(reportId);
      setReviewError("");
      const text = String(remarks[reportId] || "").trim();
      await hrApi.reviewReport(reportId, { status: statusValue, remarks: text || null });
      setInternReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status: statusValue, reviewReason: text || null, reviewedAt: new Date().toISOString() }
            : r
        )
      );
      setRemarks((prev) => ({ ...prev, [reportId]: "" }));
    } catch (err) {
      setReviewError(err?.message || "Failed to review report.");
    } finally {
      setSavingReviewId("");
    }
  }

  if (!currentIntern && !loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: COLORS.muted }}>
        No intern selected.
      </div>
    );
  }

  const name = internMeta.name;
  const avatar = internMeta.avatar;
  const status = String(currentIntern?.status || "active").toLowerCase();
  const department = resolveDepartment(currentIntern || {});
  const profilePictureUrl = profilePayload.profilePictureUrl || profilePayload.profile_picture_url || null;
  const resumeUrl =
    profilePayload.resumeUrl ||
    profilePayload.resume_url ||
    currentIntern?.resumeUrl ||
    currentIntern?.resume_url ||
    null;

  // Extended profile data
  const education = currentIntern?.education || profilePayload.education || profilePayload.degree || null;
  const university = currentIntern?.university || profilePayload.university || profilePayload.college || null;
  const phone = currentIntern?.phone || profilePayload.phone || null;
  const location = currentIntern?.location || profilePayload.location || profilePayload.city || null;
  const supervisor = currentIntern?.supervisor || profilePayload.supervisor || null;
  const duration = currentIntern?.internshipDuration || profilePayload.internshipDuration || profilePayload.duration || null;
  const expectedGraduation = currentIntern?.expectedGraduation || profilePayload.expectedGraduation || null;
  const endDate = currentIntern?.endDate || profilePayload.endDate || profilePayload.end_date || null;
  const bio = currentIntern?.bio || profilePayload.bio || null;
  const rawSkills = profilePayload.skills ?? profilePayload.technicalSkills ?? [];
  const skillsArr = Array.isArray(rawSkills)
    ? rawSkills
    : typeof rawSkills === "string"
      ? rawSkills.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
  const performance = Number(profilePayload.performance ?? currentIntern?.performance ?? 0);
  const tasksCompleted = Number(profilePayload.tasksCompleted ?? currentIntern?.tasksCompleted ?? 0);
  const tasksTotal = Number(profilePayload.tasksTotal ?? currentIntern?.tasksTotal ?? 0);
  const totalHours = Number(profilePayload.totalHours ?? currentIntern?.totalHours ?? 0);
  const joinDate = currentIntern?.joinDate || currentIntern?.created_at || null;
  const lastActive = currentIntern?.lastLogDate || currentIntern?.lastActive || profilePayload.lastActive || null;
  const domain = profilePayload.domain || profilePayload.specialization || null;
  const experience = profilePayload.experience || profilePayload.priorExperience || null;
  const linkedin = profilePayload.linkedIn || profilePayload.linkedin || profilePayload.linkedinUrl || null;
  const pmCode = currentIntern?.assigned_pm_code || currentIntern?.pmCode || null;

  const TABS = [
    { key: "profile", label: "Profile", icon: <User size={15} />, activeColor: "rgba(255,229,217,0.12)", activeBorder: "rgba(255,229,217,0.4)", activeText: COLORS.peachGlow },
    { key: "tracking", label: "Tracking Sheet", icon: <ListChecks size={15} />, activeColor: "rgba(103,146,137,0.18)", activeBorder: "rgba(103,146,137,0.55)", activeText: "#a7f3d0" },
    { key: "blueprint", label: "Blueprint", icon: <FileText size={15} />, activeColor: "rgba(103,146,137,0.18)", activeBorder: "rgba(103,146,137,0.55)", activeText: "#e0e7ff" },
    { key: "attendance", label: "Attendance", icon: <Calendar size={15} />, activeColor: "rgba(34,211,238,0.14)", activeBorder: "rgba(34,211,238,0.45)", activeText: "#cffafe" },
    { key: "reports", label: "Reports", icon: <FileText size={15} />, activeColor: "rgba(20,184,166,0.18)", activeBorder: "rgba(20,184,166,0.55)", activeText: "#dcfce7" },
  ];

  return (
    <div className="animate-fadeIn" style={{ display: "grid", gap: 16 }}>
      {loadError && (
        <div
          className="glass"
          style={{
            padding: "12px 16px",
            borderRadius: "12px",
            background: "rgba(217, 4, 41, 0.15)",
            border: "1px solid rgba(217, 4, 41, 0.35)",
            color: COLORS.peachGlow,
          }}
        >
          {loadError}
        </div>
      )}
      <button
        onClick={onBack}
        style={{
          width: "fit-content", padding: "10px 18px", borderRadius: 12,
          border: `1px solid ${COLORS.jungleTeal}`, background: "rgba(103,146,137,0.18)",
          color: COLORS.peachGlow, cursor: "pointer",
          display: "inline-flex", alignItems: "center", gap: 8,
          fontWeight: 700, fontSize: 13,
        }}
      >
        <ArrowLeft size={16} /> Back to Active Interns
      </button>


      {/* Profile Header */}
      <div
        className="glass animate-fadeIn stagger-1"
        style={{
          padding: "32px",
          borderRadius: "16px",
          background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "24px", flexWrap: "wrap" }}>
          <div
            style={{
              width: "120px",
              height: "120px",
              background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "48px",
              color: COLORS.peachGlow,
              border: "4px solid rgba(255, 229, 217, 0.3)",
              flexShrink: 0,
            }}
          >
            {internMeta.avatar}
          </div>


          <div style={{ flex: 1, minWidth: "300px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: "700",
                  color: COLORS.peachGlow,
                  fontFamily: "Outfit",
                }}
              >
                {internMeta.name}
              </h1>
              <span
                style={{
                  padding: "6px 16px",
                  background:
                    internMeta.status === "active"
                      ? "rgba(34, 197, 94, 0.3)"
                      : "rgba(217, 4, 41, 0.3)",
                  border: `1px solid ${
                    internMeta.status === "active" ? "rgba(34, 197, 94, 0.5)" : "rgba(217, 4, 41, 0.5)"
                  }`,
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: internMeta.status === "active" ? "#22c55e" : COLORS.racingRed,
                  textTransform: "uppercase",
                }}
              >
                {internMeta.status}
              </span>
            </div>


            <p style={{ fontSize: "18px", color: "rgba(255, 229, 217, 0.9)", marginBottom: "16px" }}>
              {internMeta.role || "Intern"} • {internMeta.department || "General"}
            </p>


            <p style={{ fontSize: "14px", color: "rgba(255, 229, 217, 0.8)", lineHeight: "1.6", marginBottom: "20px" }}>
              {profileData.bio || "—"}
            </p>


            {/* Contact Info */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Mail size={18} color={COLORS.peachGlow} />
                <span style={{ fontSize: "14px", color: "rgba(255, 229, 217, 0.9)" }}>
                  {internMeta.email || "—"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Phone size={18} color={COLORS.peachGlow} />
                <span style={{ fontSize: "14px", color: "rgba(255, 229, 217, 0.9)" }}>
                  {profileData.phone || "—"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <MapPin size={18} color={COLORS.peachGlow} />
                <span style={{ fontSize: "14px", color: "rgba(255, 229, 217, 0.9)" }}>
                  {profileData.address || "?"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Calendar size={18} color={COLORS.peachGlow} />
                <span style={{ fontSize: "14px", color: "rgba(255, 229, 217, 0.9)" }}>
                  Joined: {profileData.startDate ? new Date(profileData.startDate).toLocaleDateString() : "—"}
                </span>
              </div>
            </div>
      {/* Header */}
      <div style={{
        padding: 22, borderRadius: 16,
        background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
        border: "1px solid rgba(255,255,255,0.2)",
      }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "rgba(255,255,255,0.2)", border: "2px solid rgba(255,255,255,0.35)",
            display: "grid", placeItems: "center", color: "white", fontWeight: 800, fontSize: 24,
            overflow: "hidden",
            position: "relative",
          }}>
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
          <div style={{ minWidth: 260, flex: 1 }}>
            <div style={{ fontSize: 28, fontWeight: 900, color: "white" }}>{name}</div>
            <div style={{ marginTop: 4, fontSize: 13, color: "rgba(255,255,255,0.9)" }}>
              {intern.email || "-"} | Intern ID: {intern.intern_id || intern.internId || "-"} | Department: {department}
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{
                display: "inline-block", borderRadius: 999, padding: "4px 10px",
                fontSize: 11, fontWeight: 800, textTransform: "uppercase",
                border: `1px solid ${status === "active" ? "rgba(74,222,128,0.55)" : "rgba(239,68,68,0.55)"}`,
                background: status === "active" ? "rgba(74,222,128,0.2)" : "rgba(239,68,68,0.18)",
                color: status === "active" ? "#dcfce7" : "#fecaca",
              }}>
                {status}
              </span>
            </div>
          </div>
        </div>
      </div>


      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <div
          className="glass hover-lift animate-fadeIn stagger-2"
          style={{
            padding: "24px",
            borderRadius: "16px",
            background: "rgba(103, 146, 137, 0.1)",
            border: `1px solid rgba(103, 146, 137, 0.3)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", color: "rgba(255, 229, 217, 0.7)" }}>Performance</span>
            <Award size={20} color={COLORS.jungleTeal} />
          </div>
          <p style={{ fontSize: "28px", fontWeight: "700", color: COLORS.peachGlow }}>
            {profileData.performance}%
          </p>
        </div>


        <div
          className="glass hover-lift animate-fadeIn stagger-3"
          style={{
            padding: "24px",
            borderRadius: "16px",
            background: "rgba(103, 146, 137, 0.1)",
            border: `1px solid rgba(103, 146, 137, 0.3)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", color: "rgba(255, 229, 217, 0.7)" }}>Tasks Completed</span>
            <CheckCircle2 size={20} color={COLORS.jungleTeal} />
          </div>
          <p style={{ fontSize: "28px", fontWeight: "700", color: COLORS.peachGlow }}>
            {profileData.tasksCompleted}/{profileData.tasksTotal}
          </p>
        </div>


        <div
          className="glass hover-lift animate-fadeIn stagger-4"
          style={{
            padding: "24px",
            borderRadius: "16px",
            background: "rgba(103, 146, 137, 0.1)",
            border: `1px solid rgba(103, 146, 137, 0.3)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", color: "rgba(255, 229, 217, 0.7)" }}>Weekly Reports</span>
            <TrendingUp size={20} color={COLORS.jungleTeal} />
          </div>
          <p style={{ fontSize: "28px", fontWeight: "700", color: COLORS.peachGlow }}>
            {profileData.weeklyReports}
          </p>
        </div>


        <div
          className="glass hover-lift animate-fadeIn stagger-5"
          style={{
            padding: "24px",
            borderRadius: "16px",
            background: "rgba(103, 146, 137, 0.1)",
            border: `1px solid rgba(103, 146, 137, 0.3)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", color: "rgba(255, 229, 217, 0.7)" }}>Last Active</span>
            <Clock size={20} color={COLORS.jungleTeal} />
          </div>
          <p style={{ fontSize: "18px", fontWeight: "700", color: COLORS.peachGlow }}>
            {profileData.lastActive || "—"}
          </p>
        </div>
      {/* Tabs */}
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                border: `1px solid ${isActive ? tab.activeBorder : COLORS.border}`,
                background: isActive ? tab.activeColor : "rgba(255,255,255,0.04)",
                color: isActive ? tab.activeText : COLORS.muted,
                borderRadius: 999, padding: "10px 16px",
                fontWeight: 900, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13,
              }}
            >
              {tab.icon} {tab.label}
            </button>
          );
        })}
      </div>

      {profileError && (
        <div style={{ padding: 12, borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fecaca", fontSize: 13 }}>
          {profileError}
        </div>
      )}

      {/* Two Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Education & Details */}
          <div
            className="glass animate-fadeIn stagger-2"
            style={{
              padding: "24px",
              borderRadius: "16px",
              background: "rgba(103, 146, 137, 0.1)",
              border: `1px solid rgba(103, 146, 137, 0.3)`,
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: COLORS.peachGlow,
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <GraduationCap size={22} color={COLORS.jungleTeal} />
              Education & Details
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  College/University
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.college}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  Degree/Education
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.degree}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  DOB
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.dob}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  Blood Group
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.bloodGroup}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  Emergency Contact
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.emergencyContactName}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  Guide Name
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.guideName}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  Address
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.address}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  LinkedIn
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.linkedIn}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  GitHub
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.github}
                </p>
              </div>
            </div>
      {/* -- PROFILE TAB -- */}
      {activeTab === "profile" && (
        <div style={{ display: "grid", gap: 16 }}>

          {/* Stats Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 12 }}>
            <StatCard icon={<Award size={20} color={COLORS.jungleTeal} />} label="Performance" value={`${performance}%`} accent={COLORS.jungleTeal} />
            <StatCard icon={<CheckCircle2 size={20} color={COLORS.success} />} label="Tasks Done" value={`${tasksCompleted}${tasksTotal ? `/${tasksTotal}` : ""}`} accent={COLORS.success} />
            <StatCard icon={<Clock size={20} color="#60a5fa" />} label="Total Hours" value={`${totalHours.toFixed(1)}h`} accent="#60a5fa" />
            <StatCard icon={<FileText size={20} color={COLORS.warning} />} label="Reports" value={reportSummary.total} accent={COLORS.warning} />
            <StatCard icon={<TrendingUp size={20} color="#c084fc" />} label="Weekly Reports" value={weeklyReports.length} accent="#c084fc" />
            <StatCard icon={<Activity size={20} color="#f472b6" />} label="Monthly Reports" value={monthlyReports.length} accent="#f472b6" />
          </div>

          {/* Intern Information */}
          <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ color: COLORS.peachGlow, fontWeight: 900, fontSize: 17, marginBottom: 12 }}>Intern Information</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 10, minWidth: 0 }}>
              <ProfileField icon={<Mail size={15} />} label="Email" value={intern.email || "-"} truncate />
              <ProfileField icon={<Briefcase size={15} />} label="Intern ID" value={intern.intern_id || intern.internId || "-"} />
              <ProfileField icon={<Users size={15} />} label="Department" value={department} />
              <ProfileField icon={<Calendar size={15} />} label="Joined" value={joinDate ? new Date(joinDate).toLocaleDateString() : "-"} />
              {endDate && <ProfileField icon={<Calendar size={15} />} label="End Date" value={new Date(endDate).toLocaleDateString()} />}
              <ProfileField icon={<Clock size={15} />} label="Last Activity" value={lastActive ? new Date(lastActive).toLocaleDateString() : "No logs"} />
              {duration && <ProfileField icon={<Activity size={15} />} label="Duration" value={duration} />}
              {supervisor && <ProfileField icon={<User size={15} />} label="Supervisor" value={supervisor} />}
              {pmCode && <ProfileField icon={<Users size={15} />} label="PM Code" value={pmCode} />}
              {phone && <ProfileField icon={<Phone size={15} />} label="Phone" value={phone} />}
              {location && <ProfileField icon={<MapPin size={15} />} label="Location" value={location} />}
              {domain && <ProfileField icon={<Briefcase size={15} />} label="Domain" value={domain} />}
              {linkedin && <ProfileField icon={<Link2 size={15} />} label="LinkedIn" value={linkedin} truncate />}
            </div>

          {/* Skills */}
          <div
            className="glass animate-fadeIn stagger-3"
            style={{
              padding: "24px",
              borderRadius: "16px",
              background: "rgba(103, 146, 137, 0.1)",
              border: `1px solid rgba(103, 146, 137, 0.3)`,
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: COLORS.peachGlow,
                marginBottom: "16px",
              }}
            >
              Skills
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {profileData.skills.length > 0 ? (
                profileData.skills.map((skill, index) => (
                  <span
                    key={index}
                    style={{
                      padding: "8px 16px",
                      background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: "600",
                      color: COLORS.peachGlow,
                    }}
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: "13px", color: "rgba(255, 229, 217, 0.6)" }}>No skills listed.</span>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
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
                <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 800 }}>
                  Resume not uploaded (profile setup pending)
                </div>
              )}
            </div>
          </div>

          {/* Education */}
          {(education || university || expectedGraduation) && (
            <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.peachGlow, fontWeight: 900, fontSize: 17, marginBottom: 12 }}>
                <GraduationCap size={18} color={COLORS.jungleTeal} /> Education & Details
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px,1fr))", gap: 10, minWidth: 0 }}>
                {education && <ProfileField icon={<BookOpen size={15} />} label="Education" value={education} />}
                {university && <ProfileField icon={<Target size={15} />} label="University" value={university} truncate />}
                {expectedGraduation && <ProfileField icon={<Calendar size={15} />} label="Expected Graduation" value={expectedGraduation} />}
                {duration && <ProfileField icon={<Clock size={15} />} label="Internship Duration" value={duration} />}
                {experience && <ProfileField icon={<Star size={15} />} label="Prior Experience" value={experience} />}
              </div>
            </div>
          )}

          {/* Bio */}
          {bio && (
            <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16 }}>
              <div style={{ color: COLORS.peachGlow, fontWeight: 900, fontSize: 17, marginBottom: 8 }}>About</div>
              <div style={{ color: COLORS.muted, fontSize: 14, lineHeight: 1.7 }}>{bio}</div>
            </div>
          )}

          {/* Skills */}
          {skillsArr.length > 0 && (
            <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.peachGlow, fontWeight: 900, fontSize: 17, marginBottom: 12 }}>
                <Star size={18} color={COLORS.jungleTeal} /> Skills
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {skillsArr.map((skill, i) => (
                  <span key={i} style={{
                    padding: "7px 14px",
                    background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                    borderRadius: 8, fontSize: 13, fontWeight: 700, color: COLORS.peachGlow,
                  }}>
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* TNA & Blueprint Summary */}
          <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              <div style={{ color: COLORS.peachGlow, fontWeight: 900, fontSize: 17 }}>TNA &amp; Blueprint</div>
              <button onClick={loadArtifacts} style={{
                border: "1px solid rgba(103,146,137,0.45)", background: "rgba(103,146,137,0.18)",
                color: "white", borderRadius: 9, padding: "8px 12px",
                fontWeight: 700, fontSize: 12, cursor: "pointer",
              }}>
                Refresh Data
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px,1fr))", gap: 12 }}>
              {/* Links */}
              <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14, background: "rgba(255,255,255,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.muted, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
                  <Link2 size={14} color={COLORS.jungleTeal} /> External Links
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {[
                    { label: "TNA Sheet", url: links.tnaSheetUrl },
                    { label: "Blueprint Doc", url: links.blueprintDocUrl },
                  ].map(({ label, url }) => (
                    <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: "rgba(0,0,0,0.2)", borderRadius: 8, fontSize: 13 }}>
                      <span style={{ color: "rgba(255,229,217,0.9)" }}>{label}</span>
                      {url
                        ? <a href={url} target="_blank" rel="noreferrer" style={{ color: COLORS.jungleTeal, fontWeight: 800, textDecoration: "none" }}>Open ?</a>
                        : <span style={{ color: COLORS.muted, fontSize: 12 }}>Not set</span>}
                    </div>
                  ))}
                </div>
              </div>
              {/* Blueprint summary */}
              <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14, background: "rgba(255,255,255,0.03)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.muted, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 10 }}>
                  <FileText size={14} color={COLORS.jungleTeal} /> Blueprint Details
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

            {/* TNA Phased Tracker */}
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.muted, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>
                <ListChecks size={14} color={COLORS.jungleTeal} /> TNA Phased Tracking
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
                                <td style={{ padding: 12, color: "white", fontWeight: 600, minWidth: 200 }}>{item.task || "Unnamed Task"}</td>
                                <td style={{ padding: 12, color: COLORS.muted, fontSize: 12, minWidth: 120 }}>{item.planned_date || "Not set"}</td>
                                <td style={{ padding: 12, textAlign: "right", minWidth: 120 }}>
                                  <span style={{
                                    padding: "4px 8px", borderRadius: 6, fontSize: 10, fontWeight: 800, textTransform: "uppercase",
                                    background: item.status === "completed" ? "rgba(74,222,128,0.15)" : item.status === "blocked" ? "rgba(245,158,11,0.15)" : "rgba(103,146,137,0.15)",
                                    color: item.status === "completed" ? COLORS.success : item.status === "blocked" ? COLORS.warning : COLORS.peachGlow,
                                    border: `1px solid ${item.status === "completed" ? "rgba(74,222,128,0.3)" : item.status === "blocked" ? "rgba(245,158,11,0.3)" : "rgba(103,146,137,0.3)"}`,
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
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* -- TRACKING SHEET TAB -- */}
      {activeTab === "tracking" && (
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ color: COLORS.peachGlow, fontWeight: 900, fontSize: 18 }}>TNA Tracking Sheet</div>
            {links.tnaSheetUrl && (
              <a href={links.tnaSheetUrl} target="_blank" rel="noreferrer" style={{ color: COLORS.jungleTeal, fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
                Open in New Tab ?
              </a>
            )}
          </div>
          {links.tnaSheetUrl ? (
            <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${COLORS.border}` }}>
              <iframe src={getGoogleEmbedUrl(links.tnaSheetUrl, "sheet")} style={{ width: "100%", height: "70vh", minHeight: 600, border: "none" }} title="TNA Tracking Sheet" />
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: COLORS.muted }}>No Tracking Sheet link set for this intern yet.</div>
          )}
        </div>
      )}

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Recent Activities */}
          <div
            className="glass animate-fadeIn stagger-4"
            style={{
              padding: "24px",
              borderRadius: "16px",
              background: "rgba(103, 146, 137, 0.1)",
              border: `1px solid rgba(103, 146, 137, 0.3)`,
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: COLORS.peachGlow,
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Clock size={22} color={COLORS.jungleTeal} />
              Recent Activities
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {activities.length === 0 ? (
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>No recent activity.</div>
                ) : activities.map((act, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: act.type === "report" ? "#a78bfa" : "#14b8a6",
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{act.label}</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
                    {act.date ? new Date(act.date).toLocaleDateString() : "—"}
                  </div>
                </div>
              ))}
            </div>
      {/* -- BLUEPRINT TAB -- */}
      {activeTab === "blueprint" && (
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ color: COLORS.peachGlow, fontWeight: 900, fontSize: 18 }}>Blueprint Document</div>
            {links.blueprintDocUrl && (
              <a href={links.blueprintDocUrl} target="_blank" rel="noreferrer" style={{ color: COLORS.jungleTeal, fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
                Open in New Tab ?
              </a>
            )}
          </div>
          {links.blueprintDocUrl ? (
            <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${COLORS.border}` }}>
              <iframe src={getGoogleEmbedUrl(links.blueprintDocUrl, "doc")} style={{ width: "100%", height: "70vh", minHeight: 600, border: "none" }} title="Blueprint Document" />
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: "center", color: COLORS.muted }}>No Blueprint Document link set for this intern yet.</div>
          )}
        </div>
      )}

      {/* -- ATTENDANCE TAB -- */}
      {activeTab === "attendance" && (
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16 }}>
          <AttendancePanel internId={internId} variant="hr" title="Attendance" />
        </div>
      )}

      {/* -- REPORTS TAB -- */}
      {activeTab === "reports" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px,1fr))", gap: 10 }}>
            <MiniStat icon={<FileText size={16} />} label="Total Reports" value={reportSummary.total} />
            <MiniStat icon={<Clock size={16} />} label="Pending" value={reportSummary.pending} />
            <MiniStat icon={<CheckCircle2 size={16} />} label="Approved" value={reportSummary.approved} />
            <MiniStat icon={<XCircle size={16} />} label="Rejected" value={reportSummary.rejected} />
          </div>

          <div ref={reportsSectionRef} style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 14 }}>
            <div style={{ color: COLORS.peachGlow, fontWeight: 900, fontSize: 18, marginBottom: 10 }}>Reports (This Intern)</div>

            {reviewError && (
              <div style={{ marginBottom: 16, padding: 12, borderRadius: 10, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#fecaca", fontSize: 13 }}>
                {reviewError}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginBottom: 16, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 14 }}>
              {[
                { key: "weekly", label: "Weekly Reports", activeColor: "rgba(103,146,137,0.2)", activeTextColor: COLORS.jungleTeal },
                { key: "monthly", label: "Monthly Reports", activeColor: "rgba(245,158,11,0.2)", activeTextColor: COLORS.warning },
              ].map(({ key, label, activeColor, activeTextColor }) => (
                <button
                  key={key}
                  onClick={() => setReportTab(key)}
                  style={{
                    padding: "8px 16px", borderRadius: 12, border: "none",
                    background: reportTab === key ? activeColor : "transparent",
                    color: reportTab === key ? activeTextColor : "rgba(255,255,255,0.6)",
                    cursor: "pointer", fontWeight: reportTab === key ? 800 : 600,
                    fontSize: 14, transition: "all 0.2s",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>

            {reportTab === "weekly" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
                {(() => {
                  if (weeklyReports.length === 0) return <div style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", padding: 20 }}>No weekly reports found.</div>;
                  const byMonth = weeklyReports.reduce((acc, r) => {
                    const m = r.month || "Unknown Month";
                    if (!acc[m]) acc[m] = [];
                    acc[m].push(r);
                    return acc;
                  }, {});
                  return Object.entries(byMonth).map(([monthName, monthReports]) => (
                    <div key={monthName}>
                      <h3 style={{ fontSize: 15, fontWeight: 800, color: "rgba(255,255,255,0.7)", marginBottom: 12, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 8 }}>
                        {monthName}
                      </h3>
                      <div style={{ display: "grid", gap: 16 }}>
                        {monthReports.map((report) => (
                          <ReportCard key={report.id} report={report} remarks={remarks} setRemarks={setRemarks} savingReviewId={savingReviewId} onApprove={(id) => reviewReport(id, "approved")} onReject={(id) => reviewReport(id, "rejected")} />
                        ))}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            )}

            {reportTab === "monthly" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {monthlyReports.length === 0
                  ? <div style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", padding: 20 }}>No monthly reports found.</div>
                  : monthlyReports.map((report) => (
                    <ReportCard key={report.id} report={report} remarks={remarks} setRemarks={setRemarks} savingReviewId={savingReviewId} onApprove={(id) => reviewReport(id, "approved")} onReject={(id) => reviewReport(id, "rejected")} />
                  ))
                }
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// -- Sub-components --

function StatCard({ icon, label, value, accent }) {
  return (
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: COLORS.muted }}>{label}</span>
        {icon}
      </div>
      <div style={{ fontSize: 26, fontWeight: 900, color: accent || COLORS.peachGlow }}>{value}</div>
    </div>
  );
}

function ProfileField({ icon, label, value, truncate = false }) {
  return (
    <div style={{ border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, padding: 12, background: "rgba(255,255,255,0.04)", minWidth: 0, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, color: COLORS.muted, fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap", overflow: "hidden" }}>
        {icon} {label}
      </div>
      <div style={{
        marginTop: 8, color: "white", fontWeight: 800, fontSize: 13,
        ...(truncate ? { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" } : { wordBreak: "break-word" }),
      }}>
        {value}
      </div>
    </div>
  );
}

function MiniStat({ icon, label, value }) {
  return (
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14, display: "flex", gap: 12, alignItems: "center" }}>
      <div style={{ color: COLORS.jungleTeal }}>{icon}</div>
      <div>
        <div style={{ fontSize: 11, color: COLORS.muted }}>{label}</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: COLORS.peachGlow }}>{value}</div>
      </div>
    </div>
  );
}

function ReportCard({ report, remarks, setRemarks, savingReviewId, onApprove, onReject }) {
  const readOnly = String(report.status || "").toLowerCase() !== "pending";
  const currentStatusColor = statusColor(report.status);
  const isWeekly = String(report.reportType || "").toLowerCase() === "weekly";
  const label = isWeekly ? `Week ${report.weekNumber || "-"}` : report.month || "Monthly";
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
      <div style={{ position: "absolute", top: 0, left: 0, width: 4, height: "100%", background: currentStatusColor }} />
      <div style={{ padding: 16, paddingLeft: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
          <div>
            <span style={{ fontWeight: 800, color: "white", fontSize: 15 }}>{label}</span>
            {meta && <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 3 }}>{meta}</div>}
            {statsList && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>{statsList}</div>}
          </div>
          <span style={{
            padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 800, textTransform: "uppercase",
            background: `${currentStatusColor}18`,
            border: `1px solid ${currentStatusColor}55`,
            color: currentStatusColor,
          }}>
            {report.status || "pending"}
          </span>
        </div>

        {report.content && (
          <div style={{ marginTop: 10, padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 8, color: "rgba(255,229,217,0.85)", fontSize: 13, lineHeight: 1.6 }}>
            {report.content}
          </div>
        )}

        {(attendanceSummary || progressSummary) && (
          <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
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

        {report.reviewReason && (
          <div style={{ marginTop: 8, padding: 10, background: "rgba(0,0,0,0.2)", borderRadius: 8, fontSize: 12, color: COLORS.muted }}>
            Review note: {report.reviewReason}
          </div>
        )}

        {!readOnly && (
          <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
            <textarea
              value={remarks[report.id] || ""}
              onChange={(e) => setRemarks((prev) => ({ ...prev, [report.id]: e.target.value }))}
              placeholder="Add review remarks (optional)..."
              rows={2}
              style={{
                width: "100%", padding: "10px 12px", borderRadius: 8,
                border: `1px solid ${COLORS.border}`, background: "rgba(255,255,255,0.04)",
                color: "white", fontSize: 13, resize: "vertical",
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => onApprove(report.id)}
                disabled={!!savingReviewId}
                style={{
                  flex: 1, padding: "9px 14px", borderRadius: 9,
                  border: "1px solid rgba(74,222,128,0.4)", background: "rgba(74,222,128,0.15)",
                  color: COLORS.success, fontWeight: 800, fontSize: 13, cursor: "pointer",
                  opacity: savingReviewId === report.id ? 0.6 : 1,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <CheckCircle2 size={15} /> Approve
              </button>
              <button
                onClick={() => onReject(report.id)}
                disabled={!!savingReviewId}
                style={{
                  flex: 1, padding: "9px 14px", borderRadius: 9,
                  border: "1px solid rgba(239,68,68,0.4)", background: "rgba(239,68,68,0.12)",
                  color: COLORS.danger, fontWeight: 800, fontSize: 13, cursor: "pointer",
                  opacity: savingReviewId === report.id ? 0.6 : 1,
                  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <XCircle size={15} /> Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InternProfilePage;
