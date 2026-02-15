//frontend/src/pages/intern/InternHome.jsx
import React, { useState, useEffect } from "react";
import DailyLogPage from './DailyLogPage';
import ProfilePage from './ProfilePage';
import MessagesPage from './MessagesPage';
import ReportsPage from './ReportsPage';

import { 
<<<<<<< HEAD
  User, Bell, MessageCircle, FileText, Award, Calendar, 
  MapPin, Briefcase, Mail, Phone, GraduationCap,
  Home, BookOpen, Send, Menu, X, Users, Clock, CheckCircle,
  ChevronRight, Sparkles, TrendingUp, Zap, Star,
  Github, Globe, Upload, AlertCircle, Coffee, Target, Rocket,
  ClipboardList
} from "lucide-react";

// Original color palette preserved
=======
  User, Bell, MessageCircle, FileText, 
  Home, BookOpen, Send, Menu, X, Sparkles,
  ClipboardList, LogOut
} from "lucide-react";

// ==================== COLORS MATCHING PM DASHBOARD ====================
>>>>>>> 0459e1788ddb5f149b97ab4468a9511b362ae99f
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

<<<<<<< HEAD
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap');
    
    * { box-sizing: border-box; margin: 0; padding: 0; }
    
    body {
      font-family: 'DM Sans', -apple-system, sans-serif;
      background: ${COLORS.inkBlack};
      color: white;
      overflow-x: hidden;
    }
    
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    @keyframes slideInLeft {
      from { opacity: 0; transform: translateX(-20px); }
      to { opacity: 1; transform: translateX(0); }
    }
    
    @keyframes scaleIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    
    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    
    @keyframes rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .animate-fadeIn { animation: fadeInUp 0.5s ease-out forwards; }
    .animate-slideIn { animation: slideInLeft 0.4s ease-out forwards; }
    .animate-scaleIn { animation: scaleIn 0.3s ease-out forwards; }
    .animate-float { animation: float 3s ease-in-out infinite; }
    .animate-pulse { animation: pulse 2s ease-in-out infinite; }
    
=======
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
>>>>>>> 0459e1788ddb5f149b97ab4468a9511b362ae99f
    .stagger-1 { animation-delay: 0.05s; opacity: 0; }
    .stagger-2 { animation-delay: 0.1s; opacity: 0; }
    .stagger-3 { animation-delay: 0.15s; opacity: 0; }
    .stagger-4 { animation-delay: 0.2s; opacity: 0; }
    .stagger-5 { animation-delay: 0.25s; opacity: 0; }
<<<<<<< HEAD
    
    .hover-lift {
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }
    .hover-lift:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(29, 120, 116, 0.25);
    }
    
    .glass {
      background: rgba(7, 30, 34, 0.8);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(103, 146, 137, 0.15);
    }
    
    input::placeholder, textarea::placeholder { color: rgba(255, 229, 217, 0.4); }
    
    input:focus, textarea:focus {
      outline: none;
      border-color: ${COLORS.jungleTeal};
      box-shadow: 0 0 0 3px rgba(103, 146, 137, 0.2);
    }
    
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: ${COLORS.inkBlack}; }
=======
    input::placeholder, textarea::placeholder { color: rgba(248, 250, 252, 0.4); }
    input:focus, textarea:focus { 
      outline: none; 
      border-color: ${COLORS.jungleTeal}; 
      box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.2); 
    }
    ::-webkit-scrollbar { width: 6px; height: 6px; }
    ::-webkit-scrollbar-track { background: ${COLORS.bgPrimary}; }
>>>>>>> 0459e1788ddb5f149b97ab4468a9511b362ae99f
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
<<<<<<< HEAD
  const [notifications, setNotifications] = useState(3);

  const [announcements] = useState([
    { id: 1, title: "Welcome to the Team!", message: "We're excited to have you on board. Complete your profile and start your internship journey.", date: "2024-01-15", priority: "high", from: "HR Team" },
    { id: 2, title: "Weekly Check-in Reminder", message: "Remember to submit your weekly progress report every Friday by 5 PM.", date: "2024-01-14", priority: "medium", from: "Your PM" },
    { id: 3, title: "Learning Resources Available", message: "Check out our resource library for tutorials and documentation to help with your projects.", date: "2024-01-10", priority: "low", from: "HR Team" }
  ]);

  const [dailyLogs, setDailyLogs] = useState([]);

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 900;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
=======
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
>>>>>>> 0459e1788ddb5f149b97ab4468a9511b362ae99f
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

