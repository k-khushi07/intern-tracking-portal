import React, { useState, useEffect } from "react";
import { Search, Mail, Eye, MapPin, Calendar, Award, TrendingUp, Clock } from "lucide-react";
import InternProfilePage from "./InternProfilePage";

const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
};

const ActiveInternsPage = ({ onNavigateToMessages }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeInterns, setActiveInterns] = useState([]);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    const loadActiveInterns = () => {
      try {
        const usersData = localStorage.getItem("users");
        if (usersData) {
          const users = JSON.parse(usersData);
          const interns = users.filter(
            (user) => user.role === "intern" && user.status === "active"
          );
          
          // Remove duplicates based on email (unique identifier)
          const uniqueInterns = interns.reduce((acc, current) => {
            const duplicate = acc.find(item => item.email === current.email);
            if (!duplicate) {
              return acc.concat([current]);
            }
            return acc;
          }, []);
          
          setActiveInterns(uniqueInterns);
        }
      } catch (error) {
        console.error("Error loading interns:", error);
      }
    };

    loadActiveInterns();
  }, []);

  const filteredInterns = activeInterns.filter((intern) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      intern.name?.toLowerCase().includes(searchLower) ||
      intern.fullName?.toLowerCase().includes(searchLower) ||
      intern.email?.toLowerCase().includes(searchLower) ||
      intern.internshipDomain?.toLowerCase().includes(searchLower) ||
      intern.degree?.toLowerCase().includes(searchLower)
    );
  });

  const stats = {
    total: activeInterns.length,
    active: activeInterns.filter((i) => i.status === "active").length,
    avgPerformance: activeInterns.length > 0
      ? Math.round(
          activeInterns.reduce((sum, i) => sum + (i.performance || 0), 0) / activeInterns.length
        )
      : 0,
  };

  const handleViewProfile = (intern) => {
    setSelectedIntern(intern);
    setViewMode("profile");
  };

  const handleBackToGrid = () => {
    setSelectedIntern(null);
    setViewMode("grid");
  };

  if (viewMode === "profile" && selectedIntern) {
    return <InternProfilePage intern={selectedIntern} onBack={handleBackToGrid} />;
  }

  return (
    <div className="animate-fadeIn">
      {/* REDUCED Stats Cards - 1/3 size */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <div
          className="glass hover-lift animate-fadeIn stagger-1"
          style={{
            padding: "12px",
            borderRadius: "10px",
            background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "11px", color: "rgba(255, 229, 217, 0.8)", marginBottom: "2px" }}>
                Total
              </p>
              <h3 style={{ fontSize: "20px", fontWeight: "700", color: COLORS.peachGlow }}>
                {stats.total}
              </h3>
            </div>
            <div
              style={{
                width: "32px",
                height: "32px",
                background: "rgba(255, 229, 217, 0.2)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Award size={16} color={COLORS.peachGlow} />
            </div>
          </div>
        </div>

        <div
          className="glass hover-lift animate-fadeIn stagger-2"
          style={{
            padding: "12px",
            borderRadius: "10px",
            background: `linear-gradient(135deg, rgba(103, 146, 137, 0.3), rgba(29, 120, 116, 0.3))`,
            border: `1px solid rgba(103, 146, 137, 0.3)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "11px", color: "rgba(255, 229, 217, 0.8)", marginBottom: "2px" }}>
                Active
              </p>
              <h3 style={{ fontSize: "20px", fontWeight: "700", color: COLORS.peachGlow }}>
                {stats.active}
              </h3>
            </div>
            <div
              style={{
                width: "32px",
                height: "32px",
                background: "rgba(103, 146, 137, 0.3)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp size={16} color={COLORS.jungleTeal} />
            </div>
          </div>
        </div>

        <div
          className="glass hover-lift animate-fadeIn stagger-3"
          style={{
            padding: "12px",
            borderRadius: "10px",
            background: `linear-gradient(135deg, rgba(103, 146, 137, 0.3), rgba(29, 120, 116, 0.3))`,
            border: `1px solid rgba(103, 146, 137, 0.3)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "11px", color: "rgba(255, 229, 217, 0.8)", marginBottom: "2px" }}>
                Avg Performance
              </p>
              <h3 style={{ fontSize: "20px", fontWeight: "700", color: COLORS.peachGlow }}>
                {stats.avgPerformance}%
              </h3>
            </div>
            <div
              style={{
                width: "32px",
                height: "32px",
                background: "rgba(103, 146, 137, 0.3)",
                borderRadius: "8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Clock size={16} color={COLORS.jungleTeal} />
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
        <div style={{ position: "relative" }}>
          <Search
            size={18}
            color="rgba(255, 229, 217, 0.5)"
            style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="text"
            placeholder="Search by name, email, domain, or degree..."
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
            key={intern.email || index}
            className={`glass hover-lift animate-fadeIn stagger-${(index % 5) + 1}`}
            style={{
              padding: "24px",
              borderRadius: "16px",
              background: "rgba(29, 120, 116, 0.1)",
              border: `1px solid rgba(103, 146, 137, 0.3)`,
            }}
          >
            {/* Intern Header - REAL DATA */}
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
                {(intern.fullName || intern.name || "IN")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
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
                  {intern.fullName || intern.name || "Intern"}
                </h3>
                <p style={{ fontSize: "13px", color: "rgba(255, 229, 217, 0.6)" }}>
                  {intern.internshipDomain || intern.degree || "General"}
                </p>
              </div>
            </div>

            {/* Intern Details - REAL DATA */}
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
                <span>{intern.email || "No email"}</span>
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
                <span>{intern.location || `${intern.city || "Not specified"}, ${intern.state || ""}`}</span>
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
                <span>
                  Joined: {intern.approvedAt ? new Date(intern.approvedAt).toLocaleDateString() : "N/A"}
                </span>
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
                  {intern.performance || 0}%
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
                    width: `${intern.performance || 0}%`,
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
                  Tasks
                </p>
                <p style={{ fontSize: "16px", fontWeight: "700", color: COLORS.peachGlow }}>
                  {intern.tasksCompleted || 0}/{intern.tasksTotal || 0}
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
                  {(intern.weeklyReports || 0) + (intern.monthlyReports || 0)}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => handleViewProfile(intern)}
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
                onClick={() => onNavigateToMessages && onNavigateToMessages(intern)}
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
            No Active Interns Found
          </h3>
          <p style={{ fontSize: "14px", color: "rgba(255, 229, 217, 0.6)" }}>
            {searchQuery ? "Try adjusting your search criteria" : "No active interns in the system yet"}
          </p>
        </div>
      )}
    </div>
  );
};

export default ActiveInternsPage;