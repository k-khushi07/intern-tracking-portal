// frontend/src/pages/Admin/AdminHome.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi, authApi } from "../../lib/apiClient";
import { 
  Users, UserCheck, UserX, LayoutDashboard, Activity, Shield, 
  Plus, Trash2, Search, Eye, LogOut, Bell, X, Check, 
  Filter, Calendar, User, Mail, Phone, ChevronDown, Archive,
  Briefcase, GraduationCap, MapPin, FileText, Award, TrendingUp, 
  Clock, Target, CheckCircle2, AlertCircle
} from "lucide-react";

const COLORS = {
  inkBlack: "#020617",
  backgroundSecondary: "#0a2528",
  deepOcean: "#0f766e",
  jungleTeal: "#14b8a6",
  emeraldGlow: "#10b981",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
  surfaceGlass: "rgba(255, 255, 255, 0.06)",
  borderGlass: "rgba(255, 255, 255, 0.12)",
};

// Helper Functions
const getUsers = () => {
  try {
    return JSON.parse(localStorage.getItem("users") || "[]");
  } catch {
    return [];
  }
};

const saveUsers = (users) => {
  localStorage.setItem("users", JSON.stringify(users));
};

const getNotifications = () => {
  try {
    return JSON.parse(localStorage.getItem("notifications") || "[]");
  } catch {
    return [];
  }
};

const saveNotifications = (notifications) => {
  localStorage.setItem("notifications", JSON.stringify(notifications));
};

const addNotification = (type, message, details = {}) => {
  const notifications = getNotifications();
  const newNotification = {
    id: Date.now().toString(),
    type,
    message,
    details,
    timestamp: new Date().toISOString(),
    read: false,
  };
  notifications.unshift(newNotification);
  saveNotifications(notifications);
  console.log(`[NOTIFICATION] ${type.toUpperCase()}: ${message}`, details);
};

const getArchivedInterns = () => {
  try {
    return JSON.parse(localStorage.getItem("archivedInterns") || "[]");
  } catch {
    return [];
  }
};

const saveArchivedInterns = (archived) => {
  localStorage.setItem("archivedInterns", JSON.stringify(archived));
};

const generatePassword = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

const sendSimulatedEmail = (to, subject, body) => {
  try {
    const emails = JSON.parse(localStorage.getItem("sentEmails") || "[]");
    emails.push({
      to,
      subject,
      body,
      sentAt: new Date().toISOString(),
    });
    localStorage.setItem("sentEmails", JSON.stringify(emails));
    
    console.log("=== SIMULATED EMAIL ===");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(body);
    console.log("======================");
  } catch (err) {
    console.error("Error sending email:", err);
  }
};

