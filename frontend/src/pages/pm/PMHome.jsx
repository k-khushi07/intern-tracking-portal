import React, { useState, useEffect } from "react";
import { Users, MessageCircle, Bell, User, Search, Eye, Calendar, Award, Phone, Mail, GraduationCap, MapPin } from "lucide-react";
import ChatSystem from "../../components/ChatSystem";

const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
};

export default function PMHome() {
  const [activeTab, setActiveTab] = useState("overview");
  const [currentPM, setCurrentPM] = useState(null);
  const [assignedInterns, setAssignedInterns] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [announcements] = useState([
    {
      id: 1,
      title: "Weekly Team Meeting",
      message: "Join us every Monday at 10 AM for team sync-up.",
      date: "2024-01-15",
      priority: "high"
    },
    {
      id: 2,
      title: "Project Deadline Update",
      message: "Phase 1 deliverables are due by end of this week.",
      date: "2024-01-14",
      priority: "medium"
    },
    {
      id: 3,
      title: "New Resources Available",
      message: "Check the shared drive for updated documentation.",
      date: "2024-01-10",
      priority: "low"
    }
  ]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    loadCurrentPM();
  }, []);

  useEffect(() => {
    if (currentPM) {
      loadAssignedInterns();
    }
  }, [currentPM]);

  const loadCurrentPM = () => {
    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
      if (user.role === "pm") {
        setCurrentPM(user);
      }
    } catch (error) {
      console.error("Error loading PM:", error);
    }
  };

  const loadAssignedInterns = () => {
    try {
      const allUsers = JSON.parse(localStorage.getItem("users") || "[]");
      const interns = allUsers.filter(
        (u) => u.role === "intern" && u.pmCode === currentPM?.pmCode && !u.disabled
      );
      setAssignedInterns(interns);
    } catch (error) {
      console.error("Error loading interns:", error);
      setAssignedInterns([]);
    }
  };

  const filteredInterns = assignedInterns.filter(
    (intern) =>
      intern.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      intern.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewProfile = (intern) => {
    setSelectedIntern(intern);
    setShowProfileModal(true);
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
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "-5%",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
            opacity: 0.3,
            filter: "blur(100px)",
            animation: "pulse 4s ease-in-out infinite",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            right: "-5%",
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
            <Award size={isMobile ? 32 : 40} color={COLORS.peachGlow} />
            <h1 style={{ fontSize: isMobile ? 28 : 42, margin: 0, fontWeight: 800 }}>
              PM Dashboard
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: isMobile ? 14 : 16 }}>
            Welcome back, {currentPM?.fullName || "Project Manager"} • PM Code: {currentPM?.pmCode || "N/A"}
          </p>
        </div>

        {activeTab === "overview" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 16,
              marginBottom: 32,
            }}
          >
            <StatCard icon={<Users size={28} />} label="Assigned Interns" value={assignedInterns.length} color={COLORS.peachGlow} />
            <StatCard icon={<MessageCircle size={28} />} label="Unread Messages" value={0} color={COLORS.jungleTeal} />
            <StatCard icon={<Bell size={28} />} label="Announcements" value={announcements.length} color="#a78bfa" />
            <StatCard icon={<Award size={28} />} label="Active Projects" value={assignedInterns.length} color="#4ade80" />
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
            { id: "interns", label: "My Interns" },
            { id: "announcements", label: "Announcements" },
            { id: "chat", label: "Messages" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: isMobile ? "1 1 45%" : "0 0 auto",
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
              interns={assignedInterns}
              announcements={announcements}
              isMobile={isMobile}
              onViewProfile={handleViewProfile}
            />
          )}

          {activeTab === "interns" && (
            <InternsManagement
              interns={filteredInterns}
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              onViewProfile={handleViewProfile}
              isMobile={isMobile}
            />
          )}

          {activeTab === "announcements" && (
            <AnnouncementsView announcements={announcements} isMobile={isMobile} />
          )}

          {activeTab === "chat" && <ChatSystem userRole="pm" currentUser={currentPM} />}
        </div>
      </div>

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

