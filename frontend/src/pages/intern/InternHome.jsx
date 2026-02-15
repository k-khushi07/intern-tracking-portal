//frontend/src/pages/intern/InternHome.jsx
import React, { useState, useEffect } from "react";
import DailyLogPage from './DailyLogPage';
import ProfilePage from './ProfilePage';
import MessagesPage from './MessagesPage';
import ReportsPage from './ReportsPage';

import { 
  User, Bell, MessageCircle, FileText, 
  Home, BookOpen, Send, Menu, X, Sparkles,
  ClipboardList, LogOut
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
  const [assignedPM, setAssignedPM] = useState(null);
  const [assignedHR, setAssignedHR] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);

  const [dailyLogs, setDailyLogs] = useState([]);

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

  useEffect(() => { 
    loadCurrentIntern(); 
    loadDailyLogs(); 
    loadAnnouncements();
  }, []);
  
  useEffect(() => { 
    if (currentIntern?.pmCode) { 
      loadAssignedPM(); 
      loadAssignedHR(); 
    } 
  }, [currentIntern]);

  const loadCurrentIntern = () => {
    setCurrentIntern({
      fullName: "Alex Johnson", 
      email: "alex.johnson@college.edu", 
      phone: "+91 98765 43210",
      dob: "2002-05-15", 
      role: "intern", 
      pmCode: "PM001", 
      degree: "B.Tech Computer Science", 
      avatar: "AJ",
      profile: {
        bloodGroup: "O+", 
        address: "123 College Road, University Area", 
        city: "Bangalore",
        state: "Karnataka", 
        pincode: "560001", 
        emergencyContactName: "Sarah Johnson",
        emergencyRelation: "Mother", 
        emergencyContactPhone: "+91 98765 11111",
        collegeName: "Tech University", 
        department: "Computer Science", 
        semester: "6th Semester",
        guideName: "Dr. Rajesh Kumar", 
        guideEmail: "rajesh@college.edu", 
        guidePhone: "+91 98765 22222",
        internshipDuration: "6 months", 
        startDate: "2024-01-01", 
        endDate: "2024-06-30",
        workMode: "Hybrid", 
        expectedOutcome: "Full Stack Development Skills", 
        bio: "Passionate about web development and AI"
      }
    });
  };

  const loadAssignedPM = () => setAssignedPM({ 
    fullName: "Priya Sharma", 
    email: "priya.sharma@company.com", 
    phone: "+91 98765 33333", 
    role: "pm", 
    pmCode: "PM001" 
  });
  
  const loadAssignedHR = () => setAssignedHR({ 
    fullName: "Rahul Verma", 
    email: "rahul.verma@company.com", 
    phone: "+91 98765 44444", 
    role: "hr" 
  });

  const loadDailyLogs = () => {
    setDailyLogs([
      { id: 1, date: "2024-01-15", tasks: "Completed React component development for the dashboard module", learnings: "Learned about React hooks, state management with Context API, and performance optimization", blockers: "None", hoursWorked: 8 },
      { id: 2, date: "2024-01-14", tasks: "API integration with backend services and data fetching implementation", learnings: "REST API best practices, error handling, and async/await patterns", blockers: "CORS issues - resolved with proxy configuration", hoursWorked: 7 },
      { id: 3, date: "2024-01-13", tasks: "Database schema design and MongoDB setup", learnings: "NoSQL database design patterns and indexing strategies", blockers: "None", hoursWorked: 6 }
    ]);
  };

  const loadAnnouncements = () => {
    // In real app, fetch from PM/HR
    setAnnouncements([
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
  };

  const getStats = () => {
    const daysActive = currentIntern?.profile?.startDate 
      ? Math.floor((new Date() - new Date(currentIntern.profile.startDate)) / (1000 * 60 * 60 * 24)) 
      : 0;
    const totalHours = dailyLogs.reduce((sum, log) => sum + (log.hoursWorked || 0), 0);
    const progressPercent = currentIntern?.profile?.startDate && currentIntern?.profile?.endDate
      ? Math.min(Math.round((daysActive / 180) * 100), 100)
      : 0;
    
    return { 
      daysActive, 
      unreadMessages: 5, 
      announcements: announcements.length, 
      tasksCompleted: 12, 
      totalHours, 
      progressPercent 
    };
  };

  const menuItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "daily-log", label: "Daily Log", icon: BookOpen },
    { id: "reports", label: "Reports", icon: ClipboardList },
    { id: "chat", label: "Messages", icon: MessageCircle, badge: 5 },
    { id: "profile", label: "My Profile", icon: User },
    { id: "project-submission", label: "Submit Project", icon: Send },
  ];

  const stats = getStats();
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
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%", background: GRADIENTS.accent,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 18, fontWeight: 700, color: "white",
                  }}>
                    {currentIntern?.avatar || "IN"}
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
                width: 40, height: 40, borderRadius: "50%", background: GRADIENTS.accent,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontWeight: 700, color: "white", cursor: "pointer",
              }}>
                {currentIntern?.avatar || "IN"}
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
              {activePage === "reports" && <ReportsPage isMobile={isMobile} />}
              {activePage === "chat" && (
                <MessagesPage 
                  isMobile={isMobile} 
                  assignedPM={assignedPM} 
                  assignedHR={assignedHR} 
                />
              )}
              {activePage === "profile" && (
                <ProfilePage intern={currentIntern} isMobile={isMobile} />
              )}
              {activePage === "project-submission" && (
                <ProjectSubmissionPage isMobile={isMobile} />
              )}
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
}

function getPageTitle(page) {
  return { 
    "overview": "Intern Dashboard", 
    "daily-log": "Daily Log", 
    "reports": "Reports", 
    "chat": "Messages", 
    "profile": "My Profile", 
    "project-submission": "Submit Project" 
  }[page] || "Intern Dashboard";
}

function getPageSubtitle(page, intern) {
  return { 
    "overview": "Track your internship progress and activities", 
    "daily-log": "Track your daily progress", 
    "reports": "TNA & Project Blueprint", 
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
        <div>{new Date(announcement.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
        <div style={{ fontStyle: "italic" }}>{announcement.from}</div>
      </div>
    </div>
  );  
}

function ProjectSubmissionPage({ isMobile }) {
  const [projectTitle, setProjectTitle] = useState("");
  const [description, setDescription] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [demoLink, setDemoLink] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [files, setFiles] = useState([]);

  const handleSubmit = (e) => { 
    e.preventDefault(); 
    setSubmitted(true); 
    setTimeout(() => setSubmitted(false), 4000); 
  };
  
  const handleFileChange = (e) => setFiles([...files, ...Array.from(e.target.files)]);

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
            ✓
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
    </div>
  );
}