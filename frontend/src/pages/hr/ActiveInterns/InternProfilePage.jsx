// InternProfilePage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ArrowLeft, Mail, MapPin, Calendar, Award, TrendingUp, Clock, Phone, Briefcase, GraduationCap, Target, CheckCircle2, AlertCircle } from "lucide-react";
import { hrApi } from "../../../lib/apiClient";


const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
};


const InternProfilePage = ({ intern, onBack }) => {
  const params = useParams();
  const internId = params?.internId || params?.id || intern?.id || null;
  const [internData, setInternData] = useState(intern || null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!intern) return;
    setInternData(intern);
  }, [intern]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!internId) return;
      setLoading(true);
      setLoadError("");
      try {
        const res = await hrApi.getIntern(internId);
        if (cancelled) return;
        setInternData(res?.intern || null);
      } catch (err) {
        if (cancelled) return;
        setLoadError(err?.message || "Failed to load intern profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [internId]);

  const profilePayload = useMemo(() => {
    const raw = internData?.profile_data || internData?.profileData;
    return raw && typeof raw === "object" ? raw : {};
  }, [internData]);

  const skills = useMemo(() => {
    const raw = profilePayload.skills ?? profilePayload.technicalSkills ?? [];
    if (Array.isArray(raw)) return raw.filter(Boolean);
    if (typeof raw === "string") {
      return raw.split(",").map((value) => value.trim()).filter(Boolean);
    }
    return [];
  }, [profilePayload]);

  const profileData = useMemo(
    () => ({
      phone: profilePayload.phone || profilePayload.mobile || "",
      dob: profilePayload.dob || profilePayload.dateOfBirth || "",
      bloodGroup: profilePayload.bloodGroup || profilePayload.blood_group || "",
      address: profilePayload.address || "",
      college: profilePayload.college || profilePayload.collegeName || "",
      degree: profilePayload.degree || profilePayload.education || "",
      education: profilePayload.education || profilePayload.degree || "",
      university: profilePayload.university || profilePayload.college || profilePayload.collegeName || "",
      expectedGraduation: profilePayload.expectedGraduation || profilePayload.graduationYear || profilePayload.graduationDate || "",
      internshipDuration: profilePayload.internshipDuration || profilePayload.duration || "",
      supervisor: profilePayload.supervisor || profilePayload.mentor || "",
      startDate: profilePayload.startDate || profilePayload.joinDate || internData?.created_at || "",
      bio: profilePayload.bio || profilePayload.about || "",
      location:
        profilePayload.location ||
        profilePayload.address ||
        [profilePayload.city, profilePayload.state].filter(Boolean).join(", "),
      recentActivities: Array.isArray(profilePayload.recentActivities) ? profilePayload.recentActivities : [],
      currentProjects: Array.isArray(profilePayload.currentProjects) ? profilePayload.currentProjects : [],
      goals: Array.isArray(profilePayload.goals) ? profilePayload.goals : [],
      skills,
      performance: Number(profilePayload.performance ?? internData?.performance ?? 0),
      tasksCompleted: Number(profilePayload.tasksCompleted ?? internData?.tasksCompleted ?? 0),
      tasksTotal: Number(profilePayload.tasksTotal ?? internData?.tasksTotal ?? 0),
      weeklyReports: Number(profilePayload.weeklyReports ?? internData?.weeklyReports ?? 0),
      monthlyReports: Number(profilePayload.monthlyReports ?? internData?.monthlyReports ?? 0),
      lastActive: profilePayload.lastActive || internData?.lastActive || "",
    }),
    [profilePayload, internData, skills]
  );

  const internMeta = useMemo(() => {
    const name = internData?.full_name || internData?.fullName || internData?.name || internData?.email || "Intern";
    return {
      name,
      email: internData?.email || "",
      status: String(internData?.status || "active").toLowerCase(),
      role: internData?.role || "Intern",
      department:
        profilePayload.department ||
        profilePayload.domain ||
        profilePayload.team ||
        internData?.department ||
        internData?.internshipDomain ||
        "",
      avatar:
        name
          .split(" ")
          .filter(Boolean)
          .map((n) => n[0])
          .join("")
          .toUpperCase() || "IN",
    };
  }, [internData, profilePayload]);

  if (!internData && !loading) {
    return (
      <div className="animate-fadeIn" style={{ textAlign: "center", padding: "60px 20px" }}>
        <p style={{ fontSize: "18px", color: "rgba(255, 229, 217, 0.6)" }}>No intern selected</p>
      </div>
    );
  }


  return (
    <div className="animate-fadeIn">
      {loadError && (
        <div
          className="glass"
          style={{
            padding: "12px 16px",
            borderRadius: "12px",
            marginBottom: "16px",
            background: "rgba(217, 4, 41, 0.15)",
            border: "1px solid rgba(217, 4, 41, 0.35)",
            color: COLORS.peachGlow,
          }}
        >
          {loadError}
        </div>
      )}
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
            {internMeta.avatar}
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
                {internMeta.name}
              </h1>
              <span
                style={{
                  padding: "6px 16px",
                  background:
                    internMeta.status === "active"
                      ? "rgba(34, 197, 94, 0.3)"
                      : "rgba(217, 4, 41, 0.3)",
                  border: `1px solid ${
                    internMeta.status === "active" ? "rgba(34, 197, 94, 0.5)" : "rgba(217, 4, 41, 0.5)"
                  }`,
                  borderRadius: "8px",
                  fontSize: "12px",
                  fontWeight: "600",
                  color: internMeta.status === "active" ? "#22c55e" : COLORS.racingRed,
                  textTransform: "uppercase",
                }}
              >
                {internMeta.status}
              </span>
            </div>


            <p style={{ fontSize: "18px", color: "rgba(255, 229, 217, 0.9)", marginBottom: "16px" }}>
              {internMeta.role || "Intern"} • {internMeta.department || "General"}
            </p>


            <p style={{ fontSize: "14px", color: "rgba(255, 229, 217, 0.8)", lineHeight: "1.6", marginBottom: "20px" }}>
              {profileData.bio || "—"}
            </p>


            {/* Contact Info */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Mail size={18} color={COLORS.peachGlow} />
                <span style={{ fontSize: "14px", color: "rgba(255, 229, 217, 0.9)" }}>
                  {internMeta.email || "—"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Phone size={18} color={COLORS.peachGlow} />
                <span style={{ fontSize: "14px", color: "rgba(255, 229, 217, 0.9)" }}>
                  {profileData.phone || "—"}
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
                  Joined: {profileData.startDate ? new Date(profileData.startDate).toLocaleDateString() : "—"}
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
            {profileData.lastActive || "—"}
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
              {profileData.skills.length > 0 ? (
                profileData.skills.map((skill, index) => (
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
                ))
              ) : (
                <span style={{ fontSize: "13px", color: "rgba(255, 229, 217, 0.6)" }}>No skills listed.</span>
              )}
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
              {profileData.currentProjects.length > 0 ? (
                profileData.currentProjects.map((project) => (
                  <div key={project.id || project.name}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: "8px",
                      }}
                    >
                      <span style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                        {project.name || "Untitled Project"}
                      </span>
                      <span
                        style={{
                          fontSize: "12px",
                          fontWeight: "600",
                          color: project.status === "Completed" ? "#22c55e" : COLORS.jungleTeal,
                        }}
                      >
                        {project.progress ?? 0}%
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
                          width: `${project.progress ?? 0}%`,
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
                ))
              ) : (
                <span style={{ fontSize: "13px", color: "rgba(255, 229, 217, 0.6)" }}>No projects yet.</span>
              )}
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
              {profileData.goals.length > 0 ? (
                profileData.goals.map((goal) => (
                  <div key={goal.id || goal.title}>
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
                          {goal.title || "Goal"}
                        </p>
                        <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)" }}>
                          Deadline: {goal.deadline || "—"}
                        </p>
                      </div>
                      <span style={{ fontSize: "14px", fontWeight: "600", color: COLORS.jungleTeal }}>
                        {goal.progress ?? 0}%
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
                          width: `${goal.progress ?? 0}%`,
                          height: "100%",
                          background: `linear-gradient(90deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                          borderRadius: "10px",
                          transition: "width 0.5s ease",
                        }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <span style={{ fontSize: "13px", color: "rgba(255, 229, 217, 0.6)" }}>No goals yet.</span>
              )}
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
              {profileData.recentActivities.length > 0 ? (
                profileData.recentActivities.map((activity) => {
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
                      key={activity.id || activity.action}
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
                          {activity.action || "Activity"}
                        </p>
                        <p style={{ fontSize: "11px", color: "rgba(255, 229, 217, 0.6)" }}>
                          {activity.time || "—"}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <span style={{ fontSize: "13px", color: "rgba(255, 229, 217, 0.6)" }}>No recent activity.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default InternProfilePage;
