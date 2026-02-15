// MyInternsPage.jsx
import React, { useState } from "react";
import { Search, Mail, Eye, MapPin, Calendar, Award, TrendingUp, Clock } from "lucide-react";


const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
};


const MyInternsPage = ({ onNavigateToMessages, onViewProfile }) => {
  const [searchQuery, setSearchQuery] = useState("");


  // Mock data for assigned interns
  const interns = [
    {
      id: 1,
      name: "John Doe",
      email: "john.doe@company.com",
      avatar: "JD",
      role: "Frontend Developer",
      department: "Engineering",
      status: "active",
      joinDate: "2024-01-15",
      location: "New York, USA",
      tasksCompleted: 24,
      tasksTotal: 30,
      weeklyReports: 8,
      monthlyReports: 2,
      lastActive: "2 hours ago",
      performance: 85,
      skills: ["React", "JavaScript", "CSS"],
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane.smith@company.com",
      avatar: "JS",
      role: "Backend Developer",
      department: "Engineering",
      status: "active",
      joinDate: "2024-02-01",
      location: "San Francisco, USA",
      tasksCompleted: 18,
      tasksTotal: 25,
      weeklyReports: 6,
      monthlyReports: 1,
      lastActive: "5 hours ago",
      performance: 92,
      skills: ["Node.js", "Python", "MongoDB"],
    },
    {
      id: 3,
      name: "Mike Johnson",
      email: "mike.johnson@company.com",
      avatar: "MJ",
      role: "UI/UX Designer",
      department: "Design",
      status: "active",
      joinDate: "2024-01-20",
      location: "Austin, USA",
      tasksCompleted: 21,
      tasksTotal: 28,
      weeklyReports: 7,
      monthlyReports: 2,
      lastActive: "1 hour ago",
      performance: 88,
      skills: ["Figma", "Adobe XD", "Prototyping"],
    },
    {
      id: 4,
      name: "Emily Davis",
      email: "emily.davis@company.com",
      avatar: "ED",
      role: "Data Analyst",
      department: "Analytics",
      status: "inactive",
      joinDate: "2024-03-10",
      location: "Chicago, USA",
      tasksCompleted: 15,
      tasksTotal: 20,
      weeklyReports: 5,
      monthlyReports: 1,
      lastActive: "2 days ago",
      performance: 78,
      skills: ["Python", "SQL", "Tableau"],
    },
  ];


  const filteredInterns = interns.filter((intern) => {
    const matchesSearch =
      intern.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intern.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intern.role.toLowerCase().includes(searchQuery.toLowerCase());
   
    return matchesSearch;
  });


  const stats = {
    total: interns.length,
    active: interns.filter((i) => i.status === "active").length,
    avgPerformance: Math.round(
      interns.reduce((sum, i) => sum + i.performance, 0) / interns.length
    ),
  };


  return (
    <div className="animate-fadeIn">
      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          className="glass hover-lift animate-fadeIn stagger-1"
          style={{
            padding: "16px",
            borderRadius: "12px",
            background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.8)", marginBottom: "4px" }}>
                Total Interns
              </p>
              <h3 style={{ fontSize: "24px", fontWeight: "700", color: COLORS.peachGlow }}>
                {stats.total}
              </h3>
            </div>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "rgba(255, 229, 217, 0.2)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Award size={20} color={COLORS.peachGlow} />
            </div>
          </div>
        </div>

        <div
          className="glass hover-lift animate-fadeIn stagger-2"
          style={{
            padding: "16px",
            borderRadius: "12px",
            background: `linear-gradient(135deg, rgba(103, 146, 137, 0.3), rgba(29, 120, 116, 0.3))`,
            border: `1px solid rgba(103, 146, 137, 0.3)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.8)", marginBottom: "4px" }}>
                Active Interns
              </p>
              <h3 style={{ fontSize: "24px", fontWeight: "700", color: COLORS.peachGlow }}>
                {stats.active}
              </h3>
            </div>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "rgba(103, 146, 137, 0.3)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp size={20} color={COLORS.jungleTeal} />
            </div>
          </div>
        </div>

        <div
          className="glass hover-lift animate-fadeIn stagger-3"
          style={{
            padding: "16px",
            borderRadius: "12px",
            background: `linear-gradient(135deg, rgba(103, 146, 137, 0.3), rgba(29, 120, 116, 0.3))`,
            border: `1px solid rgba(103, 146, 137, 0.3)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.8)", marginBottom: "4px" }}>
                Avg Performance
              </p>
              <h3 style={{ fontSize: "24px", fontWeight: "700", color: COLORS.peachGlow }}>
                {stats.avgPerformance}%
              </h3>
            </div>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "rgba(103, 146, 137, 0.3)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock size={20} color={COLORS.jungleTeal} />
            </div>
          </div>
        </div>
      </div>


      {/* Search Bar */}
      <div
        className="glass animate-fadeIn stagger-4"
        style={{
          padding: "16px",
          borderRadius: "12px",
          marginBottom: "24px",
        }}
      >
        {/* Search Input */}
        <div style={{ position: "relative" }}>
          <Search
            size={18}
            color="rgba(255, 229, 217, 0.5)"
            style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px 12px 44px",
              background: "rgba(103, 146, 137, 0.1)",
              border: `1px solid rgba(103, 146, 137, 0.3)`,
              borderRadius: "10px",
              color: COLORS.peachGlow,
              fontSize: "14px",
              transition: "all 0.3s ease",
            }}
          />
        </div>
      </div>


      {/* Interns Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
          gap: "24px",
        }}
      >
        {filteredInterns.map((intern, index) => (
          <div
            key={intern.id}
            className={`glass hover-lift animate-fadeIn stagger-${(index % 5) + 1}`}
            style={{
              padding: "24px",
              borderRadius: "16px",
              background: "rgba(29, 120, 116, 0.1)",
              border: `1px solid rgba(103, 146, 137, 0.3)`,
            }}
          >
            {/* Intern Header */}
            <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "20px" }}>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "20px",
                  color: COLORS.peachGlow,
                  marginRight: "16px",
                  flexShrink: 0,
                }}
              >
                {intern.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    color: COLORS.peachGlow,
                    marginBottom: "4px",
                  }}
                >
                  {intern.name}
                </h3>
                <p style={{ fontSize: "13px", color: "rgba(255, 229, 217, 0.6)" }}>
                  {intern.role}
                </p>
              </div>
            </div>


            {/* Intern Details */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "10px",
                  fontSize: "13px",
                  color: "rgba(255, 229, 217, 0.7)",
                }}
              >
                <Mail size={16} color={COLORS.jungleTeal} />
                <span>{intern.email}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "10px",
                  fontSize: "13px",
                  color: "rgba(255, 229, 217, 0.7)",
                }}
              >
                <MapPin size={16} color={COLORS.jungleTeal} />
                <span>{intern.location}</span>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "13px",
                  color: "rgba(255, 229, 217, 0.7)",
                }}
              >
                <Calendar size={16} color={COLORS.jungleTeal} />
                <span>Joined: {new Date(intern.joinDate).toLocaleDateString()}</span>
              </div>
            </div>


            {/* Performance Bar */}
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "13px", color: "rgba(255, 229, 217, 0.7)" }}>
                  Performance
                </span>
                <span style={{ fontSize: "14px", fontWeight: "600", color: COLORS.peachGlow }}>
                  {intern.performance}%
                </span>
              </div>
              <div
                style={{
                  width: "100%",
                  height: "8px",
                  background: "rgba(103, 146, 137, 0.2)",
                  borderRadius: "10px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${intern.performance}%`,
                    height: "100%",
                    background: `linear-gradient(90deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                    borderRadius: "10px",
                    transition: "width 0.5s ease",
                  }}
                />
              </div>
            </div>


            {/* Quick Stats */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  padding: "12px",
                  background: "rgba(103, 146, 137, 0.1)",
                  borderRadius: "10px",
                  textAlign: "center",
                }}
              >
                <p style={{ fontSize: "11px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  Tasks Progress
                </p>
                <p style={{ fontSize: "16px", fontWeight: "700", color: COLORS.peachGlow }}>
                  {intern.tasksCompleted}/{intern.tasksTotal}
                </p>
              </div>
              <div
                style={{
                  padding: "12px",
                  background: "rgba(103, 146, 137, 0.1)",
                  borderRadius: "10px",
                  textAlign: "center",
                }}
              >
                <p style={{ fontSize: "11px", color: "rgba(255, 229, 217, 0.6)", marginBottom: "4px" }}>
                  Reports
                </p>
                <p style={{ fontSize: "16px", fontWeight: "700", color: COLORS.peachGlow }}>
                  {intern.weeklyReports + intern.monthlyReports}
                </p>
              </div>
            </div>


            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => onViewProfile(intern)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                  border: "none",
                  borderRadius: "10px",
                  color: COLORS.peachGlow,
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
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
                <Eye size={18} />
                View Profile
              </button>
              <button
                onClick={() => onNavigateToMessages(intern)}
                style={{
                  flex: 1,
                  padding: "12px",
                  background: "rgba(103, 146, 137, 0.2)",
                  border: `1px solid ${COLORS.jungleTeal}`,
                  borderRadius: "10px",
                  color: COLORS.peachGlow,
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
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
                <Mail size={18} />
                Send Message
              </button>
            </div>
          </div>
        ))}
      </div>


      {/* Empty State */}
      {filteredInterns.length === 0 && (
        <div
          className="glass animate-fadeIn"
          style={{
            padding: "60px 40px",
            borderRadius: "16px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Search size={36} color={COLORS.peachGlow} />
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: "700", color: COLORS.peachGlow, marginBottom: "8px" }}>
            No Interns Found
          </h3>
          <p style={{ fontSize: "14px", color: "rgba(255, 229, 217, 0.6)" }}>
            Try adjusting your search criteria
          </p>
        </div>
      )}
    </div>
  );
};


export default MyInternsPage;