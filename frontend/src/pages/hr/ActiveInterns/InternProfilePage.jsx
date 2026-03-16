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
  const [activities, setActivities] = useState([]);

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

  useEffect(() => {
    if (!internId) return;
    Promise.all([
      hrApi.getInternDailyLogs(internId),
      hrApi.getInternReports(internId),
    ])
      .then(([logsRes, reportsRes]) => {
        const logs = (logsRes?.logs || []).map((l) => ({
          type: "daily_log",
          label: `Submitted daily log for ${l.logDate || l.log_date}`,
          date: l.createdAt || l.created_at,
        }));
        const reports = (reportsRes?.reports || []).map((r) => ({
          type: "report",
          label: `Submitted ${r.reportType || r.report_type || "report"}`,
          date: r.submittedAt || r.submitted_at,
        }));
        const all = [...logs, ...reports]
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 10);
        setActivities(all);
      })
      .catch(() => {});
  }, [internId, internData]);

  const profilePayload = useMemo(() => {
    const pd = internData?.profile_data || internData?.profileData || {};
    return pd && typeof pd === "object" ? pd : {};
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
      phone: profilePayload.phone || internData?.phone || "?",
      dob: profilePayload.dob || internData?.dob || "?",
      address: profilePayload.address || "?",
      college: profilePayload.collegeName || profilePayload.college || "?",
      degree: profilePayload.degree || internData?.degree || "?",
      skills,
      bio: profilePayload.bio || "?",
      linkedIn: profilePayload.linkedIn || "?",
      github: profilePayload.github || "?",
      bloodGroup: profilePayload.bloodGroup || "?",
      emergencyContactName: profilePayload.emergencyContactName || "?",
      guideName: profilePayload.guideName || "?",
      startDate: profilePayload.startDate || profilePayload.joinDate || internData?.created_at || "",
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
                  {profileData.address || "?"}
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
                  College/University
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.college}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  Degree/Education
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.degree}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  DOB
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.dob}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  Blood Group
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.bloodGroup}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  Emergency Contact
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.emergencyContactName}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  Guide Name
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.guideName}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  Address
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.address}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  LinkedIn
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.linkedIn}
                </p>
              </div>
              <div>
                <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  GitHub
                </p>
                <p style={{ fontSize: "14px", color: COLORS.peachGlow, fontWeight: "500" }}>
                  {profileData.github}
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


        </div>


        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
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
                {activities.length === 0 ? (
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>No recent activity.</div>
                ) : activities.map((act, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "10px 0",
                  borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: act.type === "report" ? "#a78bfa" : "#14b8a6",
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{act.label}</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11 }}>
                    {act.date ? new Date(act.date).toLocaleDateString() : "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};


export default InternProfilePage;
