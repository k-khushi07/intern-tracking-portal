// PMHome.jsx - pm dashboard
import React, { useState, useEffect, useCallback } from "react";
import { Menu, Bell, LogOut, Sparkles, X, Users, Home, MessageCircle, Send } from "lucide-react";
import MessagesPage from './MessagesPage';
import OverviewPage from "./OverviewPage";
import MyInternsPage from './MyInternsPage';
import InternProfilePage from './InternProfilePage';
import { authApi, pmApi, announcementsApi, notificationsApi } from "../../lib/apiClient";
import { getRealtimeSocket } from "../../lib/realtime";
import AccountModal from "../../components/AccountModal";

const COLORS = {
  bgPrimary: "#020617",
  bgSecondary: "#0a2528",
  surfaceGlass: "rgba(255, 255, 255, 0.06)",
  borderGlass: "rgba(255, 255, 255, 0.12)",
  deepOcean: "#0f766e",
  jungleTeal: "#14b8a6",
  emeraldGlow: "#10b981",
  cyanHighlight: "#22d3ee",
  textPrimary: "#f8fafc",
  textSecondary: "rgba(248, 250, 252, 0.7)",
  textMuted: "rgba(248, 250, 252, 0.5)",
  orange: "#f59e0b",
  red: "#ef4444",
  purple: "#a78bfa",
};

