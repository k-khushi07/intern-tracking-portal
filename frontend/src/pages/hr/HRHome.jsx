import React, { useState, useEffect } from "react";
import { Users, UserCheck, UserX, Clock, MessageCircle, Award, Search, Eye, EyeOff, Check, X, Key, Mail, Phone } from "lucide-react";
import ChatSystem from "../../components/ChatSystem";

const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
};

export default function HRHome() {
  const [activeTab, setActiveTab] = useState("overview");
  const [currentHR, setCurrentHR] = useState(null);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [pmCodeInput, setPmCodeInput] = useState("");
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    loadCurrentHR();
    loadUsers();
  }, []);

  const loadCurrentHR = () => {
    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
      if (user.role === "hr") {
        setCurrentHR(user);
      }
    } catch (error) {
      console.error("Error loading HR:", error);
    }
  };

  const loadUsers = () => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
      setUsers(storedUsers);
    } catch {
      setUsers([]);
    }
  };

  const getStats = () => {
    const pendingInterns = users.filter((u) => u.role === "intern" && !u.status).length;
    const activeInterns = users.filter((u) => u.role === "intern" && u.status === "active").length;
    const totalInterns = users.filter((u) => u.role === "intern").length;
    const pms = users.filter((u) => u.role === "pm").length;
    return { pendingInterns, activeInterns, totalInterns, pms };
  };

  const stats = getStats();

  const handleApproveClick = (intern) => {
    setSelectedIntern(intern);
    setPmCodeInput("");
    setShowApprovalModal(true);
  };

  const handleApproveIntern = () => {
    if (!pmCodeInput) {
      alert("Please enter a PM Code");
      return;
    }

    const pmExists = users.find((u) => u.role === "pm" && u.pmCode === pmCodeInput);
    if (!pmExists) {
      alert("Invalid PM Code. Please verify the PM Code exists.");
      return;
    }

    const updatedUsers = users.map((u) => {
      if (u.email === selectedIntern.email && u.role === "intern") {
        return {
          ...u,
          pmCode: pmCodeInput,
          status: "pending_profile_completion",
          approvedBy: currentHR?.email,
          approvedAt: new Date().toISOString(),
        };
      }
      return u;
    });

    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setShowApprovalModal(false);
    alert(`Intern ${selectedIntern.fullName} approved with PM Code: ${pmCodeInput}`);
  };

  const handleRejectIntern = (intern) => {
    if (!confirm(`Are you sure you want to reject ${intern.fullName}?`)) return;

    const updatedUsers = users.filter((u) => !(u.email === intern.email && u.role === "intern"));
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

  const handleViewProfile = (intern) => {
    setSelectedIntern(intern);
    setShowProfileModal(true);
  };

  const filteredInterns = (status) => {
    return users
      .filter((u) => {
        if (u.role !== "intern") return false;
        if (status === "pending") return !u.status;
        if (status === "active") return u.status === "active";
        return true;
      })
      .filter((u) =>
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
  };

  const allPMs = users.filter((u) => u.role === "pm");

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
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: "20%",
            right: "-10%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
            opacity: 0.25,
            filter: "blur(100px)",
            animation: "pulse 4s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "15%",
            left: "-5%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.peachGlow})`,
            opacity: 0.2,
            filter: "blur(100px)",
            animation: "pulse 5s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.08); }
        }
      `}</style>

      <div style={{ position: "relative", zIndex: 10, maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <UserCheck size={isMobile ? 32 : 40} color={COLORS.peachGlow} />
            <h1 style={{ fontSize: isMobile ? 28 : 42, margin: 0, fontWeight: 800 }}>HR Dashboard</h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: isMobile ? 14 : 16 }}>
            Welcome back, {currentHR?.fullName || "HR"}! Manage intern registrations and approvals.
          </p>
        </div>

        {activeTab === "overview" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            <StatCard icon={<Clock size={28} />} label="Pending Approvals" value={stats.pendingInterns} color="#f59e0b" />
            <StatCard icon={<UserCheck size={28} />} label="Active Interns" value={stats.activeInterns} color="#4ade80" />
            <StatCard icon={<Users size={28} />} label="Total Interns" value={stats.totalInterns} color={COLORS.peachGlow} />
            <StatCard icon={<Award size={28} />} label="Project Managers" value={stats.pms} color="#a78bfa" />
          </div>
        )}

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
            { id: "pending", label: `Pending (${stats.pendingInterns})` },
            { id: "active", label: "Active Interns" },
            { id: "pms", label: "Project Managers" },
            { id: "chat", label: "Messages" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: isMobile ? "1 1 45%" : "0 0 auto",
                padding: "12px 20px",
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
          {activeTab === "overview" && (
            <OverviewContent
              pendingInterns={filteredInterns("pending")}
              activeInterns={filteredInterns("active")}
              onApprove={handleApproveClick}
              onReject={handleRejectIntern}
              onViewProfile={handleViewProfile}
              isMobile={isMobile}
            />
          )}

          {activeTab === "pending" && (
            <PendingInterns
              interns={filteredInterns("pending")}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onApprove={handleApproveClick}
              onReject={handleRejectIntern}
              isMobile={isMobile}
            />
          )}

          {activeTab === "active" && (
            <ActiveInterns
              interns={filteredInterns("active")}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onViewProfile={handleViewProfile}
              onToggleDisable={handleToggleDisable}
              isMobile={isMobile}
            />
          )}

          {activeTab === "pms" && <PMsList pms={allPMs} isMobile={isMobile} />}

          {activeTab === "chat" && <ChatSystem userRole="hr" currentUser={currentHR} />}
        </div>
      </div>

      {showApprovalModal && (
        <Modal onClose={() => setShowApprovalModal(false)} isMobile={isMobile}>
          <h2 style={{ marginBottom: 16, fontSize: isMobile ? 20 : 24 }}>Approve Intern</h2>
          <div style={{ marginBottom: 20 }}>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
              Approving: <strong>{selectedIntern?.fullName}</strong>
            </p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{selectedIntern?.email}</p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14 }}>Assign PM Code</label>
            <div style={{ position: "relative" }}>
              <Key
                size={18}
                style={{
                  position: "absolute",
                  left: 14,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "rgba(255,255,255,0.5)",
                }}
              />
              <input
                placeholder="Enter PM Code (e.g., PM001)"
                value={pmCodeInput}
                onChange={(e) => setPmCodeInput(e.target.value)}
                style={{ ...inputStyle, paddingLeft: 44 }}
              />
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>
              Make sure the PM Code exists in the system
            </p>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={handleApproveIntern} style={primaryButtonStyle}>
              <Check size={18} /> Approve
            </button>
            <button
              onClick={() => setShowApprovalModal(false)}
              style={{ ...primaryButtonStyle, background: "transparent", border: "1px solid white" }}
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}

      {showProfileModal && selectedIntern && (
        <Modal onClose={() => setShowProfileModal(false)} isMobile={isMobile}>
          <InternProfileView intern={selectedIntern} isMobile={isMobile} />
        </Modal>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{ color }}>{icon}</div>
      <div>
        <div style={{ fontSize: 32, fontWeight: 800, color }}>{value}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginTop: 2 }}>{label}</div>
      </div>
    </div>
  );
}

function OverviewContent({ pendingInterns, activeInterns, onApprove, onReject, onViewProfile, isMobile }) {
  const recentPending = pendingInterns.slice(0, 3);
  const recentActive = activeInterns.slice(0, 3);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <h3 style={{ marginBottom: 16, fontSize: isMobile ? 18 : 22, display: "flex", alignItems: "center", gap: 8 }}>
          <Clock size={22} /> Pending Approvals ({pendingInterns.length})
        </h3>
        {recentPending.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.6)" }}>No pending registrations.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentPending.map((intern, idx) => (
              <PendingInternCard key={idx} intern={intern} onApprove={onApprove} onReject={onReject} isMobile={isMobile} />
            ))}
            {pendingInterns.length > 3 && (
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontStyle: "italic" }}>
                + {pendingInterns.length - 3} more pending...
              </p>
            )}
          </div>
        )}
      </div>

      <div>
        <h3 style={{ marginBottom: 16, fontSize: isMobile ? 18 : 22, display: "flex", alignItems: "center", gap: 8 }}>
          <UserCheck size={22} /> Recently Active Interns
        </h3>
        {recentActive.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.6)" }}>No active interns yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentActive.map((intern, idx) => (
              <ActiveInternCard key={idx} intern={intern} onViewProfile={onViewProfile} isMobile={isMobile} showActions={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PendingInterns({ interns, searchTerm, setSearchTerm, onApprove, onReject, isMobile }) {
  return (
    <div>
      <h3 style={{ marginBottom: 20, fontSize: isMobile ? 18 : 22 }}>Pending Registrations ({interns.length})</h3>

      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.5)" }} />
        <input placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...inputStyle, paddingLeft: 44 }} />
      </div>

      {interns.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Clock size={48} color="rgba(255,255,255,0.3)" style={{ marginBottom: 16 }} />
          <p style={{ color: "rgba(255,255,255,0.6)" }}>
            {searchTerm ? "No pending interns found." : "No pending registrations at this time."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {interns.map((intern, idx) => (
            <PendingInternCard key={idx} intern={intern} onApprove={onApprove} onReject={onReject} isMobile={isMobile} />
          ))}
        </div>
      )}
    </div>
  );
}

function PendingInternCard({ intern, onApprove, onReject, isMobile }) {
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
        borderLeft: `4px solid #f59e0b`,
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>{intern.fullName}</div>
        <div style={{ fontSize: isMobile ? 12 : 14, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{intern.email}</div>
        {intern.phone && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{intern.phone}</div>}
        {intern.degree && <div style={{ fontSize: 12, color: COLORS.peachGlow, marginTop: 4 }}>{intern.degree}</div>}
      </div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => onApprove(intern)} style={{ ...actionButtonStyle, background: "#4ade80" }}>
          <Check size={16} /> Approve
        </button>
        <button onClick={() => onReject(intern)} style={{ ...actionButtonStyle, background: COLORS.racingRed }}>
          <X size={16} /> Reject
        </button>
      </div>
    </div>
  );
}

