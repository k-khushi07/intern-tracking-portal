import React, { useState, useEffect, useCallback, useRef } from "react";
import { Search, Mail, Eye, Award, TrendingUp, Clock, FileDown, CheckCircle2, Briefcase, Calendar, MessageCircle, FileText, X, Activity, User } from "lucide-react";
import InternProfilePage from "./InternProfilePage";
import { Modal } from "../HRComponents";
import { hrApi } from "../../../lib/apiClient";

const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
};

const DEPARTMENTS = ["SAP", "Oracle", "Accounts", "HR"];

const normalizeDepartment = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "sap") return "SAP";
  if (normalized === "oracle") return "Oracle";
  if (normalized === "accounts" || normalized === "account" || normalized === "accounting") return "Accounts";
  if (normalized === "hr" || normalized === "human resources") return "HR";
  return "";
};

const getInternDepartment = (intern) =>
  intern?.department ||
  intern?.internshipDomain ||
  intern?.domain ||
  intern?.internship_domain ||
  intern?.department_name ||
  "";

const resolveDepartment = (intern) => {
  const normalized = normalizeDepartment(getInternDepartment(intern));
  if (normalized) return normalized;
  const raw = String(getInternDepartment(intern) || "").trim();
  if (!raw) return "Unassigned";
  return "Other";
};

const statusColor = (status) => {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "active") return "#4ade80";
  if (normalized === "completed") return COLORS.jungleTeal;
  if (normalized === "inactive") return "#f59e0b";
  return "#ef4444";
};

