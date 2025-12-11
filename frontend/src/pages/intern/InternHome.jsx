import React, { useState, useEffect } from "react";
import { User, Bell, MessageCircle, FileText, Award, Calendar, MapPin, Briefcase, Mail, Phone, Heart, GraduationCap, Eye } from "lucide-react";
import ChatSystem from "../../components/ChatSystem";

const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
};

export default function InternHome() {
  const [activeTab, setActiveTab] = useState("overview");
  const [currentIntern, setCurrentIntern] = useState(null);
  const [assignedPM, setAssignedPM] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  const [announcements] = useState([
    {
      id: 1,
      title: "Welcome to the Team!",
      message: "We're excited to have you on board. Complete your profile and start your internship journey.",
      date: "2024-01-15",
      priority: "high",
      from: "HR Team"
    },
    {
      id: 2,
      title: "Weekly Check-in Reminder",
      message: "Remember to submit your weekly progress report every Friday by 5 PM.",
      date: "2024-01-14",
      priority: "medium",
      from: "Your PM"
    },
    {
      id: 3,
      title: "Learning Resources Available",
      message: "Check out our resource library for tutorials and documentation to help with your projects.",
      date: "2024-01-10",
      priority: "low",
      from: "HR Team"
    }
  ]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    loadCurrentIntern();
  }, []);

  useEffect(() => {
    if (currentIntern?.pmCode) {
      loadAssignedPM();
    }
  }, [currentIntern]);

  const loadCurrentIntern = () => {
    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
      if (user.role === "intern") {
        setCurrentIntern(user);
      }
    } catch (error) {
      console.error("Error loading intern:", error);
    }
  };

  const loadAssignedPM = () => {
    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const pm = users.find((u) => u.role === "pm" && u.pmCode === currentIntern?.pmCode);
      setAssignedPM(pm);
    } catch (error) {
      console.error("Error loading PM:", error);
    }
  };

  const getStats = () => {
    const daysActive = currentIntern?.profileCompletedAt
      ? Math.floor((new Date() - new Date(currentIntern.profileCompletedAt)) / (1000 * 60 * 60 * 24))
      : 0;
    
    return {
      daysActive,
      unreadMessages: 0,
      announcements: announcements.length,
      tasksCompleted: 0,
    };
  };

  const stats = getStats();

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
            top: "25%",
            left: "-8%",
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
            bottom: "20%",
            right: "-5%",
            width: 450,
            height: 450,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.peachGlow})`,
            opacity: 0.25,
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
            <div
              style={{
                width: isMobile ? 48 : 64,
                height: isMobile ? 48 : 64,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: isMobile ? 20 : 28,
                border: "3px solid rgba(255,255,255,0.2)",
              }}
            >
              {currentIntern?.fullName?.charAt(0) || "I"}
            </div>
            <div>
              <h1 style={{ fontSize: isMobile ? 28 : 42, margin: 0, fontWeight: 800 }}>
                Welcome, {currentIntern?.fullName?.split(" ")[0] || "Intern"}!
              </h1>
              <p style={{ color: "rgba(255,255,255,0.75)", fontSize: isMobile ? 13 : 15, marginTop: 4 }}>
                {currentIntern?.degree || "Intern"} • PM Code: {currentIntern?.pmCode || "Not assigned"}
              </p>
            </div>
          </div>
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
            <StatCard icon={<Calendar size={28} />} label="Days Active" value={stats.daysActive} color={COLORS.peachGlow} />
            <StatCard icon={<MessageCircle size={28} />} label="Unread Messages" value={stats.unreadMessages} color={COLORS.jungleTeal} />
            <StatCard icon={<Bell size={28} />} label="Announcements" value={stats.announcements} color="#f59e0b" />
            <StatCard icon={<Award size={28} />} label="Tasks Completed" value={stats.tasksCompleted} color="#a78bfa" />
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
            { id: "profile", label: "My Profile" },
            { id: "announcements", label: "Announcements" },
            { id: "documents", label: "Documents" },
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
            <OverviewContent intern={currentIntern} pm={assignedPM} announcements={announcements} isMobile={isMobile} />
          )}
          {activeTab === "profile" && <ProfileView intern={currentIntern} isMobile={isMobile} />}
          {activeTab === "announcements" && <AnnouncementsView announcements={announcements} isMobile={isMobile} />}
          {activeTab === "documents" && <DocumentsView intern={currentIntern} isMobile={isMobile} />}
          {activeTab === "chat" && <ChatSystem userRole="intern" currentUser={currentIntern} />}
        </div>
      </div>
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

function OverviewContent({ intern, pm, announcements, isMobile }) {
  const recentAnnouncements = announcements.slice(0, 2);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`, padding: isMobile ? 20 : 28, borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)" }}>
        <h3 style={{ fontSize: isMobile ? 18 : 22, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
          🎉 Your Internship Journey
        </h3>
        <p style={{ color: "rgba(255,255,255,0.9)", lineHeight: 1.6, marginBottom: 12 }}>
          You're making great progress! Keep up the excellent work and don't hesitate to reach out to your PM or HR if you need any support.
        </p>
        {intern?.profile?.startDate && intern?.profile?.endDate && (
          <div style={{ display: "flex", gap: 16, fontSize: 13, flexWrap: "wrap" }}>
            <div><span style={{ color: "rgba(255,255,255,0.7)" }}>Start:</span> <strong>{new Date(intern.profile.startDate).toLocaleDateString()}</strong></div>
            <div><span style={{ color: "rgba(255,255,255,0.7)" }}>End:</span> <strong>{new Date(intern.profile.endDate).toLocaleDateString()}</strong></div>
            <div><span style={{ color: "rgba(255,255,255,0.7)" }}>Mode:</span> <strong>{intern.profile.workMode}</strong></div>
          </div>
        )}
      </div>

      {pm && (
        <div>
          <h3 style={{ marginBottom: 16, fontSize: isMobile ? 18 : 22, display: "flex", alignItems: "center", gap: 8 }}>
            <Award size={22} /> Your Project Manager
          </h3>
          <div style={{ background: "rgba(255,255,255,0.04)", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: "50%", background: `linear-gradient(135deg, #a78bfa, ${COLORS.jungleTeal})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 24 }}>
                {pm.fullName?.charAt(0) || "P"}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{pm.fullName}</div>
                <div style={{ fontSize: 13, color: COLORS.peachGlow, fontWeight: 600 }}>PM Code: {pm.pmCode}</div>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.8)" }}>
                <Mail size={16} />
                <a href={`mailto:${pm.email}`} style={{ color: "inherit", textDecoration: "none" }}>{pm.email}</a>
              </div>
              {pm.phone && (
                <div style={{ display: "flex", alignItems: "center", gap: 10, color: "rgba(255,255,255,0.8)" }}>
                  <Phone size={16} /> {pm.phone}
                </div>
              )}
            </div>
            <button style={{ ...buttonStyle, marginTop: 16, background: COLORS.jungleTeal }}>
              <MessageCircle size={16} /> Chat with PM
            </button>
          </div>
        </div>
      )}

      <div>
        <h3 style={{ marginBottom: 16, fontSize: isMobile ? 18 : 22, display: "flex", alignItems: "center", gap: 8 }}>
          <Bell size={22} /> Latest Announcements
        </h3>
        {recentAnnouncements.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.6)" }}>No announcements yet.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {recentAnnouncements.map((ann) => <AnnouncementCard key={ann.id} announcement={ann} isMobile={isMobile} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfileView({ intern, isMobile }) {
  const profile = intern?.profile || {};
  return (
    <div>
      <h2 style={{ fontSize: isMobile ? 20 : 26, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
        <User size={28} /> My Profile
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <Section title="Basic Information" icon={<User size={20} />}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <InfoField label="Full Name" value={intern?.fullName} />
            <InfoField label="Email" value={intern?.email} />
            <InfoField label="Phone" value={intern?.phone} />
            <InfoField label="Date of Birth" value={intern?.dob} />
            <InfoField label="Blood Group" value={profile.bloodGroup} />
          </div>
        </Section>
        <Section title="Address" icon={<MapPin size={20} />}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <InfoField label="Full Address" value={profile.address} fullWidth />
            <InfoField label="City" value={profile.city} />
            <InfoField label="State" value={profile.state} />
            <InfoField label="Pincode" value={profile.pincode} />
          </div>
        </Section>
        <Section title="Emergency Contact" icon={<Phone size={20} />}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <InfoField label="Contact Name" value={profile.emergencyContactName} />
            <InfoField label="Relation" value={profile.emergencyRelation} />
            <InfoField label="Phone" value={profile.emergencyContactPhone} />
          </div>
        </Section>
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
        <Section title="Internship Details" icon={<Briefcase size={20} />}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <InfoField label="Duration" value={profile.internshipDuration} />
            <InfoField label="Start Date" value={profile.startDate} />
            <InfoField label="End Date" value={profile.endDate} />
            <InfoField label="Work Mode" value={profile.workMode} />
            <InfoField label="Expected Outcome" value={profile.expectedOutcome} fullWidth />
          </div>
          {profile.bio && <div style={{ marginTop: 16 }}><InfoField label="Bio" value={profile.bio} fullWidth /></div>}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, icon, children }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", padding: 20, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)" }}>
      <h3 style={{ fontSize: 18, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>{icon} {title}</h3>
      {children}
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

function AnnouncementsView({ announcements, isMobile }) {
  return (
    <div>
      <h2 style={{ fontSize: isMobile ? 20 : 26, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
        <Bell size={28} /> All Announcements
      </h2>
      {announcements.length === 0 ? (
        <p style={{ color: "rgba(255,255,255,0.6)" }}>No announcements yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {announcements.map((ann) => <AnnouncementCard key={ann.id} announcement={ann} isMobile={isMobile} expanded />)}
        </div>
      )}
    </div>
  );
}

function AnnouncementCard({ announcement, isMobile }) {
  const priorityColor = { high: COLORS.racingRed, medium: "#f59e0b", low: "#4ade80" }[announcement.priority];
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", padding: isMobile ? 16 : 20, borderRadius: 12, borderLeft: `4px solid ${priorityColor}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: isMobile ? 16 : 18 }}>{announcement.title}</div>
        <div style={{ background: priorityColor, color: "white", padding: "4px 12px", borderRadius: 999, fontSize: 11, fontWeight: 700, textTransform: "uppercase" }}>{announcement.priority}</div>
      </div>
      <div style={{ fontSize: isMobile ? 13 : 14, color: "rgba(255,255,255,0.8)", marginBottom: 12, lineHeight: 1.5 }}>{announcement.message}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Calendar size={14} /> {new Date(announcement.date).toLocaleDateString()}</div>
        <div style={{ fontStyle: "italic" }}>From: {announcement.from}</div>
      </div>
    </div>
  );
}

function DocumentsView({ intern, isMobile }) {
  const profile = intern?.profile || {};
  return (
    <div>
      <h2 style={{ fontSize: isMobile ? 20 : 26, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
        <FileText size={28} /> My Documents
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {profile.profilePicture && <DocumentCard title="Profile Picture" type="image" data={profile.profilePicture} isMobile={isMobile} />}
        {profile.resume && <DocumentCard title="Resume / CV" type="document" data={profile.resume} isMobile={isMobile} />}
        {!profile.profilePicture && !profile.resume && <p style={{ color: "rgba(255,255,255,0.6)" }}>No documents uploaded yet.</p>}
      </div>
    </div>
  );
}

function DocumentCard({ title, type, data, isMobile }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.04)", padding: isMobile ? 16 : 20, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {type === "image" ? <User size={24} /> : <FileText size={24} />}
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{type === "image" ? "Image file" : "Document file"}</div>
        </div>
      </div>
      <button onClick={() => { const link = document.createElement("a"); link.href = data; link.download = title; link.click(); }} style={buttonStyle}>
        <Eye size={16} /> View
      </button>
    </div>
  );
}

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
  transition: "all 0.2s",
};