function OverviewContent({ interns, announcements, isMobile, onViewProfile }) {
  const recentInterns = interns.slice(0, 3);
  const recentAnnouncements = announcements.slice(0, 2);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <h3 style={{ marginBottom: 16, fontSize: isMobile ? 18 : 22, display: "flex", alignItems: "center", gap: 8 }}>
          <Users size={22} /> Your Team Overview
        </h3>
        <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>
          You are currently managing {interns.length} intern{interns.length !== 1 ? "s" : ""}.
        </p>
      </div>

      <div>
        <h3 style={{ marginBottom: 16, fontSize: isMobile ? 18 : 22 }}>Recently Active Interns</h3>
        {recentInterns.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.6)" }}>No interns assigned yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentInterns.map((intern, idx) => (
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
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 18,
                    }}
                  >
                    {intern.fullName?.charAt(0) || "I"}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>{intern.fullName}</div>
                    <div style={{ fontSize: isMobile ? 12 : 14, color: "rgba(255,255,255,0.6)" }}>{intern.email}</div>
                  </div>
                </div>
                <button onClick={() => onViewProfile(intern)} style={buttonStyle}>
                  <Eye size={16} /> View Profile
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 style={{ marginBottom: 16, fontSize: isMobile ? 18 : 22 }}>Latest Announcements</h3>
        {recentAnnouncements.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.6)" }}>No announcements yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentAnnouncements.map((ann) => (
              <div
                key={ann.id}
                style={{
                  background: "rgba(255,255,255,0.04)",
                  padding: 16,
                  borderRadius: 12,
                  borderLeft: `4px solid ${getPriorityColor(ann.priority)}`,
                }}
              >
                <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16, marginBottom: 4 }}>{ann.title}</div>
                <div style={{ fontSize: isMobile ? 12 : 14, color: "rgba(255,255,255,0.7)" }}>{ann.message}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
                  {new Date(ann.date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InternsManagement({ interns, searchTerm, setSearchTerm, onViewProfile, isMobile }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <h3 style={{ margin: 0, fontSize: isMobile ? 18 : 22 }}>My Interns ({interns.length})</h3>
      </div>

      <div style={{ position: "relative", marginBottom: 20 }}>
        <Search
          size={18}
          style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.5)" }}
        />
        <input
          placeholder="Search interns by name or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{ ...inputStyle, paddingLeft: 44 }}
        />
      </div>

      {interns.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <Users size={48} color="rgba(255,255,255,0.3)" style={{ marginBottom: 16 }} />
          <p style={{ color: "rgba(255,255,255,0.6)" }}>
            {searchTerm ? "No interns found matching your search." : "No interns assigned to you yet."}
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {interns.map((intern, idx) => (
            <InternCard key={idx} intern={intern} onViewProfile={onViewProfile} isMobile={isMobile} />
          ))}
        </div>
      )}
    </div>
  );
}

function InternCard({ intern, onViewProfile, isMobile }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        padding: 20,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        transition: "all 0.3s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
        e.currentTarget.style.transform = "translateY(-4px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 22,
          }}
        >
          {intern.fullName?.charAt(0) || "I"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{intern.fullName}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{intern.degree || "Intern"}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 13 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.7)" }}>
          <Mail size={14} />
          {intern.email}
        </div>
        {intern.phone && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.7)" }}>
            <Phone size={14} />
            {intern.phone}
          </div>
        )}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button onClick={() => onViewProfile(intern)} style={{ ...buttonStyle, flex: 1 }}>
          <Eye size={16} /> View Profile
        </button>
        <button style={{ ...buttonStyle, flex: 1, background: COLORS.jungleTeal }}>
          <MessageCircle size={16} /> Chat
        </button>
      </div>
    </div>
  );
}

function AnnouncementsView({ announcements, isMobile }) {
  return (
    <div>
      <h3 style={{ marginBottom: 20, fontSize: isMobile ? 18 : 22 }}>All Announcements ({announcements.length})</h3>
      {announcements.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.6)" }}>No announcements yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {announcements.map((ann) => (
            <div
              key={ann.id}
              style={{
                background: "rgba(255,255,255,0.04)",
                padding: 20,
                borderRadius: 12,
                borderLeft: `4px solid ${getPriorityColor(ann.priority)}`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8 }}>
                <div style={{ fontWeight: 700, fontSize: isMobile ? 16 : 18 }}>{ann.title}</div>
                <div
                  style={{
                    background: getPriorityColor(ann.priority),
                    color: "white",
                    padding: "4px 12px",
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: "uppercase",
                  }}
                >
                  {ann.priority}
                </div>
              </div>
              <div style={{ fontSize: isMobile ? 13 : 14, color: "rgba(255,255,255,0.7)", marginBottom: 12 }}>{ann.message}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                <Calendar size={14} />
                {new Date(ann.date).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
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
        <ProfileField icon={<Mail size={18} />} label="Email" value={intern.email} />
        <ProfileField icon={<Phone size={18} />} label="Phone" value={intern.phone || "Not provided"} />
        <ProfileField icon={<Calendar size={18} />} label="Date of Birth" value={intern.dob || "Not provided"} />
        <ProfileField icon={<GraduationCap size={18} />} label="Degree" value={intern.degree || "Not provided"} />
        <ProfileField icon={<MapPin size={18} />} label="PM Code" value={intern.pmCode || "Not assigned"} />
        <ProfileField
          icon={<Calendar size={18} />}
          label="Joined"
          value={intern.createdAt ? new Date(intern.createdAt).toLocaleDateString() : "Unknown"}
        />
      </div>
    </div>
  );
}

function ProfileField({ icon, label, value }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", padding: 16, borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ color: COLORS.peachGlow }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 2 }}>{label}</div>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{value}</div>
      </div>
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

function getPriorityColor(priority) {
  switch (priority) {
    case "high":
      return COLORS.racingRed;
    case "medium":
      return "#f59e0b";
    case "low":
      return "#4ade80";
    default:
      return COLORS.jungleTeal;
  }
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

const buttonStyle = {
  padding: "10px 16px",
  borderRadius: 999,
  border: "none",
  background: "white",
  color: COLORS.inkBlack,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontSize: 13,
  transition: "all 0.2s",
};