const ActiveInternsPage = ({
  onNavigateToMessages,
  users: usersProp,
  initialPmCode = "",
  initialPmName = "",
  onClearPmFilter,
  filterMode = "all",
  currentHrId = "",
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [allUsers, setAllUsers] = useState(usersProp || []);
  const [activeInterns, setActiveInterns] = useState([]);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [viewMode, setViewMode] = useState("grid");
  const [internProfileSection, setInternProfileSection] = useState("profile");
  const [departmentFilter, setDepartmentFilter] = useState("Overall");
  const [pmFilterCode, setPmFilterCode] = useState(initialPmCode || "");
  const [pmFilterName, setPmFilterName] = useState(initialPmName || "");

  const [pmSelections, setPmSelections] = useState({});
  const [pmEditing, setPmEditing] = useState({});
  const [savingAssign, setSavingAssign] = useState({});
  const [pmDirectory, setPmDirectory] = useState([]);
  const [markingCompleted, setMarkingCompleted] = useState({});
  const [loadError, setLoadError] = useState("");
  const [pendingCompleteIntern, setPendingCompleteIntern] = useState(null);
  const [feedback, setFeedback] = useState({
    open: false,
    title: "",
    message: "",
    tone: "info",
  });

  const openFeedback = ({ title, message, tone = "info" }) => {
    setFeedback({ open: true, title, message, tone });
  };

  // Legacy inline reports modal (replaced by PM-style intern profile "Reports" tab).
  // Kept disabled to avoid a huge diff in this file.
  const reportsModal = null;


  useEffect(() => {
    const nextCode = initialPmCode || "";
    const nextName = initialPmName || "";

    setPmFilterCode(nextCode);
    setPmFilterName(nextName);

    if (nextCode) {
      setDepartmentFilter("Overall");
      setSearchQuery("");
      setViewMode("grid");
      setSelectedIntern(null);
    }
  }, [initialPmCode, initialPmName]);

  useEffect(() => {
    if (Array.isArray(usersProp) && usersProp.length) {
      setAllUsers(usersProp);
    }
  }, [usersProp]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (Array.isArray(usersProp) && usersProp.length) return;
      try {
        setLoadError("");
        const res = await hrApi.users();
        if (cancelled) return;
        const users = res?.users || [];
        setAllUsers(users);
      } catch (err) {
        console.error("Error loading users (API):", err);
        if (cancelled) return;
        setLoadError(err?.message || "Failed to load interns");
        setAllUsers([]);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [usersProp]);

  useEffect(() => {
    const interns = (allUsers || []).filter((user) => user.role === "intern" && user.status === "active");
    const uniqueInterns = interns.reduce((acc, current) => {
      const duplicate = acc.find((item) => item.email === current.email);
      if (!duplicate) return acc.concat([current]);
      return acc;
    }, []);
    setActiveInterns(uniqueInterns);
  }, [allUsers]);

  const pmDirectoryFetchedRef = useRef(false);
  const allPMs = pmDirectory;

  useEffect(() => {
    const pmsFromCurrentUsers = (allUsers || [])
      .filter((u) => u?.role === "pm" && (u.pmCode || u.pm_code))
      .map((u) => ({
        id: u.id,
        fullName: u.fullName || u.name || u.full_name || u.email,
        email: u.email,
        pmCode: u.pmCode || u.pm_code,
      }))
      .filter((pm) => pm?.pmCode);

    if (pmsFromCurrentUsers.length) {
      setPmDirectory(pmsFromCurrentUsers);
      return;
    }

    if (pmDirectoryFetchedRef.current) return;
    pmDirectoryFetchedRef.current = true;

    const loadPmDirectory = async () => {
      try {
        const res = await hrApi.users();
        const pms = (res?.users || [])
          .filter((u) => u?.role === "pm" && (u.pmCode || u.pm_code))
          .map((u) => ({
            id: u.id,
            fullName: u.fullName || u.name || u.full_name || u.email,
            email: u.email,
            pmCode: u.pmCode || u.pm_code,
          }))
          .filter((pm) => pm?.pmCode);
        setPmDirectory(pms);
      } catch (err) {
        console.error("Error loading PM directory:", err);
        setPmDirectory([]);
      }
    };

    void loadPmDirectory();
  }, [allUsers]);

  const handleAssignPm = async (intern, pmCode) => {
    if (!intern?.id || !pmCode) return;
    try {
      setSavingAssign((prev) => ({ ...prev, [intern.id]: true }));
      await hrApi.assignPm(intern.id, pmCode);

      const next = activeInterns.map((i) => (i.id === intern.id ? { ...i, pmCode } : i));
      setActiveInterns(next);

      const updatedAll = (allUsers || []).map((u) =>
        u.id === intern.id ? { ...u, pmCode, pmId: allPMs.find((p) => p.pmCode === pmCode)?.id || u.pmId } : u
      );
      setAllUsers(updatedAll);
    } catch (err) {
      console.error("Error assigning PM:", err);
      openFeedback({
        title: "PM assignment failed",
        message: err?.message || "Failed to assign PM.",
        tone: "error",
      });
    } finally {
      setSavingAssign((prev) => ({ ...prev, [intern.id]: false }));
    }
  };

  const getInitials = (fullName) => {
    const safe = String(fullName || "").trim();
    if (!safe) return "PM";
    const parts = safe.split(/\s+/).filter(Boolean);
    const initials = parts.slice(0, 2).map((p) => p[0]).join("");
    return initials.toUpperCase() || "PM";
  };

  const handleMarkCompleted = async (intern) => {
    if (!intern?.id) return;
    setPendingCompleteIntern(intern);
  };

  const confirmMarkCompleted = async () => {
    const intern = pendingCompleteIntern;
    if (!intern?.id) {
      setPendingCompleteIntern(null);
      return;
    }
    try {
      setMarkingCompleted((prev) => ({ ...prev, [intern.id]: true }));
      await hrApi.markInternCompleted(intern.id);
      const nextAll = (allUsers || []).map((row) =>
        row.id === intern.id ? { ...row, status: "completed", approvalStatus: "completed" } : row
      );
      setAllUsers(nextAll);
      setActiveInterns((rows) => rows.filter((row) => row.id !== intern.id));
    } catch (err) {
      openFeedback({
        title: "Update failed",
        message: err?.message || "Failed to mark intern as completed.",
        tone: "error",
      });
    } finally {
      setMarkingCompleted((prev) => ({ ...prev, [intern.id]: false }));
      setPendingCompleteIntern(null);
    }
  };

  const internsForScope = filterMode === "mine"
    ? activeInterns.filter((intern) => {
        if (!currentHrId) return false;
        // Assigned HR: profiles.hr_id === this HR's profile id
        const assignedHrId = intern?.hrId || intern?.hr_id || null;
        return assignedHrId && String(assignedHrId) === String(currentHrId);
      })
    : activeInterns;

  const internsForPm = pmFilterCode
    ? internsForScope.filter((intern) => (intern?.pmCode || intern?.pm_code || "") === pmFilterCode)
    : internsForScope;

  const enrichedInterns = internsForPm.map((intern) => ({
    ...intern,
    departmentResolved: resolveDepartment(intern),
  }));

  const searchFiltered = enrichedInterns.filter((intern) => {
    const searchLower = searchQuery.toLowerCase();
    if (!searchLower) return true;
    const internId = String(intern.internId || intern.intern_id || "").toLowerCase();
    return (
      String(intern.name || "").toLowerCase().includes(searchLower) ||
      String(intern.fullName || "").toLowerCase().includes(searchLower) ||
      String(intern.email || "").toLowerCase().includes(searchLower) ||
      String(intern.internshipDomain || "").toLowerCase().includes(searchLower) ||
      String(intern.degree || "").toLowerCase().includes(searchLower) ||
      String(intern.departmentResolved || "").toLowerCase().includes(searchLower) ||
      internId.includes(searchLower)
    );
  });

  const filteredInterns =
    departmentFilter === "Overall"
      ? searchFiltered
      : searchFiltered.filter((intern) => intern.departmentResolved === departmentFilter);

  const stats = {
    total: enrichedInterns.length,
    active: enrichedInterns.filter((i) => i.status === "active").length,
    avgPerformance: enrichedInterns.length > 0
      ? Math.round(
          enrichedInterns.reduce((sum, i) => sum + (i.performance || 0), 0) / enrichedInterns.length
        )
      : 0,
  };

  const handleViewProfile = (intern) => {
    setSelectedIntern(intern);
    setInternProfileSection("profile");
    setViewMode("profile");
  };

  const handleViewReports = (intern) => {
    setSelectedIntern(intern);
    setInternProfileSection("reports");
    setViewMode("profile");
  };

  const handleBackToGrid = () => {
    setSelectedIntern(null);
    setInternProfileSection("profile");
    setViewMode("grid");
  };

  if (viewMode === "profile" && selectedIntern) {
    return <InternProfilePage intern={selectedIntern} onBack={handleBackToGrid} initialSection={internProfileSection} />;
  }

  return (
    <div className="animate-fadeIn">
      <style>{`
        .intern-card {
          background: rgba(7, 30, 34, 0.85);
          border: 1px solid rgba(103, 146, 137, 0.25);
          border-radius: 18px;
          padding: 20px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .intern-card:hover {
          transform: translateY(-3px);
          border-color: rgba(103, 146, 137, 0.45);
          background: rgba(7, 30, 34, 0.95);
          box-shadow: 0 16px 32px -10px rgba(0, 0, 0, 0.6), 0 0 24px rgba(103, 146, 137, 0.12);
        }
        .stat-box {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 10px;
          padding: 10px 6px;
          text-align: center;
          flex: 1;
        }
        .stat-box .stat-label {
          font-size: 9px;
          font-weight: 800;
          letter-spacing: 0.08em;
          color: rgba(255, 229, 217, 0.55);
          text-transform: uppercase;
          margin-bottom: 4px;
        }
        .stat-box .stat-value {
          font-size: 16px;
          font-weight: 900;
          color: ${COLORS.peachGlow};
        }
        .stat-box .stat-value.green { color: #4ade80; }
        .action-btn {
          flex: 1;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 6px;
          padding: 10px 8px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .action-btn.profile-btn {
          background: linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean});
          color: ${COLORS.peachGlow};
          border: none;
        }
        .action-btn.profile-btn:hover { transform: scale(1.02); opacity: 0.9; }
        .action-btn.reports-btn {
          background: rgba(120, 80, 10, 0.35);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.3);
        }
        .action-btn.reports-btn:hover { background: rgba(120, 80, 10, 0.5); transform: scale(1.02); }
        .action-btn.msg-btn {
          background: rgba(255, 255, 255, 0.05);
          color: ${COLORS.peachGlow};
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .action-btn.msg-btn:hover { background: rgba(255, 255, 255, 0.09); transform: scale(1.02); }
        .action-btn.primary {
          background: linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean});
          color: ${COLORS.peachGlow};
          border: none;
        }
        .action-btn.primary:hover { transform: scale(1.02); }
        .action-btn.secondary {
          background: rgba(255, 255, 255, 0.05);
          color: ${COLORS.peachGlow};
          border: 1px solid rgba(255, 255, 255, 0.12);
        }
        .action-btn.secondary:hover { background: rgba(255, 255, 255, 0.09); transform: scale(1.02); }
        .action-btn.success {
          background: rgba(34, 197, 94, 0.15);
          color: #86efac;
          border: 1px solid rgba(34, 197, 94, 0.35);
        }
        .action-btn.success:hover { background: rgba(34, 197, 94, 0.22); transform: scale(1.02); }
        .info-row-icon {
          color: rgba(255, 229, 217, 0.5);
          flex-shrink: 0;
        }
        .divider-line {
          border: none;
          border-top: 1px solid rgba(103, 146, 137, 0.15);
          margin: 0;
        }
      `}</style>
      {loadError && (
        <div
          style={{
            marginBottom: 16,
            padding: "12px 16px",
            borderRadius: 12,
            background: "rgba(217, 4, 41, 0.12)",
            border: "1px solid rgba(217, 4, 41, 0.35)",
            color: COLORS.peachGlow,
          }}
        >
          {loadError}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <h2 style={{ margin: 0, color: COLORS.peachGlow, fontSize: 22, fontWeight: 800 }}>
            {filterMode === "mine" ? "My Interns" : "Active Interns"}
          </h2>
          <div style={{ marginTop: 4, color: "rgba(255, 229, 217, 0.65)", fontSize: 13 }}>
            {filterMode === "mine" ? "Interns approved by you" : "All active interns in the system"}
          </div>
        </div>
      </div>
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

      {pmFilterCode && (
        <div
          className="glass animate-fadeIn"
          style={{
            padding: "12px 14px",
            borderRadius: "12px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            background: "rgba(29, 120, 116, 0.12)",
            border: "1px solid rgba(103, 146, 137, 0.3)",
          }}
        >
          <div style={{ color: COLORS.peachGlow, fontSize: 13, fontWeight: 700 }}>
            Showing interns under{" "}
            <span style={{ color: "rgba(255, 229, 217, 0.9)", fontWeight: 800 }}>
              {pmFilterName ? `${pmFilterName} (${pmFilterCode})` : pmFilterCode}
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setPmFilterCode("");
              setPmFilterName("");
              onClearPmFilter && onClearPmFilter();
            }}
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              border: "1px solid rgba(103, 146, 137, 0.45)",
              background: "rgba(103, 146, 137, 0.12)",
              color: COLORS.peachGlow,
              fontSize: 12,
              fontWeight: 800,
              cursor: "pointer",
              whiteSpace: "nowrap",
            }}
          >
            Clear filter
          </button>
        </div>
      )}

      {/* Department Tabs */}
      <div
        className="glass animate-fadeIn"
        style={{
          padding: "10px",
          borderRadius: "12px",
          marginBottom: "16px",
          display: "grid",
          gap: 10,
        }}
      >
        {/* Department chips */}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {["Overall", ...DEPARTMENTS].map((dept) => {
            const active = departmentFilter === dept;
            const label = dept === "Overall" ? "All" : String(dept).toUpperCase();
            return (
              <button
                key={dept}
                type="button"
                onClick={() => setDepartmentFilter(dept)}
                style={{
                  padding: "10px 18px",
                  borderRadius: 14,
                  border: active ? "none" : "1px solid rgba(255, 255, 255, 0.12)",
                  background: active
                    ? `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`
                    : "rgba(255, 255, 255, 0.04)",
                  color: active ? COLORS.peachGlow : "rgba(255, 229, 217, 0.92)",
                  fontWeight: 800,
                  fontSize: 14,
                  letterSpacing: 0.4,
                  cursor: "pointer",
                  boxShadow: active ? "0 10px 24px rgba(0,0,0,0.35)" : "none",
                  transition: "transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease",
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = "scale(0.98)"}
                onMouseUp={(e) => e.currentTarget.style.transform = "scale(1)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search
            size={18}
            color="rgba(255, 229, 217, 0.5)"
            style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="text"
            placeholder="Search by name, email, intern ID, department..."
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
          gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
          gap: 16,
        }}
      >
        {filteredInterns.map((intern, index) => (
          <div
            key={intern.id || intern.email || index}
            className={`intern-card animate-fadeIn stagger-${(index % 5) + 1}`}
          >
            {/* ── Card Header ── */}
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              {/* Avatar */}
              <div
                style={{
                  width: 54,
                  height: 54,
                  background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                  borderRadius: "50%",
                  display: "grid",
                  placeItems: "center",
                  fontWeight: 800,
                  fontSize: 19,
                  color: "white",
                  position: "relative",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.35)",
                  flexShrink: 0,
                }}
              >
                {(intern.fullName || intern.name || "IN")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
                <div
                  title={intern.status || "active"}
                  style={{
                    position: "absolute",
                    bottom: 1,
                    right: 1,
                    width: 13,
                    height: 13,
                    borderRadius: "50%",
                    background: statusColor(intern.status || "active"),
                    border: "2px solid rgba(7, 30, 34, 0.9)",
                  }}
                />
              </div>

              {/* Name + Email */}
              <div style={{ minWidth: 0, flex: 1 }}>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 900,
                    color: COLORS.peachGlow,
                    margin: 0,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {intern.fullName || intern.name || "Intern"}
                </h3>
                <div style={{ fontSize: 12, color: "rgba(255, 229, 217, 0.55)", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {intern.email || "—"}
                </div>
              </div>

              {/* Status Badge */}
              <div
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontSize: 10,
                  fontWeight: 900,
                  letterSpacing: "0.07em",
                  color: statusColor(intern.status || "active"),
                  border: `1px solid ${statusColor(intern.status || "active")}55`,
                  background: `${statusColor(intern.status || "active")}18`,
                  flexShrink: 0,
                  alignSelf: "flex-start",
                  marginTop: 2,
                }}
              >
                {(intern.status || "active").toUpperCase()}
              </div>
            </div>

            {/* ── Info Row ── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Briefcase size={13} className="info-row-icon" />
                <span style={{ fontSize: 12, color: "rgba(255, 229, 217, 0.75)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {intern.internId || intern.intern_id || "—"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Award size={13} className="info-row-icon" />
                <span style={{ fontSize: 12, color: "rgba(255, 229, 217, 0.75)" }}>
                  {intern.departmentResolved || resolveDepartment(intern)}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Calendar size={13} className="info-row-icon" />
                <span style={{ fontSize: 12, color: "rgba(255, 229, 217, 0.75)" }}>
                  {intern.endDate ? new Date(intern.endDate).toLocaleDateString() : "—"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Clock size={13} className="info-row-icon" />
                <span style={{ fontSize: 12, color: "rgba(255, 229, 217, 0.75)" }}>
                  {intern.lastLogDate ? "Logged" : "No logs"}
                </span>
              </div>
            </div>

            <hr className="divider-line" />

            {/* ── Stats Row (4 columns) ── */}
            <div style={{ display: "flex", gap: 8 }}>
              <div className="stat-box">
                <div className="stat-label">Hours</div>
                <div className="stat-value">{(Number(intern.totalHours) || 0).toFixed(1)}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Tasks</div>
                <div className="stat-value">{Number(intern.tasksCompleted) || 0}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Reports</div>
                <div className="stat-value">{Number(intern.pendingReports) || 0}</div>
              </div>
              <div className="stat-box">
                <div className="stat-label">Perform</div>
                <div className="stat-value green">{Number(intern.performance) || 0}%</div>
              </div>
            </div>

            {/* ── Quick Actions (Profile / Reports / Message) ── */}
            <div style={{ display: "flex", gap: 8 }}>
              <button type="button" onClick={() => handleViewProfile(intern)} className="action-btn profile-btn">
                <Eye size={15} /> Profile
              </button>
              <button type="button" onClick={() => handleViewReports(intern)} className="action-btn reports-btn">
                <FileText size={15} /> Reports
              </button>
              <button type="button" onClick={() => onNavigateToMessages && onNavigateToMessages(intern)} className="action-btn msg-btn">
                <MessageCircle size={15} /> Message
              </button>
            </div>

            <hr className="divider-line" />

            {/* ── Existing Management Controls (kept) ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* PM Assignment */}
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, color: "rgba(255, 229, 217, 0.55)", marginBottom: 5, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                    PM Assignment
                  </p>

                  {intern.pmCode && !pmEditing[intern.id] ? (
                    (() => {
                      const assignedPm = allPMs.find((pm) => String(pm.pmCode) === String(intern.pmCode));
                      const pmName = assignedPm?.fullName || "Unknown PM";
                      const pmCode = assignedPm?.pmCode || intern.pmCode;

                      return (
                        <div
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: 10,
                            padding: "10px 12px",
                            borderRadius: 14,
                            background: "rgba(103, 146, 137, 0.12)",
                            border: "1px solid rgba(103, 146, 137, 0.3)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                            <div
                              style={{
                                width: 34,
                                height: 34,
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, rgba(20, 184, 166, 0.35), rgba(103, 146, 137, 0.25))",
                                border: "1px solid rgba(103, 146, 137, 0.35)",
                                display: "grid",
                                placeItems: "center",
                                color: COLORS.peachGlow,
                                fontWeight: 900,
                                fontSize: 13,
                                flexShrink: 0,
                              }}
                              title={pmName}
                            >
                              {getInitials(pmName)}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ color: COLORS.peachGlow, fontSize: 14, fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {pmName}
                              </div>
                              <div style={{ marginTop: 2, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                                <span
                                  style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    padding: "3px 8px",
                                    borderRadius: 999,
                                    fontSize: 12,
                                    color: "rgba(255, 229, 217, 0.8)",
                                    background: "rgba(255,255,255,0.05)",
                                    border: "1px solid rgba(103, 146, 137, 0.25)",
                                  }}
                                >
                                  {pmCode}
                                </span>
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setPmSelections((prev) => ({ ...prev, [intern.id]: String(intern.pmCode || "") }));
                              setPmEditing((prev) => ({ ...prev, [intern.id]: true }));
                            }}
                            className="action-btn secondary"
                            style={{ flex: "0 0 auto" }}
                          >
                            Change
                          </button>
                        </div>
                      );
                    })()
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        padding: "10px 12px",
                        borderRadius: 14,
                        border: intern.pmCode ? "1px solid rgba(103, 146, 137, 0.3)" : "1px dashed rgba(245, 158, 11, 0.35)",
                        background: intern.pmCode ? "rgba(255,255,255,0.04)" : "rgba(245, 158, 11, 0.08)",
                      }}
                    >
                      {!intern.pmCode ? (
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, color: "rgba(255, 229, 217, 0.75)", fontSize: 12, fontWeight: 800 }}>
                          <User size={14} style={{ opacity: 0.9 }} />
                          No PM assigned
                        </div>
                      ) : null}

                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <select
                          value={pmSelections[intern.id] || ""}
                          onChange={(e) => setPmSelections((prev) => ({ ...prev, [intern.id]: e.target.value }))}
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            borderRadius: 10,
                            border: "1px solid rgba(103, 146, 137, 0.35)",
                            background: "rgba(7, 30, 34, 0.72)",
                            color: COLORS.peachGlow,
                            outline: "none",
                            fontSize: 13,
                          }}
                        >
                          <option value="" style={{ background: COLORS.inkBlack, color: COLORS.peachGlow }}>
                            Select project manager…
                          </option>
                          {allPMs.map((pm) => (
                            <option key={pm.pmCode} value={pm.pmCode} style={{ background: COLORS.inkBlack, color: COLORS.peachGlow }}>
                              {pm.fullName} ({pm.pmCode})
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={async () => {
                            await handleAssignPm(intern, pmSelections[intern.id]);
                            setPmEditing((prev) => ({ ...prev, [intern.id]: false }));
                          }}
                          disabled={!pmSelections[intern.id] || !!savingAssign[intern.id]}
                          className="action-btn primary"
                          style={{
                            flex: "0 0 auto",
                            opacity: !pmSelections[intern.id] || savingAssign[intern.id] ? 0.65 : 1,
                            cursor: !pmSelections[intern.id] || savingAssign[intern.id] ? "not-allowed" : "pointer",
                          }}
                        >
                          {savingAssign[intern.id] ? "Saving…" : intern.pmCode ? "Update" : "Assign"}
                        </button>
                      </div>

                      {intern.pmCode ? (
                        <button
                          type="button"
                          onClick={() => setPmEditing((prev) => ({ ...prev, [intern.id]: false }))}
                          className="action-btn secondary"
                          style={{ marginTop: 8, padding: "8px 10px", fontSize: 12 }}
                        >
                          Cancel
                        </button>
                      ) : null}
                    </div>
                  )}
                </div>
              </div>

              {/* Documents + Complete */}
              <div style={{ display: "flex", gap: 8 }}>
                <button type="button" onClick={() => window.open(hrApi.downloadOfferLetter(intern.id), "_blank", "noopener,noreferrer")} className="action-btn secondary" style={{ fontSize: 12 }}>
                  <FileDown size={14} /> Offer
                </button>
                <button type="button" onClick={() => window.open(hrApi.downloadCertificate(intern.id), "_blank", "noopener,noreferrer")} className="action-btn secondary" style={{ fontSize: 12 }}>
                  <FileDown size={14} /> Certificate
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkCompleted(intern)}
                  disabled={!!markingCompleted[intern.id]}
                  className="action-btn success"
                  style={{
                    cursor: markingCompleted[intern.id] ? "not-allowed" : "pointer",
                    opacity: markingCompleted[intern.id] ? 0.65 : 1,
                    fontSize: 12,
                  }}
                >
                  <CheckCircle2 size={14} /> {markingCompleted[intern.id] ? "Updating..." : "Complete"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Inline Reports Modal ── */}
      {reportsModal && (
        <div
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.78)",
            backdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 3000, padding: 18,
          }}
          onClick={() => setReportsModal(null)}
        >
          <div
            style={{
              width: "100%", maxWidth: 800, maxHeight: "88vh",
              borderRadius: 20,
              background: "linear-gradient(135deg, #071e22, #0a2528)",
              border: "1px solid rgba(103, 146, 137, 0.3)",
              display: "flex", flexDirection: "column",
              overflow: "hidden",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(103, 146, 137, 0.2)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 42, height: 42,
                  background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                  borderRadius: "50%", display: "grid", placeItems: "center",
                  fontWeight: 800, fontSize: 15, color: "white", flexShrink: 0,
                }}>
                  {(reportsModal.intern?.fullName || reportsModal.intern?.name || "IN").split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 16, color: COLORS.peachGlow }}>
                    {reportsModal.intern?.fullName || reportsModal.intern?.name || "Intern"}'s Reports
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255, 229, 217, 0.55)", marginTop: 2 }}>
                    {reportsModal.intern?.email || ""}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setReportsModal(null)}
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: COLORS.peachGlow }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              {reportsModal.loading ? (
                <div style={{ textAlign: "center", padding: 40, color: "rgba(255,229,217,0.6)" }}>Loading reports…</div>
              ) : reportsModal.error ? (
                <div style={{ padding: 20, color: "#f87171", background: "rgba(239,68,68,0.1)", borderRadius: 12, border: "1px solid rgba(239,68,68,0.25)" }}>{reportsModal.error}</div>
              ) : reportsModal.reports.length === 0 ? (
                <div style={{ textAlign: "center", padding: 48 }}>
                  <FileText size={40} color="rgba(103,146,137,0.5)" style={{ marginBottom: 12 }} />
                  <div style={{ color: "rgba(255,229,217,0.55)", fontSize: 14 }}>No reports submitted yet.</div>
                </div>
              ) : reportsModal.selected ? (
                /* Full report detail */
                <div>
                  <button
                    onClick={() => setReportsModal((p) => p ? { ...p, selected: null } : null)}
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "8px 14px", color: COLORS.peachGlow, cursor: "pointer", fontSize: 13, fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}
                  >
                    ← Back to reports
                  </button>
                  <div style={{ fontWeight: 900, fontSize: 16, color: COLORS.peachGlow, marginBottom: 4 }}>
                    {reportsModal.selected.reportType === "weekly"
                      ? `Weekly Report • Week ${reportsModal.selected.weekNumber || "?"}`
                      : `Monthly Report • ${reportsModal.selected.month || "Month"}`}
                  </div>
                  {reportsModal.selected.dateRange && <div style={{ fontSize: 12, color: "rgba(255,229,217,0.5)", marginBottom: 14 }}>{reportsModal.selected.dateRange}</div>}
                  <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(103,146,137,0.2)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
                    <div style={{ fontWeight: 800, color: COLORS.peachGlow, marginBottom: 8, fontSize: 13 }}>Summary</div>
                    <pre style={{ whiteSpace: "pre-wrap", margin: 0, color: "rgba(255,255,255,0.78)", fontSize: 12, lineHeight: 1.7 }}>{reportsModal.selected.summary || ""}</pre>
                  </div>
                  {reportsModal.selected.reviewReason && (
                    <div style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: 16 }}>
                      <div style={{ fontWeight: 800, color: COLORS.peachGlow, marginBottom: 8, fontSize: 13 }}>Review Note</div>
                      <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 1.6 }}>{reportsModal.selected.reviewReason}</div>
                    </div>
                  )}
                </div>
              ) : (
                /* Reports list */
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {reportsModal.reports.map((r) => {
                    const title = r.reportType === "weekly"
                      ? `Weekly Report • Week ${r.weekNumber || "?"}`
                      : `Monthly Report • ${r.month || "Month"}`;
                    const statusColor2 = r.status === "approved" ? "#10b981" : r.status === "rejected" ? "#ef4444" : "#f59e0b";
                    return (
                      <button
                        key={r.id}
                        onClick={() => setReportsModal((p) => p ? { ...p, selected: r } : null)}
                        style={{
                          background: "rgba(255,255,255,0.04)",
                          border: "1px solid rgba(103,146,137,0.2)",
                          borderRadius: 14, padding: 14, textAlign: "left", cursor: "pointer",
                          transition: "background 0.2s",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
                          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                            <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(103,146,137,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.jungleTeal, flexShrink: 0 }}>
                              <FileText size={16} />
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: 13, color: COLORS.peachGlow }}>{title}</div>
                              <div style={{ fontSize: 11, color: "rgba(255,229,217,0.5)", marginTop: 4 }}>{r.dateRange || ""}</div>
                              {r.summary && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 6, lineHeight: 1.5 }}>{String(r.summary).slice(0, 140)}{String(r.summary).length > 140 ? "…" : ""}</div>}
                            </div>
                          </div>
                          <div style={{ padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 800, color: "white", background: `${statusColor2}28`, border: `1px solid ${statusColor2}44`, flexShrink: 0, textTransform: "capitalize" }}>
                            {r.status || "pending"}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

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
            {pmFilterCode
              ? "No interns are assigned to this project manager."
              : searchQuery
                ? "Try adjusting your search criteria"
                : filterMode === "mine"
                  ? "No interns are assigned to you yet"
                  : "No interns in the system yet"}
          </p>
        </div>
      )}

      {pendingCompleteIntern && (
        <Modal onClose={() => setPendingCompleteIntern(null)}>
          <h3 style={{ margin: 0, color: COLORS.peachGlow, fontSize: 20 }}>Confirm completion</h3>
          <p style={{ color: "rgba(255, 229, 217, 0.8)", marginTop: 10, marginBottom: 16 }}>
            Mark <strong>{pendingCompleteIntern.fullName || pendingCompleteIntern.name || "this intern"}</strong> as completed?
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              onClick={() => setPendingCompleteIntern(null)}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(103, 146, 137, 0.35)",
                background: "transparent",
                color: COLORS.peachGlow,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              onClick={confirmMarkCompleted}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "none",
                background: "rgba(34, 197, 94, 0.9)",
                color: "#052e16",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              Confirm
            </button>
          </div>
        </Modal>
      )}

      {feedback.open && (
        <Modal
          onClose={() =>
            setFeedback({
              open: false,
              title: "",
              message: "",
              tone: "info",
            })
          }
        >
          <h3 style={{ margin: 0, color: COLORS.peachGlow, fontSize: 20 }}>{feedback.title || "Update"}</h3>
          <p style={{ color: "rgba(255, 229, 217, 0.8)", marginTop: 10, marginBottom: 16, whiteSpace: "pre-line" }}>
            {feedback.message}
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() =>
                setFeedback({
                  open: false,
                  title: "",
                  message: "",
                  tone: "info",
                })
              }
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "none",
                background:
                  feedback.tone === "success"
                    ? "rgba(16, 185, 129, 0.9)"
                    : feedback.tone === "error"
                      ? "rgba(239, 68, 68, 0.9)"
                      : "rgba(20, 184, 166, 0.9)",
                color: "white",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              OK
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ActiveInternsPage;