function ActiveInterns({ interns, searchTerm, setSearchTerm, onViewProfile, onToggleDisable, isMobile }) {
  return (
    <div>
      <h3 style={{ marginBottom: 20, fontSize: isMobile ? 18 : 22 }}>Active Interns ({interns.length})</h3>

      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.5)" }} />
        <input placeholder="Search interns..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ ...inputStyle, paddingLeft: 44 }} />
      </div>

      {interns.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Users size={48} color="rgba(255,255,255,0.3)" style={{ marginBottom: 16 }} />
          <p style={{ color: "rgba(255,255,255,0.6)" }}>
            {searchTerm ? "No active interns found." : "No active interns yet."}
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {interns.map((intern, idx) => (
            <ActiveInternCard key={idx} intern={intern} onViewProfile={onViewProfile} onToggleDisable={onToggleDisable} isMobile={isMobile} showActions={true} />
          ))}
        </div>
      )}
    </div>
  );
}

function ActiveInternCard({ intern, onViewProfile, onToggleDisable, isMobile, showActions }) {
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
        opacity: intern.disabled ? 0.5 : 1,
      }}
    >
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>
          {intern.fullName}
          {intern.disabled && <span style={{ color: COLORS.racingRed, fontSize: 12, marginLeft: 8 }}>(DISABLED)</span>}
        </div>
        <div style={{ fontSize: isMobile ? 12 : 14, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{intern.email}</div>
        {intern.pmCode && <div style={{ fontSize: 12, color: COLORS.peachGlow, marginTop: 4 }}>PM Code: {intern.pmCode}</div>}
      </div>
      {showActions && (
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => onViewProfile(intern)} style={{ ...actionButtonStyle, background: COLORS.jungleTeal }}>
            <Eye size={16} /> View
          </button>
          <button onClick={() => onToggleDisable(intern.email, intern.role)} style={{ ...actionButtonStyle, background: intern.disabled ? "#4ade80" : COLORS.racingRed }}>
            {intern.disabled ? <Eye size={16} /> : <EyeOff size={16} />}
            {intern.disabled ? "Enable" : "Disable"}
          </button>
        </div>
      )}
    </div>
  );
}