<<<<<<< HEAD
  useEffect(() => { loadCurrentIntern(); loadDailyLogs(); }, []);
  useEffect(() => { if (currentIntern?.pmCode) { loadAssignedPM(); loadAssignedHR(); } }, [currentIntern]);

  const loadCurrentIntern = () => {
    setCurrentIntern({
      fullName: "Alex Johnson", email: "alex.johnson@college.edu", phone: "+91 98765 43210",
      dob: "2002-05-15", role: "intern", pmCode: "PM001", degree: "B.Tech Computer Science", avatar: "AJ",
      profile: {
        bloodGroup: "O+", address: "123 College Road, University Area", city: "Bangalore",
        state: "Karnataka", pincode: "560001", emergencyContactName: "Sarah Johnson",
        emergencyRelation: "Mother", emergencyContactPhone: "+91 98765 11111",
        collegeName: "Tech University", department: "Computer Science", semester: "6th Semester",
        guideName: "Dr. Rajesh Kumar", guideEmail: "rajesh@college.edu", guidePhone: "+91 98765 22222",
        internshipDuration: "6 months", startDate: "2024-01-01", endDate: "2024-06-30",
        workMode: "Hybrid", expectedOutcome: "Full Stack Development Skills", bio: "Passionate about web development and AI"
=======
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
>>>>>>> 0459e1788ddb5f149b97ab4468a9511b362ae99f
      }
    });
  };

<<<<<<< HEAD
  const loadAssignedPM = () => setAssignedPM({ fullName: "Priya Sharma", email: "priya.sharma@company.com", phone: "+91 98765 33333", role: "pm", pmCode: "PM001" });
  const loadAssignedHR = () => setAssignedHR({ fullName: "Rahul Verma", email: "rahul.verma@company.com", phone: "+91 98765 44444", role: "hr" });
