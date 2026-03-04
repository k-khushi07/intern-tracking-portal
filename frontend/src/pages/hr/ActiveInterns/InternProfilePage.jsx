// InternProfilePage.jsx
import React from "react";
import { ArrowLeft, Mail, MapPin, Calendar, Award, TrendingUp, Clock, Phone, Briefcase, GraduationCap, Target, CheckCircle2, AlertCircle } from "lucide-react";


const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
};


const InternProfilePage = ({ intern, onBack }) => {
  if (!intern) {
    return (
      <div className="animate-fadeIn" style={{ textAlign: "center", padding: "60px 20px" }}>
        <p style={{ fontSize: "18px", color: "rgba(255, 229, 217, 0.6)" }}>No intern selected</p>
      </div>
    );
  }


  // Enhance profile data with defaults
  const profileData = {
    ...intern,
    phone: intern.phone || "+1 (555) 123-4567",
    education: intern.education || "Bachelor's in Computer Science",
    university: intern.university || "University Name",
    expectedGraduation: intern.expectedGraduation || "May 2025",
    internshipDuration: intern.internshipDuration || "6 months",
    supervisor: intern.supervisor || "Not Assigned",
    startDate: intern.joinDate || new Date().toISOString(),
    bio: intern.bio || "Passionate about learning and contributing to team success.",
    avatar: intern.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "IN",
    recentActivities: intern.recentActivities || [
      { id: 1, action: "Completed weekly report", time: "2 hours ago", type: "report" },
      { id: 2, action: "Updated TNA Tracker", time: "5 hours ago", type: "tna" },
      { id: 3, action: "Submitted project", time: "1 day ago", type: "project" },
    ],
    currentProjects: intern.currentProjects || [
      { id: 1, name: "Training Module", progress: 75, status: "In Progress" },
      { id: 2, name: "Documentation", progress: 50, status: "In Progress" },
    ],
    goals: intern.goals || [
      { id: 1, title: "Complete onboarding", progress: 80, deadline: "Feb 2025" },
      { id: 2, title: "Master core technologies", progress: 60, deadline: "Mar 2025" },
    ],
    skills: intern.skills || ["JavaScript", "React", "Node.js"],
    performance: intern.performance || 75,
    tasksCompleted: intern.tasksCompleted || 0,
    tasksTotal: intern.tasksTotal || 0,
    weeklyReports: intern.weeklyReports || 0,
    monthlyReports: intern.monthlyReports || 0,
    lastActive: intern.lastActive || "Recently",
  };


  return (
    <div className="animate-fadeIn">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="hover-lift"
        style={{
          padding: "12px 24px",
          background: "rgba(103, 146, 137, 0.2)",
          border: `1px solid ${COLORS.jungleTeal}`,
          borderRadius: "12px",
          color: COLORS.peachGlow,
          fontSize: "14px",
          fontWeight: "600",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "24px",
          transition: "all 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(103, 146, 137, 0.3)";
          e.currentTarget.style.transform = "translateX(-4px)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(103, 146, 137, 0.2)";
          e.currentTarget.style.transform = "translateX(0)";
        }}
      >
        <ArrowLeft size={18} />
        Back to Active Interns
      </button>


      {/* Profile Header */}
      <div
        className="glass animate-fadeIn stagger-1"
        style={{
          padding: "32px",
          borderRadius: "16px",
          background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "24px", flexWrap: "wrap" }}>
          <div
            style={{
              width: "120px",
              height: "120px",
              background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
              fontSize: "48px",
              color: COLORS.peachGlow,
              border: "4px solid rgba(255, 229, 217, 0.3)",
              flexShrink: 0,
            }}
          >
            {profileData.avatar}
          </div>


          <div style={{ flex: 1, minWidth: "300px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px", flexWrap: "wrap" }}>
              <h1
                style={{
                  fontSize: "32px",
                  fontWeight: "700",
                  color: COLORS.peachGlow,
                  fontFamily: "Outfit",
                }}
              >
                {profileData.name}
              </h1>
              <span
                style={{
                  padding: "6px 16px",
                  background:
                    profileData.status === "active"
                      ? "rgba(34, 197, 94, 0.3)"
                      : "rgba(217, 4, 41, 0.3)",
                  border: `1px solid ${
                    profileData.status === "active" ? "rgba(34, 197, 94, 0.5)" : "rgba(217, 4, 41, 0.5)"
                  }`,
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: profileData.status === "active" ? "#22c55e" : COLORS.racingRed,
                  textTransform: "uppercase",
                }}
              >
                {profileData.status}
              </span>
            </div>


            <p style={{ fontSize: "18px", color: "rgba(255, 229, 217, 0.9)", marginBottom: "16px" }}>
              {profileData.role || "Intern"} • {profileData.department || "General"}
            </p>


            <p style={{ fontSize: "14px", color: "rgba(255, 229, 217, 0.8)", lineHeight: "1.6", marginBottom: "20px" }}>
              {profileData.bio}
            </p>


            {/* Contact Info */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Mail size={18} color={COLORS.peachGlow} />
                <span style={{ fontSize: "14px", color: "rgba(255, 229, 217, 0.9)" }}>
                  {profileData.email}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Phone size={18} color={COLORS.peachGlow} />
                <span style={{ fontSize: "14px", color: "rgba(255, 229, 217, 0.9)" }}>
                  {profileData.phone}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <MapPin size={18} color={COLORS.peachGlow} />
                <span style={{ fontSize: "14px", color: "rgba(255, 229, 217, 0.9)" }}>
                  {profileData.location || "Not specified"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Calendar size={18} color={COLORS.peachGlow} />
                <span style={{ fontSize: "14px", color: "rgba(255, 229, 217, 0.9)" }}>
                  Joined: {new Date(profileData.startDate).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Stats Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        <div
          className="glass hover-lift animate-fadeIn stagger-2"
          style={{
            padding: "24px",
            borderRadius: "16px",
            background: "rgba(103, 146, 137, 0.1)",
            border: `1px solid rgba(103, 146, 137, 0.3)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", color: "rgba(255, 229, 217, 0.7)" }}>Performance</span>
            <Award size={20} color={COLORS.jungleTeal} />
          </div>
          <p style={{ fontSize: "28px", fontWeight: "700", color: COLORS.peachGlow }}>
            {profileData.performance}%
          </p>
        </div>


        <div
          className="glass hover-lift animate-fadeIn stagger-3"
          style={{
            padding: "24px",
            borderRadius: "16px",
            background: "rgba(103, 146, 137, 0.1)",
            border: `1px solid rgba(103, 146, 137, 0.3)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", color: "rgba(255, 229, 217, 0.7)" }}>Tasks Completed</span>
            <CheckCircle2 size={20} color={COLORS.jungleTeal} />
          </div>
          <p style={{ fontSize: "28px", fontWeight: "700", color: COLORS.peachGlow }}>
            {profileData.tasksCompleted}/{profileData.tasksTotal}
          </p>
        </div>


        <div
          className="glass hover-lift animate-fadeIn stagger-4"
          style={{
            padding: "24px",
            borderRadius: "16px",
            background: "rgba(103, 146, 137, 0.1)",
            border: `1px solid rgba(103, 146, 137, 0.3)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", color: "rgba(255, 229, 217, 0.7)" }}>Weekly Reports</span>
            <TrendingUp size={20} color={COLORS.jungleTeal} />
          </div>
          <p style={{ fontSize: "28px", fontWeight: "700", color: COLORS.peachGlow }}>
            {profileData.weeklyReports}
          </p>
        </div>


        <div
          className="glass hover-lift animate-fadeIn stagger-5"
          style={{
            padding: "24px",
            borderRadius: "16px",
            background: "rgba(103, 146, 137, 0.1)",
            border: `1px solid rgba(103, 146, 137, 0.3)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "13px", color: "rgba(255, 229, 217, 0.7)" }}>Last Active</span>
            <Clock size={20} color={COLORS.jungleTeal} />
          </div>
          <p style={{ fontSize: "18px", fontWeight: "700", color: COLORS.peachGlow }}>
            {profileData.lastActive}
          </p>
        </div>
      </div>


      {/* Two Column Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "24px" }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Education & Details */}
          <div
            className="glass animate-fadeIn stagger-2"
            style={{
              padding: "24px",
              borderRadius: "16px",
              background: "rgba(103, 146, 137, 0.1)",
              border: `1px solid rgba(103, 146, 137, 0.3)`,
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: COLORS.peachGlow,
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <GraduationCap size={22} color={COLORS.jungleTeal} />
              Education & Details
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  Education
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.education}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  University
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.university}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  Expected Graduation
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.expectedGraduation}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  Internship Duration
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.internshipDuration}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  Supervisor
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.supervisor}
                </p>
              </div>
            </div>
          </div>


          {/* Skills */}
          <div
            className="glass animate-fadeIn stagger-3"
            style={{
              padding: "24px",
              borderRadius: "16px",
              background: "rgba(103, 146, 137, 0.1)",
              border: `1px solid rgba(103, 146, 137, 0.3)`,
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: COLORS.peachGlow,
                marginBottom: "16px",
              }}
            >
              Skills
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
              {profileData.skills.map((skill, index) => (
                <span
                  key={index}
                  style={{
                    padding: "8px 16px",
                    background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: COLORS.peachGlow,
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>


          {/* Current Projects */}
          <div
            className="glass animate-fadeIn stagger-4"
            style={{
              padding: "24px",
              borderRadius: "16px",
              background: "rgba(103, 146, 137, 0.1)",
              border: `1px solid rgba(103, 146, 137, 0.3)`,
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: COLORS.peachGlow,
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Briefcase size={22} color={COLORS.jungleTeal} />
              Current Projects
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {profileData.currentProjects.map((project) => (
                <div key={project.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                      {project.name}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: project.status === "Completed" ? "#22c55e" : COLORS.jungleTeal,
                      }}
                    >
                      {project.progress}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      background: "rgba(103, 146, 137, 0.2)",
                      borderRadius: "10px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${project.progress}%`,
                        height: "100%",
                        background:
                          project.status === "Completed"
                            ? "linear-gradient(90deg, #22c55e, #16a34a)"
                            : `linear-gradient(90deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                        borderRadius: "10px",
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Goals */}
          <div
            className="glass animate-fadeIn stagger-3"
            style={{
              padding: "24px",
              borderRadius: "16px",
              background: "rgba(103, 146, 137, 0.1)",
              border: `1px solid rgba(103, 146, 137, 0.3)`,
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: COLORS.peachGlow,
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Target size={22} color={COLORS.jungleTeal} />
              Goals & Milestones
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {profileData.goals.map((goal) => (
                <div key={goal.id}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "8px",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500", marginBottom: "4px" }}>
                        {goal.title}
                      </p>
                      <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)" }}>
                        Deadline: {goal.deadline}
                      </p>
                    </div>
                    <span style={{ fontSize: "14px", fontWeight: "600", color: COLORS.jungleTeal }}>
                      {goal.progress}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "6px",
                      background: "rgba(103, 146, 137, 0.2)",
                      borderRadius: "10px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${goal.progress}%`,
                        height: "100%",
                        background: `linear-gradient(90deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                        borderRadius: "10px",
                        transition: "width 0.5s ease",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>


          {/* Recent Activities */}
          <div
            className="glass animate-fadeIn stagger-4"
            style={{
              padding: "24px",
              borderRadius: "16px",
              background: "rgba(103, 146, 137, 0.1)",
              border: `1px solid rgba(103, 146, 137, 0.3)`,
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: "700",
                color: COLORS.peachGlow,
                marginBottom: "20px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Clock size={22} color={COLORS.jungleTeal} />
              Recent Activities
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {profileData.recentActivities.map((activity) => {
                const getIcon = () => {
                  switch (activity.type) {
                    case "report":
                      return <TrendingUp size={16} color={COLORS.jungleTeal} />;
                    case "tna":
                      return <CheckCircle2 size={16} color={COLORS.jungleTeal} />;
                    case "project":
                      return <Briefcase size={16} color={COLORS.jungleTeal} />;
                    case "blueprint":
                      return <Target size={16} color={COLORS.jungleTeal} />;
                    case "task":
                      return <Award size={16} color={COLORS.jungleTeal} />;
                    default:
                      return <AlertCircle size={16} color={COLORS.jungleTeal} />;
                  }
                };


                return (
                  <div
                    key={activity.id}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                      padding: "12px",
                      background: "rgba(103, 146, 137, 0.05)",
                      borderRadius: "10px",
                      borderLeft: `3px solid ${COLORS.jungleTeal}`,
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        background: "rgba(103, 146, 137, 0.2)",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {getIcon()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: "13px", color: COLORS.peachGlow, fontWeight: "500", marginBottom: "4px" }}>
                        {activity.action}
                      </p>
                      <p style={{ fontSize: "11px", color: "rgba(255, 229, 217, 0.6)" }}>
                        {activity.time}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default InternProfilePage;