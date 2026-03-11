import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, LogOut, Trash2, Plus, Users, UserCheck, BarChart3, Activity, Save, Eye, X, Sparkles, Menu } from "lucide-react";
import { adminApi, authApi } from "../../lib/apiClient";

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
  // Map old colors to new ones for compatibility
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

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "hr", label: "HR", icon: Users },
  { id: "pm", label: "PM", icon: UserCheck },
  { id: "intern", label: "Interns", icon: Activity },
  { id: "departments", label: "Departments", icon: Users },
  { id: "progress", label: "Progress", icon: Activity },
];

const DEPARTMENT_OPTIONS = ["SAP", "Oracle", "Accounts", "HR"];
const DEPARTMENT_SECTIONS = ["SAP", "Oracle", "Accounts", "HR"];
const OTHER_DEPARTMENT_LABEL = "Unassigned";

function resolveDepartmentValue(selected) {
  return String(selected || "").trim();
}

function normalizeDepartmentForSection(value) {
  const raw = String(value || "").trim();
  if (!raw) return OTHER_DEPARTMENT_LABEL;
  const known = DEPARTMENT_SECTIONS.find((item) => item.toLowerCase() === raw.toLowerCase());
  return known || OTHER_DEPARTMENT_LABEL;
}

function randomPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$!";
  let output = "";
  for (let i = 0; i < 10; i += 1) output += chars.charAt(Math.floor(Math.random() * chars.length));
  return output;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
}

