import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, LogOut, Trash2, Plus, Users, UserCheck, BarChart3, Activity } from "lucide-react";
import { adminApi, authApi } from "../../lib/apiClient";

const COLORS = {
  bg: "#08131a",
  panel: "rgba(255, 255, 255, 0.06)",
  border: "rgba(255, 255, 255, 0.14)",
  text: "#f8fafc",
  muted: "rgba(248, 250, 252, 0.72)",
  accent: "#14b8a6",
  accent2: "#10b981",
  danger: "#ef4444",
};

const TABS = [
  { id: "overview", label: "Overview", icon: BarChart3 },
  { id: "hr", label: "HR", icon: Users },
  { id: "pm", label: "PM", icon: UserCheck },
  { id: "intern", label: "Interns", icon: Activity },
  { id: "progress", label: "Progress", icon: Activity },
];

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
    if (form.role === "pm" && !form.pmCode.trim()) {
      setError("PM code is required for PM users.");
      return;
    }

    const role = form.role;
    const password = form.password.trim() || randomPassword();
    const payload = {
      role,
      fullName: form.fullName.trim(),
      email: form.email.trim().toLowerCase(),
      password,
    };

    if (role === "pm") payload.pmCode = form.pmCode.trim();
    if (role === "intern") {
      if (form.pmId) payload.pmId = form.pmId;
      if (form.internId.trim()) payload.internId = form.internId.trim();
      payload.profileData = {
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        department: form.department || null,
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
      setInfo(`Created ${role.toUpperCase()} account for ${payload.email}. Password: ${password}`);
      await loadAll();
    } catch (err) {
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
      setError(err?.message || "Failed to update intern status.");
    } finally {
      setActionId("");
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: COLORS.bg, color: COLORS.text }}>
        Loading admin dashboard...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${COLORS.bg}, #0f2a31)`,
        color: COLORS.text,
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <div style={{ maxWidth: 1300, margin: "0 auto", display: "grid", gap: 16 }}>
        <div
          style={{
            background: COLORS.panel,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 16,
            padding: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>Admin Dashboard</div>
            <div style={{ color: COLORS.muted, fontSize: 13 }}>
              {currentUser?.fullName || "Admin"} ({currentUser?.email || ""})
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={refreshData} style={btnStyle("secondary")} type="button">
              <RefreshCw size={16} /> Refresh
            </button>
            <button onClick={logout} style={btnStyle("danger")} type="button">
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <form
          onSubmit={createUser}
          style={{
            background: COLORS.panel,
            border: `1px solid ${COLORS.border}`,
            borderRadius: 16,
            padding: 16,
            display: "grid",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 16, fontWeight: 700, display: "flex", alignItems: "center", gap: 8 }}>
            <Plus size={16} /> Create User
          </div>
          <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
            <select value={form.role} onChange={(event) => setForm((prev) => ({ ...prev, role: event.target.value }))} style={inputStyle}>
              <option value="hr">HR</option>
              <option value="pm">PM</option>
              <option value="intern">Intern</option>
            </select>
            <input
              placeholder="Full name"
              value={form.fullName}
              onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))}
              style={inputStyle}
            />
            <input
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              style={inputStyle}
            />
            <input
              placeholder="Password (optional)"
              value={form.password}
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              style={inputStyle}
            />
            {form.role === "pm" && (
              <input
                placeholder="PM Code"
                value={form.pmCode}
                onChange={(event) => setForm((prev) => ({ ...prev, pmCode: event.target.value }))}
                style={inputStyle}
              />
            )}
            {form.role === "intern" && (
              <select value={form.pmId} onChange={(event) => setForm((prev) => ({ ...prev, pmId: event.target.value }))} style={inputStyle}>
                <option value="">Assign PM (optional)</option>
                {pmUsers.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.fullName || pm.email} {pm.pmCode ? `(${pm.pmCode})` : ""}
                  </option>
                ))}
              </select>
            )}
            {form.role === "intern" && (
              <input
                placeholder="Intern ID (optional)"
                value={form.internId}
                onChange={(event) => setForm((prev) => ({ ...prev, internId: event.target.value }))}
                style={inputStyle}
              />
            )}
            {form.role === "intern" && (
              <input
                type="date"
                value={form.startDate}
                onChange={(event) => setForm((prev) => ({ ...prev, startDate: event.target.value }))}
                style={inputStyle}
              />
            )}
            {form.role === "intern" && (
              <input
                type="date"
                value={form.endDate}
                onChange={(event) => setForm((prev) => ({ ...prev, endDate: event.target.value }))}
                style={inputStyle}
              />
            )}
            {form.role === "intern" && (
              <input
                placeholder="Department"
                value={form.department}
                onChange={(event) => setForm((prev) => ({ ...prev, department: event.target.value }))}
                style={inputStyle}
              />
            )}
            {form.role === "intern" && (
              <input
                placeholder="Mentor"
                value={form.mentor}
                onChange={(event) => setForm((prev) => ({ ...prev, mentor: event.target.value }))}
                style={inputStyle}
              />
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ color: COLORS.muted, fontSize: 12 }}>
              If password is empty, a secure random password will be generated.
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

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} style={tabStyle(active)}>
                <Icon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>

        {(activeTab === "hr" || activeTab === "pm" || activeTab === "intern") && (
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
              columns={activeTab === "intern" ? "2fr 1fr 1fr 1fr 1fr auto" : "2fr 1fr 1fr 1fr auto"}
              labels={activeTab === "intern" ? ["User", "Code/ID", "Status", "Assigned PM", "Set Status", "Actions"] : ["User", "Code/ID", "Status", "Assigned PM", "Actions"]}
            />
            <div style={{ display: "grid" }}>
              {roleFilteredUsers.map((user) => (
                <div
                  key={user.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: activeTab === "intern" ? "2fr 1fr 1fr 1fr 1fr auto" : "2fr 1fr 1fr 1fr auto",
                    padding: "10px 12px",
                    borderTop: `1px solid ${COLORS.border}`,
                    fontSize: 13,
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{user.fullName || "-"}</div>
                    <div style={{ color: COLORS.muted }}>{user.email}</div>
                  </div>
                  <div>{user.role === "pm" ? user.pmCode || "-" : user.role === "intern" ? user.internId || "-" : "-"}</div>
                  <div>{user.status || "-"}</div>
                  <div>{user.role === "intern" ? user.pm?.fullName || user.pm?.email || "-" : "-"}</div>
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
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={() => deleteUser(user)}
                      disabled={actionId === user.id}
                      style={btnStyle("danger")}
                    >
                      <Trash2 size={14} /> {actionId === user.id ? "..." : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
              {!roleFilteredUsers.length && <div style={{ padding: 16, color: COLORS.muted }}>No users found.</div>}
            </div>
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
            <TableHeader columns="2fr 1fr 1fr 1fr 1fr 1fr" labels={["Intern", "Intern ID", "Assigned PM", "Hours", "Reports", "Progress"]} />
            <div style={{ display: "grid" }}>
              {internProgress.map((intern) => (
                <div
                  key={intern.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 1fr",
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
                  <div>{intern.pm?.fullName || intern.pm?.email || "-"}</div>
                  <div>{intern.totalHours || 0}h</div>
                  <div>
                    {intern.reports?.approved || 0}/{intern.reports?.total || 0}
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

function tabStyle(active) {
  return {
    border: active ? "1px solid rgba(20,184,166,0.7)" : `1px solid ${COLORS.border}`,
    background: active ? "rgba(20,184,166,0.15)" : COLORS.panel,
    color: COLORS.text,
    padding: "9px 12px",
    borderRadius: 999,
    fontWeight: 700,
    fontSize: 13,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
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
