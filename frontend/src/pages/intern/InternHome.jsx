//frontend/src/pages/intern/InternHome.jsx
import React, { useState, useEffect } from "react";
import DailyLogPage from './DailyLogPage';
import ProfilePage from './ProfilePage';
import MessagesPage from './MessagesPage';
import ReportsPage from './ReportsPage';
import AttendancePage from "./AttendancePage";
import DocumentsPage from "./DocumentsPage";
import { authApi, internApi, announcementsApi, notificationsApi } from "../../lib/apiClient";
import { getRealtimeSocket } from "../../lib/realtime";
import { formatDmy, formatDmyTime } from "../../lib/dateFormat";

import { 
  User, Bell, MessageCircle, FileText, 
  Home, BookOpen, Send, Menu, X, Sparkles,
  ClipboardList, LogOut, Calendar
} from "lucide-react";

// ==================== COLORS MATCHING PM DASHBOARD ====================
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
    body { 
      font-family: 'Inter', system-ui, sans-serif; 
      background: ${COLORS.bgPrimary}; 
      color: white; 
      overflow-x: hidden; 
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideIn { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes pulse { 
      0%, 100% { opacity: 1; transform: scale(1); } 
      50% { opacity: 0.6; transform: scale(1.1); } 
    }
    .animate-fadeIn { animation: fadeIn 0.5s ease-out forwards; }
    .animate-slideIn { animation: slideIn 0.4s ease-out forwards; }
    .stagger-1 { animation-delay: 0.05s; opacity: 0; }
    .stagger-2 { animation-delay: 0.1s; opacity: 0; }
    .stagger-3 { animation-delay: 0.15s; opacity: 0; }
    .stagger-4 { animation-delay: 0.2s; opacity: 0; }
    .stagger-5 { animation-delay: 0.25s; opacity: 0; }
    input::placeholder, textarea::placeholder { color: rgba(248, 250, 252, 0.4); }
    input:focus, textarea:focus { 
      outline: none; 
      border-color: ${COLORS.jungleTeal}; 
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2); 
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: ${COLORS.bgPrimary}; }
    ::-webkit-scrollbar-thumb { background: ${COLORS.deepOcean}; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: ${COLORS.jungleTeal}; }
  `}</style>
);

export default function InternDashboard() {
  const [activePage, setActivePage] = useState("overview");
  const [currentIntern, setCurrentIntern] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [assignedPM, setAssignedPM] = useState(null);
  const [assignedHR, setAssignedHR] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [stats, setStats] = useState({
    daysActive: 0,
    totalHours: 0,
    tasksCompleted: 0,
    progressPercent: 0,
    pendingReports: 0,
  });
  const [dismissedReportReminder, setDismissedReportReminder] = useState(false);
  const profilePictureUrl = currentIntern?.profile?.profilePictureUrl || currentIntern?.profile?.profile_picture_url || null;
  const formatTimeAgo = React.useCallback((iso) => {
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

  const mapApiNotification = React.useCallback(
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

  // Responsive Handler
  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) setSidebarOpen(false);
      else setSidebarOpen(true);
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const loadNotifications = React.useCallback(async () => {
    try {
      const res = await notificationsApi.list({ limit: 60 });
      const rows = res?.notifications || [];
      setNotifications(rows.map(mapApiNotification));
    } catch (err) {
      console.error("Failed to load notifications:", err);
      setNotifications([]);
    }
  }, [mapApiNotification]);

  useEffect(() => { 
    loadCurrentIntern(); 
    loadStats();
    loadAnnouncements();
    loadNotifications();
  }, []);

  useEffect(() => {
    const now = new Date();
    const day = now.getDay(); // 0 Sun ... 6 Sat
    const isReminderDay = day === 5 || day === 6; // Fri/Sat
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const key = `itp:dismiss_report_reminder:${yyyy}-${mm}-${dd}`;
    setDismissedReportReminder(!isReminderDay || localStorage.getItem(key) === "1");
  }, []);

  const dismissReminderForToday = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const key = `itp:dismiss_report_reminder:${yyyy}-${mm}-${dd}`;
    localStorage.setItem(key, "1");
    setDismissedReportReminder(true);
  };

  const loadCurrentIntern = async () => {
    setLoadError("");
    try {
      const res = await internApi.me();
      const profile = res?.profile;
      if (!profile?.email) throw new Error("Unable to load intern profile");

      const displayName = profile.full_name || profile.fullName || profile.email;
      const avatar = String(displayName)
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();

      const profileData = profile.profile_data || profile.profileData || profile.profile || {};
      const assignedPm = profile.pm
        ? {
            id: profile.pm.id,
            fullName: profile.pm.full_name || profile.pm.fullName || "Project Manager",
            email: profile.pm.email,
            role: "pm",
            pmCode: profile.pm.pm_code || profile.pm.pmCode || null,
          }
        : null;

      const nextIntern = {
        id: profile.id,
        internId: profile.intern_id || null,
        fullName: displayName,
        email: profile.email,
        phone: profileData.phone || profile.phone || "",
        dob: profileData.dob || profile.dob || "",
        role: "intern",
        pmCode: assignedPm?.pmCode || null,
        degree: profileData.degree || profileData.department || "",
        avatar: avatar || "IN",
        profile: profileData,
        profileCompleted: !!profile.profile_completed,
      };

      setCurrentIntern(nextIntern);
      setAssignedPM(assignedPm);
      setAssignedHR(null);

      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          role: "intern",
          fullName: nextIntern.fullName,
          email: nextIntern.email,
          pmCode: nextIntern.pmCode,
          internId: nextIntern.internId,
          profileCompleted: nextIntern.profileCompleted,
          profileData: nextIntern.profile,
        })
      );
    } catch (err) {
      console.error("Error loading intern (API):", err);
      if (err?.status === 401 || err?.status === 403) {
        window.location.href = "/";
        return;
      }
      setCurrentIntern(null);
      setAssignedPM(null);
      setAssignedHR(null);
      setLoadError(err?.message || "Unable to load your profile. Please try again.");
    }
  };

  const loadStats = async () => {
    try {
      const res = await internApi.stats();
      if (res?.stats) {
        setStats(res.stats);
        return;
      }
    } catch (err) {
      console.error("Failed to load intern stats:", err);
    }

    setStats((prev) => ({
      ...prev,
      daysActive: currentIntern?.profile?.startDate
        ? Math.max(0, Math.floor((new Date() - new Date(currentIntern.profile.startDate)) / (1000 * 60 * 60 * 24)))
        : 0,
    }));
  };

  const loadAnnouncements = async () => {
    try {
      const res = await announcementsApi.list();
      const rows = res?.announcements || [];
      const mapped = rows.map((a) => ({
        id: a.id,
        title: a.title,
        message: a.content,
        date: a.created_at,
        priority: a.priority || "medium",
        from: a.created_by?.full_name || a.created_by?.email || "HR",
      }));
      setAnnouncements(mapped);
    } catch (err) {
      console.error("Failed to load announcements:", err);
      setAnnouncements([]);
    }
  };


  const menuItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "daily-log", label: "Daily Log", icon: BookOpen },
    { id: "attendance", label: "Attendance", icon: Calendar },
    { id: "reports", label: "Reports", icon: ClipboardList },
    { id: "documents", label: "Documents", icon: FileText },
    { id: "chat", label: "Messages", icon: MessageCircle },
    { id: "profile", label: "My Profile", icon: User },
    { id: "project-submission", label: "Submit Project", icon: Send },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const socket = getRealtimeSocket();
    const onChanged = () => {
      loadCurrentIntern();
      loadStats();
      loadAnnouncements();
      loadNotifications();
    };
    socket.on("itp:changed", onChanged);
    return () => socket.off("itp:changed", onChanged);
  }, []);

  const addNotification = React.useCallback(
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
      if (!row?.id) {
        loadNotifications();
        return;
      }
      addNotification(mapApiNotification(row));
      loadNotifications();
    };
    socket.on("itp:notification", onNotification);
    return () => socket.off("itp:notification", onNotification);
  }, [addNotification, mapApiNotification]);

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

  if (loadError && !currentIntern) {
    return (
      <>
        <GlobalStyles />
        <div style={{
          minHeight: "100vh",
          background: GRADIENTS.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "'Inter', system-ui, sans-serif"
        }}>
          <div style={{
            maxWidth: 520,
            width: "100%",
            background: COLORS.surfaceGlass,
            border: `1px solid ${COLORS.borderGlass}`,
            borderRadius: 16,
            padding: 24,
            color: COLORS.textPrimary,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Profile Unavailable</div>
            <div style={{ color: COLORS.textSecondary, marginBottom: 16 }}>{loadError}</div>
            <button
              onClick={loadCurrentIntern}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: "none",
                background: GRADIENTS.accent,
                color: "white",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <div style={{ 
        display: "flex", 
        minHeight: "100vh", 
        background: GRADIENTS.primary,
        fontFamily: "'Inter', system-ui, sans-serif"
      }}>
        {/* SIDEBAR - Fixed Position */}
        <aside style={{
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
        }}>
          <div style={{ 
            display: "flex", 
            flexDirection: "column", 
            height: "100%", 
            overflowY: "auto",
            overflowX: "hidden",
          }}>
            {/* Logo */}
            <div style={{ padding: 24, borderBottom: `1px solid ${COLORS.borderGlass}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, background: GRADIENTS.accent,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Sparkles size={20} color="white" />
                  </div>
                  <span style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary }}>
                    InternHub
                  </span>
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

            {/* User Card */}
            <div style={{ padding: 20 }}>
              <div style={{
                background: COLORS.surfaceGlass, borderRadius: 16, padding: 16,
                border: `1px solid ${COLORS.borderGlass}`,
                cursor: "pointer",
              }}>
                <div
                  onClick={() => setActivePage("profile")}
                  style={{ display: "flex", alignItems: "center", gap: 12 }}
                >
                  <div style={{
                    width: 48, height: 48, aspectRatio: "1 / 1", borderRadius: "50%", background: GRADIENTS.accent,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 700, color: "white",
                    overflow: "hidden",
                    position: "relative",
                    flexShrink: 0,
                  }}>
                  {profilePictureUrl ? (
                    <img
                      src={profilePictureUrl}
                      alt="Profile"
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span style={{ position: "relative", zIndex: 1 }}>{currentIntern?.avatar || "IN"}</span>
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: 14 }}>
                    {currentIntern?.fullName || "Intern"}
                  </div>
                    <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                      {currentIntern?.degree || "Student"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav style={{ 
              flex: 1, 
              padding: "0 12px", 
              overflowY: "auto",
              overflowX: "hidden",
            }}>
              {menuItems.map((item, idx) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActivePage(item.id)}
                    className={`animate-slideIn stagger-${idx + 1}`}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
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
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span style={{
                        background: COLORS.red,
                        color: "white",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: 20,
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Sidebar Footer */}
            <div style={{ padding: 16, borderTop: `1px solid ${COLORS.borderGlass}` }}>
              <button
                onClick={async () => {
                  try {
                    await authApi.logout();
                  } catch {
                    // ignore
                  }
                  localStorage.removeItem("currentUser");
                  window.location.href = "/";
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

        {/* MAIN CONTENT AREA */}
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
                  {getPageTitle(activePage)}
                </h1>
                <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>
                  {getPageSubtitle(activePage, currentIntern)}
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
                    <div style={{ 
                      padding: "16px 20px", 
                      borderBottom: `1px solid ${COLORS.borderGlass}`, 
                      display: "flex", 
                      justifyContent: "space-between", 
                      alignItems: "center" 
                    }}>
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
                            <div style={{ 
                              display: "flex", 
                              justifyContent: "space-between", 
                              alignItems: "start", 
                              marginBottom: 4 
                            }}>
                              <span style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>
                                {notif.title}
                              </span>
                              {!notif.read && (
                                <div style={{ 
                                  width: 8, 
                                  height: 8, 
                                  borderRadius: "50%", 
                                  background: COLORS.red, 
                                  flexShrink: 0, 
                                  marginLeft: 8 
                                }} />
                              )}
                            </div>
                            <p style={{ 
                              fontSize: 13, 
                              color: COLORS.textSecondary, 
                              margin: 0, 
                              marginBottom: 4 
                            }}>
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
                width: 40, height: 40, aspectRatio: "1 / 1", borderRadius: "50%", background: GRADIENTS.accent,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, color: "white", cursor: "pointer",
                overflow: "hidden",
                position: "relative",
                flexShrink: 0,
              }}>
                <button
                  type="button"
                  onClick={() => setActivePage("profile")}
                  style={{ border: "none", background: "transparent", padding: 0, margin: 0, width: "100%", height: "100%", cursor: "pointer", color: "inherit" }}
                  aria-label="Open profile"
                >
                  {profilePictureUrl ? (
                    <img
                      src={profilePictureUrl}
                      alt="Profile"
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%", display: "block" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <span style={{ position: "relative", zIndex: 1 }}>{currentIntern?.avatar || "IN"}</span>
                  )}
                </button>
              </div>
            </div>
          </header>

          {/* PAGE CONTENT */}
          {activePage === "chat" ? (
            <div style={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: COLORS.bgPrimary,
            }}>
              <MessagesPage
                isMobile={isMobile}
                assignedPM={assignedPM}
                assignedHR={assignedHR}
              />
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
                {!dismissedReportReminder && (
                  <div
                    style={{
                      marginBottom: 16,
                      padding: 14,
                      borderRadius: 16,
                      border: `1px solid ${COLORS.borderGlass}`,
                      background: "linear-gradient(135deg, rgba(245,158,11,0.18), rgba(20,184,166,0.10))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                    }}
                  >
                    <div style={{ minWidth: 240 }}>
                      <div style={{ fontWeight: 900, color: "white" }}>Reminder</div>
                      <div style={{ marginTop: 4, fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
                        It’s Friday/Saturday — don’t forget to send your weekly report (generate summary from Daily Logs).
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <button
                        type="button"
                        onClick={() => setActivePage("daily-log")}
                        style={{
                          border: "none",
                          background: GRADIENTS.accent,
                          color: "white",
                          padding: "10px 12px",
                          borderRadius: 12,
                          fontWeight: 900,
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        Open Daily Logs
                      </button>
                      <button
                        type="button"
                        onClick={dismissReminderForToday}
                        style={{
                          border: `1px solid ${COLORS.borderGlass}`,
                          background: "rgba(255,255,255,0.06)",
                          color: "rgba(255,255,255,0.85)",
                          padding: "10px 12px",
                          borderRadius: 12,
                          fontWeight: 900,
                          cursor: "pointer",
                          fontSize: 12,
                        }}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
                {activePage === "overview" && (
                  <OverviewPage
                    intern={currentIntern}
                    pm={assignedPM}
                    hr={assignedHR}
                    announcements={announcements}
                    stats={stats}
                    isMobile={isMobile}
                  />
                )}
                {activePage === "daily-log" && (
                  <DailyLogPage isMobile={isMobile} assignedPM={assignedPM} />
                )}
                {activePage === "attendance" && <AttendancePage />}
                {activePage === "reports" && <ReportsPage isMobile={isMobile} />}
                {activePage === "documents" && <DocumentsPage />}
                {activePage === "profile" && (
                  <ProfilePage intern={currentIntern} isMobile={isMobile} onProfileUpdated={loadCurrentIntern} />
                )}
                  {activePage === "project-submission" && (
                    <ProjectSubmissionPage
                      isMobile={isMobile}
                      currentIntern={currentIntern}
                      profilePictureUrl={profilePictureUrl}
                    />
                  )}
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
      </div>
    </>
  );
}

function getPageTitle(page) {
  return { 
    "overview": "Intern Dashboard", 
    "daily-log": "Daily Log", 
    "attendance": "Attendance",
    "reports": "Reports", 
    "documents": "Documents",
    "chat": "Messages", 
    "profile": "My Profile", 
    "project-submission": "Submit Project" 
  }[page] || "Intern Dashboard";
}

function getPageSubtitle(page) {
  return { 
    "overview": "Track your internship progress and activities", 
    "daily-log": "Track your daily progress", 
    "attendance": "View your attendance history",
    "reports": "TNA & Project Blueprint", 
    "documents": "View and download your files",
    "chat": "Connect with your team", 
    "profile": "Manage your information", 
    "project-submission": "Share your work" 
  }[page] || "";
}

function OverviewPage({ intern, pm, hr, announcements, stats, isMobile }) {
  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      {/* COMPACT Hero Section */}
      <div className="animate-fadeIn" style={{
        borderRadius: 16,
        background: GRADIENTS.accent,
        border: `1px solid ${COLORS.borderGlass}`,
        padding: isMobile ? 20 : 24,
        marginBottom: 24,
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          top: -50,
          right: -50,
          width: 200,
          height: 200,
          background: `radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)`,
          borderRadius: "50%",
        }} />
        
        <div style={{ position: "relative", zIndex: 1 }}>
          <h2 style={{ 
            fontSize: isMobile ? 22 : 26, 
            margin: 0, 
            color: "white", 
            fontWeight: 700, 
            marginBottom: 6,
          }}>
            Welcome back, {intern?.fullName?.split(" ")[0] || "Intern"}!
          </h2>
          
          <p style={{ 
            color: "rgba(255,255,255,0.85)", 
            fontSize: 13, 
            margin: 0,
            marginBottom: 16,
          }}>
            You're making great progress on your internship journey
          </p>

          {/* Inline Stats */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", 
            gap: 10 
          }}>
            {[
              { label: "Days Active", value: stats.daysActive },
              { label: "Hours Logged", value: `${stats.totalHours}h` },
              { label: "Tasks Done", value: stats.tasksCompleted },
              { label: "Progress", value: `${stats.progressPercent}%` },
            ].map((stat, idx) => (
              <div key={idx} style={{
                padding: 12,
                background: "rgba(255,255,255,0.15)",
                borderRadius: 10,
                textAlign: "center",
              }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: "white" }}>{stat.value}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
        gap: 24 
      }}>
        {/* Your Team */}
        <div style={{
          background: COLORS.surfaceGlass,
          backdropFilter: "blur(20px)",
          borderRadius: 16,
          padding: 24,
          border: `1px solid ${COLORS.borderGlass}`,
        }}>
          <h3 style={{ 
            color: COLORS.textPrimary, 
            fontSize: 16, 
            fontWeight: 600, 
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            Your Team
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {pm && <CompactTeamCard member={pm} role="Project Manager" online={true} />}
            {hr && <CompactTeamCard member={hr} role="HR Manager" online={false} />}
          </div>
        </div>

        {/* Announcements */}
        <div className="animate-fadeIn" style={{ animationDelay: "0.1s", opacity: 0 }}>
          <h3 style={{ 
            color: COLORS.textPrimary, 
            fontSize: 16, 
            fontWeight: 600, 
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}>
            Announcements
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {announcements.map((ann, idx) => (
              <AnnouncementCard key={ann.id} announcement={ann} index={idx} />
            ))}
          </div>
        </div>
      </div>

          </div>
  );
}

function CompactTeamCard({ member, role, online = true }) {
  return (
    <div style={{
      padding: 16,
      borderRadius: 12,
      display: "flex",
      alignItems: "center",
      gap: 14,
      cursor: "pointer",
      background: COLORS.surfaceGlass,
      border: `1px solid ${COLORS.borderGlass}`,
      transition: "all 0.2s"
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = COLORS.surfaceGlass; }}>
      <div style={{ position: "relative" }}>
        <div style={{
          width: 46,
          height: 46,
          borderRadius: "50%",
          background: GRADIENTS.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: 16,
          color: "white"
        }}>
          {member.fullName?.charAt(0) || "?"}
        </div>
        {/* Status indicator dot */}
        <div style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: online ? COLORS.emeraldGlow : COLORS.textMuted,
          border: `2px solid ${COLORS.bgPrimary}`,
          boxShadow: online ? `0 0 8px ${COLORS.emeraldGlow}` : "none",
        }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: COLORS.textPrimary }}>
          {member.fullName}
        </div>
        <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>{role}</div>
      </div>
    </div>
  );
}

function AnnouncementCard({ announcement, index }) {
  const priorityConfig = {
    high: { color: COLORS.red, bg: `${COLORS.red}15`, border: `${COLORS.red}30`, icon: "🔴" },
    medium: { color: COLORS.orange, bg: `${COLORS.orange}15`, border: `${COLORS.orange}30`, icon: "🟡" },
    low: { color: COLORS.jungleTeal, bg: `${COLORS.jungleTeal}15`, border: `${COLORS.jungleTeal}30`, icon: "🟢" }
  };
  const config = priorityConfig[announcement.priority] || priorityConfig.low;
  
  return (
    <div 
      className={`animate-fadeIn stagger-${Math.min(index + 1, 5)}`}
      style={{ 
        background: COLORS.surfaceGlass,
        backdropFilter: "blur(20px)",
        padding: 18,
        borderRadius: 14,
        borderLeft: `4px solid ${config.color}`,
        border: `1px solid ${COLORS.borderGlass}`,
        position: "relative",
      }}
    >
      {/* Priority indicator dot */}
      <div style={{
        position: "absolute",
        top: 18,
        right: 18,
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: config.color,
        boxShadow: `0 0 8px ${config.color}`,
        animation: announcement.priority === "high" ? "pulse 2s infinite" : "none",
      }} />
      
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "flex-start", 
        marginBottom: 10, 
        gap: 12,
        paddingRight: 20,
      }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: COLORS.textPrimary, flex: 1 }}>
          {announcement.title}
        </div>
        <span style={{
          background: config.bg,
          color: config.color,
          padding: "4px 10px",
          borderRadius: 20,
          fontSize: 10,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          border: `1px solid ${config.border}`,
          flexShrink: 0,
        }}>
          {announcement.priority}
        </span>
      </div>
      <p style={{ 
        fontSize: 14, 
        color: COLORS.textSecondary, 
        marginBottom: 12, 
        lineHeight: 1.6 
      }}>
        {announcement.message}
      </p>
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center", 
        fontSize: 12, 
        color: COLORS.textMuted 
      }}>
                        <div>{formatDmy(announcement.date)}</div>
        <div style={{ fontStyle: "italic" }}>{announcement.from}</div>
      </div>
    </div>
  );  
}

function ProjectSubmissionPage({ isMobile, currentIntern, profilePictureUrl }) {
  const [projectTitle, setProjectTitle] = useState("");
  const [description, setDescription] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [demoLink, setDemoLink] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [mySubmissions, setMySubmissions] = React.useState([]);
  const [subsLoading, setSubsLoading] = React.useState(true);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await internApi.submitProject({
        title: projectTitle,
        description,
        githubLink,
        demoLink: demoLink || null,
      });
      setSubmitted(true);
      setProjectTitle("");
      setDescription("");
      setGithubLink("");
      setDemoLink("");
      setTimeout(() => setSubmitted(false), 4000);
    } catch (err) {
      alert(err?.message || "Failed to submit project");
    }
  };

  React.useEffect(() => {
    let cancelled = false;
    const load = () => {
      internApi.mySubmissions()
        .then(res => { if (!cancelled) setMySubmissions(res?.submissions || []); })
        .catch(() => {})
        .finally(() => { if (!cancelled) setSubsLoading(false); });
    };
    load();
    const interval = setInterval(load, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [submitted]);

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    borderRadius: 10,
    border: `1px solid ${COLORS.borderGlass}`,
    background: COLORS.surfaceGlass,
    color: COLORS.textPrimary,
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "'Inter', system-ui, sans-serif",
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      {submitted && (
        <div className="animate-fadeIn" style={{
          background: `${COLORS.emeraldGlow}20`,
          border: `1px solid ${COLORS.emeraldGlow}`,
          padding: 16,
          borderRadius: 12,
          marginBottom: 24,
          color: COLORS.emeraldGlow,
          display: "flex",
          alignItems: "center",
          gap: 12,
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `${COLORS.emeraldGlow}20`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            ?
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: "white" }}>
              Project Submitted Successfully!
            </div>
            <div style={{ fontSize: 13, marginTop: 2 }}>Your PM will review it shortly.</div>
          </div>
        </div>
      )}

      <div style={{
        background: COLORS.surfaceGlass,
        backdropFilter: "blur(20px)",
        padding: isMobile ? 24 : 32,
        borderRadius: 20,
        border: `1px solid ${COLORS.borderGlass}`,
        marginBottom: 24,
      }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label style={{
              display: "block",
              color: COLORS.textPrimary,
              marginBottom: 8,
              fontWeight: 500,
              fontSize: 14
            }}>
              Project Title *
            </label>
            <input
              type="text"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              style={inputStyle}
              placeholder="e.g., E-Commerce Dashboard"
              required
            />
          </div>

          <div>
            <label style={{
              display: "block",
              color: COLORS.textPrimary,
              marginBottom: 8,
              fontWeight: 500,
              fontSize: 14
            }}>
              Project Description *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
              placeholder="Describe your project, technologies used, key features..."
              required
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{
                display: "block",
                color: COLORS.textPrimary,
                marginBottom: 8,
                fontWeight: 500,
                fontSize: 14
              }}>
                GitHub Repository *
              </label>
              <input
                type="url"
                value={githubLink}
                onChange={(e) => setGithubLink(e.target.value)}
                style={inputStyle}
                placeholder="https://github.com/..."
                required
              />
            </div>

            <div>
              <label style={{
                display: "block",
                color: COLORS.textPrimary,
                marginBottom: 8,
                fontWeight: 500,
                fontSize: 14
              }}>
                Live Demo (Optional)
              </label>
              <input
                type="url"
                value={demoLink}
                onChange={(e) => setDemoLink(e.target.value)}
                style={inputStyle}
                placeholder="https://your-demo.com"
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              padding: "14px 28px",
              background: GRADIENTS.accent,
              color: "white",
              border: "none",
              borderRadius: 12,
              fontWeight: 600,
              cursor: "pointer",
              fontSize: 15,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              marginTop: 8,
            }}
          >
            <Send size={18} />
            Submit Project
          </button>
        </form>
      </div>

      <div style={{ marginTop: 32 }}>
        <h3 style={{ color: "white", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
          My Submissions
        </h3>
        {subsLoading ? (
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Loading...</div>
        ) : mySubmissions.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 14 }}>No submissions yet.</div>
        ) : mySubmissions.map(sub => {
            const internName = currentIntern?.fullName || "Me";
            const internEmail = currentIntern?.email || "";
            const internId = currentIntern?.internId || "No ID";
            const internDept = currentIntern?.profile?.department || currentIntern?.profile?.degree || currentIntern?.degree || "Unassigned";
            const internInitials = currentIntern?.avatar || "IN";
            const effectiveProfilePictureUrl =
              profilePictureUrl ||
              currentIntern?.profile?.profilePictureUrl ||
              currentIntern?.profile?.profile_picture_url ||
              null;
            return (
          <div key={sub.id} style={{
            background: "rgba(255,255,255,0.05)",
            border: `1px solid ${sub.status === "approved" ? "rgba(16,185,129,0.4)" 
                                : sub.status === "rejected" ? "rgba(239,68,68,0.4)" 
                                : "rgba(255,255,255,0.1)"}`,
            borderRadius: 12,
            padding: 16,
            marginBottom: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {effectiveProfilePictureUrl ? (
                  <img
                    src={effectiveProfilePictureUrl}
                    alt="Intern"
                    style={{ width: 30, height: 30, borderRadius: "50%", objectFit: "cover" }}
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
              ) : (
                <div style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background: "rgba(20,184,166,0.2)",
                  color: "#14b8a6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 11,
                }}>
                  {internInitials}
                </div>
              )}
              <div style={{ color: "#14b8a6", fontSize: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                <span>{internName}</span>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
                <span>{internEmail}</span>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
                <span>{internId}</span>
                <span style={{ color: "rgba(255,255,255,0.3)" }}>|</span>
                <span>{internDept}</span>
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ color: "white", fontWeight: 700, fontSize: 15 }}>{sub.title}</div>
              <span style={{
                padding: "4px 12px",
                borderRadius: 20,
                fontSize: 11,
                fontWeight: 700,
                textTransform: "uppercase",
                background: sub.status === "approved" ? "rgba(16,185,129,0.15)"
                          : sub.status === "rejected" ? "rgba(239,68,68,0.15)"
                          : "rgba(20,184,166,0.15)",
                color: sub.status === "approved" ? "#10b981"
                     : sub.status === "rejected" ? "#ef4444"
                     : "#14b8a6",
                border: `1px solid ${sub.status === "approved" ? "#10b981"
                       : sub.status === "rejected" ? "#ef4444" : "#14b8a6"}`,
              }}>
                {sub.status === "submitted" ? "Pending Review" : sub.status}
              </span>
            </div>

            <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, whiteSpace: "pre-wrap" }}>
              {sub.description}
            </div>

            {sub.status === "approved" && (
              <div style={{
                background: "rgba(16,185,129,0.1)",
                border: "1px solid rgba(16,185,129,0.3)",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
              }}>
                <div style={{ color: "#10b981", fontWeight: 700, marginBottom: sub.review_comment ? 6 : 0 }}>
                  Your project was approved!
                </div>
                {sub.review_comment && (
                  <div style={{ color: "rgba(255,255,255,0.7)" }}>
                    Comment: {sub.review_comment}
                  </div>
                )}
              </div>
            )}

            {sub.status === "rejected" && (
              <div style={{
                background: "rgba(239,68,68,0.1)",
                border: "1px solid rgba(239,68,68,0.3)",
                borderRadius: 8,
                padding: "10px 14px",
                fontSize: 13,
              }}>
                <div style={{ color: "#ef4444", fontWeight: 700, marginBottom: sub.review_comment ? 6 : 0 }}>
                  Your project was not approved.
                </div>
                {sub.review_comment && (
                  <div style={{ color: "rgba(255,255,255,0.7)" }}>
                    Reason: {sub.review_comment}
                  </div>
                )}
              </div>
            )}

            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 11 }}>
              Submitted: {sub.submitted_at ? formatDmyTime(sub.submitted_at) : "?"}
              {sub.reviewed_at ? ` • Reviewed: ${formatDmyTime(sub.reviewed_at)}` : ""}
            </div>
          </div>
        );
        })}
      </div>
    </div>
  );
}
