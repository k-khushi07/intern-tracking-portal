import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, Mail, Calendar, Briefcase, Clock, FileText, CheckCircle2,
  XCircle, Link2, ListChecks, User, Award, TrendingUp, GraduationCap,
  Phone, MapPin, Target, Activity, Users, BookOpen, Star,
} from "lucide-react";
import { hrApi } from "../../../lib/apiClient";
import { getRealtimeSocket } from "../../../lib/realtime";

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
  } catch (e) {
    return url;
  }
  return url;
}

const InternProfilePage = ({ intern, onBack }) => {
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

  const internId = intern?.id || null;

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

  if (!intern) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: COLORS.muted }}>
        No intern selected.
      </div>
    );
  }

  const name = intern.full_name || intern.fullName || intern.name || intern.email || "Intern";
  const avatar = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  const status = String(intern.status || "active").toLowerCase();
  const department = resolveDepartment(intern);
  const profileData = intern.profile_data && typeof intern.profile_data === "object" ? intern.profile_data : {};

  // Extended profile data
  const education = intern.education || profileData.education || profileData.degree || null;
  const university = intern.university || profileData.university || profileData.college || null;
  const phone = intern.phone || profileData.phone || null;
  const location = intern.location || profileData.location || profileData.city || null;
  const supervisor = intern.supervisor || profileData.supervisor || null;
  const duration = intern.internshipDuration || profileData.internshipDuration || profileData.duration || null;
  const expectedGraduation = intern.expectedGraduation || profileData.expectedGraduation || null;
  const endDate = intern.endDate || profileData.endDate || profileData.end_date || null;
  const bio = intern.bio || profileData.bio || null;
  const skills = (intern.skills || profileData.skills || []);
  const skillsArr = Array.isArray(skills) ? skills : (typeof skills === "string" ? skills.split(",").map(s => s.trim()).filter(Boolean) : []);
  const performance = Number(intern.performance || profileData.performance || 0);
  const tasksCompleted = Number(intern.tasksCompleted || profileData.tasksCompleted || 0);
  const tasksTotal = Number(intern.tasksTotal || profileData.tasksTotal || 0);
  const totalHours = Number(intern.totalHours || profileData.totalHours || 0);
  const joinDate = intern.joinDate || intern.created_at || null;
  const lastActive = intern.lastLogDate || intern.lastActive || profileData.lastActive || null;
  const domain = profileData.domain || profileData.specialization || null;
  const experience = profileData.experience || profileData.priorExperience || null;
  const linkedin = profileData.linkedin || profileData.linkedinUrl || null;
  const pmCode = intern.assigned_pm_code || intern.pmCode || null;
  const internStatus = intern.status || null;

  const TABS = [
    { key: "profile", label: "Profile", icon: <User size={15} />, activeColor: "rgba(255,229,217,0.12)", activeBorder: "rgba(255,229,217,0.4)", activeText: COLORS.peachGlow },
    { key: "tracking", label: "Tracking Sheet", icon: <ListChecks size={15} />, activeColor: "rgba(103,146,137,0.18)", activeBorder: "rgba(103,146,137,0.55)", activeText: "#a7f3d0" },
    { key: "blueprint", label: "Blueprint", icon: <FileText size={15} />, activeColor: "rgba(103,146,137,0.18)", activeBorder: "rgba(103,146,137,0.55)", activeText: "#e0e7ff" },
    { key: "reports", label: "Reports", icon: <FileText size={15} />, activeColor: "rgba(20,184,166,0.18)", activeBorder: "rgba(20,184,166,0.55)", activeText: "#dcfce7" },
  ];

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* Back */}
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
          }}>
            {avatar || "IN"}
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

      {/* ── PROFILE TAB ── */}
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
                        ? <a href={url} target="_blank" rel="noreferrer" style={{ color: COLORS.jungleTeal, fontWeight: 800, textDecoration: "none" }}>Open ↗</a>
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

      {/* ── TRACKING SHEET TAB ── */}
      {activeTab === "tracking" && (
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ color: COLORS.peachGlow, fontWeight: 900, fontSize: 18 }}>TNA Tracking Sheet</div>
            {links.tnaSheetUrl && (
              <a href={links.tnaSheetUrl} target="_blank" rel="noreferrer" style={{ color: COLORS.jungleTeal, fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
                Open in New Tab ↗
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

      {/* ── BLUEPRINT TAB ── */}
      {activeTab === "blueprint" && (
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ color: COLORS.peachGlow, fontWeight: 900, fontSize: 18 }}>Blueprint Document</div>
            {links.blueprintDocUrl && (
              <a href={links.blueprintDocUrl} target="_blank" rel="noreferrer" style={{ color: COLORS.jungleTeal, fontSize: 13, fontWeight: 800, textDecoration: "none" }}>
                Open in New Tab ↗
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

      {/* ── REPORTS TAB ── */}
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

// ── Sub-components ──

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