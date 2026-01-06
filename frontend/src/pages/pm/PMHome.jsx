// PMHome.jsx
import React, { useState, useEffect } from "react";
import { Menu, Bell, LogOut, Sparkles, X, Settings, Users, Home, BookOpen, MessageCircle, BarChart3, ChevronRight } from "lucide-react";
import MessagesPage from './MessagesPage';
import OverviewPage from "./OverviewPage";
import MyInternsPage from './MyInternsPage';
import ReviewLogsPage from './ReviewLogsPage';
import AnalyticsPage from './AnalyticsPage';

const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
};

const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'DM Sans', -apple-system, sans-serif; background: ${COLORS.inkBlack}; color: white; overflow-x: hidden; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
    @keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
    @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    .animate-fadeIn { animation: fadeInUp 0.5s ease-out forwards; }
    .animate-slideIn { animation: slideInLeft 0.4s ease-out forwards; }
    .animate-scaleIn { animation: scaleIn 0.3s ease-out forwards; }
    .animate-float { animation: float 3s ease-in-out infinite; }
    .stagger-1 { animation-delay: 0.05s; opacity: 0; }
    .stagger-2 { animation-delay: 0.1s; opacity: 0; }
    .stagger-3 { animation-delay: 0.15s; opacity: 0; }
    .stagger-4 { animation-delay: 0.2s; opacity: 0; }
    .stagger-5 { animation-delay: 0.25s; opacity: 0; }
    .hover-lift { transition: transform 0.25s ease, box-shadow 0.25s ease; }
    .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(29, 120, 116, 0.25); }
    .glass { background: rgba(7, 30, 34, 0.8); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border: 1px solid rgba(103, 146, 137, 0.15); }
    input::placeholder, textarea::placeholder { color: rgba(255, 229, 217, 0.4); }
    input:focus, textarea:focus { outline: none; border-color: ${COLORS.jungleTeal}; box-shadow: 0 0 0 3px rgba(103, 146, 137, 0.2); }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: ${COLORS.inkBlack}; }
    ::-webkit-scrollbar-thumb { background: ${COLORS.deepOcean}; border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: ${COLORS.jungleTeal}; }
  `}</style>
);

export default function PMHome() {
  const [activePage, setActivePage] = useState("overview");
  const [currentPM, setCurrentPM] = useState(null);
  const [assignedInterns, setAssignedInterns] = useState([]);
  const [weeklyReports, setWeeklyReports] = useState([]);
  const [monthlyReports, setMonthlyReports] = useState([]);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    const onResize = () => { 
      const mobile = window.innerWidth < 900; 
      setIsMobile(mobile); 
      setSidebarOpen(!mobile); 
    };
    onResize(); 
    window.addEventListener("resize", onResize); 
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => { loadCurrentPM(); loadNotifications(); loadReports(); }, []);
  useEffect(() => { if (currentPM?.pmCode) loadAssignedInterns(); }, [currentPM]);

  const loadCurrentPM = () => {
    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
      if (user.role === "pm") {
        setCurrentPM(user);
      } else {
        setCurrentPM({ fullName: "Priya Sharma", email: "priya.sharma@company.com", phone: "+91 98765 33333", role: "pm", pmCode: "PM001", department: "Engineering", avatar: "PS" });
      }
    } catch (error) { console.error("Error loading PM:", error); }
  };

  const loadAssignedInterns = () => {
    try {
      const allUsers = JSON.parse(localStorage.getItem("users") || "[]");
      let interns = allUsers.filter(u => u.role === "intern" && u.pmCode === currentPM?.pmCode && !u.disabled);
      if (interns.length === 0) {
        interns = [
          { id: 1, fullName: "Alex Johnson", email: "alex@college.edu", avatar: "AJ", degree: "B.Tech CS", hoursLogged: 156, tasksCompleted: 12, status: "active", phone: "+91 98765 43210", pmCode: currentPM?.pmCode },
          { id: 2, fullName: "Sneha Patel", email: "sneha@college.edu", avatar: "SP", degree: "B.Tech IT", hoursLogged: 142, tasksCompleted: 10, status: "active", phone: "+91 98765 54321", pmCode: currentPM?.pmCode },
          { id: 3, fullName: "Ravi Kumar", email: "ravi@college.edu", avatar: "RK", degree: "MCA", hoursLogged: 168, tasksCompleted: 15, status: "active", phone: "+91 98765 67890", pmCode: currentPM?.pmCode }
        ];
      }
      setAssignedInterns(interns);
    } catch (error) { console.error("Error loading interns:", error); }
  };

  const loadNotifications = () => {
    setNotifications([
      { id: 1, title: "New Log Submission", message: "Alex Johnson submitted weekly log", time: "2 min ago", read: false, type: "log" },
      { id: 2, title: "Project Submitted", message: "Sneha Patel submitted final project", time: "1 hour ago", read: false, type: "project" },
      { id: 3, title: "Message from HR", message: "New announcement posted", time: "3 hours ago", read: true, type: "message" }
    ]);
  };

  const loadReports = () => {
    setWeeklyReports([
      { id: 1, internName: "Alex Johnson", internEmail: "alex@college.edu", weekNumber: 3, dateRange: "Jan 15 - Jan 21, 2024", totalHours: 42, daysWorked: 6, status: "pending", submittedAt: "2024-01-21T10:30:00", summary: "Completed dashboard module and API integration." },
      { id: 2, internName: "Sneha Patel", internEmail: "sneha@college.edu", weekNumber: 3, dateRange: "Jan 15 - Jan 21, 2024", totalHours: 38, daysWorked: 5, status: "approved", submittedAt: "2024-01-20T16:00:00", approvedAt: "2024-01-21T09:00:00", summary: "Database design and implementation." }
    ]);
    setMonthlyReports([
      { id: 1, internName: "Alex Johnson", internEmail: "alex@college.edu", month: "January 2024", totalHours: 168, totalDays: 22, avgHoursPerDay: 7.6, status: "approved", submittedAt: "2024-01-31T17:00:00", approvedAt: "2024-02-01T10:00:00", summary: "Excellent progress this month." }
    ]);
  };

  const stats = {
    activeInterns: assignedInterns.length,
    totalHours: assignedInterns.reduce((s, i) => s + (i.hoursLogged || 0), 0),
    totalTasks: assignedInterns.reduce((s, i) => s + (i.tasksCompleted || 0), 0),
    pendingReports: weeklyReports.filter(r => r.status === "pending").length,
    unreadMessages: notifications.filter(n => !n.read).length
  };

  const menuItems = [
    { id: "overview", label: "Overview", icon: <Home size={20} /> },
    { id: "my-interns", label: "My Interns", icon: <Users size={20} />, badge: assignedInterns.length },
    { id: "review-reports", label: "Review Reports", icon: <BookOpen size={20} />, badge: stats.pendingReports },
    { id: "messages", label: "Messages", icon: <MessageCircle size={20} />, badge: stats.unreadMessages },
    { id: "analytics", label: "Analytics", icon: <BarChart3 size={20} /> },
  ];

  const markNotificationAsRead = (id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const markAllAsRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const handleLogout = () => { localStorage.removeItem("currentUser"); window.location.href = "/login"; };

  return (
    <>
      <GlobalStyles />
      <div style={{ display: "flex", minHeight: "100vh", background: `linear-gradient(135deg, ${COLORS.inkBlack} 0%, #0a2528 50%, ${COLORS.inkBlack} 100%)` }}>
        
        {/* Sidebar */}
        <aside style={{
          width: sidebarOpen ? (isMobile ? "100%" : 280) : 0,
          background: `linear-gradient(180deg, ${COLORS.deepOcean} 0%, ${COLORS.inkBlack} 100%)`,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
          position: isMobile ? "fixed" : "relative",
          height: "100vh",
          zIndex: 1000,
          borderRight: `1px solid rgba(103, 146, 137, 0.2)`,
          display: "flex",
          flexDirection: "column",
        }}>
          <div style={{ padding: "28px 24px", flex: 1, overflowY: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg, ${COLORS.peachGlow} 0%, ${COLORS.jungleTeal} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 20px rgba(255, 229, 217, 0.2)" }}>
                  <Sparkles size={22} color={COLORS.inkBlack} />
                </div>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 800, color: "white", letterSpacing: "-0.5px" }}>PM Portal</span>
              </div>
              {isMobile && <button onClick={() => setSidebarOpen(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", cursor: "pointer", width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}><X size={20} /></button>}
            </div>
            
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 16, marginBottom: 32, border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: `linear-gradient(135deg, ${COLORS.jungleTeal} 0%, ${COLORS.deepOcean} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, color: "white", border: `2px solid ${COLORS.peachGlow}` }}>
                  {currentPM?.avatar || "PM"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: "white", fontSize: 15 }}>{currentPM?.fullName || "Project Manager"}</div>
                  <div style={{ fontSize: 12, color: COLORS.peachGlow, opacity: 0.8 }}>PM Code: {currentPM?.pmCode || "PM001"}</div>
                </div>
              </div>
            </div>

            <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {menuItems.map((item, index) => (
                <button key={item.id} onClick={() => { setActivePage(item.id); if (isMobile) setSidebarOpen(false); }} className={`animate-slideIn stagger-${index + 1}`}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderRadius: 12, border: "none", background: activePage === item.id ? "rgba(255, 229, 217, 0.15)" : "transparent", color: activePage === item.id ? COLORS.peachGlow : "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 14, fontWeight: 500, transition: "all 0.2s ease", textAlign: "left" }}
                  onMouseEnter={(e) => { if (activePage !== item.id) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "white"; }}}
                  onMouseLeave={(e) => { if (activePage !== item.id) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>{item.icon}{item.label}</div>
                  {item.badge > 0 && <span style={{ background: COLORS.racingRed, color: "white", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{item.badge}</span>}
                </button>
              ))}
            </nav>
          </div>

          <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ background: `rgba(103, 146, 137, 0.15)`, borderRadius: 14, padding: 16, border: `1px solid rgba(103, 146, 137, 0.25)` }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}><Users size={14} />Team Overview</div>
              <div style={{ fontSize: 20, color: "white", fontWeight: 700, marginBottom: 4 }}>{assignedInterns.length} Active Interns</div>
              <div style={{ fontSize: 13, color: COLORS.jungleTeal, fontWeight: 600 }}>{stats.totalHours}h logged this month</div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, overflow: "auto", position: "relative" }}>
          <header style={{ background: "rgba(7, 30, 34, 0.9)", backdropFilter: "blur(20px)", padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(103, 146, 137, 0.15)", position: "sticky", top: 0, zIndex: 100 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {!sidebarOpen && <button onClick={() => setSidebarOpen(true)} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "white", cursor: "pointer", width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}><Menu size={20} /></button>}
              <div>
                <h1 style={{ color: "white", fontSize: isMobile ? 20 : 26, margin: 0, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>
                  {activePage === "overview" ? "Dashboard" : activePage === "my-interns" ? "My Interns" : activePage === "review-reports" ? "Review Reports" : activePage === "messages" ? "Messages" : "Analytics"}
                </h1>
                <p style={{ color: COLORS.jungleTeal, fontSize: 14, margin: 0, marginTop: 2 }}>
                  {activePage === "overview" ? `Welcome back, ${currentPM?.fullName?.split(" ")[0] || "there"}!` : "Manage your team effectively"}
                </p>
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowNotifications(!showNotifications)} style={{ position: "relative", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, width: 46, height: 46, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white", transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.12)"} onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}>
                  <Bell size={20} />
                  {stats.unreadMessages > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: COLORS.racingRed, color: "white", borderRadius: "50%", width: 20, height: 20, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${COLORS.inkBlack}` }}>{stats.unreadMessages}</span>}
                </button>
                {showNotifications && (
                  <div className="glass animate-scaleIn" style={{ position: "absolute", right: 0, top: 60, width: 360, maxHeight: 480, overflowY: "auto", borderRadius: 16, padding: 16, zIndex: 1000 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                      <h3 style={{ color: "white", fontSize: 16, fontWeight: 600, margin: 0 }}>Notifications</h3>
                      <button onClick={markAllAsRead} style={{ background: "none", border: "none", color: COLORS.jungleTeal, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Mark all read</button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {notifications.map(notif => (
                        <div key={notif.id} onClick={() => markNotificationAsRead(notif.id)} style={{ padding: 12, background: notif.read ? "rgba(255,255,255,0.03)" : "rgba(103, 146, 137, 0.15)", borderRadius: 12, cursor: "pointer", border: `1px solid ${notif.read ? "rgba(255,255,255,0.05)" : "rgba(103, 146, 137, 0.3)"}`, transition: "all 0.2s" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, fontSize: 14, color: "white" }}>{notif.title}</span>
                            {!notif.read && <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.racingRed, flexShrink: 0 }} />}
                          </div>
                          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", margin: 0, marginBottom: 4 }}>{notif.message}</p>
                          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{notif.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div style={{ position: "relative" }}>
                <button onClick={() => setShowProfileMenu(!showProfileMenu)} style={{ width: 46, height: 46, borderRadius: 12, background: `linear-gradient(135deg, ${COLORS.jungleTeal} 0%, ${COLORS.deepOcean} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", cursor: "pointer", border: `2px solid ${COLORS.peachGlow}`, fontSize: 16, transition: "all 0.2s" }}>
                  {currentPM?.avatar || "PM"}
                </button>
                {showProfileMenu && (
                  <div className="glass animate-scaleIn" style={{ position: "absolute", right: 0, top: 60, width: 240, borderRadius: 16, padding: 12, zIndex: 1000 }}>
                    <div style={{ padding: 12, borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 8 }}>
                      <div style={{ fontWeight: 600, color: "white", fontSize: 14 }}>{currentPM?.fullName}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{currentPM?.email}</div>
                    </div>
                    <button onClick={() => { setActivePage("profile"); setShowProfileMenu(false); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "transparent", border: "none", borderRadius: 10, color: "rgba(255,255,255,0.8)", cursor: "pointer", fontSize: 14, transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}><Settings size={18} />Edit Profile</button>
                    <button onClick={handleLogout} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "transparent", border: "none", borderRadius: 10, color: COLORS.racingRed, cursor: "pointer", fontSize: 14, transition: "all 0.2s" }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(217, 4, 41, 0.1)"} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}><LogOut size={18} />Logout</button>
                  </div>
                )}
              </div>
            </div>
          </header>

          <div style={{ padding: isMobile ? 20 : 32, minHeight: "calc(100vh - 81px)" }}>
            {activePage === "overview" && <OverviewPage pm={currentPM} interns={assignedInterns} stats={stats} isMobile={isMobile} weeklyReports={weeklyReports} />}
            {activePage === "my-interns" && <MyInternsPage interns={assignedInterns} isMobile={isMobile} />}
            {activePage === "review-reports" && <ReviewLogsPage weeklyReports={weeklyReports} monthlyReports={monthlyReports} isMobile={isMobile} />}
            {activePage === "messages" && <MessagesPage isMobile={isMobile} currentUser={currentPM} assignedInterns={assignedInterns} />}
            {activePage === "analytics" && <AnalyticsPage interns={assignedInterns} weeklyReports={weeklyReports} isMobile={isMobile} />}
          </div>
        </main>

        {(showNotifications || showProfileMenu) && <div onClick={() => { setShowNotifications(false); setShowProfileMenu(false); }} style={{ position: "fixed", inset: 0, zIndex: 99 }} />}
      </div>
    </>
  );
}