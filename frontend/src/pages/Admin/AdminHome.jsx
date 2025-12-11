import React, { useState, useEffect } from "react";
import { Users, UserCheck, UserX, LayoutDashboard, Activity, Shield, Plus, Trash2, Search, Eye, EyeOff } from "lucide-react";

const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
};

export default function AdminHome() {
  const [activeTab, setActiveTab] = useState("overview"); // overview | hr | pm | interns | logs
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalRole, setModalRole] = useState("hr"); // hr | pm
  const [isMobile, setIsMobile] = useState(false);

  // Form state for adding HR/PM
  const [newUser, setNewUser] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    pmCode: "",
  });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
      setUsers(storedUsers);
    } catch {
      setUsers([]);
    }
  };

  const getStats = () => {
    const interns = users.filter((u) => u.role === "intern").length;
    const hrs = users.filter((u) => u.role === "hr").length;
    const pms = users.filter((u) => u.role === "pm").length;
    const activeUsers = users.filter((u) => !u.disabled).length;
    return { interns, hrs, pms, activeUsers, total: users.length };
  };

  const stats = getStats();

  const handleAddUser = () => {
    if (!newUser.fullName || !newUser.email || !newUser.phone || !newUser.password) {
      alert("Please fill all required fields");
      return;
    }

    if (!/^\d{8}$/.test(newUser.password)) {
      alert("Password must be 8-digit numeric");
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

    const user = {
      role: modalRole,
      fullName: newUser.fullName,
      email: newUser.email.toLowerCase(),
      phone: newUser.phone,
      password: newUser.password,
      pmCode: modalRole === "pm" ? newUser.pmCode : null,
      createdAt: new Date().toISOString(),
      disabled: false,
    };

    const updatedUsers = [...users, user];
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setShowAddModal(false);
    setNewUser({ fullName: "", email: "", phone: "", password: "", pmCode: "" });
  };

  const handleRemoveUser = (email, role) => {
    if (!confirm(`Are you sure you want to remove this ${role.toUpperCase()}?`)) return;

    const updatedUsers = users.filter((u) => !(u.email === email && u.role === role));
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const handleToggleDisable = (email, role) => {
    const updatedUsers = users.map((u) => {
      if (u.email === email && u.role === role) {
        return { ...u, disabled: !u.disabled };
      }
      return u;
    });
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const filteredUsers = (role) => {
    return users
      .filter((u) => u.role === role)
      .filter((u) =>
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${COLORS.inkBlack} 0%, ${COLORS.deepOcean} 50%, ${COLORS.jungleTeal} 100%)`,
        color: "white",
        padding: isMobile ? 16 : 32,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Animated background orb */}
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
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <Shield size={isMobile ? 32 : 40} color={COLORS.peachGlow} />
            <h1 style={{ fontSize: isMobile ? 28 : 42, margin: 0, fontWeight: 800 }}>
              Admin Dashboard
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: isMobile ? 14 : 16 }}>
            Complete system control and user management
          </p>
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
              color={COLORS.peachGlow}
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
          </div>
        )}

        {/* Tab Navigation */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 24,
            flexWrap: "wrap",
            background: "rgba(255,255,255,0.04)",
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
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
            borderRadius: 24,
            padding: isMobile ? 16 : 32,
            border: "1px solid rgba(255,255,255,0.12)",
            minHeight: 400,
          }}
        >
          {activeTab === "overview" && <OverviewContent users={users} isMobile={isMobile} />}

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
              onToggleDisable={handleToggleDisable}
              isMobile={isMobile}
            />
          )}

          {activeTab === "interns" && (
            <InternsView
              users={filteredUsers("intern")}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onToggleDisable={handleToggleDisable}
              isMobile={isMobile}
            />
          )}

          {activeTab === "logs" && <ActivityLogs users={users} isMobile={isMobile} />}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <Modal onClose={() => setShowAddModal(false)} isMobile={isMobile}>
          <h2 style={{ marginBottom: 16, fontSize: isMobile ? 20 : 24 }}>
            Add New {modalRole.toUpperCase()}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              placeholder="Full Name"
              value={newUser.fullName}
              onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
              style={inputStyle}
            />
            <input
              placeholder="Email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              style={inputStyle}
            />
            <input
              placeholder="Phone Number"
              value={newUser.phone}
              onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
              style={inputStyle}
            />
            <input
              placeholder="Password (8-digit numeric)"
              type="password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              style={inputStyle}
            />
            {modalRole === "pm" && (
              <input
                placeholder="PM Code"
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
    </div>
  );
}

// Stat Card Component
function StatCard({ icon, label, value, color }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(10px)",
        padding: 20,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        alignItems: "center",
        gap: 16,
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

// Overview Content
function OverviewContent({ users, isMobile }) {
  const recentUsers = users.slice(-5).reverse();
  return (
    <div>
      <h3 style={{ marginBottom: 16, fontSize: isMobile ? 18 : 22 }}>Recent Registrations</h3>
      {recentUsers.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.6)" }}>No users registered yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {recentUsers.map((user, idx) => (
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
                <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>{user.fullName}</div>
                <div style={{ fontSize: isMobile ? 12 : 14, color: "rgba(255,255,255,0.6)" }}>
                  {user.email}
                </div>
              </div>
              <div
                style={{
                  background: COLORS.peachGlow,
                  color: COLORS.inkBlack,
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

// User Management (HR/PM)
function UserManagement({ role, users, searchTerm, setSearchTerm, onAdd, onRemove, onToggleDisable, isMobile }) {
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
              onToggleDisable={() => onToggleDisable(user.email, user.role)}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Interns View
function InternsView({ users, searchTerm, setSearchTerm, onToggleDisable, isMobile }) {
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
            <UserCard
              key={idx}
              user={user}
              onToggleDisable={() => onToggleDisable(user.email, user.role)}
              showRemove={false}
              isMobile={isMobile}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// User Card Component
function UserCard({ user, onRemove, onToggleDisable, showRemove = true, isMobile }) {
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
        opacity: user.disabled ? 0.5 : 1,
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>
          {user.fullName}
          {user.disabled && (
            <span style={{ color: COLORS.racingRed, fontSize: 12, marginLeft: 8 }}>(DISABLED)</span>
          )}
        </div>
        <div style={{ fontSize: isMobile ? 12 : 14, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
          {user.email}
        </div>
        {user.pmCode && (
          <div style={{ fontSize: 12, color: COLORS.peachGlow, marginTop: 4 }}>PM Code: {user.pmCode}</div>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onToggleDisable}
          style={{
            ...iconButtonStyle,
            background: user.disabled ? "#4ade80" : COLORS.racingRed,
          }}
          title={user.disabled ? "Enable User" : "Disable User"}
        >
          {user.disabled ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
        {showRemove && (
          <button onClick={onRemove} style={{ ...iconButtonStyle, background: COLORS.racingRed }} title="Remove User">
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

// Activity Logs
function ActivityLogs({ users, isMobile }) {
  const logs = users.map((u) => ({
    action: `User registered: ${u.fullName}`,
    role: u.role,
    timestamp: u.createdAt,
  })).reverse();

  return (
    <div>
      <h3 style={{ marginBottom: 20, fontSize: isMobile ? 18 : 22 }}>Activity Logs ({logs.length})</h3>
      {logs.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.6)" }}>No activity logs yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {logs.map((log, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(255,255,255,0.04)",
                padding: isMobile ? 12 : 16,
                borderRadius: 10,
                fontSize: isMobile ? 13 : 14,
              }}
            >
              <div style={{ fontWeight: 600 }}>{log.action}</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 4 }}>
                {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Modal Component
function Modal({ children, onClose, isMobile }) {
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
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: `linear-gradient(135deg, ${COLORS.inkBlack}, ${COLORS.deepOcean})`,
          borderRadius: 20,
          padding: isMobile ? 24 : 32,
          maxWidth: 500,
          width: "100%",
          border: "1px solid rgba(255,255,255,0.12)",
          color: "white",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Styles
const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  outline: "none",
  fontSize: 14,
};

const buttonStyle = {
  padding: "10px 20px",
  borderRadius: 999,
  border: "none",
  background: "white",
  color: COLORS.inkBlack,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
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
};