const GRADIENTS = {
  primary: `linear-gradient(135deg, ${COLORS.bgPrimary} 0%, ${COLORS.bgSecondary} 50%, ${COLORS.bgPrimary} 100%)`,
  accent: `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)`,
};

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Inter', system-ui, sans-serif; background: ${COLORS.bgPrimary}; color: white; overflow-x: hidden; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
    .animate-slideIn { animation: slideIn 0.4s ease-out forwards; }
    .stagger-1 { animation-delay: 0.05s; opacity: 0; }
    .stagger-2 { animation-delay: 0.1s; opacity: 0; }
    .stagger-3 { animation-delay: 0.15s; opacity: 0; }
    .stagger-4 { animation-delay: 0.2s; opacity: 0; }
    .stagger-5 { animation-delay: 0.25s; opacity: 0; }
    input::placeholder, textarea::placeholder { color: rgba(248, 250, 252, 0.4); }
    input:focus, textarea:focus { outline: none; border-color: ${COLORS.jungleTeal}; box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2); }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: ${COLORS.bgPrimary}; }
    ::-webkit-scrollbar-thumb { background: ${COLORS.deepOcean}; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: ${COLORS.jungleTeal}; }
  `}</style>
);

function ProjectSubmissionsSection({ isMobile }) {
  const [submissions, setSubmissions] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const load = async () => {
      try {
        const res = await pmApi.projectSubmissions();
        setSubmissions(res?.submissions || []);
      } catch (err) {
        setError(err?.message || "Failed to load submissions");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleReview = async (submissionId, status) => {
    const comment = document.getElementById(`pm-comment-${submissionId}`)?.value || "";
    try {
      await pmApi.reviewProjectSubmission(submissionId, { status, comment });
      setSubmissions(prev => prev.map(s =>
        s.id === submissionId ? { ...s, status } : s
      ));
    } catch (err) {
      alert(err?.message || "Failed to update submission");
    }
  };

  if (loading) return <div style={{ color: "white", padding: 32 }}>Loading...</div>;
  if (error) return <div style={{ color: "#ef4444", padding: 32 }}>{error}</div>;
  if (!submissions.length) return (
    <div style={{ color: "rgba(248,250,252,0.6)", padding: 60, textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 16 }}></div>
      <div style={{ fontSize: 18, fontWeight: 600, color: "white", marginBottom: 8 }}>
        No project submissions yet
      </div>
      <div style={{ fontSize: 14 }}>Submissions from your interns will appear here</div>
    </div>
  );

  return (
    <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h2 style={{ color: "white", margin: 0, fontSize: 22, fontWeight: 700 }}>
          Project Submissions
        </h2>
        <span style={{
          background: "rgba(20,184,166,0.15)",
          color: "#14b8a6",
          border: "1px solid #14b8a6",
          borderRadius: 20,
          padding: "4px 14px",
          fontSize: 13,
          fontWeight: 600,
        }}>
          {submissions.length} total
        </span>
      </div>

      {submissions.map((s) => (
        <div key={s.id} style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.12)",
          borderRadius: 16,
          padding: 24,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                Project Title
              </div>
              <div style={{ color: "white", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
                {s.title || "Untitled Project"}
              </div>
              <div style={{ color: "#14b8a6", fontSize: 13, display: "flex", flexWrap: "wrap", gap: 8 }}>
                <span>Intern: {s.intern?.full_name || "Unknown"}</span>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
                <span>{s.intern?.email || "?"}</span>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
                <span>ID: {s.intern?.intern_id || "?"}</span>
              </div>
            </div>
            <span style={{
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
              background: s.status === "submitted" ? "rgba(20,184,166,0.15)"
                        : s.status === "approved" ? "rgba(16,185,129,0.15)"
                        : "rgba(239,68,68,0.15)",
              color: s.status === "submitted" ? "#14b8a6"
                   : s.status === "approved" ? "#10b981"
                   : "#ef4444",
              border: `1px solid ${s.status === "submitted" ? "#14b8a6"
                     : s.status === "approved" ? "#10b981" : "#ef4444"}`,
              textTransform: "uppercase",
              letterSpacing: 1,
            }}>{s.status}</span>
          </div>

          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600,
              textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
              Description
            </div>
            <div style={{
              color: "rgba(248,250,252,0.8)",
              fontSize: 14,
              lineHeight: 1.7,
              background: "rgba(255,255,255,0.03)",
              padding: "14px 16px",
              borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              {s.description || "No description provided."}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
            <div style={{ display: "flex", gap: 16 }}>
              <a href={s.github_link} target="_blank" rel="noreferrer" style={{
                color: "#14b8a6", fontSize: 13, textDecoration: "none",
                display: "flex", alignItems: "center", gap: 4,
              }}>GitHub Repository</a>
              {s.demo_link && (
                <a href={s.demo_link} target="_blank" rel="noreferrer" style={{
                  color: "#a78bfa", fontSize: 13, textDecoration: "none",
                  display: "flex", alignItems: "center", gap: 4,
                }}>Live Demo</a>
              )}
            </div>
            <div style={{ color: "rgba(248,250,252,0.4)", fontSize: 11 }}>
              Submitted: {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : "?"}
            </div>
          </div>

          {s.status === "submitted" && (
            <div style={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: 14,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600,
                textTransform: "uppercase", letterSpacing: 1 }}>
                PM Review
              </div>
              <textarea
                placeholder="Add a review comment (optional)..."
                id={`pm-comment-${s.id}`}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.05)",
                  color: "white",
                  fontSize: 13,
                  resize: "vertical",
                  minHeight: 70,
                  outline: "none",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => handleReview(s.id, "approved")}
                  style={{
                    flex: 1, padding: "11px 0", borderRadius: 10, border: "none",
                    background: "linear-gradient(135deg, #059669, #10b981)",
                    color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
                  }}>
                  Approve
                </button>
                <button
                  onClick={() => handleReview(s.id, "rejected")}
                  style={{
                    flex: 1, padding: "11px 0", borderRadius: 10, border: "none",
                    background: "linear-gradient(135deg, #dc2626, #ef4444)",
                    color: "white", fontWeight: 700, fontSize: 14, cursor: "pointer",
                  }}>
                  Reject
                </button>
              </div>
            </div>
          )}

          {s.status !== "submitted" && s.review_comment && (
            <div style={{
              borderTop: "1px solid rgba(255,255,255,0.08)",
              paddingTop: 12,
              color: "rgba(248,250,252,0.5)",
              fontSize: 13,
              fontStyle: "italic",
            }}>
              Review comment: {s.review_comment}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const PMHome = () => {
  const [currentPage, setCurrentPage] = useState("overview");
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [selectedInternSection, setSelectedInternSection] = useState("profile");
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const [pmInfo, setPmInfo] = useState(null);
  const [interns, setInterns] = useState([]);
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [monthlyReports, setMonthlyReports] = useState([]);
  const [pmStats, setPmStats] = useState(null);
  const [sharedAnnouncements, setSharedAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  
  // Responsive Handler
  useEffect(() => {
    const onResize = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth < 1024) setSidebarOpen(false);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Notifications State
  const [notifications, setNotifications] = useState([]);

  const formatTimeAgo = useCallback((iso) => {
    const t = new Date(iso || "").getTime();
    if (!Number.isFinite(t)) return "";
    const diff = Date.now() - t;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, []);

  const mapApiNotification = useCallback(
    (n) => ({
      id: n.id,
      title: n.title,
      message: n.message || "",
      time: formatTimeAgo(n.createdAt),
      read: !!n.read,
      type: n.type || "info",
      link: n.link || null,
      category: n.category || null,
      createdAt: n.createdAt || null,
    }),
    [formatTimeAgo]
  );

  const loadNotifications = useCallback(async () => {
    try {
      const res = await notificationsApi.list({ limit: 60 });
      const rows = res?.notifications || [];
      setNotifications(rows.map(mapApiNotification));
    } catch {
      setNotifications([]);
    }
  }, [mapApiNotification]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setLoadError("");

      try {
        const meRes = await pmApi.me();
        const pm = meRes?.pm;
        if (!pm?.email) throw new Error("Unable to load PM profile");

        const displayName = pm.fullName || pm.email;
        const avatar = String(displayName)
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((w) => w[0])
          .join("")
          .toUpperCase();

        const nextPmInfo = {
          id: pm.id,
          name: displayName,
          role: "Project Manager",
          avatar: avatar || "PM",
          fullName: pm.fullName || displayName,
          pmCode: pm.pmCode || null,
          email: pm.email,
          status: pm.status,
        };

        if (!cancelled) {
          setPmInfo(nextPmInfo);
          localStorage.setItem(
            "currentUser",
            JSON.stringify({
              role: "pm",
              fullName: nextPmInfo.fullName,
              email: nextPmInfo.email,
              pmCode: nextPmInfo.pmCode,
            })
          );
        }
      } catch (err) {
        console.error("Failed loading PM profile:", err);
        if (!cancelled) {
          setLoadError(err?.message || "Failed to load PM profile");
        }
      }

      try {
        const internsRes = await pmApi.interns();
        const raw = internsRes?.interns || [];
        const mapped = raw.map((p) => ({
          ...p,
          fullName: p.full_name || p.fullName || p.name,
          name: p.full_name || p.fullName || p.name,
          internId: p.intern_id || p.internId,
          status: p.status || "active",
        }));
        if (!cancelled) setInterns(mapped);
      } catch (err) {
        console.error("Failed loading PM interns:", err);
        if (!cancelled) setInterns([]);
      }

      try {
        const statsRes = await pmApi.stats();
        if (!cancelled) setPmStats(statsRes?.stats || null);
      } catch (err) {
        console.error("Failed loading PM stats:", err);
        if (!cancelled) setPmStats(null);
      }

      try {
        const reportsRes = await pmApi.reports();
        const reports = reportsRes?.reports || [];
        const weekly = reports.filter((r) => r.reportType === "weekly");
        const monthly = reports.filter((r) => r.reportType === "monthly");
        if (!cancelled) {
          setWeeklyReports(weekly);
          setMonthlyReports(monthly);
        }
      } catch (err) {
        console.error("Failed loading PM reports:", err);
        if (!cancelled) {
          setWeeklyReports([]);
          setMonthlyReports([]);
        }
      }

      try {
        const annRes = await announcementsApi.list();
        if (!cancelled) setSharedAnnouncements(annRes?.announcements || []);
      } catch (err) {
        console.error("Failed loading announcements:", err);
        if (!cancelled) setSharedAnnouncements([]);
      }

      try {
        await loadNotifications();
      } catch {
        // ignore
      }

      if (!cancelled) setLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const computedStats = {
    activeInterns: interns.filter((i) => (i.status || "").toLowerCase() === "active").length,
    totalHours: 0,
    totalTasks: 0,
    pendingReports: weeklyReports.filter((r) => (r.status || "").toLowerCase() === "pending").length +
      monthlyReports.filter((r) => (r.status || "").toLowerCase() === "pending").length,
  };

  const stats = pmStats || computedStats;

  useEffect(() => {
    const socket = getRealtimeSocket();
    const onChanged = () => {
      pmApi.interns().then((r) => setInterns((r?.interns || []).map((p) => ({
        ...p,
        fullName: p.full_name || p.fullName || p.name,
        name: p.full_name || p.fullName || p.name,
        internId: p.intern_id || p.internId,
        status: p.status || "active",
      })))).catch(() => {});

      pmApi.stats().then((r) => setPmStats(r?.stats || null)).catch(() => {});

      pmApi.reports().then((r) => {
        const reports = r?.reports || [];
        setWeeklyReports(reports.filter((x) => x.reportType === "weekly"));
        setMonthlyReports(reports.filter((x) => x.reportType === "monthly"));
      }).catch(() => {});

      announcementsApi.list().then((r) => setSharedAnnouncements(r?.announcements || [])).catch(() => {});
      loadNotifications().catch(() => {});
    };

    socket.on("itp:changed", onChanged);
    return () => {
      socket.off("itp:changed", onChanged);
    };
  }, []);

  // REMOVED ANALYTICS FROM MENU
  const menuItems = [
    { id: "overview", label: "PM Dashboard", icon: Home },
    { id: "interns", label: "My Interns", icon: Users },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "project-submissions", label: "Project Submissions", icon: Send },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const markNotificationAsRead = (id) => {
    notificationsApi.markRead(id).catch(() => {});
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    notificationsApi.markAllRead().catch(() => {});
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const addNotification = useCallback(
    (notification) => {
      if (!notification) return;
      const next = {
        ...notification,
        id: notification.id || `local_${Date.now()}`,
        time: notification.time || formatTimeAgo(notification.createdAt) || "Just now",
        read: !!notification.read,
      };
      setNotifications((prev) => {
        if (prev.some((n) => String(n.id) === String(next.id))) return prev;
        return [next, ...prev].slice(0, 60);
      });
    },
    [formatTimeAgo]
  );

  useEffect(() => {
    const socket = getRealtimeSocket();
    const onNotification = (payload) => {
      const row = payload?.notification;
      if (!row?.id) return;
      addNotification(mapApiNotification(row));
    };
    socket.on("itp:notification", onNotification);
    return () => socket.off("itp:notification", onNotification);
  }, [addNotification, mapApiNotification]);

  const handleNavigateToMessages = (intern) => {
    setSelectedIntern(intern);
    setCurrentPage("messages");
  };

  const handleViewProfile = (intern) => {
    setSelectedIntern(intern);
    setSelectedInternSection("profile");
    setCurrentPage("intern-profile");
  };

  const handleViewReports = (intern) => {
    setSelectedIntern(intern);
    setSelectedInternSection("reports");
    setCurrentPage("intern-profile");
  };

  const handleBackToInterns = () => {
    setSelectedIntern(null);
    setSelectedInternSection("profile");
    setCurrentPage("interns");
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showNotifications && !e.target.closest('.notifications-container')) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const renderPage = () => {
    switch (currentPage) {
      case "overview":
        return (
          <OverviewPage 
            pm={pmInfo} 
            interns={interns} 
            stats={stats} 
            isMobile={isMobile} 
            weeklyReports={weeklyReports} 
            sharedAnnouncements={sharedAnnouncements}
          />
        );
      case "interns":
        return (
          <MyInternsPage 
            onNavigateToMessages={handleNavigateToMessages}
            onViewProfile={handleViewProfile}
            onViewReports={handleViewReports}
            interns={interns}
          />
        );
      case "intern-profile":
        return (
          <InternProfilePage 
            intern={selectedIntern}
            reports={[...(weeklyReports || []), ...(monthlyReports || [])]}
            initialSection={selectedInternSection}
            onBack={handleBackToInterns}
          />
        );
      case "messages":
        return <MessagesPage selectedIntern={selectedIntern} />;
      case "project-submissions":
        return <ProjectSubmissionsSection isMobile={isMobile} />;
      default:
        return (
          <OverviewPage 
            pm={pmInfo} 
            interns={interns} 
            stats={stats} 
            isMobile={isMobile} 
            weeklyReports={weeklyReports} 
            sharedAnnouncements={sharedAnnouncements}
          />
        );
    }
  };

  return (
    <>
      <GlobalStyles />
      <div style={{ display: "flex", minHeight: "100vh", background: GRADIENTS.primary, fontFamily: "'Inter', system-ui, sans-serif" }}>
        
        {/* SIDEBAR - Fixed Position */}
        <aside
          style={{
            width: sidebarOpen ? 280 : 0,
            height: "100vh",
            background: COLORS.surfaceGlass,
            backdropFilter: "blur(20px)",
            borderRight: `1px solid ${COLORS.borderGlass}`,
            transition: "width 0.3s ease",
            overflow: "hidden",
            position: "fixed",
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: isMobile ? 1000 : 100,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            height: "100%", 
            overflowY: "auto",
            overflowX: "hidden",
          }}>
          {/* Logo - Matching HR */}
          <div style={{ padding: 24, borderBottom: `1px solid ${COLORS.borderGlass}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 12, background: GRADIENTS.accent,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Sparkles size={20} color="white" />
                </div>
                <span style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary }}>InternHub</span>
              </div>
              {isMobile && (
                <button 
                  onClick={() => setSidebarOpen(false)} 
                  style={{
                    width: 40, height: 40, borderRadius: 10,
                    border: `1px solid ${COLORS.borderGlass}`,
                    background: "transparent", color: COLORS.textSecondary,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* User Card - Matching HR */}
          <div style={{ padding: 20 }}>
            <div style={{
              background: COLORS.surfaceGlass, borderRadius: 16, padding: 16,
              border: `1px solid ${COLORS.borderGlass}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: "50%", background: GRADIENTS.accent,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, fontWeight: 700, color: "white",
                }}>
                  {pmInfo?.avatar || "PM"}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: 14 }}>
                    {pmInfo?.name || "Project Manager"}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>Project Manager</div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation - Matching HR */}
          <nav style={{ 
            flex: 1, 
            padding: "0 12px", 
            overflowY: "auto",
            overflowX: "hidden",
          }}>
            {menuItems.map((item, idx) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentPage(item.id)}
                  className={`animate-slideIn stagger-${idx + 1}`}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 16px",
                    marginBottom: 4,
                    borderRadius: 12,
                    border: "none",
                    cursor: "pointer",
                    background: isActive ? GRADIENTS.accent : "transparent",
                    color: isActive ? "white" : COLORS.textSecondary,
                    fontWeight: isActive ? 600 : 400,
                    fontSize: 14,
                    transition: "all 0.2s ease",
                  }}
                >
                  <Icon size={20} />
                  <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer - Matching HR */}
          <div style={{ padding: 16, borderTop: `1px solid ${COLORS.borderGlass}` }}>
            <button
              onClick={async () => {
                try {
                  await authApi.logout();
                } catch {
                  // ignore
                }
                localStorage.removeItem("currentUser");
                window.location.href = "/pm/login";
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "12px 16px",
                borderRadius: 12,
                border: `1px solid ${COLORS.borderGlass}`,
                background: "transparent",
                color: COLORS.textSecondary,
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA - With margin for fixed sidebar */}
        <main style={{ 
          flex: 1, 
          display: "flex", 
          flexDirection: "column", 
          minWidth: 0,
          marginLeft: isMobile ? 0 : (sidebarOpen ? 280 : 0),
          transition: "margin-left 0.3s ease",
          height: "100vh",
          overflow: "hidden",
        }}>
          {/* HEADER - Fixed at top */}
          <header style={{
            height: 72,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 24px",
            background: COLORS.surfaceGlass,
            backdropFilter: "blur(20px)",
            borderBottom: `1px solid ${COLORS.borderGlass}`,
            position: "sticky",
            top: 0,
            zIndex: 50,
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {(!sidebarOpen || isMobile) && (
                <button 
                  onClick={() => setSidebarOpen(true)} 
                  style={{
                    width: 40, height: 40, borderRadius: 10,
                    border: `1px solid ${COLORS.borderGlass}`,
                    background: "transparent", color: COLORS.textSecondary,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Menu size={22} />
                </button>
              )}
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>
                  {menuItems.find((item) => item.id === currentPage)?.label || "Dashboard"}
                </h1>
                <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>
                  Manage your intern workforce
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Notifications */}
              <div style={{ position: "relative" }} className="notifications-container">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  style={{
                    width: 40, height: 40, borderRadius: 10,
                    border: `1px solid ${COLORS.borderGlass}`,
                    background: "transparent", color: COLORS.textSecondary,
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                    position: "relative", transition: "all 0.2s",
                  }}
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span style={{
                      position: "absolute", top: -4, right: -4,
                      width: 18, height: 18, borderRadius: "50%",
                      background: COLORS.red, color: "white",
                      fontSize: 10, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Notifications Dropdown */}
                {showNotifications && (
                  <div style={{
                    position: "absolute", top: "56px", right: 0,
                    width: "360px", maxHeight: "480px",
                    background: GRADIENTS.primary,
                    borderRadius: 20, padding: 0,
                    border: `1px solid ${COLORS.borderGlass}`,
                    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
                    overflow: "hidden", zIndex: 1000,
                    animation: "fadeIn 0.2s ease",
                  }}>
                    <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.borderGlass}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.textPrimary, margin: 0 }}>
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllAsRead}
                          style={{
                            background: "none", border: "none",
                            color: COLORS.jungleTeal, fontSize: 12,
                            cursor: "pointer", fontWeight: 600,
                            padding: "4px 8px", borderRadius: 6,
                          }}
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div style={{ maxHeight: "400px", overflowY: "auto", padding: "8px" }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: "40px 20px", textAlign: "center" }}>
                          <Bell size={40} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
                          <p style={{ color: COLORS.textMuted, fontSize: 14 }}>No notifications</p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => markNotificationAsRead(notif.id)}
                            style={{
                              padding: 12,
                              background: notif.read ? COLORS.surfaceGlass : `${COLORS.jungleTeal}15`,
                              borderRadius: 12,
                              cursor: "pointer",
                              border: `1px solid ${notif.read ? COLORS.borderGlass : `${COLORS.jungleTeal}40`}`,
                              transition: "all 0.2s",
                              marginBottom: 8
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 4 }}>
                              <span style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>
                                {notif.title}
                              </span>
                              {!notif.read && (
                                <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.red, flexShrink: 0, marginLeft: 8 }} />
                              )}
                            </div>
                            <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: 0, marginBottom: 4 }}>
                              {notif.message}
                            </p>
                            <span style={{ fontSize: 11, color: COLORS.textMuted }}>
                              {notif.time}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Avatar */}
              <div style={{
                width: 40, height: 40, borderRadius: "50%", background: GRADIENTS.accent,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, color: "white", cursor: "pointer",
              }}>
                <button
                  type="button"
                  onClick={() => setShowAccountModal(true)}
                  style={{ border: "none", background: "transparent", padding: 0, margin: 0, width: "100%", height: "100%", cursor: "pointer", color: "inherit" }}
                  aria-label="Open profile"
                >
                  {pmInfo?.avatar || "PM"}
                </button>
              </div>
            </div>
          </header>

          {/* PAGE CONTENT - SCROLLABLE */}
          {currentPage === "messages" ? (
            <div style={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: COLORS.bgPrimary,
            }}>
              {!loading && !loadError && renderPage()}
            </div>
          ) : (
            <div style={{
              flex: 1,
              padding: 24,
              overflowY: "auto",
              overflowX: "hidden",
              background: COLORS.bgPrimary,
            }}>
              <div style={{ maxWidth: 1200, margin: "0 auto" }}>
                {loading && (
                  <div style={{ padding: 20, color: COLORS.textSecondary }}>
                    Loading…
                  </div>
                )}
                {!loading && loadError && (
                  <div style={{ padding: 20, color: COLORS.red }}>
                    {loadError}
                  </div>
                )}
                {!loading && !loadError && renderPage()}
              </div>
            </div>
          )}
        </main>

        {/* Mobile Overlay */}
        {isMobile && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0, 
              background: "rgba(0,0,0,0.5)",
              zIndex: 999, 
              backdropFilter: "blur(4px)",
            }}
          />
        )}

        <AccountModal open={showAccountModal} onClose={() => setShowAccountModal(false)} />
      </div>
    </>
  );
};

export default PMHome;
