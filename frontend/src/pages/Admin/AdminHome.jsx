import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, LogOut, Trash2, Plus, Users, UserCheck, BarChart3, Activity, Save, Eye, X, Sparkles, Menu, Clock, Mail, Archive, FileText, FolderOpen, ClipboardList } from "lucide-react";
import { adminApi, authApi } from "../../lib/apiClient";
import AttendancePanel from "../../components/AttendancePanel";
import LeaveRequestsPanel from "../../components/LeaveRequestsPanel";
import AccountModal from "../../components/AccountModal";

const COLORS = {
  bgPrimary: "#020617",
  bgSecondary: "#0a2528",
  surfaceGlass: "rgba(255, 255, 255, 0.06)",
  borderGlass: "rgba(255, 255, 255, 0.12)",
  deepOcean: "#0f766e",
  jungleTeal: "#14b8a6",
  emeraldGlow: "#10b981",
  textPrimary: "#f8fafc",
  textSecondary: "rgba(248, 250, 252, 0.7)",
  textMuted: "rgba(248, 250, 252, 0.5)",
  red: "#ef4444",
  bg: "#020617",
  panel: "rgba(255, 255, 255, 0.06)",
  border: "rgba(255, 255, 255, 0.12)",
  text: "#f8fafc",
  muted: "rgba(248, 250, 252, 0.5)",
  accent: "#14b8a6",
  accent2: "#10b981",
  danger: "#ef4444",
};

const GRADIENTS = {
  primary: `linear-gradient(135deg, ${COLORS.bgPrimary} 0%, ${COLORS.bgSecondary} 50%, ${COLORS.bgPrimary} 100%)`,
  accent: `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)`,
};

const HR_TABLE_COLUMNS = "minmax(150px, 1fr) 140px 100px 220px";
const PM_TABLE_COLUMNS = "2fr 1fr 1fr 220px";
const INTERN_TABLE_COLUMNS = "1.5fr 1fr 1fr 1fr 0.8fr 340px";

const TABLE_WRAPPER_STYLE = { overflowX: "auto", width: "100%" };
const TABLE_INNER_STYLE = { minWidth: 800, width: "100%" };
const USER_CELL_STYLE = { overflow: "hidden", minWidth: 0 };
const USER_NAME_STYLE = { fontWeight: 600, fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", maxWidth: "100%" };
const USER_EMAIL_STYLE = { fontSize: 11, color: COLORS.muted, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", display: "block", maxWidth: "100%" };
const TABLE_CELL_STYLE = { overflow: "hidden", minWidth: 0 };
const TABLE_FIELD_STYLE = { background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "6px 8px", color: COLORS.text, fontSize: 12, width: "100%", boxSizing: "border-box" };
const TABLE_ROW_BASE_STYLE = { display: "grid", padding: "12px 14px", borderTop: `1px solid ${COLORS.border}`, alignItems: "center", gap: 8 };
const ACTION_CONTAINER_STYLE = { display: "flex", gap: 6, alignItems: "center", justifyContent: "flex-start", flexWrap: "nowrap" };
const INTERN_ACTION_CONTAINER_STYLE = { display: "flex", gap: 3, alignItems: "center", justifyContent: "flex-start", flexWrap: "nowrap" };

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "hr", label: "HR", icon: Users },
  { id: "pm", label: "PM", icon: UserCheck },
  { id: "intern", label: "Interns", icon: Activity },
  { id: "archived", label: "Archived Interns", icon: Archive },
  { id: "leave", label: "Leave Requests", icon: Clock },
  { id: "departments", label: "Departments", icon: Users },
  { id: "progress", label: "Progress", icon: Activity },
];

const DEPARTMENT_OPTIONS = ["SAP", "Oracle", "Accounts", "HR"];
const DEPARTMENT_SECTIONS = ["SAP", "Oracle", "Accounts", "HR"];
const OTHER_DEPARTMENT_LABEL = "Unassigned";

function resolveDepartmentValue(selected) { return String(selected || "").trim(); }
function normalizeDepartmentForSection(value) {
  const raw = String(value || "").trim();
  if (!raw) return OTHER_DEPARTMENT_LABEL;
  const known = DEPARTMENT_SECTIONS.find((item) => item.toLowerCase() === raw.toLowerCase());
  return known || OTHER_DEPARTMENT_LABEL;
}
function randomPassword() {
  const length = 8;
  const digits = "0123456789";
  try {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    // First digit non-zero
    let output = digits[(bytes[0] % 9) + 1];
    for (let i = 1; i < length; i += 1) {
      output += digits[bytes[i] % 10];
    }
    return output;
  } catch {
    const min = 10 ** (length - 1);
    const max = 10 ** length - 1;
    return String(Math.floor(min + Math.random() * (max - min + 1)));
  }
}
function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}
function formatDateTime(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function StatCard({ label, value }) {
  return (
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16 }}>
      <div style={{ color: COLORS.muted, fontSize: 12 }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function TableHeader({ columns, labels }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: columns, padding: "10px 12px", borderBottom: `1px solid ${COLORS.border}`, color: COLORS.muted, fontSize: 12, fontWeight: 700 }}>
      {(labels || []).map((label) => <div key={label}>{label}</div>)}
    </div>
  );
}