export default function AdminHome() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState([]);
  const [archivedInterns, setArchivedInterns] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showViewProfileModal, setShowViewProfileModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalRole, setModalRole] = useState("hr");
  const [isMobile, setIsMobile] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Filter states
  const [registrationDate, setRegistrationDate] = useState("");
  const [roleFilter, setRoleFilter] = useState({ intern: true, hr: true, pm: true });

  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    phone: "",
    pmCode: "",
  });

  const [archiveReason, setArchiveReason] = useState("");

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("currentUser"));
      if (!user || user.role !== "admin") {
        navigate("/");
        return;
      }
      setCurrentUser(user);
    } catch {
      navigate("/");
      return;
    }

    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [navigate]);

  useEffect(() => {
    loadUsers();
    loadNotifications();
    loadArchivedInterns();
  }, []);

  const loadUsers = () => {
    setUsers(getUsers());
  };

  const loadNotifications = () => {
    setNotifications(getNotifications());
  };

  const loadArchivedInterns = () => {
    setArchivedInterns(getArchivedInterns());
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  const getStats = () => {
    const interns = users.filter((u) => u.role === "intern" && !u.archived).length;
    const hrs = users.filter((u) => u.role === "hr").length;
    const pms = users.filter((u) => u.role === "pm").length;
    const activeUsers = users.filter((u) => !u.disabled && !u.archived).length;
    const pending = users.filter((u) => u.role === "intern" && !u.approved).length;
    return { interns, hrs, pms, activeUsers, total: users.length, pending };
  };

  const stats = getStats();

  const handleAddUser = async () => {
    if (!newUser.fullName || !newUser.email || !newUser.phone) {
      alert("Please fill all required fields");
      return;
    }

    if (modalRole === "pm" && !newUser.pmCode) {
      alert("PM Code is required for PM role");
      return;
    }

    const existing = users.find(
      (u) => u.email.toLowerCase() === newUser.email.toLowerCase() && u.role === modalRole
    );
    if (existing) {
      alert("User with this email already exists for this role");
      return;
    }

    const autoPassword = generatePassword();

    try {
      await adminApi.createUser({
        email: newUser.email.toLowerCase(),
        password: autoPassword,
        role: modalRole,
        fullName: newUser.fullName,
        pmCode: modalRole === "pm" ? newUser.pmCode : null,
      });
    } catch (err) {
      console.error("Backend user creation failed:", err);
      alert(err.message || "Failed to create user in backend.");
      return;
    }

    const user = {
      id: Date.now().toString(),
      role: modalRole,
      fullName: newUser.fullName,
      email: newUser.email.toLowerCase(),
      phone: newUser.phone,
      password: autoPassword,
      pmCode: modalRole === "pm" ? newUser.pmCode : null,
      createdAt: new Date().toISOString(),
      disabled: false,
      approved: true,
    };

    const updatedUsers = [...users, user];
    saveUsers(updatedUsers);
    setUsers(updatedUsers);

    const loginLink = `${window.location.origin}/`;
    sendSimulatedEmail(
      user.email,
      `Welcome to Intern Tracking Portal - Your ${modalRole.toUpperCase()} Account`,
      `Hello ${user.fullName},

Your ${modalRole.toUpperCase()} account has been created successfully!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOGIN CREDENTIALS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📧 Email: ${user.email}
🔐 Password: ${autoPassword}
${modalRole === "pm" ? `👤 PM Code: ${user.pmCode}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LOGIN INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Visit: ${loginLink}
2. Select "${modalRole.toUpperCase()}" as your role
3. Enter your email and password
${modalRole === "pm" ? '4. Enter your PM Code when prompted' : ''}

🔗 Direct Login Link: ${loginLink}

⚠️ IMPORTANT:
- Keep your password secure
- Do not share your credentials
- Contact admin if you face any login issues

Welcome to the team!

Best regards,
Admin Team
Intern Tracking Portal`
    );

    addNotification(
      "success",
      `New ${modalRole.toUpperCase()} added: ${user.fullName}`,
      { email: user.email, role: modalRole }
    );

    setShowAddModal(false);
    setNewUser({ fullName: "", email: "", phone: "", pmCode: "" });
    loadNotifications();
    alert(`✅ ${modalRole.toUpperCase()} added successfully! Credentials sent via email.`);
  };

  const handleRemoveUser = (email, role) => {
    if (!window.confirm(`Are you sure you want to remove this ${role.toUpperCase()}?`)) return;

    const user = users.find((u) => u.email === email && u.role === role);
    const updatedUsers = users.filter((u) => !(u.email === email && u.role === role));
    saveUsers(updatedUsers);
    setUsers(updatedUsers);

    addNotification(
      "warning",
      `${role.toUpperCase()} removed: ${user?.fullName || email}`,
      { email, role }
    );
    loadNotifications();
    alert(`✅ User removed successfully!`);
  };

  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setShowViewProfileModal(true);
  };

  const handleArchiveIntern = (intern) => {
    setSelectedUser(intern);
    setArchiveReason("");
    setShowArchiveModal(true);
  };

  const confirmArchiveIntern = () => {
    if (!selectedUser) return;

    const archivedIntern = {
      ...selectedUser,
      archivedAt: new Date().toISOString(),
      archivedBy: currentUser.email,
      archiveReason: archiveReason || "No reason provided",
      status: "completed",
    };

    const archived = getArchivedInterns();
    archived.unshift(archivedIntern);
    saveArchivedInterns(archived);

    const updatedUsers = users.map((u) =>
      u.email === selectedUser.email && u.role === "intern"
        ? { ...u, archived: true }
        : u
    );
    saveUsers(updatedUsers);
    setUsers(updatedUsers);

    addNotification(
      "info",
      `Intern archived: ${selectedUser.fullName}`,
      { email: selectedUser.email, reason: archiveReason }
    );

    setShowArchiveModal(false);
    setSelectedUser(null);
    setArchiveReason("");
    loadArchivedInterns();
    loadNotifications();
    alert("✅ Intern archived successfully!");
  };

  const handleDeleteIntern = (intern) => {
    if (!window.confirm(`Are you sure you want to delete ${intern.fullName}? This will archive the intern.`)) return;
    if (!window.confirm("This action will move the intern to Activity Log. Confirm?")) return;

    const archivedIntern = {
      ...intern,
      archivedAt: new Date().toISOString(),
      archivedBy: currentUser.email,
      archiveReason: "Deleted by admin",
      status: "removed",
    };

    const archived = getArchivedInterns();
    archived.unshift(archivedIntern);
    saveArchivedInterns(archived);

    const updatedUsers = users.map((u) =>
      u.email === intern.email && u.role === "intern"
        ? { ...u, archived: true }
        : u
    );
    saveUsers(updatedUsers);
    setUsers(updatedUsers);

    addNotification(
      "warning",
      `Intern deleted: ${intern.fullName}`,
      { email: intern.email }
    );

    loadArchivedInterns();
    loadNotifications();
    alert("✅ Intern deleted and moved to Activity Log!");
  };

  const markNotificationAsRead = (id) => {
    const updated = notifications.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(updated);
    setNotifications(updated);
  };

  const clearAllReadNotifications = () => {
    if (!window.confirm("Clear all read notifications?")) return;
    const updated = notifications.filter((n) => !n.read);
    saveNotifications(updated);
    setNotifications(updated);
  };

  const clearAllOverviewNotifications = () => {
    setRegistrationDate("");
    setRoleFilter({ intern: false, hr: false, pm: false });
  };

  const filteredUsers = (role) => {
    return users
      .filter((u) => u.role === role && !u.archived)
      .filter((u) =>
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  };

  const filteredOverviewUsers = () => {
    return users
      .filter((u) => {
        if (!registrationDate) return true;
        const createdDate = new Date(u.createdAt).toDateString();
        const filterDate = new Date(registrationDate).toDateString();
        return createdDate === filterDate;
      })
      .filter((u) => {
        if (u.role === "intern") return roleFilter.intern;
        if (u.role === "hr") return roleFilter.hr;
        if (u.role === "pm") return roleFilter.pm;
        return true;
      })
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!currentUser) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
        Loading...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${COLORS.inkBlack} 0%, ${COLORS.backgroundSecondary} 50%, ${COLORS.inkBlack} 100%)`,
        color: "white",
        padding: isMobile ? 16 : 32,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: "30%",
            right: "-10%",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
            opacity: 0.25,
            filter: "blur(100px)",
            animation: "pulse 4s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }
      `}</style>

      <div style={{ position: "relative", zIndex: 10, maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <Shield size={isMobile ? 32 : 40} color={COLORS.emeraldGlow} />
              <h1 style={{ fontSize: isMobile ? 28 : 42, margin: 0, fontWeight: 800 }}>
                Admin Dashboard
              </h1>
            </div>
            <p style={{ color: "rgba(255,255,255,0.75)", fontSize: isMobile ? 14 : 16, margin: 0 }}>
              Complete system control and management
            </p>
          </div>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            {/* Notifications */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  padding: 10,
                  borderRadius: 12,
                  border: `1px solid ${COLORS.borderGlass}`,
                  background: COLORS.surfaceGlass,
                  color: "white",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      background: COLORS.racingRed,
                      color: "white",
                      borderRadius: "50%",
                      width: 20,
                      height: 20,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <NotificationsPanel
                  notifications={notifications}
                  onMarkAsRead={markNotificationAsRead}
                  onClearAllRead={clearAllReadNotifications}
                  onClose={() => setShowNotifications(false)}
                  isMobile={isMobile}
                />
              )}
            </div>

            {/* User Menu */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.borderGlass}`,
                  background: COLORS.surfaceGlass,
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 600,
                }}
              >
                <User size={18} />
                {!isMobile && <span>{currentUser.fullName || "Admin"}</span>}
                <ChevronDown size={16} />
              </button>

              {showUserMenu && (
                <div
                  style={{
                    position: "absolute",
                    top: "calc(100% + 8px)",
                    right: 0,
                    background: `linear-gradient(135deg, ${COLORS.inkBlack}, ${COLORS.deepOcean})`,
                    border: `1px solid ${COLORS.borderGlass}`,
                    borderRadius: 12,
                    padding: 8,
                    minWidth: 180,
                    boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
                    zIndex: 1000,
                  }}
                >
                  <button
                    onClick={logout}
                    style={{
                      width: "100%",
                      padding: 12,
                      borderRadius: 8,
                      border: "none",
                      background: "transparent",
                      color: "white",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      fontWeight: 600,
                      fontSize: 14,
                    }}
                    onMouseEnter={(e) => (e.target.style.background = "rgba(255,255,255,0.1)")}
                    onMouseLeave={(e) => (e.target.style.background = "transparent")}
                  >
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards - Extra Compact */}
        {activeTab === "overview" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "repeat(3, 1fr)" : "repeat(6, 1fr)",
              gap: 8,
              marginBottom: 20,
            }}
          >
            <CompactStatCard
              icon={<Users size={16} />}
              label="Total Users"
              value={stats.total}
              color={COLORS.emeraldGlow}
            />
            <CompactStatCard
              icon={<UserCheck size={16} />}
              label="Active Users"
              value={stats.activeUsers}
              color="#4ade80"
            />
            <CompactStatCard
              icon={<LayoutDashboard size={16} />}
              label="Interns"
              value={stats.interns}
              color={COLORS.jungleTeal}
            />
            <CompactStatCard
              icon={<Activity size={16} />}
              label="HR Staff"
              value={stats.hrs}
              color={COLORS.deepOcean}
            />
            <CompactStatCard
              icon={<Shield size={16} />}
              label="PMs"
              value={stats.pms}
              color="#a78bfa"
            />
            <CompactStatCard
              icon={<UserX size={16} />}
              label="Pending"
              value={stats.pending}
              color="#fbbf24"
            />
          </div>
        )}

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            flexWrap: "wrap",
            background: COLORS.surfaceGlass,
            padding: 8,
            borderRadius: 16,
            backdropFilter: "blur(10px)",
          }}
        >
          {[
            { id: "overview", label: "Overview" },
            { id: "hr", label: "HR Management" },
            { id: "pm", label: "PM Management" },
            { id: "interns", label: "Interns" },
            { id: "logs", label: "Activity Logs" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: isMobile ? "1 1 100%" : "0 0 auto",
                padding: "12px 24px",
                borderRadius: 12,
                border: "none",
                cursor: "pointer",
                fontWeight: 700,
                background: activeTab === tab.id ? "white" : "transparent",
                color: activeTab === tab.id ? COLORS.inkBlack : "white",
                transition: "all 0.2s",
                fontSize: isMobile ? 13 : 15,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div
          style={{
            background: COLORS.surfaceGlass,
            backdropFilter: "blur(20px)",
            borderRadius: 24,
            padding: isMobile ? 16 : 32,
            border: `1px solid ${COLORS.borderGlass}`,
            minHeight: 400,
          }}
        >
          {activeTab === "overview" && (
            <OverviewContent 
              users={filteredOverviewUsers()} 
              registrationDate={registrationDate}
              setRegistrationDate={setRegistrationDate}
              roleFilter={roleFilter}
              setRoleFilter={setRoleFilter}
              onClearAll={clearAllOverviewNotifications}
              isMobile={isMobile} 
            />
          )}

          {(activeTab === "hr" || activeTab === "pm") && (
            <UserManagement
              role={activeTab}
              users={filteredUsers(activeTab)}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onAdd={() => {
                setModalRole(activeTab);
                setShowAddModal(true);
              }}
              onRemove={handleRemoveUser}
              onViewProfile={handleViewProfile}
              isMobile={isMobile}
            />
          )}

          {activeTab === "interns" && (
            <InternsView
              users={filteredUsers("intern")}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onViewProfile={handleViewProfile}
              onArchive={handleArchiveIntern}
              onDelete={handleDeleteIntern}
              isMobile={isMobile}
            />
          )}

          {activeTab === "logs" && (
            <ActivityLogs 
              archivedInterns={archivedInterns} 
              onViewProfile={handleViewProfile}
              isMobile={isMobile} 
            />
          )}
        </div>
      </div>

      {/* Modals */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)} isMobile={isMobile}>
          <h2 style={{ marginBottom: 16, fontSize: isMobile ? 20 : 24 }}>
            Add New {modalRole.toUpperCase()}
          </h2>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 20 }}>
            Password will be auto-generated and sent via email
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              placeholder="Full Name *"
              value={newUser.fullName}
              onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
              style={inputStyle}
            />
            <input
              placeholder="Email *"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              style={inputStyle}
            />
            <input
              placeholder="Phone Number *"
              value={newUser.phone}
              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
              style={inputStyle}
            />
            {modalRole === "pm" && (
              <input
                placeholder="PM Code *"
                value={newUser.pmCode}
                onChange={(e) => setNewUser({ ...newUser, pmCode: e.target.value })}
                style={inputStyle}
              />
            )}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button onClick={handleAddUser} style={buttonStyle}>
                Add {modalRole.toUpperCase()}
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ ...buttonStyle, background: "transparent", border: "1px solid white" }}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showViewProfileModal && selectedUser && (
        <ViewProfileModal
          user={selectedUser}
          onClose={() => {
            setShowViewProfileModal(false);
            setSelectedUser(null);
          }}
          isMobile={isMobile}
        />
      )}

      {showArchiveModal && selectedUser && (
        <Modal onClose={() => setShowArchiveModal(false)} isMobile={isMobile}>
          <h2 style={{ marginBottom: 16, fontSize: isMobile ? 20 : 24 }}>
            Archive Intern
          </h2>
          <p style={{ marginBottom: 16, color: "rgba(255,255,255,0.8)" }}>
            Archive {selectedUser.fullName}?
          </p>
          <textarea
            placeholder="Archive reason (optional)"
            value={archiveReason}
            onChange={(e) => setArchiveReason(e.target.value)}
            style={{
              ...inputStyle,
              minHeight: 100,
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={confirmArchiveIntern} style={buttonStyle}>
              <Archive size={16} /> Confirm Archive
            </button>
            <button
              onClick={() => setShowArchiveModal(false)}
              style={{ ...buttonStyle, background: "transparent", border: "1px solid white" }}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function CompactStatCard({ icon, label, value, color }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(14px)",
        padding: 10,
        borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        boxShadow: `0 2px 10px ${color}20`,
      }}
    >
      <div style={{ color, opacity: 0.9 }}>{icon}</div>
      <div style={{ fontSize: 20, fontWeight: 800, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", textAlign: "center", lineHeight: 1.2 }}>{label}</div>
    </div>
  );
}

function NotificationsPanel({ notifications, onMarkAsRead, onClearAllRead, onClose, isMobile }) {
  const readCount = notifications.filter(n => n.read).length;
  
  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 999,
        }}
        onClick={onClose}
      />
      <div
        style={{
          position: "absolute",
          top: "calc(100% + 12px)",
          right: 0,
          width: isMobile ? 320 : 400,
          maxHeight: 500,
          background: `linear-gradient(135deg, ${COLORS.inkBlack}, ${COLORS.deepOcean})`,
          border: `1px solid ${COLORS.borderGlass}`,
          borderRadius: 16,
          boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
          zIndex: 1000,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: 16, borderBottom: `1px solid ${COLORS.borderGlass}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Notifications</h3>
          {readCount > 0 && (
            <button
              onClick={onClearAllRead}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "none",
                background: COLORS.racingRed,
                color: "white",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Trash2 size={14} /> Clear All
            </button>
          )}
        </div>
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {notifications.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.5)" }}>
              <Bell size={48} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p>You have no notifications</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => onMarkAsRead(notif.id)}
                style={{
                  padding: 12,
                  borderBottom: `1px solid ${COLORS.borderGlass}`,
                  background: notif.read ? "transparent" : "rgba(255,255,255,0.05)",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
                onMouseLeave={(e) => e.currentTarget.style.background = notif.read ? "transparent" : "rgba(255,255,255,0.05)"}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, opacity: notif.read ? 0.7 : 1 }}>
                      {notif.message}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                      {new Date(notif.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {!notif.read && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        background: COLORS.emeraldGlow,
                        marginTop: 6,
                      }}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}

function OverviewContent({ users, registrationDate, setRegistrationDate, roleFilter, setRoleFilter, onClearAll, isMobile }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: isMobile ? 18 : 22 }}>
          Recent Registrations ({users.length})
        </h3>
        
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {/* Role Filters */}
          <div style={{ display: "flex", gap: 12, padding: "8px 12px", background: COLORS.surfaceGlass, borderRadius: 8, border: `1px solid ${COLORS.borderGlass}` }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
              <input
                type="checkbox"
                checked={roleFilter.intern}
                onChange={(e) => setRoleFilter({ ...roleFilter, intern: e.target.checked })}
              />
              <span>Interns</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
              <input
                type="checkbox"
                checked={roleFilter.hr}
                onChange={(e) => setRoleFilter({ ...roleFilter, hr: e.target.checked })}
              />
              <span>HR</span>
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13 }}>
              <input
                type="checkbox"
                checked={roleFilter.pm}
                onChange={(e) => setRoleFilter({ ...roleFilter, pm: e.target.checked })}
              />
              <span>PM</span>
            </label>
          </div>

          {/* Date Filter */}
          <input
            type="date"
            value={registrationDate}
            onChange={(e) => setRegistrationDate(e.target.value)}
            style={{ 
              ...inputStyle, 
              width: "auto", 
              padding: "8px 12px",
              fontSize: 13,
            }}
          />
          
          {registrationDate && (
            <button
              onClick={() => setRegistrationDate("")}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: `1px solid ${COLORS.borderGlass}`,
                background: "transparent",
                color: "white",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          )}

          {users.length > 0 && (
            <button
              onClick={onClearAll}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "none",
                background: COLORS.racingRed,
                color: "white",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Trash2 size={14} /> Clear All
            </button>
          )}
        </div>
      </div>

      {users.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", padding: 40 }}>No registrations found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {users.map((user, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(255,255,255,0.04)",
                padding: 16,
                borderRadius: 12,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 8,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>
                  {user.fullName}
                </div>
                <div style={{ fontSize: isMobile ? 12 : 14, color: "rgba(255,255,255,0.6)" }}>
                  {user.email}
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                  {new Date(user.createdAt).toLocaleString()}
                </div>
              </div>

              <div
                style={{
                  background: COLORS.emeraldGlow,
                  color: "white",
                  padding: "6px 12px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  textTransform: "uppercase",
                }}
              >
                {user.role}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UserManagement({ role, users, searchTerm, setSearchTerm, onAdd, onRemove, onViewProfile, isMobile }) {
  // Generate avatar initials
  const getAvatar = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: isMobile ? 18 : 22 }}>
          {role.toUpperCase()} Management ({users.length})
        </h3>
        <button onClick={onAdd} style={buttonStyle}>
          <Plus size={18} /> Add {role.toUpperCase()}
        </button>
      </div>

      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search
          size={18}
          style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.5)" }}
        />
        <input
          placeholder="Search by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...inputStyle, paddingLeft: 44 }}
        />
      </div>

      {users.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", padding: 40 }}>No {role.toUpperCase()} users found.</p>
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(340px, 1fr))", 
          gap: 20 
        }}>
          {users.map((user, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(29, 120, 116, 0.1)",
                border: "1px solid rgba(103, 146, 137, 0.3)",
                padding: 20,
                borderRadius: 16,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(103, 146, 137, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* User Header */}
              <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 16 }}>
                <div
                  style={{
                    width: 56,
                    height: 56,
                    background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: 18,
                    color: COLORS.peachGlow,
                    marginRight: 14,
                    flexShrink: 0,
                  }}
                >
                  {getAvatar(user.fullName)}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 700, color: COLORS.peachGlow, marginBottom: 4 }}>
                    {user.fullName}
                  </h3>
                  <p style={{ fontSize: 13, color: "rgba(255, 229, 217, 0.6)", margin: 0 }}>
                    {role.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* User Details */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13, color: "rgba(255, 229, 217, 0.7)" }}>
                  <Mail size={15} color={COLORS.jungleTeal} />
                  <span>{user.email}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255, 229, 217, 0.7)" }}>
                  <Phone size={15} color={COLORS.jungleTeal} />
                  <span>{user.phone || "Not provided"}</span>
                </div>
                {user.pmCode && (
                  <div style={{ 
                    marginTop: 8, 
                    padding: "6px 10px", 
                    background: "rgba(103, 146, 137, 0.2)", 
                    borderRadius: 8,
                    fontSize: 12,
                    color: COLORS.emeraldGlow,
                    fontWeight: 600
                  }}>
                    PM Code: {user.pmCode}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => onViewProfile(user)}
                  style={{
                    flex: 1,
                    padding: 10,
                    background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                    border: "none",
                    borderRadius: 10,
                    color: COLORS.peachGlow,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(103, 146, 137, 0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <Eye size={16} />
                  View Profile
                </button>
                <button
                  onClick={() => onRemove(user.email, user.role)}
                  style={{
                    padding: 10,
                    background: "rgba(217, 4, 41, 0.2)",
                    border: `1px solid ${COLORS.racingRed}`,
                    borderRadius: 10,
                    color: COLORS.racingRed,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(217, 4, 41, 0.3)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(217, 4, 41, 0.2)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function InternsView({ users, searchTerm, setSearchTerm, onViewProfile, onArchive, onDelete, isMobile }) {
  const getAvatar = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  // Calculate mock performance data
  const getPerformance = (user) => {
    return Math.floor(75 + Math.random() * 25); // 75-100%
  };

  return (
    <div>
      <h3 style={{ marginBottom: 20, fontSize: isMobile ? 18 : 22 }}>All Interns ({users.length})</h3>

      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search
          size={18}
          style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.5)" }}
        />
        <input
          placeholder="Search interns..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...inputStyle, paddingLeft: 44 }}
        />
      </div>

      {users.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", padding: 40 }}>No interns found.</p>
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(360px, 1fr))", 
          gap: 20 
        }}>
          {users.map((user, idx) => {
            const performance = getPerformance(user);
            return (
              <div
                key={idx}
                style={{
                  background: "rgba(29, 120, 116, 0.1)",
                  border: "1px solid rgba(103, 146, 137, 0.3)",
                  padding: 20,
                  borderRadius: 16,
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-4px)";
                  e.currentTarget.style.boxShadow = "0 8px 24px rgba(103, 146, 137, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {/* Intern Header */}
                <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 16 }}>
                  <div
                    style={{
                      width: 60,
                      height: 60,
                      background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 20,
                      color: COLORS.peachGlow,
                      marginRight: 14,
                      flexShrink: 0,
                    }}
                  >
                    {getAvatar(user.fullName)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: COLORS.peachGlow, marginBottom: 4 }}>
                      {user.fullName}
                    </h3>
                    <p style={{ fontSize: 13, color: "rgba(255, 229, 217, 0.6)", margin: 0 }}>
                      {user.profile?.department || "Engineering"}
                    </p>
                  </div>
                </div>

                {/* Intern Details */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13, color: "rgba(255, 229, 217, 0.7)" }}>
                    <Mail size={15} color={COLORS.jungleTeal} />
                    <span>{user.email}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13, color: "rgba(255, 229, 217, 0.7)" }}>
                    <MapPin size={15} color={COLORS.jungleTeal} />
                    <span>{user.profile?.city || "Location not set"}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255, 229, 217, 0.7)" }}>
                    <Calendar size={15} color={COLORS.jungleTeal} />
                    <span>Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Performance Bar */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 13, color: "rgba(255, 229, 217, 0.7)" }}>Performance</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: COLORS.peachGlow }}>{performance}%</span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: 8,
                      background: "rgba(103, 146, 137, 0.2)",
                      borderRadius: 10,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${performance}%`,
                        height: "100%",
                        background: `linear-gradient(90deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                        borderRadius: 10,
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: 8 }}>
                  <button
                    onClick={() => onViewProfile(user)}
                    style={{
                      flex: 1,
                      padding: 10,
                      background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                      border: "none",
                      borderRadius: 10,
                      color: COLORS.peachGlow,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(103, 146, 137, 0.4)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    <Eye size={16} />
                    View
                  </button>
                  <button
                    onClick={() => onArchive(user)}
                    style={{
                      padding: 10,
                      background: "rgba(103, 146, 137, 0.2)",
                      border: `1px solid ${COLORS.jungleTeal}`,
                      borderRadius: 10,
                      color: COLORS.peachGlow,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(103, 146, 137, 0.3)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(103, 146, 137, 0.2)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <Archive size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(user)}
                    style={{
                      padding: 10,
                      background: "rgba(217, 4, 41, 0.2)",
                      border: `1px solid ${COLORS.racingRed}`,
                      borderRadius: 10,
                      color: COLORS.racingRed,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transition: "all 0.3s ease",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(217, 4, 41, 0.3)";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(217, 4, 41, 0.2)";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ActivityLogs({ archivedInterns, onViewProfile, isMobile }) {
  const getAvatar = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  return (
    <div>
      <h3 style={{ marginBottom: 20, fontSize: isMobile ? 18 : 22 }}>
        Activity Logs - Archived Interns ({archivedInterns.length})
      </h3>
      {archivedInterns.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.6)", textAlign: "center", padding: 40 }}>No archived interns yet.</p>
      ) : (
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(360px, 1fr))", 
          gap: 20 
        }}>
          {archivedInterns.map((intern, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(29, 120, 116, 0.1)",
                border: `1px solid ${intern.status === "completed" ? COLORS.emeraldGlow : COLORS.racingRed}40`,
                padding: 20,
                borderRadius: 16,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 8px 24px rgba(103, 146, 137, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {/* Header with Avatar and Status */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 700,
                      fontSize: 18,
                      color: COLORS.peachGlow,
                      marginRight: 14,
                      flexShrink: 0,
                    }}
                  >
                    {getAvatar(intern.fullName)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: COLORS.peachGlow, marginBottom: 4 }}>
                      {intern.fullName}
                    </h3>
                    <p style={{ fontSize: 13, color: "rgba(255, 229, 217, 0.6)", margin: 0 }}>
                      {intern.profile?.department || "Engineering"}
                    </p>
                  </div>
                </div>
                <div
                  style={{
                    background: intern.status === "completed" ? COLORS.emeraldGlow : COLORS.racingRed,
                    color: "white",
                    padding: "5px 12px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  {intern.status}
                </div>
              </div>

              {/* Details */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13, color: "rgba(255, 229, 217, 0.7)" }}>
                  <Mail size={15} color={COLORS.jungleTeal} />
                  <span>{intern.email}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, fontSize: 13, color: "rgba(255, 229, 217, 0.7)" }}>
                  <Calendar size={15} color={COLORS.jungleTeal} />
                  <span>Archived: {new Date(intern.archivedAt).toLocaleDateString()}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "rgba(255, 229, 217, 0.7)" }}>
                  <User size={15} color={COLORS.jungleTeal} />
                  <span>By: {intern.archivedBy}</span>
                </div>
              </div>

              {/* Reason */}
              <div 
                style={{ 
                  padding: 12, 
                  background: "rgba(103, 146, 137, 0.1)", 
                  borderRadius: 10,
                  marginBottom: 16,
                  borderLeft: `3px solid ${COLORS.jungleTeal}`
                }}
              >
                <p style={{ fontSize: 12, color: "rgba(255, 229, 217, 0.6)", margin: "0 0 4px 0", fontWeight: 600 }}>
                  Reason:
                </p>
                <p style={{ fontSize: 13, color: "rgba(255, 229, 217, 0.85)", margin: 0 }}>
                  {intern.archiveReason}
                </p>
              </div>

              {/* View Button */}
              <button
                onClick={() => onViewProfile(intern)}
                style={{
                  width: "100%",
                  padding: 10,
                  background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                  border: "none",
                  borderRadius: 10,
                  color: COLORS.peachGlow,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(103, 146, 137, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <Eye size={16} />
                View Full Profile
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ViewProfileModal({ user, onClose, isMobile }) {
  const profile = user.profile || {};
  const isIntern = user.role === "intern";
  
  // Mock data for demonstration
  const mockData = {
    performance: Math.floor(75 + Math.random() * 25),
    tasksCompleted: Math.floor(15 + Math.random() * 15),
    tasksTotal: 30,
    weeklyReports: Math.floor(5 + Math.random() * 5),
    lastActive: "2 hours ago",
    skills: profile.skills || ["React", "JavaScript", "Node.js"],
    recentActivities: [
      { id: 1, action: "Completed weekly report #8", time: "2 hours ago", type: "report" },
      { id: 2, action: "Updated TNA Tracker", time: "5 hours ago", type: "tna" },
      { id: 3, action: "Submitted Project", time: "1 day ago", type: "project" },
    ],
    currentProjects: [
      { id: 1, name: "Dashboard Development", progress: 85, status: "In Progress" },
      { id: 2, name: "API Integration", progress: 100, status: "Completed" },
    ],
    goals: [
      { id: 1, title: "Complete React certification", progress: 75, deadline: "Feb 2025" },
      { id: 2, title: "Build 3 full-stack projects", progress: 66, deadline: "Apr 2025" },
    ],
  };

  const getAvatar = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  return (
    <Modal onClose={onClose} isMobile={isMobile} large>
      {/* Profile Header - Similar to PM Dashboard */}
      <div
        style={{
          padding: 28,
          borderRadius: 16,
          background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, flexWrap: "wrap" }}>
          <div
            style={{
              width: 100,
              height: 100,
              background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 40,
              color: COLORS.peachGlow,
              border: "4px solid rgba(255, 229, 217, 0.3)",
              flexShrink: 0,
            }}
          >
            {getAvatar(user.fullName)}
          </div>

          <div style={{ flex: 1, minWidth: 250 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
              <h1 style={{ fontSize: isMobile ? 24 : 28, fontWeight: 700, color: COLORS.peachGlow, margin: 0 }}>
                {user.fullName}
              </h1>
              <span
                style={{
                  padding: "6px 14px",
                  background: "rgba(34, 197, 94, 0.3)",
                  border: "1px solid rgba(34, 197, 94, 0.5)",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: "#22c55e",
                  textTransform: "uppercase",
                }}
              >
                {user.role}
              </span>
            </div>

            <p style={{ fontSize: 16, color: "rgba(255, 229, 217, 0.9)", marginBottom: 14 }}>
              {profile.department || "Engineering"} {isIntern && profile.collegeName ? `• ${profile.collegeName}` : ""}
            </p>

            <p style={{ fontSize: 14, color: "rgba(255, 229, 217, 0.8)", lineHeight: 1.6, marginBottom: 16 }}>
              {profile.bio || "Passionate about creating impactful solutions and always eager to learn new technologies."}
            </p>

            {/* Contact Info Grid */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Mail size={16} color={COLORS.peachGlow} />
                <span style={{ fontSize: 13, color: "rgba(255, 229, 217, 0.9)" }}>{user.email}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Phone size={16} color={COLORS.peachGlow} />
                <span style={{ fontSize: 13, color: "rgba(255, 229, 217, 0.9)" }}>{user.phone || "Not provided"}</span>
              </div>
              {(profile.city || profile.state) && (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <MapPin size={16} color={COLORS.peachGlow} />
                  <span style={{ fontSize: 13, color: "rgba(255, 229, 217, 0.9)" }}>
                    {[profile.city, profile.state].filter(Boolean).join(", ")}
                  </span>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Calendar size={16} color={COLORS.peachGlow} />
                <span style={{ fontSize: 13, color: "rgba(255, 229, 217, 0.9)" }}>
                  Joined: {new Date(user.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid - Only for Interns */}
      {isIntern && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatBox icon={<Award size={18} />} label="Performance" value={`${mockData.performance}%`} color={COLORS.jungleTeal} />
          <StatBox icon={<CheckCircle2 size={18} />} label="Tasks" value={`${mockData.tasksCompleted}/${mockData.tasksTotal}`} color={COLORS.jungleTeal} />
          <StatBox icon={<TrendingUp size={18} />} label="Reports" value={mockData.weeklyReports} color={COLORS.jungleTeal} />
          <StatBox icon={<Clock size={18} />} label="Last Active" value={mockData.lastActive} color={COLORS.jungleTeal} isText />
        </div>
      )}

      {/* Content - Scrollable */}
      <div style={{ maxHeight: isMobile ? "50vh" : "60vh", overflowY: "auto", paddingRight: 8 }}>
        {/* Two Column Layout */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Basic Information */}
            <Section title="Basic Information" icon={<User size={20} />}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                <InfoField label="Email" value={user.email} />
                <InfoField label="Phone" value={user.phone || "Not provided"} />
                {user.dob && <InfoField label="Date of Birth" value={user.dob} />}
                {profile.bloodGroup && <InfoField label="Blood Group" value={profile.bloodGroup} />}
              </div>
            </Section>

            {/* Address - Interns Only */}
            {isIntern && (profile.address || profile.city) && (
              <Section title="Address" icon={<MapPin size={20} />}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                  {profile.address && <InfoField label="Address" value={profile.address} />}
                  {profile.city && <InfoField label="City" value={profile.city} />}
                  {profile.state && <InfoField label="State" value={profile.state} />}
                  {profile.pincode && <InfoField label="Pincode" value={profile.pincode} />}
                </div>
              </Section>
            )}

            {/* Academic Details - Interns Only */}
            {isIntern && profile.collegeName && (
              <Section title="Academic Details" icon={<GraduationCap size={20} />}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                  <InfoField label="College" value={profile.collegeName} />
                  <InfoField label="Department" value={profile.department} />
                  <InfoField label="Semester" value={profile.semester} />
                  {profile.guideName && <InfoField label="Guide" value={profile.guideName} />}
                  {profile.guideEmail && <InfoField label="Guide Email" value={profile.guideEmail} />}
                </div>
              </Section>
            )}

            {/* Skills */}
            {isIntern && mockData.skills.length > 0 && (
              <Section title="Skills" icon={<Award size={20} />}>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {mockData.skills.map((skill, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "6px 12px",
                        background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 600,
                        color: COLORS.peachGlow,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Right Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Emergency Contact - Interns Only */}
            {isIntern && profile.emergencyContactName && (
              <Section title="Emergency Contact" icon={<Phone size={20} />}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                  <InfoField label="Name" value={profile.emergencyContactName} />
                  <InfoField label="Relation" value={profile.emergencyRelation} />
                  <InfoField label="Phone" value={profile.emergencyContactPhone} />
                </div>
              </Section>
            )}

            {/* Internship Details - Interns Only */}
            {isIntern && profile.internshipDuration && (
              <Section title="Internship Details" icon={<Briefcase size={20} />}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                  <InfoField label="Duration" value={profile.internshipDuration} />
                  <InfoField label="Work Mode" value={profile.workMode} />
                  {profile.startDate && <InfoField label="Start Date" value={new Date(profile.startDate).toLocaleDateString()} />}
                  {profile.endDate && <InfoField label="End Date" value={new Date(profile.endDate).toLocaleDateString()} />}
                </div>
              </Section>
            )}

            {/* Current Projects - Interns Only */}
            {isIntern && (
              <Section title="Current Projects" icon={<FileText size={20} />}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {mockData.currentProjects.map((project) => (
                    <div key={project.id}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: COLORS.peachGlow, fontWeight: 500 }}>{project.name}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: project.status === "Completed" ? "#22c55e" : COLORS.jungleTeal }}>
                          {project.progress}%
                        </span>
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: 6,
                          background: "rgba(103, 146, 137, 0.2)",
                          borderRadius: 10,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${project.progress}%`,
                            height: "100%",
                            background: project.status === "Completed" ? "linear-gradient(90deg, #22c55e, #16a34a)" : `linear-gradient(90deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                            borderRadius: 10,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Recent Activities - Interns Only */}
            {isIntern && (
              <Section title="Recent Activities" icon={<Clock size={20} />}>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {mockData.recentActivities.map((activity) => (
                    <div
                      key={activity.id}
                      style={{
                        padding: 10,
                        background: "rgba(103, 146, 137, 0.1)",
                        borderRadius: 8,
                        borderLeft: `3px solid ${COLORS.jungleTeal}`,
                      }}
                    >
                      <p style={{ fontSize: 13, color: COLORS.peachGlow, fontWeight: 500, margin: "0 0 4px 0" }}>
                        {activity.action}
                      </p>
                      <p style={{ fontSize: 11, color: "rgba(255, 229, 217, 0.6)", margin: 0 }}>
                        {activity.time}
                      </p>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>

      {/* Close Button */}
      <div style={{ marginTop: 24, display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={onClose}
          style={{
            ...buttonStyle,
            background: "transparent",
            border: "1px solid white",
          }}
        >
          Close
        </button>
      </div>
    </Modal>
  );
}

function StatBox({ icon, label, value, color, isText = false }) {
  return (
    <div
      style={{
        padding: 16,
        background: "rgba(103, 146, 137, 0.1)",
        border: "1px solid rgba(103, 146, 137, 0.3)",
        borderRadius: 12,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "rgba(255, 229, 217, 0.7)" }}>{label}</span>
        <div style={{ color }}>{icon}</div>
      </div>
      <p style={{ fontSize: isText ? 14 : 22, fontWeight: 700, color: COLORS.peachGlow, margin: 0 }}>
        {value}
      </p>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div>
      <h3 style={{ fontSize: 16, marginBottom: 12, display: "flex", alignItems: "center", gap: 8, color: COLORS.emeraldGlow }}>
        {icon} {title}
      </h3>
      <div style={{ background: "rgba(255,255,255,0.04)", padding: 16, borderRadius: 12, border: `1px solid ${COLORS.borderGlass}` }}>
        {children}
      </div>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.95)" }}>{value || "Not provided"}</div>
    </div>
  );
}

function Modal({ children, onClose, isMobile, large = false }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: `linear-gradient(135deg, ${COLORS.inkBlack}, ${COLORS.deepOcean})`,
          borderRadius: 20,
          padding: isMobile ? 20 : 28,
          maxWidth: large ? 900 : 500,
          width: "100%",
          border: `1px solid ${COLORS.borderGlass}`,
          color: "white",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {children}
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 12,
  border: `1px solid ${COLORS.borderGlass}`,
  background: COLORS.surfaceGlass,
  color: "white",
  outline: "none",
  fontSize: 14,
  boxSizing: "border-box",
};

const buttonStyle = {
  padding: "12px 20px",
  borderRadius: 12,
  border: "none",
  background: "white",
  color: COLORS.inkBlack,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
  transition: "all 0.2s",
};
