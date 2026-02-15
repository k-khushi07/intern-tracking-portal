// PMHome.jsx - pm dashboard
import React, { useState, useEffect } from "react";
import { Menu, Bell, LogOut, Sparkles, X, Users, Home, BookOpen, MessageCircle } from "lucide-react";
import MessagesPage from './MessagesPage';
import OverviewPage from "./OverviewPage";
import MyInternsPage from './MyInternsPage';
import InternProfilePage from './InternProfilePage';
import ReviewLogsPage from './ReviewLogsPage';

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

const PMHome = () => {
  const [currentPage, setCurrentPage] = useState("overview");
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
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
  const [notifications, setNotifications] = useState([
    { id: 1, title: "New Weekly Report", message: "John Doe submitted Week 2 report", time: "5m ago", read: false, type: "report", internEmail: "john.doe@company.com" },
    { id: 2, title: "TNA Tracker Updated", message: "Jane Smith updated TNA progress", time: "1h ago", read: false, type: "tna", internEmail: "jane.smith@company.com" },
    { id: 3, title: "Project Milestone", message: "Mike Johnson completed UI mockups", time: "2h ago", read: true, type: "project", internEmail: "mike.johnson@company.com" },
  ]);

  const pmInfo = {
    name: "Sarah Johnson",
    role: "Project Manager",
    avatar: "SJ",
    fullName: "Sarah Johnson",
    pmCode: "PM001",
    email: "sarah.johnson@company.com"
  };

  // Mock data
  const mockInterns = [
    { id: 1, fullName: "John Doe", email: "john.doe@company.com", degree: "Computer Science", hoursLogged: 45, tasksCompleted: 12, status: "active" },
    { id: 2, fullName: "Jane Smith", email: "jane.smith@company.com", degree: "Software Engineering", hoursLogged: 38, tasksCompleted: 10, status: "active" },
    { id: 3, fullName: "Mike Johnson", email: "mike.johnson@company.com", degree: "Information Technology", hoursLogged: 42, tasksCompleted: 11, status: "active" }
  ];

  const mockStats = {
    activeInterns: 3,
    totalHours: 125,
    totalTasks: 33,
    pendingReports: 5
  };

  const mockWeeklyReports = [
    {
      id: 1,
      internName: "John Doe",
      weekNumber: 1,
      dateRange: "Jan 6 - Jan 12, 2025",
      totalHours: 40,
      daysWorked: 5,
      summary: "Completed frontend components and integrated APIs. Made good progress on the dashboard redesign.",
      status: "pending",
      submittedAt: new Date().toISOString()
    },
    {
      id: 2,
      internName: "Jane Smith",
      weekNumber: 1,
      dateRange: "Jan 6 - Jan 12, 2025",
      totalHours: 38,
      daysWorked: 5,
      summary: "Worked on backend API development and database optimization. Fixed several critical bugs.",
      status: "approved",
      submittedAt: new Date(Date.now() - 86400000).toISOString()
    }
  ];

  // REMOVED ANALYTICS FROM MENU
  const menuItems = [
    { id: "overview", label: "PM Dashboard", icon: Home },
    { id: "interns", label: "My Interns", icon: Users },
    { id: "messages", label: "Messages", icon: MessageCircle },
    { id: "review-logs", label: "Review Reports", icon: BookOpen },
  ];

  const unreadCount = notifications.filter(n => !n.read).length;

  const markNotificationAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  };

  const addNotification = (notification) => {
    const newNotif = {
      id: Date.now(),
      ...notification,
      time: "Just now",
      read: false
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  const handleNavigateToMessages = (intern) => {
    setSelectedIntern(intern);
    setCurrentPage("messages");
  };

  const handleViewProfile = (intern) => {
    setSelectedIntern(intern);
    setCurrentPage("intern-profile");
  };

  const handleBackToInterns = () => {
    setSelectedIntern(null);
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
            interns={mockInterns} 
            stats={mockStats} 
            isMobile={isMobile} 
            weeklyReports={mockWeeklyReports} 
          />
        );
      case "interns":
        return (
          <MyInternsPage 
            onNavigateToMessages={handleNavigateToMessages}
            onViewProfile={handleViewProfile}
          />
        );
      case "intern-profile":
        return (
          <InternProfilePage 
            intern={selectedIntern}
            onBack={handleBackToInterns}
          />
        );
      case "messages":
        return <MessagesPage selectedIntern={selectedIntern} />;
      case "review-logs":
        return (
          <ReviewLogsPage 
            weeklyReports={mockWeeklyReports} 
            monthlyReports={[]} 
            isMobile={isMobile}
            pmEmail={pmInfo.email}
            addNotification={addNotification}
          />
        );
      default:
        return (
          <OverviewPage 
            pm={pmInfo} 
            interns={mockInterns} 
            stats={mockStats} 
            isMobile={isMobile} 
            weeklyReports={mockWeeklyReports} 
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
                  {pmInfo.avatar}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: 14 }}>
                    {pmInfo.name}
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
              onClick={() => {
                localStorage.removeItem("currentUser");
                window.location.href = "/login";
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
                {pmInfo.avatar}
              </div>
            </div>
          </header>

          {/* PAGE CONTENT - SCROLLABLE */}
          <div style={{ 
            flex: 1, 
            padding: 24, 
            overflowY: "auto",
            overflowX: "hidden",
            background: COLORS.bgPrimary,
          }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              {renderPage()}
            </div>
          </div>
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
};

export default PMHome;