// ─── Intern Detail Panel (Projects + Monthly Logs) ────────────────────────────
function InternDetailPanel({ internId }) {
  const [activeSection, setActiveSection] = useState("projects");
  const [projects, setProjects] = useState([]);
  const [reports, setReports] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!internId) return;
    setLoadingProjects(true);
    setLoadingReports(true);
    setLoadingLogs(true);
    setErrorMsg("");

    // Fetch project submissions via HR route
    adminApi.getInternProjectSubmissions(internId)
      .then((res) => setProjects(res?.submissions || []))
      .catch(() => setProjects([]))
      .finally(() => setLoadingProjects(false));

    // Fetch monthly/weekly reports via HR route
    adminApi.getInternReports(internId)
      .then((res) => setReports(res?.reports || []))
      .catch(() => setReports([]))
      .finally(() => setLoadingReports(false));

    // Fetch daily logs via HR route
    adminApi.getInternDailyLogs(internId)
      .then((res) => setLogs(res?.logs || []))
      .catch(() => setLogs([]))
      .finally(() => setLoadingLogs(false));
  }, [internId]);

  const sectionBtnStyle = (id) => ({
    padding: "7px 16px",
    borderRadius: 8,
    border: activeSection === id ? "1px solid #14b8a6" : `1px solid ${COLORS.border}`,
    background: activeSection === id ? "rgba(20,184,166,0.15)" : "transparent",
    color: activeSection === id ? "#14b8a6" : COLORS.muted,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    display: "inline-flex",
    gap: 6,
    alignItems: "center",
  });

  const statusBadge = (status) => {
    const colors = {
      submitted: { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.4)", text: "#f59e0b" },
      approved: { bg: "rgba(16,185,129,0.15)", border: "rgba(16,185,129,0.4)", text: "#10b981" },
      rejected: { bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.4)", text: "#ef4444" },
      pending: { bg: "rgba(245,158,11,0.15)", border: "rgba(245,158,11,0.4)", text: "#f59e0b" },
    };
    const c = colors[String(status || "").toLowerCase()] || colors.pending;
    return (
      <span style={{ padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: c.bg, border: `1px solid ${c.border}`, color: c.text, textTransform: "capitalize" }}>
        {status || "—"}
      </span>
    );
  };

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {/* Section tabs */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button type="button" style={sectionBtnStyle("projects")} onClick={() => setActiveSection("projects")}>
          <FolderOpen size={13} /> Projects ({loadingProjects ? "..." : projects.length})
        </button>
        <button type="button" style={sectionBtnStyle("reports")} onClick={() => setActiveSection("reports")}>
          <FileText size={13} /> Monthly Logs ({loadingReports ? "..." : reports.length})
        </button>
        <button type="button" style={sectionBtnStyle("dailylogs")} onClick={() => setActiveSection("dailylogs")}>
          <ClipboardList size={13} /> Daily Logs ({loadingLogs ? "..." : logs.length})
        </button>
      </div>

      {/* Projects section */}
      {activeSection === "projects" && (
        <div style={{ display: "grid", gap: 8 }}>
          {loadingProjects ? (
            <div style={{ color: COLORS.muted, fontSize: 13, padding: 12 }}>Loading projects...</div>
          ) : projects.length === 0 ? (
            <div style={{ color: COLORS.muted, fontSize: 13, padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
              No project submissions yet.
            </div>
          ) : (
            projects.map((proj) => (
              <div key={proj.id} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 14px", display: "grid", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ fontWeight: 600, fontSize: 14 }}>{proj.title}</div>
                  {statusBadge(proj.status)}
                </div>
                <div style={{ color: COLORS.muted, fontSize: 12, lineHeight: 1.5 }}>{proj.description}</div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginTop: 4 }}>
                  {proj.github_link && (
                    <a href={proj.github_link} target="_blank" rel="noreferrer" style={{ color: "#14b8a6", fontSize: 12, textDecoration: "none" }}>
                      🔗 GitHub
                    </a>
                  )}
                  {proj.demo_link && (
                    <a href={proj.demo_link} target="_blank" rel="noreferrer" style={{ color: "#a78bfa", fontSize: 12, textDecoration: "none" }}>
                      🌐 Demo
                    </a>
                  )}
                  <span style={{ color: COLORS.muted, fontSize: 11 }}>Submitted: {formatDate(proj.submitted_at)}</span>
                </div>
                {proj.review_comment && (
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: COLORS.textSecondary, borderLeft: "3px solid #14b8a6" }}>
                    <strong>Review:</strong> {proj.review_comment}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Monthly/Weekly Reports section */}
      {activeSection === "reports" && (
        <div style={{ display: "grid", gap: 8 }}>
          {loadingReports ? (
            <div style={{ color: COLORS.muted, fontSize: 13, padding: 12 }}>Loading reports...</div>
          ) : reports.length === 0 ? (
            <div style={{ color: COLORS.muted, fontSize: 13, padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
              No reports submitted yet.
            </div>
          ) : (
            reports.map((report) => (
              <div key={report.id} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "12px 14px", display: "grid", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontWeight: 600, fontSize: 13, textTransform: "capitalize" }}>
                      {report.report_type === "monthly" ? `${report.month || "Monthly"} Report` : `Week ${report.week_number || ""} Report`}
                    </span>
                    <span style={{ padding: "1px 8px", borderRadius: 20, fontSize: 10, fontWeight: 700, background: "rgba(167,139,250,0.15)", border: "1px solid rgba(167,139,250,0.3)", color: "#a78bfa", textTransform: "capitalize" }}>
                      {report.report_type}
                    </span>
                  </div>
                  {statusBadge(report.status)}
                </div>
                <div style={{ color: COLORS.muted, fontSize: 12, lineHeight: 1.5 }}>{report.summary}</div>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  {report.total_hours != null && <span style={{ color: COLORS.textSecondary, fontSize: 11 }}>⏱ {report.total_hours}h total</span>}
                  {report.days_worked != null && <span style={{ color: COLORS.textSecondary, fontSize: 11 }}>📅 {report.days_worked} days</span>}
                  {report.period_start && <span style={{ color: COLORS.muted, fontSize: 11 }}>{formatDate(report.period_start)} → {formatDate(report.period_end)}</span>}
                  <span style={{ color: COLORS.muted, fontSize: 11 }}>Submitted: {formatDate(report.submitted_at)}</span>
                </div>
                {report.review_reason && (
                  <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "6px 10px", fontSize: 12, color: COLORS.textSecondary, borderLeft: "3px solid #14b8a6" }}>
                    <strong>Review note:</strong> {report.review_reason}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Daily Logs section */}
      {activeSection === "dailylogs" && (
        <div style={{ display: "grid", gap: 8 }}>
          {loadingLogs ? (
            <div style={{ color: COLORS.muted, fontSize: 13, padding: 12 }}>Loading daily logs...</div>
          ) : logs.length === 0 ? (
            <div style={{ color: COLORS.muted, fontSize: 13, padding: 12, background: "rgba(255,255,255,0.03)", borderRadius: 8, border: `1px solid ${COLORS.border}` }}>
              No daily logs yet.
            </div>
          ) : (
            <div>
              <div style={{ color: COLORS.muted, fontSize: 12, marginBottom: 8 }}>Showing {logs.length} log{logs.length !== 1 ? "s" : ""}</div>
              {logs.map((log) => (
                <div key={log.id} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "10px 14px", marginBottom: 6, display: "grid", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{formatDate(log.log_date)}</span>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ color: COLORS.textSecondary, fontSize: 11 }}>⏱ {log.hours_worked || 0}h</span>
                      {statusBadge(log.status)}
                    </div>
                  </div>
                  {log.tasks && <div style={{ color: COLORS.textSecondary, fontSize: 12 }}><strong>Tasks:</strong> {log.tasks}</div>}
                  {log.learnings && <div style={{ color: COLORS.textSecondary, fontSize: 12 }}><strong>Learnings:</strong> {log.learnings}</div>}
                  {log.blockers && <div style={{ color: "#f59e0b", fontSize: 12 }}><strong>Blockers:</strong> {log.blockers}</div>}
                  {log.review_reason && (
                    <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "5px 10px", fontSize: 12, color: COLORS.textSecondary, borderLeft: "3px solid #14b8a6" }}>
                      <strong>Review:</strong> {log.review_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminHome() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [internProgress, setInternProgress] = useState([]);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    role: "hr", fullName: "", email: "", password: "", pmCode: "", hrCode: "",
    pmId: "", internId: "", startDate: "", endDate: "", department: "", mentor: "", stipend: "",
  });
  const [internEdits, setInternEdits] = useState({});
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [profileDraft, setProfileDraft] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [loadingGeneratedId, setLoadingGeneratedId] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [passwordModal, setPasswordModal] = useState(null);
  const [internStatusFilter, setInternStatusFilter] = useState("all");
  const [sendingCredentials, setSendingCredentials] = useState("");
  const [archivedInternDetail, setArchivedInternDetail] = useState(null);
  // NEW: profile modal tab state
  const [profileModalTab, setProfileModalTab] = useState("profile");

  const minDate = new Date().toISOString().slice(0, 10);
  const pmUsers = useMemo(() => users.filter((user) => user.role === "pm"), [users]);
  const archivedInterns = useMemo(() => users.filter((u) => u.role === "intern" && u.status === "archived"), [users]);

  const filteredUsers = useMemo(() => {
    const normalized = search.trim().toLowerCase();
    return users.filter((user) => {
      if (!normalized) return true;
      return (
        String(user.fullName || "").toLowerCase().includes(normalized) ||
        String(user.email || "").toLowerCase().includes(normalized) ||
        String(user.internId || "").toLowerCase().includes(normalized) ||
        String(user.pmCode || "").toLowerCase().includes(normalized)
      );
    });
  }, [search, users]);

  const roleFilteredUsers = useMemo(() => {
    if (activeTab === "hr") return filteredUsers.filter((user) => user.role === "hr");
    if (activeTab === "pm") return filteredUsers.filter((user) => user.role === "pm");
    if (activeTab === "intern") {
      const byRole = filteredUsers.filter((user) => user.role === "intern");
      if (internStatusFilter === "all") return byRole;
      return byRole.filter((user) => (user.status || "active") === internStatusFilter);
    }
    return filteredUsers;
  }, [activeTab, filteredUsers, internStatusFilter]);

  const internDepartmentById = useMemo(() => {
    const entries = (internProgress || []).map((intern) => [intern.id, String(intern.department || "").trim()]);
    return new Map(entries);
  }, [internProgress]);

  const progressByInternId = useMemo(() => {
    const entries = (internProgress || []).map((intern) => [intern.id, intern]);
    return new Map(entries);
  }, [internProgress]);

  const departmentGroups = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const groups = new Map([
      ...DEPARTMENT_SECTIONS.map((item) => [item, { department: item, interns: [], pms: [] }]),
      [OTHER_DEPARTMENT_LABEL, { department: OTHER_DEPARTMENT_LABEL, interns: [], pms: [] }],
    ]);
    const addToGroup = (user, role, department) => {
      const key = normalizeDepartmentForSection(department);
      if (role === "intern") groups.get(key).interns.push(user);
      if (role === "pm") groups.get(key).pms.push(user);
    };
    users.filter((user) => user.role === "intern" || user.role === "pm").forEach((user) => {
      const fromProfile = String(user?.profileData?.department || "").trim();
      const fromProgress = user.role === "intern" ? String(internDepartmentById.get(user.id) || "").trim() : "";
      const resolvedDepartment = fromProfile || fromProgress || "Unassigned";
      if (normalizedSearch) {
        const searchable = [String(user.fullName || ""), String(user.email || ""), String(user.internId || ""), String(user.pmCode || ""), String(resolvedDepartment || "")].join(" ").toLowerCase();
        if (!searchable.includes(normalizedSearch)) return;
      }
      addToGroup(user, user.role, resolvedDepartment);
    });
    return Array.from(groups.values());
  }, [users, internDepartmentById, search]);

  async function loadGeneratedIdForRole(role) {
    const normalizedRole = String(role || "").trim().toLowerCase();
    if (!["intern", "pm", "hr"].includes(normalizedRole)) return "";
    try {
      setLoadingGeneratedId(true);
      if (normalizedRole === "intern") {
        const res = await adminApi.nextInternId();
        const nextInternId = String(res?.internId || "").trim();
        if (nextInternId) setForm((prev) => ({ ...prev, internId: nextInternId }));
        return nextInternId;
      }
      if (normalizedRole === "pm") {
        const res = await adminApi.nextPmCode();
        const nextPmCode = String(res?.pmCode || "").trim();
        if (nextPmCode) setForm((prev) => ({ ...prev, pmCode: nextPmCode }));
        return nextPmCode;
      }
      const res = await adminApi.nextHrCode();
      const nextHrCode = String(res?.hrCode || "").trim();
      if (nextHrCode) setForm((prev) => ({ ...prev, hrCode: nextHrCode }));
      return nextHrCode;
    } catch { return ""; } finally { setLoadingGeneratedId(false); }
  }

  function isAuthOrRoleError(err) {
    const status = Number(err?.status || 0);
    return status === 401 || status === 403;
  }

  function redirectToAdminLogin(err) {
    localStorage.removeItem("currentUser");
    setCurrentUser(null);
    setError(err?.message || "Your admin session is no longer valid. Please log in again.");
    navigate("/admin/login");
  }

  useEffect(() => {
    const nextEdits = {};
    users.filter((user) => user.role === "intern").forEach((user) => {
      const fromProfile = String(user?.profileData?.department || "").trim();
      const fromProgress = String(internDepartmentById.get(user.id) || "").trim();
      nextEdits[user.id] = { internId: user.internId || "", department: fromProfile || fromProgress || "", pmId: user.pmId || "" };
    });
    setInternEdits(nextEdits);
  }, [users, internDepartmentById]);

  useEffect(() => { loadGeneratedIdForRole(form.role); }, [form.role]);

  async function loadAll() {
    const [usersRes, statsRes, progressRes] = await Promise.all([adminApi.users(), adminApi.stats(), adminApi.internProgress()]);
    setUsers(usersRes?.users || []);
    setStats(statsRes?.stats || null);
    setInternProgress(progressRes?.interns || []);
  }

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setError("");
        const meRes = await authApi.me();
        if (!isMounted) return;
        if (meRes?.profile?.role !== "admin") { navigate("/admin/login"); return; }
        const me = { role: meRes.profile.role, fullName: meRes.profile.full_name || "Admin", email: meRes.profile.email || "" };
        setCurrentUser(me);
        localStorage.setItem("currentUser", JSON.stringify(me));
        await loadAll();
      } catch (err) {
        if (!isMounted) return;
        localStorage.removeItem("currentUser");
        setError(err?.message || "Failed to load admin dashboard.");
        navigate("/admin/login");
      } finally { if (isMounted) setLoading(false); }
    })();
    return () => { isMounted = false; };
  }, [navigate]);

  useEffect(() => { setInfo(""); setError(""); }, [activeTab]);

  async function refreshData() {
    try {
      setLoading(true); setError("");
      await loadAll();
    } catch (err) {
      if (isAuthOrRoleError(err)) { redirectToAdminLogin(err); return; }
      setError(err?.message || "Failed to refresh data.");
    } finally { setLoading(false); }
  }

  async function handleViewPassword(user) {
    setPasswordModal({ user, password: null, loading: true, newPassword: "" });
    try {
      const res = await adminApi.getUserPassword(user.id);
      setPasswordModal((prev) => ({ ...prev, password: res?.password || "Not saved", loading: false }));
    } catch (err) {
      setPasswordModal((prev) => ({ ...prev, password: "Error loading", loading: false }));
    }
  }

  async function assignHrCode(user) {
    if (!user?.id) return;
    try {
      setActionId(user.id);
      setError("");
      const res = await adminApi.nextHrCode();
      const nextHrCode = String(res?.hrCode || "").trim();
      if (!nextHrCode) throw new Error("Failed to generate HR code");
      await adminApi.updateUser(user.id, { hrCode: nextHrCode });
      setInfo(`Assigned HR code ${nextHrCode} to ${user.fullName || user.email}.`);
      setTimeout(() => setInfo(""), 3000);
      await loadAll();
    } catch (err) {
      if (isAuthOrRoleError(err)) { redirectToAdminLogin(err); return; }
      setError(err?.message || "Failed to assign HR code.");
    } finally {
      setActionId("");
    }
  }

  async function handleSendCredentials(user) {
    if (!user?.email) { setError("No email address for this user."); return; }
    let password = null;
    try {
      const res = await adminApi.getUserPassword(user.id);
      password = res?.password || null;
    } catch (e) { /* ignore */ }
    if (!password) {
      setError("Password not on record. Please reset their password first using the Password button, then send credentials.");
      setTimeout(() => setError(""), 5000);
      return;
    }
    try {
      setSendingCredentials(user.id);
      const roleLabel = user.role === "hr" ? "HR Manager" : user.role === "pm" ? "Project Manager" : "Intern";
      const extraInfo = user.role === "pm"
        ? `<p style="margin:8px 0"><strong>PM Code:</strong> ${user.pmCode || "\u2014"}</p>`
        : user.role === "hr"
        ? `<p style="margin:8px 0"><strong>HR Code:</strong> ${user.pmCode || "\u2014"}</p>`
        : user.role === "intern"
        ? `<p style="margin:8px 0"><strong>Intern ID:</strong> ${user.internId || "\u2014"}</p>`
        : "";
      const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;padding:0;background:#f4f4f4;font-family:'Segoe UI',Arial,sans-serif;"><table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:40px 0;"><tr><td align="center"><table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);"><tr><td style="background:linear-gradient(135deg,#0f766e,#14b8a6);padding:32px 40px;text-align:center;"><h1 style="color:white;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px">Welcome to InternHub</h1><p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:15px">Your account has been created</p></td></tr><tr><td style="padding:40px;"><p style="color:#374151;font-size:16px;margin:0 0 24px">Hi <strong>${user.fullName || user.email}</strong>,</p><p style="color:#6b7280;font-size:14px;margin:0 0 24px;line-height:1.6">Your <strong>${roleLabel}</strong> account has been set up on the InternHub portal. Here are your login credentials:</p><table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:24px;"><tr><td style="padding:24px;"><p style="margin:0 0 12px;font-size:13px;color:#6b7280;font-weight:600;text-transform:uppercase;letter-spacing:0.5px">Your Login Credentials</p><p style="margin:8px 0"><strong style="color:#374151">Email:</strong> <span style="color:#0f766e;font-family:monospace;font-size:14px">${user.email}</span></p><p style="margin:8px 0"><strong style="color:#374151">Password:</strong> <span style="background:#fff;border:1px solid #d1fae5;border-radius:6px;padding:3px 10px;color:#065f46;font-family:monospace;font-size:15px;font-weight:700">${password}</span></p><p style="margin:8px 0"><strong style="color:#374151">Role:</strong> <span style="background:#f0fdf4;border:1px solid #86efac;border-radius:20px;padding:3px 12px;color:#15803d;font-size:12px;font-weight:600">${roleLabel}</span></p>${extraInfo}</td></tr></table><p style="color:#ef4444;font-size:13px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px 16px;margin:0 0 24px">Please change your password after your first login for security.</p><p style="color:#6b7280;font-size:14px;margin:0;line-height:1.6">If you have any questions, please contact your administrator.</p></td></tr><tr><td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:20px 40px;text-align:center;"><p style="color:#9ca3af;font-size:12px;margin:0">&copy; ${new Date().getFullYear()} InternHub &mdash; This is an automated message, please do not reply.</p></td></tr></table></td></tr></table></body></html>`;
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ to: user.email, subject: `Your InternHub Account Credentials \u2014 ${user.fullName || user.email}`, html }),
      }).then(async (res) => {
        if (!res.ok) { const data = await res.json().catch(() => ({})); throw new Error(data?.error || "Failed to send email"); }
      });
      setInfo(`Credentials sent to ${user.email}!`);
      setTimeout(() => setInfo(""), 3000);
    } catch (err) {
      setError(err?.message || "Failed to send credentials email.");
      setTimeout(() => setError(""), 4000);
    } finally { setSendingCredentials(""); }
  }

  async function logout() {
    try { await authApi.logout(); } catch { /* ignore */ }
    localStorage.removeItem("currentUser");
    navigate("/admin/login");
  }

  async function createUser(event) {
    event.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) { setError("Full name and email are required."); return; }
    const role = form.role;
    const password = form.password.trim() || randomPassword();
    const resolvedDepartment = resolveDepartmentValue(form.department);
    const payload = { role, fullName: form.fullName.trim(), email: form.email.trim().toLowerCase(), password };
    if (role === "pm") {
      let nextPmCode = String(form.pmCode || "").trim();
      if (!nextPmCode) nextPmCode = String(await loadGeneratedIdForRole("pm")).trim();
      if (!nextPmCode) { setError("PM code is required."); return; }
      payload.pmCode = nextPmCode;
      if (resolvedDepartment) payload.profileData = { department: resolvedDepartment };
    }
    if (role === "hr") {
      let nextHrCode = String(form.hrCode || "").trim();
      if (!nextHrCode) nextHrCode = String(await loadGeneratedIdForRole("hr")).trim();
      if (!nextHrCode) { setError("HR code is required."); return; }
      payload.hrCode = nextHrCode;
    }
    if (role === "intern") {
      let nextInternId = String(form.internId || "").trim();
      if (!nextInternId) nextInternId = String(await loadGeneratedIdForRole("intern")).trim();
      if (!nextInternId) { setError("Intern ID is required."); return; }
      if (form.startDate && form.startDate < minDate) { setError("Start date cannot be in the past."); return; }
      if (form.endDate && form.endDate < minDate) { setError("End date cannot be in the past."); return; }
      if (form.startDate && form.endDate && form.endDate < form.startDate) { setError("End date must be on or after start date."); return; }
      if (form.pmId) payload.pmId = form.pmId;
      payload.internId = nextInternId;
      payload.profileData = { startDate: form.startDate || null, endDate: form.endDate || null, department: resolvedDepartment || null, mentorName: form.mentor || null, stipend: form.stipend || null };
    }
    try {
      setSaving(true); setError(""); setInfo("");
      await adminApi.createUser(payload);
      setForm({ role, fullName: "", email: "", password: "", pmCode: "", hrCode: "", pmId: "", internId: "", startDate: "", endDate: "", department: "", mentor: "", stipend: "" });
      await loadGeneratedIdForRole(role);
      setInfo(`Created ${role.toUpperCase()} account for ${payload.email}. Password: ${password}`);
      setTimeout(() => setInfo(""), 3000);
      await loadAll();
    } catch (err) {
      if (isAuthOrRoleError(err)) { redirectToAdminLogin(err); return; }
      setError(err?.message || "Failed to create user.");
    } finally { setSaving(false); }
  }

  async function deleteUser(user) {
    if (!user?.id) return;
    if (!window.confirm(`Delete ${user.fullName || user.email}? This action cannot be undone.`)) return;
    try {
      setActionId(user.id); setError("");
      await adminApi.deleteUser(user.id);
      await loadAll();
    } catch (err) {
      if (isAuthOrRoleError(err)) { redirectToAdminLogin(err); return; }
      setError(err?.message || "Failed to delete user.");
    } finally { setActionId(""); }
  }

  async function updateInternStatus(internId, status) {
    try {
      setActionId(internId); setError("");
      await adminApi.setInternStatus(internId, status);
      await loadAll();
    } catch (err) {
      if (isAuthOrRoleError(err)) { redirectToAdminLogin(err); return; }
      setError(err?.message || "Failed to update intern status.");
    } finally { setActionId(""); }
  }

  async function saveInternProfile(user) {
    const draft = internEdits[user.id] || { internId: user.internId || "", department: "", pmId: user.pmId || "" };
    const nextInternId = String(draft.internId || "").trim();
    const nextDepartment = String(draft.department || "").trim();
    const nextPmId = String(draft.pmId || "").trim();
    if (!nextInternId) { setError("Intern ID cannot be empty."); return; }
    try {
      setActionId(user.id); setError(""); setInfo("");
      await adminApi.updateUser(user.id, { internId: nextInternId, department: nextDepartment || null, pmId: nextPmId || null });
      await loadAll();
      setInfo(`Updated intern profile for ${user.fullName || user.email}.`);
      setTimeout(() => setInfo(""), 3000);
    } catch (err) {
      if (isAuthOrRoleError(err)) { redirectToAdminLogin(err); return; }
      setError(err?.message || "Failed to update intern profile.");
    } finally { setActionId(""); }
  }

  function openInternProfile(user) {
    const progress = progressByInternId.get(user.id) || null;
    const currentDepartment = String(user?.profileData?.department || progress?.department || "").trim();
    const knownDepartment = DEPARTMENT_OPTIONS.find((item) => item.toLowerCase() === currentDepartment.toLowerCase()) || "";
    setSelectedIntern(user);
    setProfileModalTab("profile"); // reset tab
    setProfileDraft({
      fullName: user.fullName || "", internId: user.internId || "", department: knownDepartment || "",
      pmId: user.pmId || "", startDate: progress?.startDate || user?.profileData?.startDate || "",
      endDate: progress?.endDate || user?.profileData?.endDate || "",
      mentorName: progress?.mentor || user?.profileData?.mentorName || user?.profileData?.mentor || "",
      stipend: progress?.stipend || user?.profileData?.stipend || "", status: user.status || "active",
    });
  }

  function closeInternProfile() {
    if (profileSaving) return;
    setSelectedIntern(null); setProfileDraft(null); setProfileModalTab("profile");
  }

  async function saveInternProfileFromModal() {
    if (!selectedIntern?.id || !profileDraft) return;
    const resolvedDepartment = resolveDepartmentValue(profileDraft.department);
    const nextStartDate = String(profileDraft.startDate || "").trim();
    const nextEndDate = String(profileDraft.endDate || "").trim();
    if (!String(profileDraft.internId || "").trim()) { setError("Intern ID cannot be empty."); return; }
    if (!nextStartDate || !nextEndDate) { setError("Start date and end date are required."); return; }
    if (nextStartDate < minDate || nextEndDate < minDate) { setError("Past dates are not allowed."); return; }
    if (nextEndDate < nextStartDate) { setError("End date must be on or after start date."); return; }
    try {
      setProfileSaving(true); setError(""); setInfo("");
      await adminApi.updateUser(selectedIntern.id, {
        fullName: String(profileDraft.fullName || "").trim(), internId: String(profileDraft.internId || "").trim(),
        department: resolvedDepartment || null, pmId: String(profileDraft.pmId || "").trim() || null,
        startDate: nextStartDate, endDate: nextEndDate,
        mentorName: String(profileDraft.mentorName || "").trim() || null,
        stipend: String(profileDraft.stipend || "").trim() || null,
        status: String(profileDraft.status || "").trim().toLowerCase(),
      });
      await loadAll();
      setInfo(`Updated profile for ${selectedIntern.fullName || selectedIntern.email}.`);
      setTimeout(() => setInfo(""), 3000);
      closeInternProfile();
    } catch (err) {
      if (isAuthOrRoleError(err)) { redirectToAdminLogin(err); return; }
      setError(err?.message || "Failed to save intern profile.");
    } finally { setProfileSaving(false); }
  }

  const selectedInternProgress = selectedIntern ? progressByInternId.get(selectedIntern.id) || null : null;

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) setSidebarOpen(false);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: COLORS.bgPrimary, color: COLORS.textPrimary }}>
        Loading admin dashboard...
      </div>
    );
  }

  const activeTabDetails = TABS.find((t) => t.id === activeTab);
  const userTableColumns = activeTab === "intern" ? INTERN_TABLE_COLUMNS : activeTab === "pm" ? PM_TABLE_COLUMNS : HR_TABLE_COLUMNS;
  const userTableLabels = activeTab === "intern"
    ? ["User", "Intern ID", "Department", "Assigned PM", "Status", "Actions"]
    : activeTab === "pm" ? ["User", "PM Code", "Status", "Actions"] : activeTab === "hr" ? ["User", "HR Code", "Status", "Actions"] : ["User", "Status", "Actions"];

  const modalTabStyle = (id) => ({
    padding: "8px 18px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
    background: profileModalTab === id ? GRADIENTS.accent : "rgba(255,255,255,0.06)",
    color: profileModalTab === id ? "white" : COLORS.muted,
    transition: "all 0.15s",
  });

  return (
    <>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: GRADIENTS.primary, fontFamily: "'Inter', system-ui, sans-serif", color: COLORS.textPrimary }}>

        {/* SIDEBAR */}
        <aside style={{ width: sidebarOpen ? 280 : 0, height: "100vh", background: COLORS.surfaceGlass, backdropFilter: "blur(20px)", borderRight: `1px solid ${COLORS.borderGlass}`, transition: "width 0.3s ease", overflow: "hidden", position: "fixed", left: 0, top: 0, bottom: 0, zIndex: isMobile ? 1000 : 100, display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", overflowX: "hidden" }}>
            <div style={{ padding: 24, borderBottom: `1px solid ${COLORS.borderGlass}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: GRADIENTS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Sparkles size={20} color="white" />
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary }}>AdminHub</span>
                </div>
                {isMobile && (
                  <button onClick={() => setSidebarOpen(false)} style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${COLORS.borderGlass}`, background: "transparent", color: COLORS.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ background: COLORS.surfaceGlass, borderRadius: 16, padding: 16, border: `1px solid ${COLORS.borderGlass}`, cursor: "pointer" }}>
                <div onClick={() => setShowAccountModal(true)} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: GRADIENTS.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "white" }}>
                    {currentUser?.fullName?.[0]?.toUpperCase() || "A"}
                  </div>
                  <div style={{ minWidth: 0, overflow: "hidden" }}>
                    <div style={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: 14, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>{currentUser?.fullName || "Admin"}</div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>System Admin</div>
                  </div>
                </div>
              </div>
            </div>
            <nav style={{ flex: 1, padding: "0 12px", overflowY: "auto", overflowX: "hidden" }}>
              {TABS.map((tab, idx) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button key={tab.id} onClick={() => { setActiveTab(tab.id); if (isMobile) setSidebarOpen(false); }}
                    style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", marginBottom: 4, borderRadius: 12, border: "none", cursor: "pointer", background: isActive ? GRADIENTS.accent : "transparent", color: isActive ? "white" : COLORS.textSecondary, fontWeight: isActive ? 600 : 400, fontSize: 14, transition: "all 0.2s ease", animation: "slideIn 0.4s ease-out forwards", animationDelay: `${idx * 0.05}s` }}>
                    <Icon size={20} />
                    <span style={{ flex: 1, textAlign: "left" }}>{tab.label}</span>
                    {tab.id === "archived" && archivedInterns.length > 0 && (
                      <span style={{ background: "rgba(239,68,68,0.2)", color: "#ef4444", borderRadius: 20, padding: "1px 7px", fontSize: 11, fontWeight: 700 }}>{archivedInterns.length}</span>
                    )}
                  </button>
                );
              })}
            </nav>
            <div style={{ padding: 16, borderTop: `1px solid ${COLORS.borderGlass}` }}>
              <button onClick={logout} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 16px", borderRadius: 12, border: `1px solid ${COLORS.borderGlass}`, background: "transparent", color: COLORS.textSecondary, cursor: "pointer", fontSize: 14, fontWeight: 500 }}>
                <LogOut size={18} /> Logout
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, marginLeft: isMobile ? 0 : (sidebarOpen ? 280 : 0), transition: "margin-left 0.3s ease", height: "100vh", overflow: "hidden" }}>
          <header style={{ height: 72, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", background: COLORS.surfaceGlass, backdropFilter: "blur(20px)", borderBottom: `1px solid ${COLORS.borderGlass}`, position: "sticky", top: 0, zIndex: 50, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {(!sidebarOpen || isMobile) && (
                <button onClick={() => setSidebarOpen(true)} style={{ width: 40, height: 40, borderRadius: 10, border: `1px solid ${COLORS.borderGlass}`, background: "transparent", color: COLORS.textSecondary, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Menu size={22} />
                </button>
              )}
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>{activeTabDetails?.label || "Admin Dashboard"}</h1>
                <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>Manage users and platform settings</p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={refreshData} style={btnStyle("secondary")} type="button"><RefreshCw size={16} /> Refresh</button>
            </div>
          </header>

          <div style={{ flex: 1, padding: 24, overflowY: "auto", overflowX: "hidden", background: "transparent" }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gap: 24 }}>

              {activeTab === "overview" && (
                <form onSubmit={createUser} style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 24, display: "grid", gap: 20 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}><Plus size={20} /> Create New User</div>
                  <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>Role</span>
                      <select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))} style={inputStyle}>
                        <option value="hr">HR</option>
                        <option value="pm">Project Manager (PM)</option>
                        <option value="intern">Intern</option>
                      </select>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>Full Name</span>
                      <input placeholder="e.g. John Doe" value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} style={inputStyle} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>Email Address</span>
                      <input placeholder="john@example.com" type="email" value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} style={inputStyle} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                        <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>Password (Optional)</span>
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, password: randomPassword() }))}
                          title="Auto-generate a secure password"
                          style={{
                            border: `1px solid ${COLORS.border}`,
                            background: "rgba(20,184,166,0.12)",
                            color: COLORS.accent,
                            borderRadius: 10,
                            padding: "6px 10px",
                            fontSize: 12,
                            fontWeight: 800,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            flexShrink: 0,
                          }}
                        >
                          <Sparkles size={14} /> Auto
                        </button>
                      </div>
                      <input placeholder="Leave blank for auto-generation" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} style={inputStyle} />
                    </div>
                    {form.role === "pm" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>PM ID (e.g. pmCode)</span>
                        <input placeholder="e.g. PM-001 (Editable)" value={form.pmCode} onChange={(event) => setForm((prev) => ({ ...prev, pmCode: event.target.value }))} style={inputStyle} />
                      </div>
                    )}
                    {form.role === "hr" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>HR Code</span>
                        <input placeholder="e.g. HR-001" value={form.hrCode} onChange={(event) => setForm((prev) => ({ ...prev, hrCode: event.target.value }))} style={inputStyle} />
                      </div>
                    )}
                    {(form.role === "pm" || form.role === "intern") && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>Department</span>
                        <select value={form.department} onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))} style={inputStyle}>
                          <option value="">Select Department</option>
                          {DEPARTMENT_OPTIONS.map((department) => <option key={department} value={department}>{department}</option>)}
                        </select>
                      </div>
                    )}
                    {form.role === "intern" && (<>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>Assign PM (Optional)</span>
                        <select value={form.pmId} onChange={(event) => setForm((prev) => ({ ...prev, pmId: event.target.value }))} style={inputStyle}>
                          <option value="">Select a PM</option>
                          {pmUsers.map((pm) => <option key={pm.id} value={pm.id}>{pm.fullName || pm.email} {pm.pmCode ? `(${pm.pmCode})` : ""}</option>)}
                        </select>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>Intern ID</span>
                        <input placeholder="e.g. INT-001 (Editable)" value={form.internId} onChange={(event) => setForm((prev) => ({ ...prev, internId: event.target.value }))} style={inputStyle} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>Start Date</span>
                        <input type="date" value={form.startDate} min={minDate} onChange={(event) => setForm((prev) => { const nextStartDate = event.target.value; const nextEndDate = prev.endDate && nextStartDate && prev.endDate < nextStartDate ? nextStartDate : prev.endDate; return { ...prev, startDate: nextStartDate, endDate: nextEndDate }; })} style={inputStyle} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>End Date</span>
                        <input type="date" value={form.endDate} min={form.startDate || minDate} onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))} style={inputStyle} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>Mentor Name</span>
                        <input placeholder="Assigned Mentor" value={form.mentor} onChange={(event) => setForm((prev) => ({ ...prev, mentor: event.target.value }))} style={inputStyle} />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>Stipend</span>
                        <input placeholder="e.g. 5000" value={form.stipend} onChange={(event) => setForm((prev) => ({ ...prev, stipend: event.target.value }))} style={inputStyle} />
                      </div>
                    </>)}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", paddingTop: 8, borderTop: `1px solid ${COLORS.border}` }}>
                    <div style={{ color: COLORS.muted, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      <span>If password is empty, a secure random password will be generated. IDs are auto-sequenced but can be edited manually.</span>
                      {loadingGeneratedId && <span style={{ color: COLORS.accent }}>(Generating next ID...)</span>}
                    </div>
                    <button type="submit" disabled={saving} style={btnStyle("primary")}><Plus size={16} /> {saving ? "Creating..." : "Create User"}</button>
                  </div>
                </form>
              )}

              {error && <div style={{ background: "rgba(239, 68, 68, 0.18)", border: "1px solid rgba(239, 68, 68, 0.48)", color: "#fecaca", borderRadius: 12, padding: "10px 12px", fontSize: 13 }}>{error}</div>}
              {info && <div style={{ background: "rgba(16, 185, 129, 0.15)", border: "1px solid rgba(16, 185, 129, 0.45)", color: "#a7f3d0", borderRadius: 12, padding: "10px 12px", fontSize: 13, wordBreak: "break-word" }}>{info}</div>}

              {(activeTab === "hr" || activeTab === "pm" || activeTab === "intern" || activeTab === "departments") && (
                <input placeholder="Search by name, email, code" value={search} onChange={(event) => setSearch(event.target.value)} style={inputStyle} />
              )}

              {activeTab === "overview" && (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
                    <StatCard label="Total Users" value={stats?.users?.total ?? users.length} />
                    <StatCard label="Admins" value={stats?.users?.admin ?? 0} />
                    <StatCard label="HRs" value={stats?.users?.hr ?? 0} />
                    <StatCard label="PMs" value={stats?.users?.pm ?? 0} />
                    <StatCard label="Interns" value={stats?.users?.intern ?? 0} />
                    <StatCard label="Active Users" value={stats?.users?.active ?? 0} />
                    <StatCard label="Avg Intern Progress" value={`${stats?.interns?.averageProgress ?? 0}%`} />
                    <StatCard label="Pending Reports" value={stats?.activity?.reportsPending ?? 0} />
                  </div>
                  {stats && (
                    <div style={{ display: "grid", gap: 16, marginTop: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: COLORS.textPrimary }}>Analytics Overview</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
                        {[
                          { title: "User Breakdown", items: [{ label: "HR Staff", value: stats.users?.hr || 0, color: "#14b8a6" }, { label: "Project Managers", value: stats.users?.pm || 0, color: "#a78bfa" }, { label: "Interns", value: stats.users?.intern || 0, color: "#10b981" }, { label: "Active Users", value: stats.users?.active || 0, color: "#f59e0b" }, { label: "New (last 30 days)", value: stats.users?.createdLast30Days || 0, color: "#14b8a6" }] },
                          { title: "Intern Statistics", items: [{ label: "Assigned to PM", value: stats.interns?.assignedToPm || 0, color: "#10b981" }, { label: "Unassigned", value: stats.interns?.unassignedToPm || 0, color: "#ef4444" }, { label: "Profile Completed", value: stats.interns?.profileCompleted || 0, color: "#14b8a6" }, { label: "Avg Progress", value: `${stats.interns?.averageProgress || 0}%`, color: "#a78bfa" }, { label: "Completed Internships", value: stats.interns?.completed || 0, color: "#10b981" }] },
                          { title: "Activity Summary", items: [{ label: "Total Daily Logs", value: stats.activity?.dailyLogs || 0, color: "#14b8a6" }, { label: "Approved Logs", value: stats.activity?.approvedDailyLogs || 0, color: "#10b981" }, { label: "Total Hours Logged", value: `${stats.activity?.totalHours || 0}h`, color: "#f59e0b" }, { label: "Reports Submitted", value: stats.activity?.reportsTotal || 0, color: "#a78bfa" }, { label: "Reports Pending", value: stats.activity?.reportsPending || 0, color: "#f59e0b" }] },
                        ].map((card) => (
                          <div key={card.title} style={{ background: COLORS.surfaceGlass, border: `1px solid ${COLORS.borderGlass}`, borderRadius: 14, padding: 16 }}>
                            <div style={{ fontWeight: 700, marginBottom: 12, color: COLORS.textPrimary }}>{card.title}</div>
                            {card.items.map((item) => (
                              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                                <span style={{ color: COLORS.textSecondary, fontSize: 13 }}>{item.label}</span>
                                <span style={{ color: item.color, fontWeight: 700, fontSize: 15 }}>{item.value}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: "hidden" }}>
                    <div style={{ padding: "12px 14px", fontWeight: 700 }}>Recent Users</div>
                    <TableHeader columns="2fr 1fr 1fr 1fr" labels={["User", "Role", "Status", "Created"]} />
                    <div style={{ display: "grid" }}>
                      {users.slice(0, 10).map((user) => (
                        <div key={user.id} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr", padding: "10px 12px", borderTop: `1px solid ${COLORS.border}`, fontSize: 13, alignItems: "center" }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{user.fullName || "-"}</div>
                            <div style={{ color: COLORS.muted, fontSize: 11 }}>{user.email}</div>
                          </div>
                          <div style={{ textTransform: "uppercase", fontWeight: 700 }}>{user.role}</div>
                          <div>{user.status || "-"}</div>
                          <div>{formatDate(user.createdAt)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "leave" && (
                <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 12 }}>
                  <LeaveRequestsPanel variant="admin" defaultStatus="pending" />
                </div>
              )}

              {(activeTab === "hr" || activeTab === "pm" || activeTab === "intern") && (
                <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: "hidden", width: "100%" }}>
                  <div style={{ padding: "12px 14px", fontWeight: 700 }}>{activeTab.toUpperCase()} Users ({roleFilteredUsers.length})</div>
                  {activeTab === "intern" && (
                    <div style={{ display: "flex", gap: 8, margin: "0 14px 16px", flexWrap: "wrap" }}>
                      {["all", "active", "completed", "archived", "inactive"].map((status) => (
                        <button key={status} type="button" onClick={() => setInternStatusFilter(status)}
                          style={{ padding: "6px 16px", borderRadius: 20, border: internStatusFilter === status ? "1px solid #14b8a6" : `1px solid rgba(255,255,255,0.12)`, background: internStatusFilter === status ? "rgba(20,184,166,0.15)" : "transparent", color: internStatusFilter === status ? "#14b8a6" : "rgba(248,250,252,0.5)", fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                          {status === "all" ? "All Interns" : status}
                        </button>
                      ))}
                    </div>
                  )}
                  <div style={TABLE_WRAPPER_STYLE}>
                    <div style={TABLE_INNER_STYLE}>
                      <TableHeader columns={userTableColumns} labels={userTableLabels} />
                      <div style={{ display: "grid" }}>
                        {roleFilteredUsers.map((user) => (
                          <div key={user.id} style={{ ...TABLE_ROW_BASE_STYLE, gridTemplateColumns: userTableColumns }}>
                            <div style={USER_CELL_STYLE}>
                              <span style={USER_NAME_STYLE}>{user.fullName || "-"}</span>
                              <span style={USER_EMAIL_STYLE}>{user.email || "-"}</span>
                            </div>
                            {activeTab === "hr" && (
                              <>
                                <div style={TABLE_CELL_STYLE}>
                                  {user.pmCode ? (
                                    user.pmCode
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => assignHrCode(user)}
                                      disabled={actionId === user.id}
                                      title="Generate and assign an HR code"
                                      style={{
                                        ...btnStyle("small"),
                                        border: "1px solid rgba(16,185,129,0.4)",
                                        background: "rgba(16,185,129,0.15)",
                                        color: "#10b981",
                                      }}
                                    >
                                      <Sparkles size={12} /> Assign
                                    </button>
                                  )}
                                </div>
                                <div style={TABLE_CELL_STYLE}>{user.status || "-"}</div>
                                <div style={ACTION_CONTAINER_STYLE}>
                                  <button type="button" title="Password" onClick={() => handleViewPassword(user)}
                                    style={{ ...btnStyle("small"), border: "1px solid rgba(167,139,250,0.4)", background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}>
                                    <Eye size={12} /> Password
                                  </button>
                                  <button type="button" title="Delete" onClick={() => deleteUser(user)} disabled={actionId === user.id} style={btnStyle("small-danger")}>
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </>
                            )}
                            {activeTab === "pm" && (
                              <>
                                <div style={TABLE_CELL_STYLE}>{user.pmCode || "-"}</div>
                                <div style={TABLE_CELL_STYLE}>{user.status || "-"}</div>
                                <div style={ACTION_CONTAINER_STYLE}>
                                  <button type="button" title="Password" onClick={() => handleViewPassword(user)}
                                    style={{ ...btnStyle("small"), border: "1px solid rgba(167,139,250,0.4)", background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}>
                                    <Eye size={12} /> Password
                                  </button>
                                  <button type="button" title="Delete" onClick={() => deleteUser(user)} disabled={actionId === user.id} style={btnStyle("small-danger")}>
                                    <Trash2 size={12} />
                                  </button>
                                </div>
                              </>
                            )}
                            {activeTab === "intern" && (
                              <>
                                <div style={TABLE_CELL_STYLE}>
                                  <input value={internEdits[user.id]?.internId ?? user.internId ?? ""} onChange={(event) => setInternEdits((prev) => ({ ...prev, [user.id]: { ...(prev[user.id] || {}), internId: event.target.value } }))} disabled={actionId === user.id} style={TABLE_FIELD_STYLE} />
                                </div>
                                <div style={TABLE_CELL_STYLE}>
                                  <select value={internEdits[user.id]?.department ?? user.profileData?.department ?? ""} onChange={(event) => setInternEdits((prev) => ({ ...prev, [user.id]: { ...(prev[user.id] || {}), department: event.target.value } }))} disabled={actionId === user.id} style={TABLE_FIELD_STYLE}>
                                    <option value="">Unassigned</option>
                                    {DEPARTMENT_OPTIONS.map((department) => <option key={department} value={department}>{department}</option>)}
                                  </select>
                                </div>
                                <div style={TABLE_CELL_STYLE}>
                                  <select value={internEdits[user.id]?.pmId ?? user.pmId ?? ""} onChange={(event) => setInternEdits((prev) => ({ ...prev, [user.id]: { ...(prev[user.id] || {}), pmId: event.target.value } }))} disabled={actionId === user.id} style={TABLE_FIELD_STYLE}>
                                    <option value="">Unassigned</option>
                                    {pmUsers.map((pm) => <option key={pm.id} value={pm.id}>{pm.fullName || pm.email} {pm.pmCode ? `(${pm.pmCode})` : ""}</option>)}
                                  </select>
                                </div>
                                <div style={TABLE_CELL_STYLE}>
                                  <select value={user.status || "active"} onChange={(event) => updateInternStatus(user.id, event.target.value)} disabled={actionId === user.id} style={TABLE_FIELD_STYLE}>
                                    <option value="active">active</option>
                                    <option value="inactive">inactive</option>
                                    <option value="completed">completed</option>
                                    <option value="archived">archived</option>
                                  </select>
                                </div>
                                <div style={TABLE_CELL_STYLE}>
                                  <div style={INTERN_ACTION_CONTAINER_STYLE}>
                                    <button type="button" title="Save" onClick={() => saveInternProfile(user)} disabled={actionId === user.id}
                                      style={{ ...btnStyle("small"), background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#10b981" }}>
                                      <Save size={12} /> {actionId === user.id ? "..." : "Save"}
                                    </button>
                                    <button type="button" title="View" onClick={() => openInternProfile(user)} style={btnStyle("small")}>
                                      <Eye size={12} /> View
                                    </button>
                                    <button type="button" title="Password" onClick={() => handleViewPassword(user)}
                                      style={{ ...btnStyle("small"), border: "1px solid rgba(167,139,250,0.4)", background: "rgba(167,139,250,0.15)", color: "#a78bfa" }}>
                                      <Eye size={12} /> Password
                                    </button>
                                    <button type="button" title="Delete" onClick={() => deleteUser(user)} disabled={actionId === user.id} style={btnStyle("small-danger")}>
                                      <Trash2 size={12} /> {actionId === user.id ? "..." : "Delete"}
                                    </button>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        ))}
                        {!roleFilteredUsers.length && <div style={{ padding: 16, color: COLORS.muted }}>No users found.</div>}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ARCHIVED INTERNS TAB */}
              {activeTab === "archived" && (
                <div style={{ display: "grid", gap: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>Archived Interns ({archivedInterns.length})</div>
                    <div style={{ color: COLORS.muted, fontSize: 13 }}>Full profiles, projects and logs preserved for reference.</div>
                  </div>
                  {archivedInterns.length === 0 ? (
                    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 60, textAlign: "center" }}>
                      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><Archive size={48} color={COLORS.muted} /></div>
                      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>No Archived Interns</div>
                      <div style={{ color: COLORS.muted, fontSize: 14 }}>Set an intern's status to "archived" in the Interns tab and they will appear here.</div>
                    </div>
                  ) : (
                    archivedInterns.map((intern) => {
                      const progress = progressByInternId.get(intern.id) || null;
                      const pd = intern.profileData || {};
                      const isExpanded = archivedInternDetail?.id === intern.id;
                      return (
                        <div key={intern.id} style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 16, overflow: "hidden" }}>
                          {/* Header */}
                          <div style={{ background: "rgba(239,68,68,0.07)", borderBottom: `1px solid ${COLORS.border}`, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                              <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(239,68,68,0.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 700, color: "#ef4444", flexShrink: 0 }}>
                                {(intern.fullName || "?")[0]?.toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, fontSize: 16 }}>{intern.fullName || "-"}</div>
                                <div style={{ color: COLORS.muted, fontSize: 13 }}>{intern.email}</div>
                              </div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <span style={{ padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: "rgba(239,68,68,0.15)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.3)", textTransform: "uppercase" }}>Archived</span>
                              <button type="button" onClick={() => setArchivedInternDetail(isExpanded ? null : intern)} style={btnStyle("secondary")}>
                                <Eye size={14} /> {isExpanded ? "Hide Details" : "View Full Profile"}
                              </button>
                            </div>
                          </div>
                          {/* Quick info */}
                          <div style={{ padding: "14px 20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
                            {[
                              ["Intern ID", intern.internId || "—"],
                              ["Department", pd.department || progress?.department || "—"],
                              ["College", pd.collegeName || pd.college || "—"],
                              ["Start Date", pd.startDate || progress?.startDate || "—"],
                              ["End Date", pd.endDate || progress?.endDate || "—"],
                              ["Mentor", pd.mentorName || progress?.mentor || "—"],
                            ].map(([label, val]) => (
                              <div key={label}>
                                <div style={{ color: COLORS.muted, fontSize: 11, marginBottom: 2 }}>{label}</div>
                                <div style={{ fontSize: 13, fontWeight: 500 }}>{val}</div>
                              </div>
                            ))}
                          </div>
                          {/* Progress stats */}
                          {progress && (
                            <div style={{ padding: "0 20px 14px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 8 }}>
                              {[["Progress", `${progress.progressPercent || 0}%`], ["Approved Logs", progress.approvedWork?.logs || 0], ["Total Hours", `${progress.approvedWork?.hours || 0}h`], ["Reports", `${progress.approvedWork?.reports || 0}/${progress.reports?.total || 0}`]].map(([label, val]) => (
                                <div key={label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "10px 12px", border: `1px solid ${COLORS.border}` }}>
                                  <div style={{ color: COLORS.muted, fontSize: 11 }}>{label}</div>
                                  <div style={{ fontSize: 15, fontWeight: 700 }}>{val}</div>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Expanded full profile */}
                          {isExpanded && (
                            <div style={{ borderTop: `1px solid ${COLORS.border}`, padding: 20, display: "grid", gap: 20 }}>
                              <div style={{ fontWeight: 700, fontSize: 15 }}>Full Profile Details</div>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10 }}>
                                {[
                                  ["Phone", pd.phone || "—"], ["Date of Birth", pd.dob || pd.dateOfBirth || "—"],
                                  ["Blood Group", pd.bloodGroup || "—"], ["Address", pd.address || "—"],
                                  ["City", pd.city || "—"], ["State", pd.state || "—"],
                                  ["Pincode", pd.pincode || "—"], ["Emergency Contact", pd.emergencyContactName || "—"],
                                  ["Emergency Phone", pd.emergencyContactPhone || "—"], ["Guide Name", pd.guideName || "—"],
                                  ["Guide Email", pd.guideEmail || "—"], ["LinkedIn", pd.linkedIn || pd.linkedin || "—"],
                                  ["GitHub", pd.github || "—"], ["Skills", Array.isArray(pd.skills) ? pd.skills.join(", ") : (pd.skills || "—")],
                                  ["Bio", pd.bio || "—"], ["Stipend", pd.stipend || progress?.stipend || "—"],
                                  ["Joined Platform", formatDate(intern.createdAt)],
                                ].map(([label, val]) => (
                                  <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: "10px 12px" }}>
                                    <div style={{ color: COLORS.muted, fontSize: 11, marginBottom: 4 }}>{label}</div>
                                    <div style={{ fontSize: 13, wordBreak: "break-word" }}>{val}</div>
                                  </div>
                                ))}
                              </div>
                              {/* Attendance */}
                              <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 12 }}>
                                <AttendancePanel internId={intern.id} variant="admin" canEdit={false} title="Attendance Record" />
                              </div>
                              {/* Projects + Logs — same panel used in profile modal */}
                              <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 14 }}>
                                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>Projects & Logs</div>
                                <InternDetailPanel internId={intern.id} />
                              </div>
                              {/* Actions */}
                              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                                <button type="button" onClick={async () => { await updateInternStatus(intern.id, "active"); setArchivedInternDetail(null); }} style={{ ...btnStyle("primary"), fontSize: 13 }}>
                                  Restore to Active
                                </button>
                                <button type="button" onClick={() => deleteUser(intern)} style={btnStyle("danger")}>
                                  <Trash2 size={14} /> Permanently Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeTab === "departments" && (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                    {departmentGroups.map((group) => (
                      <div key={group.department} style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 14, display: "grid", gap: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <div style={{ fontWeight: 700 }}>{group.department}</div>
                          <div style={{ color: COLORS.muted, fontSize: 12 }}>Interns: {group.interns.length} | PMs: {group.pms.length}</div>
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.muted }}>Interns</div>
                        <div style={{ display: "grid", gap: 4 }}>
                          {(group.interns || []).map((intern) => (
                            <div key={intern.id} style={{ fontSize: 13, display: "flex", justifyContent: "space-between", gap: 8 }}>
                              <span>{intern.fullName || intern.email} ({intern.internId || "-"})</span>
                              <button type="button" onClick={() => openInternProfile(intern)} style={btnStyle("secondary")}><Eye size={13} /> Profile</button>
                            </div>
                          ))}
                          {!group.interns.length && <div style={{ fontSize: 12, color: COLORS.muted }}>No interns</div>}
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>PMs</div>
                        <div style={{ display: "grid", gap: 4 }}>
                          {(group.pms || []).map((pm) => (
                            <div key={pm.id} style={{ fontSize: 13 }}>{pm.fullName || pm.email} ({pm.pmCode || "-"})</div>
                          ))}
                          {!group.pms.length && <div style={{ fontSize: 12, color: COLORS.muted }}>No PMs</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                  {!departmentGroups.length && <div style={{ padding: 16, color: COLORS.muted, background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14 }}>No department data available.</div>}
                </div>
              )}

              {activeTab === "progress" && (
                <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, overflow: "hidden" }}>
                  <div style={{ padding: "12px 14px", fontWeight: 700 }}>Intern Progress ({internProgress.length})</div>
                  <div style={TABLE_WRAPPER_STYLE}>
                    <div style={TABLE_INNER_STYLE}>
                      <TableHeader columns="1.5fr 1fr 1fr 1fr 1fr 1fr 1fr" labels={["Intern", "Intern ID", "Department", "Approved Logs", "Approved Hours", "Approved Reports", "Progress"]} />
                      <div style={{ display: "grid" }}>
                        {internProgress.map((intern) => (
                          <div key={intern.id} style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 1fr 1fr", padding: "10px 12px", borderTop: `1px solid ${COLORS.border}`, fontSize: 13, alignItems: "center", gap: 8 }}>
                            <div style={{ overflow: "hidden", minWidth: 0 }}>
                              <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{intern.fullName || "-"}</div>
                              <div style={{ color: COLORS.muted, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{intern.email}</div>
                            </div>
                            <div>{intern.internId || "-"}</div>
                            <div>{intern.department || "-"}</div>
                            <div>{intern.approvedWork?.logs || 0}</div>
                            <div>{intern.approvedWork?.hours || 0}h</div>
                            <div>{intern.approvedWork?.reports || 0}/{intern.reports?.total || 0}</div>
                            <div>
                              <div style={{ fontWeight: 700 }}>{intern.progressPercent || 0}%</div>
                              <div style={{ marginTop: 4, height: 6, borderRadius: 999, background: "rgba(255,255,255,0.1)", overflow: "hidden" }}>
                                <div style={{ width: `${Math.max(0, Math.min(100, intern.progressPercent || 0))}%`, height: "100%", background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.accent2})` }} />
                              </div>
                            </div>
                          </div>
                        ))}
                        {!internProgress.length && <div style={{ padding: 16, color: COLORS.muted }}>No intern progress data available.</div>}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <>
            {/* INTERN PROFILE MODAL — now with tabs */}
            {selectedIntern && profileDraft && (
              <div onClick={closeInternProfile} style={{ position: "fixed", inset: 0, background: "rgba(2, 6, 23, 0.72)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", zIndex: 1200, padding: 20 }}>
                <div onClick={(event) => event.stopPropagation()} style={{ width: "100%", maxWidth: 960, maxHeight: "92vh", overflow: "auto", background: "#0b1a24", border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 20, display: "grid", gap: 16 }}>

                  {/* Modal header */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800 }}>Intern Profile</div>
                      <div style={{ color: COLORS.muted, fontSize: 13 }}>{selectedIntern.email}</div>
                    </div>
                    <button type="button" onClick={closeInternProfile} style={btnStyle("secondary")}><X size={14} /> Close</button>
                  </div>

                  {/* Modal tabs */}
                  <div style={{ display: "flex", gap: 8, borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 12 }}>
                    <button type="button" style={modalTabStyle("profile")} onClick={() => setProfileModalTab("profile")}>Profile</button>
                    <button type="button" style={modalTabStyle("projects")} onClick={() => setProfileModalTab("projects")}>
                      <FolderOpen size={14} style={{ marginRight: 4 }} />Projects & Logs
                    </button>
                    <button type="button" style={modalTabStyle("attendance")} onClick={() => setProfileModalTab("attendance")}>Attendance</button>
                  </div>

                  {/* Tab: Profile */}
                  {profileModalTab === "profile" && (
                    <>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                        <input placeholder="Full name" value={profileDraft.fullName} onChange={(event) => setProfileDraft((prev) => ({ ...prev, fullName: event.target.value }))} style={inputStyle} />
                        <input placeholder="Intern ID" value={profileDraft.internId} onChange={(event) => setProfileDraft((prev) => ({ ...prev, internId: event.target.value }))} style={inputStyle} />
                        <select value={profileDraft.department} onChange={(event) => setProfileDraft((prev) => ({ ...prev, department: event.target.value }))} style={inputStyle}>
                          <option value="">Unassigned</option>
                          {DEPARTMENT_OPTIONS.map((department) => <option key={department} value={department}>{department}</option>)}
                        </select>
                        <select value={profileDraft.pmId} onChange={(event) => setProfileDraft((prev) => ({ ...prev, pmId: event.target.value }))} style={inputStyle}>
                          <option value="">Unassigned PM</option>
                          {pmUsers.map((pm) => <option key={pm.id} value={pm.id}>{pm.fullName || pm.email} {pm.pmCode ? `(${pm.pmCode})` : ""}</option>)}
                        </select>
                        <select value={profileDraft.status} onChange={(event) => setProfileDraft((prev) => ({ ...prev, status: event.target.value }))} style={inputStyle}>
                          <option value="active">active</option>
                          <option value="inactive">inactive</option>
                          <option value="completed">completed</option>
                          <option value="archived">archived</option>
                        </select>
                        <input type="date" value={profileDraft.startDate} min={minDate} onChange={(event) => setProfileDraft((prev) => { const nextStartDate = event.target.value; const nextEndDate = prev.endDate && nextStartDate && prev.endDate < nextStartDate ? nextStartDate : prev.endDate; return { ...prev, startDate: nextStartDate, endDate: nextEndDate }; })} style={inputStyle} />
                        <input type="date" value={profileDraft.endDate} min={profileDraft.startDate || minDate} onChange={(event) => setProfileDraft((prev) => ({ ...prev, endDate: event.target.value }))} style={inputStyle} />
                        <input placeholder="Mentor" value={profileDraft.mentorName} onChange={(event) => setProfileDraft((prev) => ({ ...prev, mentorName: event.target.value }))} style={inputStyle} />
                        <input placeholder="Stipend" value={profileDraft.stipend} onChange={(event) => setProfileDraft((prev) => ({ ...prev, stipend: event.target.value }))} style={inputStyle} />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                        <StatCard label="Approved Logs" value={selectedInternProgress?.approvedWork?.logs ?? 0} />
                        <StatCard label="Approved Hours" value={`${selectedInternProgress?.approvedWork?.hours ?? 0}h`} />
                        <StatCard label="Approved Reports" value={selectedInternProgress?.approvedWork?.reports ?? 0} />
                        <StatCard label="Progress" value={`${selectedInternProgress?.progressPercent ?? 0}%`} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <button type="button" onClick={closeInternProfile} style={btnStyle("secondary")}>Cancel</button>
                        <button type="button" onClick={saveInternProfileFromModal} disabled={profileSaving} style={btnStyle("primary")}><Save size={14} /> {profileSaving ? "Saving..." : "Save Profile"}</button>
                      </div>
                    </>
                  )}

                  {/* Tab: Projects & Logs */}
                  {profileModalTab === "projects" && (
                    <InternDetailPanel internId={selectedIntern.id} />
                  )}

                  {/* Tab: Attendance */}
                  {profileModalTab === "attendance" && (
                    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 12 }}>
                      <AttendancePanel internId={selectedIntern.id} variant="admin" canEdit title="Attendance" />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* PASSWORD MODAL */}
            {passwordModal && (
              <div onClick={() => setPasswordModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(2,6,23,0.8)", backdropFilter: "blur(4px)", display: "grid", placeItems: "center", zIndex: 1300, padding: 20 }}>
                <div
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: "100%",
                    maxWidth: 440,
                    maxHeight: "85vh",
                    overflowY: "auto",
                    overscrollBehavior: "contain",
                    background: "#0b1a24",
                    border: `1px solid ${COLORS.borderGlass}`,
                    borderRadius: 16,
                    padding: 24,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 700 }}>Account Password</div>
                    <button type="button" onClick={() => setPasswordModal(null)} style={btnStyle("secondary")}><X size={14} /></button>
                  </div>
                  <div style={{ color: COLORS.textMuted, fontSize: 13 }}>
                    {passwordModal.user?.fullName || passwordModal.user?.email}
                    <span style={{ marginLeft: 8, padding: "2px 8px", borderRadius: 6, background: "rgba(20,184,166,0.15)", color: "#14b8a6", fontSize: 11 }}>{passwordModal.user?.role?.toUpperCase()}</span>
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.borderGlass}`, borderRadius: 10, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                    <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>Current Password</div>
                    {passwordModal.loading ? (
                      <div style={{ color: "#14b8a6", fontSize: 15, fontWeight: 700 }}>Loading...</div>
                    ) : passwordModal.password && passwordModal.password !== "Not saved" ? (
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ color: "#14b8a6", fontSize: 15, fontWeight: 700, letterSpacing: 2 }}>{passwordModal.password}</div>
                        <button
                          type="button"
                          onClick={() => {
                            const text = passwordModal.password;
                            if (navigator.clipboard && navigator.clipboard.writeText) {
                              navigator.clipboard.writeText(text)
                                .then(() => {
                                  setInfo("Password copied!");
                                  setTimeout(() => setInfo(""), 2000);
                                })
                                .catch(() => {
                                  // fallback
                                  const el = document.createElement("textarea");
                                  el.value = text;
                                  document.body.appendChild(el);
                                  el.select();
                                  document.execCommand("copy");
                                  document.body.removeChild(el);
                                  setInfo("Password copied!");
                                  setTimeout(() => setInfo(""), 2000);
                                });
                            } else {
                              const el = document.createElement("textarea");
                              el.value = text;
                              document.body.appendChild(el);
                              el.select();
                              document.execCommand("copy");
                              document.body.removeChild(el);
                              setInfo("Password copied!");
                              setTimeout(() => setInfo(""), 2000);
                            }
                          }}
                          style={{
                            ...btnStyle("secondary"),
                            padding: "4px 8px",
                            fontSize: 11,
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 13 }}>Password not on record — this account was created before password tracking was enabled.</div>
                        <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>Use "Reset Password" below to set a new password and save it.</div>
                      </div>
                    )}
                  </div>
                  <div style={{ borderTop: `1px solid ${COLORS.borderGlass}`, paddingTop: 16 }}>
                    <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 8 }}>Reset Password</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <input
                          type="text"
                          placeholder="New password (min 6 chars)"
                          value={passwordModal.newPassword || ""}
                          onChange={(e) => setPasswordModal((prev) => ({
                            ...prev,
                            newPassword: e.target.value,
                          }))}
                          style={{ ...inputStyle, flex: 1 }}
                        />
                        <button
                          type="button"
                          title="Auto-generate a secure password"
                          onClick={() => setPasswordModal((prev) => ({
                            ...prev,
                            newPassword: randomPassword(),
                          }))}
                          style={{
                            border: "1px solid rgba(20,184,166,0.4)",
                            background: "rgba(20,184,166,0.12)",
                            color: "#14b8a6",
                            padding: "9px 12px",
                            borderRadius: 10,
                            fontWeight: 600,
                            fontSize: 12,
                            cursor: "pointer",
                            display: "inline-flex",
                            gap: 4,
                            alignItems: "center",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                          }}
                        >
                          ⚡ Auto
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!passwordModal.newPassword || passwordModal.newPassword.length < 6) {
                              alert("Password must be at least 6 characters");
                              return;
                            }
                            try {
                              await adminApi.resetUserPassword(
                                passwordModal.user.id,
                                passwordModal.newPassword
                              );
                              setPasswordModal((prev) => ({
                                ...prev,
                                password: prev.newPassword,
                                newPassword: "",
                              }));
                              setInfo("Password updated successfully!");
                              setTimeout(() => setInfo(""), 3000);
                            } catch (err) {
                              setError(err?.message || "Failed to reset password");
                              setTimeout(() => setError(""), 4000);
                            }
                          }}
                          style={btnStyle("primary")}
                        >
                          Save
                        </button>
                      </div>
                      <div style={{
                        fontSize: 11,
                        color: "rgba(248,250,252,0.4)",
                        paddingLeft: 2,
                      }}>
                        Click ⚡ Auto to generate a secure password, or type one manually.
                      </div>
                    </div>
                  </div>
                  <div style={{
                    borderTop: `1px solid ${COLORS.borderGlass}`,
                    paddingTop: 16,
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}>
                    <div style={{
                      fontSize: 13,
                      color: COLORS.textMuted,
                      marginBottom: 4,
                    }}>
                      Send Credentials by Email
                    </div>
                    <button
                      type="button"
                      disabled={
                        sendingCredentials === passwordModal.user?.id ||
                        !passwordModal.password ||
                        passwordModal.password === "Not saved"
                      }
                      onClick={() => {
                        handleSendCredentials(passwordModal.user);
                      }}
                      style={{
                        ...btnStyle("primary"),
                        width: "100%",
                        justifyContent: "center",
                        opacity: (
                          !passwordModal.password ||
                          passwordModal.password === "Not saved"
                        ) ? 0.5 : 1,
                      }}
                    >
                      <Mail size={14} />
                      {sendingCredentials === passwordModal.user?.id
                        ? "Sending..."
                        : "Send Login Credentials to " +
                          (passwordModal.user?.email || "user")}
                    </button>
                    {(!passwordModal.password ||
                      passwordModal.password === "Not saved") && (
                      <div style={{
                        fontSize: 11,
                        color: "rgba(248,250,252,0.4)",
                      }}>
                        Save a password first before sending credentials.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        </main>

        {isMobile && sidebarOpen && (
          <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 999, backdropFilter: "blur(4px)" }} />
        )}

        <AccountModal open={showAccountModal} onClose={() => setShowAccountModal(false)} />
      </div>
    </>
  );
}

function btnStyle(type) {
  if (type === "primary") return { border: "none", background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`, color: "white", padding: "10px 14px", borderRadius: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center" };
  if (type === "small") return { border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.text, padding: "4px 8px", borderRadius: 6, fontWeight: 600, fontSize: 11, cursor: "pointer", display: "inline-flex", gap: 4, alignItems: "center", whiteSpace: "nowrap" };
  if (type === "small-danger") return { border: "1px solid rgba(239,68,68,0.5)", background: "rgba(239,68,68,0.15)", color: "#fecaca", padding: "4px 8px", borderRadius: 6, fontWeight: 600, fontSize: 11, cursor: "pointer", display: "inline-flex", gap: 4, alignItems: "center", whiteSpace: "nowrap" };
  if (type === "danger") return { border: "1px solid rgba(239,68,68,0.5)", background: "rgba(239,68,68,0.15)", color: "#fecaca", padding: "8px 10px", borderRadius: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center" };
  return { border: `1px solid ${COLORS.border}`, background: "transparent", color: COLORS.text, padding: "9px 12px", borderRadius: 10, fontWeight: 700, cursor: "pointer", display: "inline-flex", gap: 6, alignItems: "center" };
}

const inputStyle = { width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: "9px 10px", color: COLORS.text, boxSizing: "border-box" };