function StatCard({ label, value }) {
  return (
    <div
      style={{
        background: COLORS.panel,
        border: `1px solid ${COLORS.border}`,
        borderRadius: 14,
        padding: 16,
      }}
    >
      <div style={{ color: COLORS.muted, fontSize: 12 }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function TableHeader({ columns, labels }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: columns,
        padding: "10px 12px",
        borderBottom: `1px solid ${COLORS.border}`,
        color: COLORS.muted,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {(labels || []).map((label) => (
        <div key={label}>{label}</div>
      ))}
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
    role: "hr",
    fullName: "",
    email: "",
    password: "",
    pmCode: "",
    pmId: "",
    internId: "",
    startDate: "",
    endDate: "",
    department: "",
    mentor: "",
    stipend: "",
  });
  const [internEdits, setInternEdits] = useState({});
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [profileDraft, setProfileDraft] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [loadingGeneratedId, setLoadingGeneratedId] = useState(false);

  const minDate = new Date().toISOString().slice(0, 10);

  const pmUsers = useMemo(() => users.filter((user) => user.role === "pm"), [users]);

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
    if (activeTab === "intern") return filteredUsers.filter((user) => user.role === "intern");
    return filteredUsers;
  }, [activeTab, filteredUsers]);

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

    users
      .filter((user) => user.role === "intern" || user.role === "pm")
      .forEach((user) => {
        const fromProfile = String(user?.profileData?.department || "").trim();
        const fromProgress = user.role === "intern" ? String(internDepartmentById.get(user.id) || "").trim() : "";
        const resolvedDepartment = fromProfile || fromProgress || "Unassigned";
        if (normalizedSearch) {
          const searchable = [
            String(user.fullName || ""),
            String(user.email || ""),
            String(user.internId || ""),
            String(user.pmCode || ""),
            String(resolvedDepartment || ""),
          ]
            .join(" ")
            .toLowerCase();
          if (!searchable.includes(normalizedSearch)) return;
        }
        addToGroup(user, user.role, resolvedDepartment);
      });

    return Array.from(groups.values());
  }, [users, internDepartmentById, search]);

  async function loadGeneratedIdForRole(role) {
    const normalizedRole = String(role || "").trim().toLowerCase();
    if (!["intern", "pm"].includes(normalizedRole)) return "";
    try {
      setLoadingGeneratedId(true);
      if (normalizedRole === "intern") {
        const res = await adminApi.nextInternId();
        const nextInternId = String(res?.internId || "").trim();
        if (nextInternId) {
          setForm((prev) => ({ ...prev, internId: nextInternId }));
        }
        return nextInternId;
      }
      const res = await adminApi.nextPmCode();
      const nextPmCode = String(res?.pmCode || "").trim();
      if (nextPmCode) {
        setForm((prev) => ({ ...prev, pmCode: nextPmCode }));
      }
      return nextPmCode;
    } catch {
      // ignore and keep existing value
      return "";
    } finally {
      setLoadingGeneratedId(false);
    }
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
    users
      .filter((user) => user.role === "intern")
      .forEach((user) => {
        const fromProfile = String(user?.profileData?.department || "").trim();
        const fromProgress = String(internDepartmentById.get(user.id) || "").trim();
        nextEdits[user.id] = {
          internId: user.internId || "",
          department: fromProfile || fromProgress || "",
          pmId: user.pmId || "",
        };
      });
    setInternEdits(nextEdits);
  }, [users, internDepartmentById]);

  useEffect(() => {
    loadGeneratedIdForRole(form.role);
  }, [form.role]);

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
        if (meRes?.profile?.role !== "admin") {
          navigate("/admin/login");
          return;
        }
        const me = {
          role: meRes.profile.role,
          fullName: meRes.profile.full_name || "Admin",
          email: meRes.profile.email || "",
        };
        setCurrentUser(me);
        localStorage.setItem("currentUser", JSON.stringify(me));
        await loadAll();
      } catch (err) {
        if (!isMounted) return;
        localStorage.removeItem("currentUser");
        setError(err?.message || "Failed to load admin dashboard.");
        navigate("/admin/login");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  async function refreshData() {
    try {
      setLoading(true);
      setError("");
      await loadAll();
    } catch (err) {
      if (isAuthOrRoleError(err)) {
        redirectToAdminLogin(err);
        return;
      }
      setError(err?.message || "Failed to refresh data.");
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem("currentUser");
    navigate("/admin/login");
  }

  async function createUser(event) {
    event.preventDefault();
    if (!form.fullName.trim() || !form.email.trim()) {
      setError("Full name and email are required.");
      return;
    }
    const role = form.role;
    const password = form.password.trim() || randomPassword();
    const resolvedDepartment = resolveDepartmentValue(form.department);
    const payload = {
      role,
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      password,
    };

    if (role === "pm") {
      let nextPmCode = String(form.pmCode || "").trim();
      if (!nextPmCode) {
        nextPmCode = String(await loadGeneratedIdForRole("pm")).trim();
      }
      if (!nextPmCode) {
        setError("PM code is required.");
        return;
      }
      payload.pmCode = nextPmCode;
      if (resolvedDepartment) {
        payload.profileData = { department: resolvedDepartment };
      }
    }
    if (role === "intern") {
      let nextInternId = String(form.internId || "").trim();
      if (!nextInternId) {
        nextInternId = String(await loadGeneratedIdForRole("intern")).trim();
      }
      if (!nextInternId) {
        setError("Intern ID is required.");
        return;
      }
      if (form.startDate && form.startDate < minDate) {
        setError("Start date cannot be in the past.");
        return;
      }
      if (form.endDate && form.endDate < minDate) {
        setError("End date cannot be in the past.");
        return;
      }
      if (form.startDate && form.endDate && form.endDate < form.startDate) {
        setError("End date must be on or after start date.");
        return;
      }
      if (form.pmId) payload.pmId = form.pmId;
      payload.internId = nextInternId;
      payload.profileData = {
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        department: resolvedDepartment || null,
        mentorName: form.mentor || null,
        stipend: form.stipend || null,
      };
    }

    try {
      setSaving(true);
      setError("");
      setInfo("");
      await adminApi.createUser(payload);
      setForm({
        role,
        fullName: "",
        email: "",
        password: "",
        pmCode: "",
        pmId: "",
        internId: "",
        startDate: "",
        endDate: "",
        department: "",
        mentor: "",
        stipend: "",
      });
      await loadGeneratedIdForRole(role);
      setInfo(`Created ${role.toUpperCase()} account for ${payload.email}. Password: ${password}`);
      await loadAll();
    } catch (err) {
      if (isAuthOrRoleError(err)) {
        redirectToAdminLogin(err);
        return;
      }
      setError(err?.message || "Failed to create user.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteUser(user) {
    if (!user?.id) return;
    if (!window.confirm(`Delete ${user.fullName || user.email}? This action cannot be undone.`)) return;

    try {
      setActionId(user.id);
      setError("");
      await adminApi.deleteUser(user.id);
      await loadAll();
    } catch (err) {
      if (isAuthOrRoleError(err)) {
        redirectToAdminLogin(err);
        return;
      }
      setError(err?.message || "Failed to delete user.");
    } finally {
      setActionId("");
    }
  }

  async function updateInternStatus(internId, status) {
    try {
      setActionId(internId);
      setError("");
      await adminApi.setInternStatus(internId, status);
      await loadAll();
    } catch (err) {
      if (isAuthOrRoleError(err)) {
        redirectToAdminLogin(err);
        return;
      }
      setError(err?.message || "Failed to update intern status.");
    } finally {
      setActionId("");
    }
  }

  async function saveInternProfile(user) {
    const draft = internEdits[user.id] || { internId: user.internId || "", department: "", pmId: user.pmId || "" };
    const nextInternId = String(draft.internId || "").trim();
    const nextDepartment = String(draft.department || "").trim();
    const nextPmId = String(draft.pmId || "").trim();
    if (!nextInternId) {
      setError("Intern ID cannot be empty.");
      return;
    }

    try {
      setActionId(user.id);
      setError("");
      setInfo("");
      await adminApi.updateUser(user.id, {
        internId: nextInternId,
        department: nextDepartment || null,
        pmId: nextPmId || null,
      });
      await loadAll();
      setInfo(`Updated intern profile for ${user.fullName || user.email}.`);
    } catch (err) {
      if (isAuthOrRoleError(err)) {
        redirectToAdminLogin(err);
        return;
      }
      setError(err?.message || "Failed to update intern profile.");
    } finally {
      setActionId("");
    }
  }

  function openInternProfile(user) {
    const progress = progressByInternId.get(user.id) || null;
    const currentDepartment = String(user?.profileData?.department || progress?.department || "").trim();
    const knownDepartment = DEPARTMENT_OPTIONS.find((item) => item.toLowerCase() === currentDepartment.toLowerCase()) || "";

    setSelectedIntern(user);
    setProfileDraft({
      fullName: user.fullName || "",
      internId: user.internId || "",
      department: knownDepartment || "",
      pmId: user.pmId || "",
      startDate: progress?.startDate || user?.profileData?.startDate || "",
      endDate: progress?.endDate || user?.profileData?.endDate || "",
      mentorName: progress?.mentor || user?.profileData?.mentorName || user?.profileData?.mentor || "",
      stipend: progress?.stipend || user?.profileData?.stipend || "",
      status: user.status || "active",
    });
  }

  function closeInternProfile() {
    if (profileSaving) return;
    setSelectedIntern(null);
    setProfileDraft(null);
  }

  async function saveInternProfileFromModal() {
    if (!selectedIntern?.id || !profileDraft) return;
    const resolvedDepartment = resolveDepartmentValue(profileDraft.department);
    const nextStartDate = String(profileDraft.startDate || "").trim();
    const nextEndDate = String(profileDraft.endDate || "").trim();

    if (!String(profileDraft.internId || "").trim()) {
      setError("Intern ID cannot be empty.");
      return;
    }
    if (!nextStartDate || !nextEndDate) {
      setError("Start date and end date are required.");
      return;
    }
    if (nextStartDate < minDate || nextEndDate < minDate) {
      setError("Past dates are not allowed.");
      return;
    }
    if (nextEndDate < nextStartDate) {
      setError("End date must be on or after start date.");
      return;
    }

    try {
      setProfileSaving(true);
      setError("");
      setInfo("");
      await adminApi.updateUser(selectedIntern.id, {
        fullName: String(profileDraft.fullName || "").trim(),
        internId: String(profileDraft.internId || "").trim(),
        department: resolvedDepartment || null,
        pmId: String(profileDraft.pmId || "").trim() || null,
        startDate: nextStartDate,
        endDate: nextEndDate,
        mentorName: String(profileDraft.mentorName || "").trim() || null,
        stipend: String(profileDraft.stipend || "").trim() || null,
        status: String(profileDraft.status || "").trim().toLowerCase(),
      });
      await loadAll();
      setInfo(`Updated profile for ${selectedIntern.fullName || selectedIntern.email}.`);
      closeInternProfile();
    } catch (err) {
      if (isAuthOrRoleError(err)) {
        redirectToAdminLogin(err);
        return;
      }
      setError(err?.message || "Failed to save intern profile.");
    } finally {
      setProfileSaving(false);
    }
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

  return (
    <>
      <style>{`
        @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
        .stagger-1 { animation-delay: 0.05s; opacity: 0; }
        .stagger-2 { animation-delay: 0.1s; opacity: 0; }
        .stagger-3 { animation-delay: 0.15s; opacity: 0; }
        .stagger-4 { animation-delay: 0.2s; opacity: 0; }
        .stagger-5 { animation-delay: 0.25s; opacity: 0; }
        .stagger-6 { animation-delay: 0.3s; opacity: 0; }
      `}</style>
      <div style={{ display: "flex", minHeight: "100vh", background: GRADIENTS.primary, fontFamily: "'Inter', system-ui, sans-serif", color: COLORS.textPrimary }}>

        {/* SIDEBAR */}
        <aside
          style={{
            width: sidebarOpen ? 280 : 0,
            height: "100vh",
            background: COLORS.surfaceGlass,
            backdropFilter: "blur(20px)",
            borderRight: `1px solid ${COLORS.borderGlass}`,
            transition: "width 0.3s ease",
            overflow: "hidden",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: isMobile ? 1000 : 100,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto", overflowX: "hidden" }}>
            {/* Logo */}
            <div style={{ padding: 24, borderBottom: `1px solid ${COLORS.borderGlass}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, background: GRADIENTS.accent,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Sparkles size={20} color="white" />
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary }}>AdminHub</span>
                </div>
                {isMobile && (
                  <button
                    onClick={() => setSidebarOpen(false)}
                    style={{
                      width: 40, height: 40, borderRadius: 10,
                      border: `1px solid ${COLORS.borderGlass}`,
                      background: "transparent", color: COLORS.textSecondary,
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
            </div>

            {/* Profile Section */}
            <div style={{ padding: 20 }}>
              <div style={{
                background: COLORS.surfaceGlass, borderRadius: 16, padding: 16,
                border: `1px solid ${COLORS.borderGlass}`,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%", background: GRADIENTS.accent,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 700, color: "white",
                  }}>
                    {currentUser?.fullName?.[0]?.toUpperCase() || "A"}
                  </div>
                  <div style={{ minWidth: 0, overflow: "hidden" }}>
                    <div style={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: 14, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                      {currentUser?.fullName || "Admin"}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted, whiteSpace: "nowrap", textOverflow: "ellipsis", overflow: "hidden" }}>
                      System Admin
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav style={{ flex: 1, padding: "0 12px", overflowY: "auto", overflowX: "hidden" }}>
              {TABS.map((tab, idx) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); if (isMobile) setSidebarOpen(false); }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "14px 16px",
                      marginBottom: 4,
                      borderRadius: 12,
                      border: "none",
                      cursor: "pointer",
                      background: isActive ? GRADIENTS.accent : "transparent",
                      color: isActive ? "white" : COLORS.textSecondary,
                      fontWeight: isActive ? 600 : 400,
                      fontSize: 14,
                      transition: "all 0.2s ease",
                      animation: "slideIn 0.4s ease-out forwards",
                      animationDelay: `${idx * 0.05}s`,
                    }}
                  >
                    <Icon size={20} />
                    <span style={{ flex: 1, textAlign: "left" }}>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Logout */}
            <div style={{ padding: 16, borderTop: `1px solid ${COLORS.borderGlass}` }}>
              <button
                onClick={logout}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.borderGlass}`,
                  background: "transparent",
                  color: COLORS.textSecondary,
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          marginLeft: isMobile ? 0 : (sidebarOpen ? 280 : 0),
          transition: "margin-left 0.3s ease",
          height: "100vh",
          overflow: "hidden",
        }}>
          {/* HEADER */}
          <header style={{
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            background: COLORS.surfaceGlass,
            backdropFilter: "blur(20px)",
            borderBottom: `1px solid ${COLORS.borderGlass}`,
            position: "sticky",
            top: 0,
            zIndex: 50,
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {(!sidebarOpen || isMobile) && (
                <button
                  onClick={() => setSidebarOpen(true)}
                  style={{
                    width: 40, height: 40, borderRadius: 10,
                    border: `1px solid ${COLORS.borderGlass}`,
                    background: "transparent", color: COLORS.textSecondary,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Menu size={22} />
                </button>
              )}
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>
                  {activeTabDetails?.label || "Admin Dashboard"}
                </h1>
                <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>
                  Manage users and platform settings
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={refreshData} style={btnStyle("secondary")} type="button">
                <RefreshCw size={16} /> Refresh
              </button>
            </div>
          </header>

          {/* PAGE CONTENT */}
          <div style={{
            flex: 1,
            padding: 24,
            overflowY: "auto",
            overflowX: "hidden",
            background: "transparent",
          }}>
            <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gap: 24 }}>

              <form
                onSubmit={createUser}
                style={{
                  background: COLORS.panel,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 16,
                  padding: 24,
                  display: "grid",
                  gap: 20,
                }}
              >
                <div style={{ fontSize: 18, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
                  <Plus size={20} /> Create New User
                </div>
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
                    <input
                      placeholder="e.g. John Doe"
                      value={form.fullName}
                      onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>Email Address</span>
                    <input
                      placeholder="john@example.com"
                      type="email"
                      value={form.email}
                      onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>Password (Optional)</span>
                    <input
                      placeholder="Leave blank for auto-generation"
                      value={form.password}
                      onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                      style={inputStyle}
                    />
                  </div>
                  {form.role === "pm" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>PM ID (e.g. pmCode)</span>
                      <input
                        placeholder="e.g. PM-001 (Editable)"
                        value={form.pmCode}
                        onChange={(event) => setForm((prev) => ({ ...prev, pmCode: event.target.value }))}
                        style={inputStyle}
                      />
                    </div>
                  )}
                  {(form.role === "pm" || form.role === "intern") && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>Department</span>
                      <select
                        value={form.department}
                        onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
                        style={inputStyle}
                      >
                        <option value="">Select Department</option>
                        {DEPARTMENT_OPTIONS.map((department) => (
                          <option key={department} value={department}>
                            {department}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {form.role === "intern" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>Assign PM (Optional)</span>
                      <select value={form.pmId} onChange={(event) => setForm((prev) => ({ ...prev, pmId: event.target.value }))} style={inputStyle}>
                        <option value="">Select a PM</option>
                        {pmUsers.map((pm) => (
                          <option key={pm.id} value={pm.id}>
                            {pm.fullName || pm.email} {pm.pmCode ? `(${pm.pmCode})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {form.role === "intern" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>Intern ID</span>
                      <input
                        placeholder="e.g. INT-001 (Editable)"
                        value={form.internId}
                        onChange={(event) => setForm((prev) => ({ ...prev, internId: event.target.value }))}
                        style={inputStyle}
                      />
                    </div>
                  )}
                  {form.role === "intern" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>Start Date</span>
                      <input
                        type="date"
                        value={form.startDate}
                        min={minDate}
                        onChange={(event) =>
                          setForm((prev) => {
                            const nextStartDate = event.target.value;
                            const nextEndDate =
                              prev.endDate && nextStartDate && prev.endDate < nextStartDate ? nextStartDate : prev.endDate;
                            return { ...prev, startDate: nextStartDate, endDate: nextEndDate };
                          })
                        }
                        style={inputStyle}
                      />
                    </div>
                  )}
                  {form.role === "intern" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>End Date</span>
                      <input
                        type="date"
                        value={form.endDate}
                        min={form.startDate || minDate}
                        onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                        style={inputStyle}
                      />
                    </div>
                  )}
                  {form.role === "intern" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>Mentor Name</span>
                      <input
                        placeholder="Assigned Mentor"
                        value={form.mentor}
                        onChange={(event) => setForm((prev) => ({ ...prev, mentor: event.target.value }))}
                        style={inputStyle}
                      />
                    </div>
                  )}
                  {form.role === "intern" && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <span style={{ fontSize: 13, color: COLORS.muted, fontWeight: 600 }}>Stipend</span>
                      <input
                        placeholder="e.g. 5000"
                        value={form.stipend}
                        onChange={(event) => setForm((prev) => ({ ...prev, stipend: event.target.value }))}
                        style={inputStyle}
                      />
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", paddingTop: 8, borderTop: `1px solid ${COLORS.border}` }}>
                  <div style={{ color: COLORS.muted, fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>If password is empty, a secure random password will be generated. IDs are auto-sequenced but can be edited manually.</span>
                    {loadingGeneratedId && <span style={{ color: COLORS.accent }}>(Generating next ID...)</span>}
                  </div>
                  <button type="submit" disabled={saving} style={btnStyle("primary")}>
                    <Plus size={16} /> {saving ? "Creating..." : "Create User"}
                  </button>
                </div>
              </form>

              {error && (
                <div
                  style={{
                    background: "rgba(239, 68, 68, 0.18)",
                    border: "1px solid rgba(239, 68, 68, 0.48)",
                    color: "#fecaca",
                    borderRadius: 12,
                    padding: "10px 12px",
                    fontSize: 13,
                  }}
                >
                  {error}
                </div>
              )}
              {info && (
                <div
                  style={{
                    background: "rgba(16, 185, 129, 0.15)",
                    border: "1px solid rgba(16, 185, 129, 0.45)",
                    color: "#a7f3d0",
                    borderRadius: 12,
                    padding: "10px 12px",
                    fontSize: 13,
                    wordBreak: "break-word",
                  }}
                >
                  {info}
                </div>
              )}


              {(activeTab === "hr" || activeTab === "pm" || activeTab === "intern" || activeTab === "departments") && (
                <input
                  placeholder="Search by name, email, code"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  style={inputStyle}
                />
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

                  <div
                    style={{
                      background: COLORS.panel,
                      border: `1px solid ${COLORS.border}`,
                      borderRadius: 14,
                      overflow: "hidden",
                    }}
                  >
                    <div style={{ padding: "12px 14px", fontWeight: 700 }}>Recent Users</div>
                    <TableHeader columns="2fr 1fr 1fr 1fr" labels={["User", "Role", "Status", "Created"]} />
                    <div style={{ display: "grid" }}>
                      {users.slice(0, 10).map((user) => (
                        <div
                          key={user.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "2fr 1fr 1fr 1fr",
                            padding: "10px 12px",
                            borderTop: `1px solid ${COLORS.border}`,
                            fontSize: 13,
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 600 }}>{user.fullName || "-"}</div>
                            <div style={{ color: COLORS.muted }}>{user.email}</div>
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

              {(activeTab === "hr" || activeTab === "pm" || activeTab === "intern") && (
                <div
                  style={{
                    background: COLORS.panel,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 14,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ padding: "12px 14px", fontWeight: 700 }}>
                    {activeTab.toUpperCase()} Users ({roleFilteredUsers.length})
                  </div>
                  <TableHeader
                    columns={activeTab === "intern" ? "2fr 1.1fr 1.2fr 1.2fr 1fr auto auto" : "2fr 1fr 1fr 1fr auto"}
                    labels={
                      activeTab === "intern"
                        ? ["User", "Intern ID", "Department", "Assigned PM", "Set Status", "Save", "Actions"]
                        : ["User", "Code/ID", "Status", "Assigned PM", "Actions"]
                    }
                  />
                  <div style={{ display: "grid" }}>
                    {roleFilteredUsers.map((user) => (
                      <div
                        key={user.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: activeTab === "intern" ? "2fr 1.1fr 1.2fr 1.2fr 1fr auto auto" : "2fr 1fr 1fr 1fr auto",
                          padding: "10px 12px",
                          borderTop: `1px solid ${COLORS.border}`,
                          fontSize: 13,
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div
                          onClick={() => {
                            if (activeTab === "intern") openInternProfile(user);
                          }}
                          style={{ cursor: activeTab === "intern" ? "pointer" : "default" }}
                        >
                          <div style={{ fontWeight: 600 }}>{user.fullName || "-"}</div>
                          <div style={{ color: COLORS.muted }}>{user.email}</div>
                        </div>
                        {activeTab === "intern" && (
                          <input
                            value={internEdits[user.id]?.internId ?? user.internId ?? ""}
                            onChange={(event) =>
                              setInternEdits((prev) => ({
                                ...prev,
                                [user.id]: {
                                  ...(prev[user.id] || {}),
                                  internId: event.target.value,
                                },
                              }))
                            }
                            disabled={actionId === user.id}
                            style={inputStyle}
                          />
                        )}
                        {activeTab === "intern" && (
                          <select
                            value={internEdits[user.id]?.department ?? user.profileData?.department ?? ""}
                            onChange={(event) =>
                              setInternEdits((prev) => ({
                                ...prev,
                                [user.id]: {
                                  ...(prev[user.id] || {}),
                                  department: event.target.value,
                                },
                              }))
                            }
                            disabled={actionId === user.id}
                            style={inputStyle}
                          >
                            <option value="">Unassigned</option>
                            {DEPARTMENT_OPTIONS.map((department) => (
                              <option key={department} value={department}>
                                {department}
                              </option>
                            ))}
                          </select>
                        )}
                        {activeTab !== "intern" && <div>{user.role === "pm" ? user.pmCode || "-" : user.role === "intern" ? user.internId || "-" : "-"}</div>}
                        {activeTab !== "intern" && <div>{user.status || "-"}</div>}
                        <div>
                          {activeTab === "intern" ? (
                            <select
                              value={internEdits[user.id]?.pmId ?? user.pmId ?? ""}
                              onChange={(event) =>
                                setInternEdits((prev) => ({
                                  ...prev,
                                  [user.id]: {
                                    ...(prev[user.id] || {}),
                                    pmId: event.target.value,
                                  },
                                }))
                              }
                              disabled={actionId === user.id}
                              style={inputStyle}
                            >
                              <option value="">Unassigned</option>
                              {pmUsers.map((pm) => (
                                <option key={pm.id} value={pm.id}>
                                  {pm.fullName || pm.email} {pm.pmCode ? `(${pm.pmCode})` : ""}
                                </option>
                              ))}
                            </select>
                          ) : user.role === "intern" ? (
                            user.pm?.fullName || user.pm?.email || "-"
                          ) : (
                            "-"
                          )}
                        </div>
                        {activeTab === "intern" && (
                          <select
                            value={user.status || "active"}
                            onChange={(event) => updateInternStatus(user.id, event.target.value)}
                            disabled={actionId === user.id}
                            style={inputStyle}
                          >
                            <option value="active">active</option>
                            <option value="inactive">inactive</option>
                            <option value="completed">completed</option>
                            <option value="archived">archived</option>
                          </select>
                        )}
                        {activeTab === "intern" && (
                          <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button type="button" onClick={() => saveInternProfile(user)} disabled={actionId === user.id} style={btnStyle("secondary")}>
                              <Save size={14} /> {actionId === user.id ? "..." : "Save"}
                            </button>
                          </div>
                        )}
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                          {activeTab === "intern" && (
                            <button type="button" onClick={() => openInternProfile(user)} style={btnStyle("secondary")}>
                              <Eye size={14} /> View
                            </button>
                          )}
                          <button type="button" onClick={() => deleteUser(user)} disabled={actionId === user.id} style={btnStyle("danger")}>
                            <Trash2 size={14} /> {actionId === user.id ? "..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    ))}
                    {!roleFilteredUsers.length && <div style={{ padding: 16, color: COLORS.muted }}>No users found.</div>}
                  </div>
                </div>
              )}

              {activeTab === "departments" && (
                <div style={{ display: "grid", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                    {departmentGroups.map((group) => (
                      <div
                        key={group.department}
                        style={{
                          background: COLORS.panel,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: 14,
                          padding: 14,
                          display: "grid",
                          gap: 10,
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                          <div style={{ fontWeight: 700 }}>{group.department}</div>
                          <div style={{ color: COLORS.muted, fontSize: 12 }}>
                            Interns: {group.interns.length} | PMs: {group.pms.length}
                          </div>
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.muted }}>Interns</div>
                        <div style={{ display: "grid", gap: 4 }}>
                          {(group.interns || []).map((intern) => (
                            <div key={intern.id} style={{ fontSize: 13, display: "flex", justifyContent: "space-between", gap: 8 }}>
                              <span>
                                {intern.fullName || intern.email} ({intern.internId || "-"})
                              </span>
                              <button type="button" onClick={() => openInternProfile(intern)} style={btnStyle("secondary")}>
                                <Eye size={13} /> Profile
                              </button>
                            </div>
                          ))}
                          {!group.interns.length && <div style={{ fontSize: 12, color: COLORS.muted }}>No interns</div>}
                        </div>
                        <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 4 }}>PMs</div>
                        <div style={{ display: "grid", gap: 4 }}>
                          {(group.pms || []).map((pm) => (
                            <div key={pm.id} style={{ fontSize: 13 }}>
                              {pm.fullName || pm.email} ({pm.pmCode || "-"})
                            </div>
                          ))}
                          {!group.pms.length && <div style={{ fontSize: 12, color: COLORS.muted }}>No PMs</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                  {!departmentGroups.length && (
                    <div style={{ padding: 16, color: COLORS.muted, background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14 }}>
                      No department data available.
                    </div>
                  )}
                </div>
              )}

              {activeTab === "progress" && (
                <div
                  style={{
                    background: COLORS.panel,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: 14,
                    overflow: "hidden",
                  }}
                >
                  <div style={{ padding: "12px 14px", fontWeight: 700 }}>Intern Progress ({internProgress.length})</div>
                  <TableHeader
                    columns="2fr 1fr 1fr 1fr 1fr 1fr 1fr"
                    labels={["Intern", "Intern ID", "Department", "Approved Logs", "Approved Hours", "Approved Reports", "Progress"]}
                  />
                  <div style={{ display: "grid" }}>
                    {internProgress.map((intern) => (
                      <div
                        key={intern.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr 1fr",
                          padding: "10px 12px",
                          borderTop: `1px solid ${COLORS.border}`,
                          fontSize: 13,
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600 }}>{intern.fullName || "-"}</div>
                          <div style={{ color: COLORS.muted }}>{intern.email}</div>
                        </div>
                        <div>{intern.internId || "-"}</div>
                        <div>{intern.department || "-"}</div>
                        <div>{intern.approvedWork?.logs || 0}</div>
                        <div>{intern.approvedWork?.hours || 0}h</div>
                        <div>
                          {intern.approvedWork?.reports || 0}/{intern.reports?.total || 0}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700 }}>{intern.progressPercent || 0}%</div>
                          <div
                            style={{
                              marginTop: 4,
                              height: 6,
                              borderRadius: 999,
                              background: "rgba(255,255,255,0.1)",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.max(0, Math.min(100, intern.progressPercent || 0))}%`,
                                height: "100%",
                                background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.accent2})`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {!internProgress.length && <div style={{ padding: 16, color: COLORS.muted }}>No intern progress data available.</div>}
                  </div>
                </div>
              )}
            </div>
          </div>

          {selectedIntern && profileDraft && (
            <div
              onClick={closeInternProfile}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(2, 6, 23, 0.72)",
                backdropFilter: "blur(4px)",
                display: "grid",
                placeItems: "center",
                zIndex: 1200,
                padding: 20,
              }}
            >
              <div
                onClick={(event) => event.stopPropagation()}
                style={{
                  width: "100%",
                  maxWidth: 900,
                  maxHeight: "90vh",
                  overflow: "auto",
                  background: "#0b1a24",
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 16,
                  padding: 16,
                  display: "grid",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800 }}>Intern Profile</div>
                    <div style={{ color: COLORS.muted, fontSize: 13 }}>{selectedIntern.email}</div>
                  </div>
                  <button type="button" onClick={closeInternProfile} style={btnStyle("secondary")}>
                    <X size={14} /> Close
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                  <input
                    placeholder="Full name"
                    value={profileDraft.fullName}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, fullName: event.target.value }))}
                    style={inputStyle}
                  />
                  <input
                    placeholder="Intern ID"
                    value={profileDraft.internId}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, internId: event.target.value }))}
                    style={inputStyle}
                  />
                  <select
                    value={profileDraft.department}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, department: event.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Unassigned</option>
                    {DEPARTMENT_OPTIONS.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                  <select
                    value={profileDraft.pmId}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, pmId: event.target.value }))}
                    style={inputStyle}
                  >
                    <option value="">Unassigned PM</option>
                    {pmUsers.map((pm) => (
                      <option key={pm.id} value={pm.id}>
                        {pm.fullName || pm.email} {pm.pmCode ? `(${pm.pmCode})` : ""}
                      </option>
                    ))}
                  </select>
                  <select
                    value={profileDraft.status}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, status: event.target.value }))}
                    style={inputStyle}
                  >
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                    <option value="completed">completed</option>
                    <option value="archived">archived</option>
                  </select>
                  <input
                    type="date"
                    value={profileDraft.startDate}
                    min={minDate}
                    onChange={(event) =>
                      setProfileDraft((prev) => {
                        const nextStartDate = event.target.value;
                        const nextEndDate = prev.endDate && nextStartDate && prev.endDate < nextStartDate ? nextStartDate : prev.endDate;
                        return { ...prev, startDate: nextStartDate, endDate: nextEndDate };
                      })
                    }
                    style={inputStyle}
                  />
                  <input
                    type="date"
                    value={profileDraft.endDate}
                    min={profileDraft.startDate || minDate}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, endDate: event.target.value }))}
                    style={inputStyle}
                  />
                  <input
                    placeholder="Mentor"
                    value={profileDraft.mentorName}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, mentorName: event.target.value }))}
                    style={inputStyle}
                  />
                  <input
                    placeholder="Stipend"
                    value={profileDraft.stipend}
                    onChange={(event) => setProfileDraft((prev) => ({ ...prev, stipend: event.target.value }))}
                    style={inputStyle}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                  <StatCard label="Approved Logs" value={selectedInternProgress?.approvedWork?.logs ?? 0} />
                  <StatCard label="Approved Hours" value={`${selectedInternProgress?.approvedWork?.hours ?? 0}h`} />
                  <StatCard label="Approved Reports" value={selectedInternProgress?.approvedWork?.reports ?? 0} />
                  <StatCard label="Progress" value={`${selectedInternProgress?.progressPercent ?? 0}%`} />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button type="button" onClick={closeInternProfile} style={btnStyle("secondary")}>
                    Cancel
                  </button>
                  <button type="button" onClick={saveInternProfileFromModal} disabled={profileSaving} style={btnStyle("primary")}>
                    <Save size={14} /> {profileSaving ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              </div>
            </div>
          )}

        </main >

        {/* Mobile Overlay */}
        {
          isMobile && sidebarOpen && (
            <div
              onClick={() => setSidebarOpen(false)}
              style={{
                position: "fixed",
                inset: 0,
                background: "rgba(0,0,0,0.5)",
                zIndex: 999,
                backdropFilter: "blur(4px)",
              }}
            />
          )
        }
      </div >
    </>
  );
}

function btnStyle(type) {
  if (type === "primary") {
    return {
      border: "none",
      background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.accent2})`,
      color: "white",
      padding: "10px 14px",
      borderRadius: 10,
      fontWeight: 700,
      cursor: "pointer",
      display: "inline-flex",
      gap: 6,
      alignItems: "center",
    };
  }
  if (type === "danger") {
    return {
      border: "1px solid rgba(239,68,68,0.5)",
      background: "rgba(239,68,68,0.15)",
      color: "#fecaca",
      padding: "8px 10px",
      borderRadius: 10,
      fontWeight: 700,
      cursor: "pointer",
      display: "inline-flex",
      gap: 6,
      alignItems: "center",
    };
  }
  return {
    border: `1px solid ${COLORS.border}`,
    background: "transparent",
    color: COLORS.text,
    padding: "9px 12px",
    borderRadius: 10,
    fontWeight: 700,
    cursor: "pointer",
    display: "inline-flex",
    gap: 6,
    alignItems: "center",
  };
}



const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: `1px solid ${COLORS.border}`,
  borderRadius: 10,
  padding: "9px 10px",
  color: COLORS.text,
  boxSizing: "border-box",
};