=======
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
>>>>>>> 0459e1788ddb5f149b97ab4468a9511b362ae99f

  const loadDailyLogs = () => {
    setDailyLogs([
      { id: 1, date: "2024-01-15", tasks: "Completed React component development for the dashboard module", learnings: "Learned about React hooks, state management with Context API, and performance optimization", blockers: "None", hoursWorked: 8 },
      { id: 2, date: "2024-01-14", tasks: "API integration with backend services and data fetching implementation", learnings: "REST API best practices, error handling, and async/await patterns", blockers: "CORS issues - resolved with proxy configuration", hoursWorked: 7 },
      { id: 3, date: "2024-01-13", tasks: "Database schema design and MongoDB setup", learnings: "NoSQL database design patterns and indexing strategies", blockers: "None", hoursWorked: 6 }
    ]);
<<<<<<< HEAD
  };

  const getStats = () => {
    const daysActive = currentIntern?.profile?.startDate ? Math.floor((new Date() - new Date(currentIntern.profile.startDate)) / (1000 * 60 * 60 * 24)) : 0;
    const totalHours = dailyLogs.reduce((sum, log) => sum + (log.hoursWorked || 0), 0);
    return { daysActive, unreadMessages: 5, announcements: announcements.length, tasksCompleted: 12, totalHours, progressPercent: Math.min(Math.round((daysActive / 180) * 100), 100) };
  };

  const menuItems = [
    { id: "overview", label: "Overview", icon: <Home size={20} /> },
    { id: "daily-log", label: "Daily Log", icon: <BookOpen size={20} /> },
    { id: "reports", label: "Reports", icon: <ClipboardList size={20} /> },
    { id: "chat", label: "Messages", icon: <MessageCircle size={20} />, badge: 5 },
    { id: "profile", label: "My Profile", icon: <User size={20} /> },
    { id: "project-submission", label: "Submit Project", icon: <Send size={20} /> },
=======
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
>>>>>>> 0459e1788ddb5f149b97ab4468a9511b362ae99f
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
<<<<<<< HEAD
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
          <div style={{ padding: "28px 24px", flex: 1 }}>
            {/* Logo */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: `linear-gradient(135deg, ${COLORS.peachGlow} 0%, ${COLORS.jungleTeal} 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 20px rgba(255, 229, 217, 0.2)"
                }}>
                  <Sparkles size={22} color={COLORS.inkBlack} />
                </div>
                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, fontWeight: 800, color: "white", letterSpacing: "-0.5px" }}>InternHub</span>
              </div>
              {isMobile && (
                <button onClick={() => setSidebarOpen(false)} style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", cursor: "pointer", width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <X size={20} />
                </button>
              )}
            </div>

            {/* User card */}
            <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 16, padding: 16, marginBottom: 32, border: "1px solid rgba(255,255,255,0.1)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: 12,
                  background: `linear-gradient(135deg, ${COLORS.jungleTeal} 0%, ${COLORS.deepOcean} 100%)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 16, color: "white", border: `2px solid ${COLORS.peachGlow}`
                }}>
                  {currentIntern?.avatar || "IN"}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "white", fontSize: 15 }}>{currentIntern?.fullName || "Intern"}</div>
                  <div style={{ fontSize: 12, color: COLORS.peachGlow, opacity: 0.8 }}>{currentIntern?.degree || "Student"}</div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {menuItems.map((item, index) => (
                <button
                  key={item.id}
                  onClick={() => { setActivePage(item.id); if (isMobile) setSidebarOpen(false); }}
                  className={`animate-slideIn stagger-${index + 1}`}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "14px 16px", borderRadius: 12, border: "none",
                    background: activePage === item.id ? "rgba(255, 229, 217, 0.15)" : "transparent",
                    color: activePage === item.id ? COLORS.peachGlow : "rgba(255,255,255,0.7)",
                    cursor: "pointer", fontSize: 14, fontWeight: 500, transition: "all 0.2s ease", textAlign: "left",
                  }}
                  onMouseEnter={(e) => { if (activePage !== item.id) { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "white"; }}}
                  onMouseLeave={(e) => { if (activePage !== item.id) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "rgba(255,255,255,0.7)"; }}}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>{item.icon}{item.label}</div>
                  {item.badge && <span style={{ background: COLORS.racingRed, color: "white", fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20 }}>{item.badge}</span>}
                </button>
              ))}
            </nav>
          </div>

          {/* Sidebar footer - Progress */}
          <div style={{ padding: "20px 24px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ background: `rgba(103, 146, 137, 0.15)`, borderRadius: 14, padding: 16, border: `1px solid rgba(103, 146, 137, 0.25)` }}>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <TrendingUp size={14} />Internship Progress
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.1)", borderRadius: 4, overflow: "hidden", marginBottom: 10 }}>
                <div style={{ width: `${stats.progressPercent}%`, height: "100%", background: `linear-gradient(90deg, ${COLORS.jungleTeal} 0%, ${COLORS.peachGlow} 100%)`, borderRadius: 4, transition: "width 1s ease" }} />
              </div>
              <div style={{ fontSize: 14, color: "white", fontWeight: 700 }}>{stats.progressPercent}% Complete</div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main style={{ flex: 1, overflow: "auto", position: "relative" }}>
          {/* Top Bar */}
          <header style={{
            background: "rgba(7, 30, 34, 0.9)", backdropFilter: "blur(20px)",
            padding: "16px 32px", display: "flex", justifyContent: "space-between", alignItems: "center",
            borderBottom: "1px solid rgba(103, 146, 137, 0.15)", position: "sticky", top: 0, zIndex: 100,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {!sidebarOpen && (
                <button onClick={() => setSidebarOpen(true)} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "white", cursor: "pointer", width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Menu size={20} />
                </button>
              )}
              <div>
                <h1 style={{ color: "white", fontSize: isMobile ? 20 : 26, margin: 0, fontWeight: 700, fontFamily: "'Outfit', sans-serif" }}>{getPageTitle(activePage)}</h1>
                <p style={{ color: COLORS.jungleTeal, fontSize: 14, margin: 0, marginTop: 2 }}>{getPageSubtitle(activePage, currentIntern)}</p>
              </div>
            </div>
            
            <button
              onClick={() => setNotifications(0)}
              style={{
                position: "relative", background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12,
                width: 46, height: 46, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "white", transition: "all 0.2s",
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
              onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            >
              <Bell size={20} />
              {notifications > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4, background: COLORS.racingRed, color: "white",
                  borderRadius: "50%", width: 20, height: 20, fontSize: 11, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${COLORS.inkBlack}`,
                }}>{notifications}</span>
              )}
            </button>
          </header>

          {/* Page Content */}
          <div style={{ padding: isMobile ? 20 : 32, minHeight: "calc(100vh - 81px)" }}>
            {activePage === "overview" && <OverviewPage intern={currentIntern} pm={assignedPM} hr={assignedHR} announcements={announcements} stats={stats} isMobile={isMobile} />}
            {activePage === "daily-log" && <DailyLogPage isMobile={isMobile} assignedPM={assignedPM} />}
            {activePage === "reports" && <ReportsPage isMobile={isMobile} />}
            {activePage === "chat" && <MessagesPage isMobile={isMobile} assignedPM={assignedPM} assignedHR={assignedHR} />}
            {activePage === "profile" && <ProfilePage intern={currentIntern} isMobile={isMobile} />}
            {activePage === "project-submission" && <ProjectSubmissionPage isMobile={isMobile} />}
          </div>
        </main>
      </div>
    </>
  );
}

function getPageTitle(page) {
  return { "overview": "Dashboard", "daily-log": "Daily Log", "reports": "Reports", "chat": "Messages", "profile": "My Profile", "project-submission": "Submit Project" }[page] || "Dashboard";
}

function getPageSubtitle(page, intern) {
  const name = intern?.fullName?.split(" ")[0] || "there";
  return { "overview": `Welcome back, ${name}!`, "daily-log": "Track your daily progress", "reports": "TNA & Project Blueprint", "chat": "Connect with your team", "profile": "Manage your information", "project-submission": "Share your work" }[page] || "";
}

function OverviewPage({ intern, pm, hr, announcements, stats, isMobile }) {
  const quickActions = [
    { icon: <BookOpen size={20} />, label: "Log Today", desc: "Record your progress", color: COLORS.jungleTeal },
    { icon: <Send size={20} />, label: "Submit Work", desc: "Share your project", color: COLORS.peachGlow },
    { icon: <MessageCircle size={20} />, label: "Message PM", desc: "Get quick help", color: "#a78bfa" },
    { icon: <FileText size={20} />, label: "Resources", desc: "Learning materials", color: "#f59e0b" },
  ];

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      {/* Enhanced Hero Section */}
      <div className="animate-fadeIn" style={{
        borderRadius: 28,
        background: `linear-gradient(135deg, ${COLORS.deepOcean} 0%, #0f3d3a 40%, ${COLORS.inkBlack} 100%)`,
        border: "1px solid rgba(103, 146, 137, 0.3)",
        padding: isMobile ? 28 : 40,
        marginBottom: 28,
        position: "relative",
        overflow: "hidden",
        minHeight: isMobile ? 420 : 320,
      }}>
        {/* Animated Background Elements */}
        <div style={{
          position: "absolute", top: -100, right: -100,
          width: 400, height: 400,
          background: `radial-gradient(circle, ${COLORS.peachGlow}15 0%, transparent 60%)`,
          borderRadius: "50%",
          animation: "float 6s ease-in-out infinite",
        }} />
        <div style={{
          position: "absolute", bottom: -80, left: -80,
          width: 300, height: 300,
          background: `radial-gradient(circle, ${COLORS.jungleTeal}20 0%, transparent 60%)`,
          borderRadius: "50%",
          animation: "float 8s ease-in-out infinite reverse",
        }} />
        <div style={{
          position: "absolute", top: "50%", right: "15%",
          width: 200, height: 200,
          background: `radial-gradient(circle, ${COLORS.deepOcean}30 0%, transparent 70%)`,
          borderRadius: "50%",
          animation: "float 5s ease-in-out infinite",
          animationDelay: "1s",
        }} />
        
        {/* Decorative Grid Pattern */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `linear-gradient(rgba(103, 146, 137, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(103, 146, 137, 0.05) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
          opacity: 0.5,
        }} />

        {/* Hero Content */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
          gap: 40, 
          position: "relative", 
          zIndex: 1,
          alignItems: "center",
        }}>
          {/* Left Side - Welcome & Info */}
          <div>
            <div style={{ 
              display: "inline-flex", 
              alignItems: "center", 
              gap: 8, 
              background: "rgba(255, 229, 217, 0.12)", 
              padding: "8px 16px", 
              borderRadius: 30,
              marginBottom: 20,
              border: "1px solid rgba(255, 229, 217, 0.2)",
            }}>
              <Coffee size={16} color={COLORS.peachGlow} />
              <span style={{ color: COLORS.peachGlow, fontSize: 13, fontWeight: 600 }}>Good {getGreeting()}!</span>
            </div>
            
            <h2 style={{ 
              fontSize: isMobile ? 36 : 48, 
              margin: 0, 
              color: "white", 
              fontFamily: "'Outfit', sans-serif", 
              fontWeight: 800, 
              lineHeight: 1.1,
              marginBottom: 12,
            }}>
              Welcome back,
              <br />
              <span style={{ 
                background: `linear-gradient(135deg, ${COLORS.peachGlow} 0%, ${COLORS.jungleTeal} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}>
                {intern?.fullName?.split(" ")[0] || "Intern"}!
              </span>
            </h2>
            
            <p style={{ 
              color: "rgba(255,255,255,0.65)", 
              fontSize: 16, 
              margin: "16px 0 24px", 
              maxWidth: 400,
              lineHeight: 1.7,
            }}>
              You're making incredible progress on your internship journey. Keep up the amazing work and continue learning every day!
            </p>

            {/* CTA Buttons */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <button style={{
                padding: "14px 28px",
                background: `linear-gradient(135deg, ${COLORS.peachGlow} 0%, #ffceb8 100%)`,
                color: COLORS.inkBlack,
                border: "none",
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                transition: "all 0.3s ease",
                boxShadow: `0 8px 30px ${COLORS.peachGlow}30`,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = `0 12px 40px ${COLORS.peachGlow}40`; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 8px 30px ${COLORS.peachGlow}30`; }}>
                <BookOpen size={18} />
                Log Today's Progress
              </button>
              <button style={{
                padding: "14px 28px",
                background: "rgba(255,255,255,0.08)",
                color: "white",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 14,
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 10,
                transition: "all 0.3s ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.borderColor = COLORS.jungleTeal; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}>
                <Target size={18} />
                View Tasks
              </button>
            </div>
          </div>

          {/* Right Side - Stats Cards */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: 16,
          }}>
            <HeroStatCard 
              icon={<Calendar size={22} />} 
              value={stats.daysActive} 
              label="Days Active" 
              color={COLORS.peachGlow}
              delay={0}
            />
            <HeroStatCard 
              icon={<Clock size={22} />} 
              value={`${stats.totalHours}h`} 
              label="Hours Logged" 
              color={COLORS.jungleTeal}
              delay={1}
            />
            <HeroStatCard 
              icon={<CheckCircle size={22} />} 
              value={stats.tasksCompleted} 
              label="Tasks Done" 
              color="#a78bfa"
              delay={2}
            />
            <HeroStatCard 
              icon={<Rocket size={22} />} 
              value={`${stats.progressPercent}%`} 
              label="Progress" 
              color="#4ade80"
              delay={3}
              isProgress
              progressValue={stats.progressPercent}
            />
          </div>
        </div>

        {/* Bottom Progress Bar */}
        <div style={{ 
          marginTop: 32, 
          position: "relative", 
          zIndex: 1,
          padding: "20px 24px",
          background: "rgba(0,0,0,0.2)",
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.08)",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: `${COLORS.jungleTeal}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <TrendingUp size={16} color={COLORS.jungleTeal} />
              </div>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>Internship Journey</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                {intern?.profile?.startDate ? new Date(intern.profile.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "Start"}
              </span>
              <span style={{ fontSize: 14, color: COLORS.peachGlow, fontWeight: 700 }}>{stats.progressPercent}% Complete</span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                {intern?.profile?.endDate ? new Date(intern.profile.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "End"}
              </span>
            </div>
          </div>
          <div style={{ height: 10, background: "rgba(255,255,255,0.1)", borderRadius: 5, overflow: "hidden" }}>
            <div style={{ 
              width: `${stats.progressPercent}%`, 
              height: "100%", 
              background: `linear-gradient(90deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 50%, ${COLORS.peachGlow} 100%)`,
              borderRadius: 5, 
              transition: "width 1.5s ease",
              position: "relative",
            }}>
              <div style={{
                position: "absolute",
                right: 0,
                top: "50%",
                transform: "translateY(-50%)",
                width: 16,
                height: 16,
                borderRadius: "50%",
                background: COLORS.peachGlow,
                border: `3px solid ${COLORS.inkBlack}`,
                boxShadow: `0 0 20px ${COLORS.peachGlow}60`,
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="animate-fadeIn stagger-2" style={{ marginBottom: 28 }}>
        <h3 style={{ color: "white", fontSize: 18, marginBottom: 16, fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}>
          <Zap size={20} color={COLORS.jungleTeal} /> Quick Actions
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 14 }}>
          {quickActions.map((action, idx) => (
            <div key={idx} className="hover-lift" style={{
              padding: 22, borderRadius: 18, cursor: "pointer",
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              transition: "all 0.3s", display: "flex", alignItems: "center", gap: 16
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = `${action.color}40`; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14, background: `${action.color}20`,
                display: "flex", alignItems: "center", justifyContent: "center", color: action.color,
                border: `1px solid ${action.color}30`, flexShrink: 0
              }}>{action.icon}</div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: "white" }}>{action.label}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>{action.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Grid - Team + Timeline + Announcements */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 24 }}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Your Team */}
          <div className="glass animate-fadeIn stagger-3" style={{ padding: 24, borderRadius: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ color: "white", fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center", gap: 10, margin: 0 }}>
                <Users size={20} color={COLORS.jungleTeal} /> Your Team
              </h3>
              <span style={{ fontSize: 12, color: COLORS.jungleTeal, cursor: "pointer", fontWeight: 500 }}>View all →</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {pm && <CompactTeamCard member={pm} role="Project Manager" color={COLORS.jungleTeal} online={true} />}
              {hr && <CompactTeamCard member={hr} role="HR Manager" color={COLORS.peachGlow} online={false} />}
            </div>
          </div>

          {/* Journey Timeline */}
          <div className="glass animate-fadeIn" style={{ padding: 24, borderRadius: 20, animationDelay: "0.3s", opacity: 0 }}>
            <h3 style={{ color: "white", fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
              <TrendingUp size={20} color={COLORS.jungleTeal} /> Journey Timeline
            </h3>
            {intern?.profile?.startDate && intern?.profile?.endDate && (
              <div style={{ position: "relative", paddingLeft: 28 }}>
                {/* Timeline line */}
                <div style={{ position: "absolute", left: 9, top: 8, bottom: 8, width: 2, background: `linear-gradient(180deg, ${COLORS.jungleTeal} 0%, ${COLORS.deepOcean} 100%)` }} />
                
                {/* Start */}
                <div style={{ position: "relative", marginBottom: 32 }}>
                  <div style={{ position: "absolute", left: -28, top: 2, width: 18, height: 18, borderRadius: "50%", background: COLORS.jungleTeal, border: `3px solid ${COLORS.inkBlack}` }} />
                  <div style={{ fontSize: 11, color: COLORS.jungleTeal, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Started</div>
                  <div style={{ fontSize: 16, color: "white", fontWeight: 600, marginTop: 6 }}>{new Date(intern.profile.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                </div>

                {/* Current */}
                <div style={{ position: "relative", marginBottom: 32 }}>
                  <div style={{ position: "absolute", left: -28, top: 2, width: 18, height: 18, borderRadius: "50%", background: COLORS.peachGlow, border: `3px solid ${COLORS.inkBlack}`, boxShadow: `0 0 16px ${COLORS.peachGlow}60` }} />
                  <div style={{ fontSize: 11, color: COLORS.peachGlow, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Today</div>
                  <div style={{ fontSize: 16, color: "white", fontWeight: 600, marginTop: 6 }}>Day {stats.daysActive}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>{intern.profile.workMode} Mode</div>
                </div>

                {/* End */}
                <div style={{ position: "relative" }}>
                  <div style={{ position: "absolute", left: -28, top: 2, width: 18, height: 18, borderRadius: "50%", background: "rgba(255,255,255,0.2)", border: `3px solid ${COLORS.inkBlack}` }} />
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>Completion</div>
                  <div style={{ fontSize: 16, color: "rgba(255,255,255,0.7)", fontWeight: 600, marginTop: 6 }}>{new Date(intern.profile.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Announcements */}
        <div className="animate-fadeIn" style={{ animationDelay: "0.35s", opacity: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ color: "white", fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center", gap: 10, margin: 0 }}>
              <Bell size={20} color={COLORS.jungleTeal} /> Announcements
            </h3>
            <span style={{ fontSize: 12, color: COLORS.jungleTeal, cursor: "pointer", fontWeight: 500 }}>View all →</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {announcements.map((ann, idx) => <AnnouncementCard key={ann.id} announcement={ann} index={idx} />)}
          </div>
        </div>
=======
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
>>>>>>> 0459e1788ddb5f149b97ab4468a9511b362ae99f
      </div>
    </>
  );
}

<<<<<<< HEAD
function HeroStatCard({ icon, value, label, color, delay, isProgress, progressValue }) {
  return (
    <div 
      className="animate-scaleIn"
      style={{
        background: "rgba(255,255,255,0.06)",
        backdropFilter: "blur(10px)",
        borderRadius: 18,
        padding: 20,
        border: "1px solid rgba(255,255,255,0.1)",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        animationDelay: `${delay * 0.1}s`,
        opacity: 0,
        transition: "all 0.3s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = `${color}40`; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
    >
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: `${color}20`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: color,
        border: `1px solid ${color}30`,
      }}>
        {icon}
=======
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
>>>>>>> 0459e1788ddb5f149b97ab4468a9511b362ae99f
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "white", fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4, fontWeight: 500 }}>{label}</div>
      </div>
      {isProgress && (
        <div style={{ height: 4, background: "rgba(255,255,255,0.1)", borderRadius: 2, overflow: "hidden", marginTop: 4 }}>
          <div style={{ 
            width: `${progressValue}%`, 
            height: "100%", 
            background: `linear-gradient(90deg, ${color} 0%, ${COLORS.peachGlow} 100%)`,
            borderRadius: 2,
            transition: "width 1s ease",
          }} />
        </div>
      )}
    </div>
  );
}

<<<<<<< HEAD
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

function CompactTeamCard({ member, role, color, online }) {
  return (
    <div style={{
      padding: 16, borderRadius: 14, display: "flex", alignItems: "center", gap: 14, cursor: "pointer",
      background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", transition: "all 0.2s"
    }}
    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}>
      <div style={{ position: "relative" }}>
        <div style={{
          width: 46, height: 46, borderRadius: 12,
          background: `linear-gradient(135deg, ${color} 0%, ${COLORS.deepOcean} 100%)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 16, color: "white"
        }}>{member.fullName?.charAt(0) || "?"}</div>
        <div style={{
          position: "absolute", bottom: -2, right: -2, width: 14, height: 14, borderRadius: "50%",
          background: online ? "#4ade80" : "rgba(255,255,255,0.3)", border: `2px solid ${COLORS.inkBlack}`
        }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: "white" }}>{member.fullName}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{role}</div>
      </div>
      <ChevronRight size={18} color="rgba(255,255,255,0.3)" />
    </div>
  );
}

function FormField({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ 
        fontSize: 14, 
        fontWeight: 600, 
        color: COLORS.peachGlow,
        display: "flex",
        alignItems: "center",
        gap: 6
      }}>
        {label}
      </label>
      {children}
=======
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
>>>>>>> 0459e1788ddb5f149b97ab4468a9511b362ae99f
    </div>
  );
}

<<<<<<< HEAD
function ProjectSubmissionPage({ isMobile }) {
  const [projectTitle, setProjectTitle] = useState("");
  const [description, setDescription] = useState("");
  const [githubLink, setGithubLink] = useState("");
  const [demoLink, setDemoLink] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [files, setFiles] = useState([]);

  const handleSubmit = (e) => { e.preventDefault(); setSubmitted(true); setTimeout(() => setSubmitted(false), 4000); };
  const handleFileChange = (e) => setFiles([...files, ...Array.from(e.target.files)]);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto" }}>
      {submitted && (
        <div className="animate-scaleIn" style={{
          background: `rgba(103, 146, 137, 0.2)`, border: `1px solid ${COLORS.jungleTeal}`,
          padding: 20, borderRadius: 16, marginBottom: 24, color: COLORS.jungleTeal, display: "flex", alignItems: "center", gap: 14,
        }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: `rgba(103, 146, 137, 0.2)`, display: "flex", alignItems: "center", justifyContent: "center" }}><CheckCircle size={22} /></div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 15, color: "white" }}>Project Submitted Successfully!</div>
            <div style={{ fontSize: 13, color: COLORS.jungleTeal, marginTop: 2 }}>Your PM will review it shortly.</div>
=======
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
>>>>>>> 0459e1788ddb5f149b97ab4468a9511b362ae99f
          </div>
        </div>
      )}

<<<<<<< HEAD
      <div className="glass animate-fadeIn" style={{ padding: isMobile ? 24 : 32, borderRadius: 20, marginBottom: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <FormField label="Project Title *"><input type="text" value={projectTitle} onChange={(e) => setProjectTitle(e.target.value)} style={inputStyle} placeholder="e.g., E-Commerce Dashboard" required /></FormField>
          <FormField label="Project Description *"><textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ ...inputStyle, minHeight: 140, resize: "vertical" }} placeholder="Describe your project, technologies used, key features..." required /></FormField>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
            <FormField label="GitHub Repository *">
              <div style={{ position: "relative" }}>
                <Github size={18} color={COLORS.jungleTeal} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input type="url" value={githubLink} onChange={(e) => setGithubLink(e.target.value)} style={{ ...inputStyle, paddingLeft: 44 }} placeholder="https://github.com/..." required />
              </div>
            </FormField>
            <FormField label="Live Demo (Optional)">
              <div style={{ position: "relative" }}>
                <Globe size={18} color={COLORS.jungleTeal} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input type="url" value={demoLink} onChange={(e) => setDemoLink(e.target.value)} style={{ ...inputStyle, paddingLeft: 44 }} placeholder="https://your-demo.com" />
              </div>
            </FormField>
          </div>
          <FormField label="Project Files (Optional)">
            <label style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: 32, borderRadius: 14, border: `2px dashed rgba(103, 146, 137, 0.3)`,
              background: "rgba(103, 146, 137, 0.05)", cursor: "pointer", transition: "all 0.2s",
            }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.jungleTeal; e.currentTarget.style.background = "rgba(103, 146, 137, 0.1)"; }}
               onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(103, 146, 137, 0.3)"; e.currentTarget.style.background = "rgba(103, 146, 137, 0.05)"; }}>
              <Upload size={32} color={COLORS.jungleTeal} style={{ marginBottom: 12 }} />
              <div style={{ color: "white", fontWeight: 500, marginBottom: 4 }}>Drop files here or click to upload</div>
              <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>ZIP, PDF, or image files up to 50MB</div>
              <input type="file" multiple onChange={handleFileChange} style={{ display: "none" }} />
            </label>
            {files.length > 0 && (
              <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {files.map((file, idx) => (
                  <div key={idx} style={{ background: "rgba(255,255,255,0.08)", padding: "6px 12px", borderRadius: 8, fontSize: 13, color: "white", display: "flex", alignItems: "center", gap: 6 }}>
                    <FileText size={14} color={COLORS.jungleTeal} />{file.name}
                  </div>
                ))}
              </div>
            )}
          </FormField>
          <button type="submit" style={{
            padding: "18px 32px", background: `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)`,
            color: "white", border: "none", borderRadius: 14, fontWeight: 700, cursor: "pointer", fontSize: 16,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginTop: 8,
            transition: "transform 0.2s, box-shadow 0.2s", boxShadow: `0 4px 20px ${COLORS.deepOcean}40`
          }} onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = `0 12px 40px ${COLORS.deepOcean}50`; }}
             onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = `0 4px 20px ${COLORS.deepOcean}40`; }}>
            <Send size={20} />Submit Project
          </button>
        </form>
      </div>

      <div className="glass animate-fadeIn stagger-2" style={{ padding: isMobile ? 24 : 32, borderRadius: 20 }}>
        <h3 style={{ color: "white", marginBottom: 20, fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center", gap: 10 }}><FileText size={20} color={COLORS.jungleTeal} />Previous Submissions</h3>
        <div style={{ padding: 40, textAlign: "center", background: "rgba(255,255,255,0.02)", borderRadius: 14, border: "1px dashed rgba(255,255,255,0.1)" }}>
          <FileText size={40} color={COLORS.jungleTeal} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ color: "rgba(255,255,255,0.4)" }}>No previous submissions yet.</p>
        </div>
      </div>
    </div>
  );
}

function AnnouncementCard({ announcement, index }) {
  const priorityConfig = {
    high: { color: COLORS.racingRed, bg: `${COLORS.racingRed}15`, border: `${COLORS.racingRed}30` },
    medium: { color: "#f59e0b", bg: "#f59e0b15", border: "#f59e0b30" },
    low: { color: COLORS.jungleTeal, bg: `${COLORS.jungleTeal}15`, border: `${COLORS.jungleTeal}30` }
  };
  const config = priorityConfig[announcement.priority] || priorityConfig.low;
  
  return (
    <div className={`glass hover-lift animate-fadeIn stagger-${Math.min(index + 1, 5)}`} style={{ padding: 20, borderRadius: 16, borderLeft: `4px solid ${config.color}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 12 }}>
        <div style={{ fontWeight: 600, fontSize: 15, color: "white", flex: 1 }}>{announcement.title}</div>
        <span style={{
          background: config.bg, color: config.color, padding: "4px 10px", borderRadius: 20,
          fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px",
          border: `1px solid ${config.border}`, flexShrink: 0,
        }}>{announcement.priority}</span>
      </div>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 12, lineHeight: 1.6 }}>{announcement.message}</p>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, color: "rgba(255,255,255,0.4)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Calendar size={12} />{new Date(announcement.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
        <div style={{ fontStyle: "italic" }}>{announcement.from}</div>
      </div>
    </div>
  );  
}

const inputStyle = {
  width: "100%", padding: "14px 16px", borderRadius: 12,
  border: `1px solid rgba(103, 146, 137, 0.25)`, background: "rgba(255,255,255,0.04)",
  color: "white", fontSize: 14, outline: "none", boxSizing: "border-box",
  transition: "border-color 0.2s, box-shadow 0.2s", fontFamily: "'DM Sans', sans-serif",
};
=======
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
>>>>>>> 0459e1788ddb5f149b97ab4468a9511b362ae99f
