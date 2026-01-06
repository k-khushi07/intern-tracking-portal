//AdminHome.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Users, UserCheck, UserX, LayoutDashboard, Activity, Shield, 
  Plus, Trash2, Search, Eye, LogOut, Bell, X, Check, 
  Filter, Calendar, User, Mail, Phone, ChevronDown, Archive,
  Briefcase, GraduationCap, MapPin, FileText
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

  const logout = () => {
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

  const handleAddUser = () => {
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
    // Reset all filters
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

        {/* Stats Cards */}
        {activeTab === "overview" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            <StatCard
              icon={<Users size={28} />}
              label="Total Users"
              value={stats.total}
              color={COLORS.emeraldGlow}
            />
            <StatCard
              icon={<UserCheck size={28} />}
              label="Active Users"
              value={stats.activeUsers}
              color="#4ade80"
            />
            <StatCard
              icon={<LayoutDashboard size={28} />}
              label="Interns"
              value={stats.interns}
              color={COLORS.jungleTeal}
            />
            <StatCard
              icon={<Activity size={28} />}
              label="HR Staff"
              value={stats.hrs}
              color={COLORS.deepOcean}
            />
            <StatCard
              icon={<Shield size={28} />}
              label="Project Managers"
              value={stats.pms}
              color="#a78bfa"
            />
            <StatCard
              icon={<UserX size={28} />}
              label="Pending Interns"
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

function StatCard({ icon, label, value, color }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(14px)",
        padding: 20,
        borderRadius: 18,
        border: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        gap: 16,
        boxShadow: `0 8px 30px ${color}40`,
      }}
    >
      <div style={{ color }}>{icon}</div>
      <div>
        <div style={{ fontSize: 32, fontWeight: 800, color }}>{value}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{label}</div>
      </div>
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
        <p style={{ color: "rgba(255,255,255,0.6)" }}>No {role.toUpperCase()} users found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {users.map((user, idx) => (
            <UserCard
              key={idx}
              user={user}
              onRemove={() => onRemove(user.email, user.role)}
              onViewProfile={() => onViewProfile(user)}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InternsView({ users, searchTerm, setSearchTerm, onViewProfile, onArchive, onDelete, isMobile }) {
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
        <p style={{ color: "rgba(255,255,255,0.6)" }}>No interns found.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {users.map((user, idx) => (
            <InternCard
              key={idx}
              user={user}
              onViewProfile={() => onViewProfile(user)}
              onArchive={() => onArchive(user)}
              onDelete={() => onDelete(user)}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function UserCard({ user, onRemove, onViewProfile, isMobile }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        padding: isMobile ? 14 : 18,
        borderRadius: 12,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>
          {user.fullName}
        </div>
        <div style={{ fontSize: isMobile ? 12 : 14, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
          {user.email}
        </div>
        {user.pmCode && (
          <div style={{ fontSize: 12, color: COLORS.emeraldGlow, marginTop: 4 }}>PM Code: {user.pmCode}</div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onViewProfile}
          style={{
            ...iconButtonStyle,
            background: COLORS.jungleTeal,
          }}
          title="View Profile"
        >
          <Eye size={16} />
        </button>
        <button 
          onClick={onRemove} 
          style={{ ...iconButtonStyle, background: COLORS.racingRed }} 
          title="Remove User"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function InternCard({ user, onViewProfile, onArchive, onDelete, isMobile }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        padding: isMobile ? 14 : 18,
        borderRadius: 12,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>
          {user.fullName}
        </div>
        <div style={{ fontSize: isMobile ? 12 : 14, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
          {user.email}
        </div>
        {user.pmCode && (
          <div style={{ fontSize: 12, color: COLORS.emeraldGlow, marginTop: 4 }}>PM Code: {user.pmCode}</div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={onViewProfile}
          style={{
            ...iconButtonStyle,
            background: COLORS.jungleTeal,
          }}
          title="View Profile"
        >
          <Eye size={16} />
        </button>
        <button
          onClick={onArchive}
          style={{
            ...iconButtonStyle,
            background: COLORS.deepOcean,
          }}
          title="Archive Intern"
        >
          <Archive size={16} />
        </button>
        <button 
          onClick={onDelete} 
          style={{ ...iconButtonStyle, background: COLORS.racingRed }} 
          title="Delete Intern"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

function ActivityLogs({ archivedInterns, onViewProfile, isMobile }) {
  return (
    <div>
      <h3 style={{ marginBottom: 20, fontSize: isMobile ? 18 : 22 }}>
        Activity Logs - Archived Interns ({archivedInterns.length})
      </h3>
      {archivedInterns.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.6)" }}>No archived interns yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {archivedInterns.map((intern, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(255,255,255,0.04)",
                padding: isMobile ? 14 : 18,
                borderRadius: 12,
                border: `1px solid ${intern.status === "completed" ? COLORS.emeraldGlow : COLORS.racingRed}40`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>
                    {intern.fullName}
                  </div>
                  <div style={{ fontSize: isMobile ? 12 : 14, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
                    {intern.email}
                  </div>
                </div>
                <div
                  style={{
                    background: intern.status === "completed" ? COLORS.emeraldGlow : COLORS.racingRed,
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  {intern.status}
                </div>
              </div>
              
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
                <strong>Reason:</strong> {intern.archiveReason}
              </div>
              
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>
                Archived on: {new Date(intern.archivedAt).toLocaleString()} • By: {intern.archivedBy}
              </div>
              
              <button
                onClick={() => onViewProfile(intern)}
                style={{
                  ...buttonStyle,
                  background: COLORS.jungleTeal,
                  padding: "8px 16px",
                  fontSize: 13,
                }}
              >
                <Eye size={14} /> View Full Profile
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

  return (
    <Modal onClose={onClose} isMobile={isMobile} large>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: isMobile ? 22 : 28, margin: 0, marginBottom: 8 }}>
          {user.fullName}
        </h2>
        <div
          style={{
            display: "inline-block",
            background: COLORS.jungleTeal,
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

      <div style={{ maxHeight: "60vh", overflowY: "auto", paddingRight: 8 }}>
        <Section title="Basic Information" icon={<User size={20} />}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <InfoField label="Email" value={user.email} />
            <InfoField label="Phone" value={user.phone} />
            {user.dob && <InfoField label="Date of Birth" value={user.dob} />}
            {profile.bloodGroup && <InfoField label="Blood Group" value={profile.bloodGroup} />}
          </div>
        </Section>

        {isIntern && profile.address && (
          <Section title="Address" icon={<MapPin size={20} />}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
              <InfoField label="Full Address" value={profile.address} fullWidth />
              <InfoField label="City" value={profile.city} />
              <InfoField label="State" value={profile.state} />
              <InfoField label="Pincode" value={profile.pincode} />
            </div>
          </Section>
        )}

        {isIntern && profile.emergencyContactName && (
          <Section title="Emergency Contact" icon={<Phone size={20} />}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
              <InfoField label="Contact Name" value={profile.emergencyContactName} />
              <InfoField label="Relation" value={profile.emergencyRelation} />
              <InfoField label="Phone" value={profile.emergencyContactPhone} />
            </div>
          </Section>
        )}

        {isIntern && profile.collegeName && (
          <Section title="Academic Details" icon={<GraduationCap size={20} />}>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
              <InfoField label="College" value={profile.collegeName} fullWidth />
              <InfoField label="Department" value={profile.department} />
              <InfoField label="Semester" value={profile.semester} />
              <InfoField label="Guide Name" value={profile.guideName} />
              <InfoField label="Guide Email" value={profile.guideEmail} />
              <InfoField label="Guide Phone" value={profile.guidePhone} />
            </div>
          </Section>
        )}

        {isIntern && profile.internshipDuration && (
          <>
            <Section title="Internship Details" icon={<Briefcase size={20} />}>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
                <InfoField label="Duration" value={profile.internshipDuration} />
                <InfoField label="Work Mode" value={profile.workMode} />
                <InfoField label="Expected Outcome" value={profile.expectedOutcome} fullWidth />
              </div>
              {profile.bio && (
                <div style={{ marginTop: 16 }}>
                  <InfoField label="Bio" value={profile.bio} fullWidth />
                </div>
              )}
            </Section>

            <Section title="Internship Timeline" icon={<Calendar size={20} />}>
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                gap: 16, 
                padding: 20,
                background: "rgba(255,255,255,0.05)",
                borderRadius: 12,
                flexWrap: "wrap"
              }}>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>Start Date</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.emeraldGlow }}>
                    {profile.startDate ? new Date(profile.startDate).toLocaleDateString() : "N/A"}
                  </div>
                </div>
                <div style={{ fontSize: 24, color: COLORS.jungleTeal }}>→</div>
                <div style={{ flex: 1, minWidth: 150 }}>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>End Date</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: COLORS.racingRed }}>
                    {profile.endDate ? new Date(profile.endDate).toLocaleDateString() : "N/A"}
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Projects" icon={<FileText size={20} />}>
              <div style={{ 
                padding: 20, 
                background: "rgba(255,255,255,0.05)", 
                borderRadius: 12,
                textAlign: "center",
                color: "rgba(255,255,255,0.6)"
              }}>
                No projects submitted yet
              </div>
            </Section>

            <Section title="Monthly Progress" icon={<Activity size={20} />}>
              <div style={{ 
                padding: 20, 
                background: "rgba(255,255,255,0.05)", 
                borderRadius: 12,
                textAlign: "center",
                color: "rgba(255,255,255,0.6)"
              }}>
                No progress updates yet
              </div>
            </Section>
          </>
        )}
      </div>

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

function Section({ title, icon, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h3 style={{ fontSize: 18, marginBottom: 16, display: "flex", alignItems: "center", gap: 8, color: COLORS.emeraldGlow }}>
        {icon} {title}
      </h3>
      <div style={{ background: "rgba(255,255,255,0.04)", padding: 20, borderRadius: 16, border: `1px solid ${COLORS.borderGlass}` }}>
        {children}
      </div>
    </div>
  );
}

function InfoField({ label, value, fullWidth }) {
  return (
    <div style={{ gridColumn: fullWidth ? "1 / -1" : "auto" }}>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.95)" }}>{value || "Not provided"}</div>
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
          padding: isMobile ? 24 : 32,
          maxWidth: large ? 800 : 500,
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

const iconButtonStyle = {
  padding: 8,
  borderRadius: 8,
  border: "none",
  color: "white",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s",
};