function PMsList({ pms, isMobile }) {
  return (
    <div>
      <h3 style={{ marginBottom: 20, fontSize: isMobile ? 18 : 22 }}>Project Managers ({pms.length})</h3>

      {pms.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.6)" }}>No project managers in the system.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {pms.map((pm, idx) => (
            <PMCard key={idx} pm={pm} isMobile={isMobile} />
          ))}
        </div>
      )}
    </div>
  );
}

function PMCard({ pm, isMobile }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: `linear-gradient(135deg, #a78bfa, ${COLORS.jungleTeal})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 18,
          }}
        >
          {pm.fullName?.charAt(0) || "P"}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{pm.fullName}</div>
          <div style={{ fontSize: 12, color: COLORS.peachGlow, fontWeight: 600 }}>PM Code: {pm.pmCode}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.7)" }}>
          <Mail size={14} />
          {pm.email}
        </div>
        {pm.phone && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.7)" }}>
            <Phone size={14} />
            {pm.phone}
          </div>
        )}
      </div>
    </div>
  );
}

function InternProfileView({ intern, isMobile }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 32,
          }}
        >
          {intern.fullName?.charAt(0) || "I"}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: isMobile ? 22 : 26 }}>{intern.fullName}</h2>
          <p style={{ color: "rgba(255,255,255,0.7)", margin: "4px 0 0 0" }}>{intern.degree || "Intern"}</p>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <ProfileField label="Email" value={intern.email} />
        <ProfileField label="Phone" value={intern.phone || "Not provided"} />
        <ProfileField label="Date of Birth" value={intern.dob || "Not provided"} />
        <ProfileField label="Degree" value={intern.degree || "Not provided"} />
        <ProfileField label="PM Code" value={intern.pmCode || "Not assigned"} />
        <ProfileField label="Status" value={intern.status === "active" ? "Active" : "Pending Profile Completion"} />
        {intern.approvedBy && <ProfileField label="Approved By" value={intern.approvedBy} />}
      </div>
    </div>
  );
}

function ProfileField({ label, value }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", padding: 16, borderRadius: 12 }}>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{value}</div>
    </div>
  );
}

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
          maxWidth: 600,
          width: "100%",
          border: "1px solid rgba(255,255,255,0.12)",
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
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  outline: "none",
  fontSize: 14,
};

const primaryButtonStyle = {
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
const actionButtonStyle = {
padding: "8px 16px",
borderRadius: 999,
border: "none",
color: "white",
fontWeight: 700,
cursor: "pointer",
display: "flex",
alignItems: "center",
gap: 6,
fontSize: 13,
};