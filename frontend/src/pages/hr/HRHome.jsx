// HRHome.jsx - FIXED with PM Dashboard colors
import React, { useState, useEffect } from "react";
import { Menu, Bell, LogOut, Sparkles, X } from "lucide-react";
import { COLORS, GRADIENTS, keyframes, navItems, INTERN_STATUS } from "./HRConstants";
import {
  DashboardSection,
  ApprovalSection,
  NewRegistrationsSection,
  PMSection,
  ReportsSection,
  ActiveInterns
} from "./HRSections";
import {
  Modal,
  RejectModal,
  ProfileModal,
  AnnouncementModal,
} from "./HRComponents";

import MessagesPage from './MessagesPage';
import { authApi, hrApi, announcementsApi } from "../../lib/apiClient";
import { getRealtimeSocket } from "../../lib/realtime";

export default function HRHome() {
  // State Management
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentHR, setCurrentHR] = useState(null);
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Modal States
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
 
  // Filter States
  const [rejectReason, setRejectReason] = useState("");
  const [profileTab, setProfileTab] = useState("personal");
  const [reportsTab, setReportsTab] = useState("review");

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

  // Close notifications when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        showNotifications &&
        !event.target.closest('[data-notification-dropdown]')
      ) {
        setShowNotifications(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifications]);

  useEffect(() => {
    const socket = getRealtimeSocket();
    const onChanged = () => {
      loadUsers();
      loadAnnouncements();
    };
    socket.on("itp:changed", onChanged);
    return () => socket.off("itp:changed", onChanged);
  }, []);

  // Data Loading Functions
  const loadCurrentHR = async () => {
    try {
      const me = await authApi.me();
      if (me?.profile?.role === "hr") {
        const hr = {
          role: me.profile.role,
          fullName: me.profile.full_name,
          email: me.profile.email,
        };
        localStorage.setItem("currentUser", JSON.stringify(hr));
        setCurrentHR(hr);
        return;
      }
      // Authenticated but not HR
      localStorage.removeItem("currentUser");
      window.location.href = "/";
      return;
    } catch (e) {
      console.error("Error loading HR (API):", e);
      if (e?.status === 401 || e?.status === 403) {
        localStorage.removeItem("currentUser");
        window.location.href = "/";
        return;
      }
    }

    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
      if (user.role === "hr") {
        setCurrentHR(user);
      }
    } catch (e) {
      console.error("Error loading HR:", e);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await hrApi.users();
      const loadedUsers = res?.users || [];
      localStorage.setItem("users", JSON.stringify(loadedUsers));
      setUsers(loadedUsers);
      return;
    } catch (err) {
      console.error("Error loading users (API):", err);
      if (err?.status === 401 || err?.status === 403) {
        localStorage.removeItem("currentUser");
        window.location.href = "/";
        return;
      }
    }

    try {
      const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
     
      // Add sample data if empty
      if (storedUsers.length === 0) {
        const sampleUsers = [
          // New Registrations (no status)
          { email: "sarah@intern.com", fullName: "Sarah Johnson", role: "intern", degree: "Data Science", registeredAt: new Date().toISOString() },
          { email: "mike@intern.com", fullName: "Mike Chen", role: "intern", degree: "Software Engineering", registeredAt: new Date().toISOString() },
         
          // Pending Approval
          {
            email: "john.doe@example.com",
            fullName: "John Doe",
            role: "intern",
            degree: "Computer Science",
            status: INTERN_STATUS.PENDING,
            registeredAt: new Date().toISOString(),
            movedToApprovalAt: new Date().toISOString()
          },
          {
            email: "jane.smith@example.com",
            fullName: "Jane Smith",
            role: "intern",
            degree: "Data Science",
            status: INTERN_STATUS.PENDING,
            registeredAt: new Date().toISOString(),
            movedToApprovalAt: new Date().toISOString()
          },

          // Active Interns
          {
            email: "alex@intern.com",
            fullName: "Alex Kumar",
            role: "intern",
            degree: "Computer Science",
            status: INTERN_STATUS.ACTIVE,
            internId: "INT001",
            password: "Test123@",
            pmCode: "PM001",
            approvedAt: new Date().toISOString(),
            approvedBy: "hr@company.com",
            lastLogTime: "2 hours ago"
          },

          // Project Managers
          { email: "pm1@company.com", fullName: "Test Project Manager", role: "pm", pmCode: "PM001", phone: "9876543210", location: "Mumbai" },
          { email: "pm2@company.com", fullName: "Khushi", role: "pm", pmCode: "PM002", phone: "8884445175", location: "Bangalore" },
        ];
        localStorage.setItem("users", JSON.stringify(sampleUsers));
        setUsers(sampleUsers);
      } else {
        setUsers(storedUsers);
      }
    } catch {
      setUsers([]);
    }
  };

  const loadAnnouncements = async () => {
    try {
      const res = await announcementsApi.list();
      const rows = res?.announcements || [];
      const mapped = rows.map((a) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        pinned: !!a.pinned,
        priority: a.priority || "medium",
        audienceRoles: a.audience_roles || [],
        date: a.created_at,
        createdBy: a.created_by,
      }));
      setAnnouncements(mapped);
    } catch (err) {
      console.error("Failed to load announcements:", err);
      if (err?.status === 401 || err?.status === 403) {
        localStorage.removeItem("currentUser");
        window.location.href = "/";
        return;
      }
      setAnnouncements([]);
    }
  };

  const loadNotifications = () => {
    const sampleNotifications = [
      { id: 1, title: "New Intern Registration", message: "Sarah Johnson has registered", time: "5 min ago", read: false, type: "info" },
      { id: 2, title: "Profile Completed", message: "Mike Chen completed profile setup", time: "1 hour ago", read: false, type: "success" },
      { id: 3, title: "Daily Log Submitted", message: "Alex Kumar submitted daily log", time: "2 hours ago", read: true, type: "info" },
      { id: 4, title: "Approval Pending", message: "John Doe awaiting final approval", time: "3 hours ago", read: false, type: "warning" },
      { id: 5, title: "Report Submitted", message: "Jane Smith submitted weekly report", time: "5 hours ago", read: true, type: "info" },
    ];
    setNotifications(sampleNotifications);
  };

  // Data Loading
  useEffect(() => {
    const initializeData = async () => {
      await loadCurrentHR();
      await loadUsers();
      await loadAnnouncements();
      loadNotifications();
    };
    initializeData();
  }, []);

  // Statistics
  const getStats = () => {
    const interns = users.filter(u => u.role === "intern");
    return {
      pending: interns.filter(u => u.status === INTERN_STATUS.PENDING).length,
      active: interns.filter(u => u.status === INTERN_STATUS.ACTIVE).length,
      total: interns.length,
      newRegistrations: interns.filter(u => !u.status && isRecent(u.registeredAt)).length,
      pms: users.filter(u => u.role === "pm").length,
      unreadMessages: notifications.filter(n => !n.read).length,
    };
  };

  const isRecent = (date) => {
    if (!date) return true;
    const now = new Date().getTime();
    const diff = now - new Date(date).getTime();
    return diff < 7 * 24 * 60 * 60 * 1000;
  };

  const stats = getStats();

  // Handlers
  const handleApprove = async (approval) => {
    try {
      if (approval?.applicationId) {
        const res = await hrApi.approveApplication(approval.applicationId, {
          internId: approval.internId,
          password: approval.password,
          email: approval.email,
        });
        await loadUsers();
        if (approval.showAlert !== false) {
          alert(`✅ ${approval.fullName || "Intern"} has been approved and activated!`);
        }
        return res;
      }

      const usersFromStorage = JSON.parse(localStorage.getItem("users") || "[]");

      const updatedUsers = usersFromStorage.map(u =>
        u.email === approval.email ? approval : u
      );

      localStorage.setItem("users", JSON.stringify(updatedUsers));
      setUsers(updatedUsers);

      alert(`✅ ${approval.fullName} has been approved and activated!`);

      console.log("✅ Intern approved:", approval.email);
    } catch (err) {
      console.error("❌ Approval error:", err);
      alert(err.message || "❌ Something went wrong during approval. Please try again.");
    }
  };

  const handleMoveToApproval = async (intern) => {
    if (intern?.applicationId) {
      try {
        await hrApi.setApplicationStatus(intern.applicationId, INTERN_STATUS.PENDING);
        await loadUsers();
        alert(`✅ ${intern.fullName} moved to Approval Center!`);
      } catch (err) {
        console.error("Move to approval failed:", err);
        alert(err.message || "❌ Failed to move intern to Approval Center.");
      }
      return;
    }

    const updatedUsers = users.map(u => {
      if (u.email === intern.email && u.role === "intern") {
        return {
          ...u,
          status: INTERN_STATUS.PENDING,
          movedToApprovalBy: currentHR?.email || "HR",
          movedToApprovalAt: new Date().toISOString(),
          meetingDate: intern.meetingDate,
          meetingTime: intern.meetingTime,
          meetingLink: intern.meetingLink,
          meetingScheduledAt: intern.meetingScheduledAt,
        };
      }
      return u;
    });

    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);

    alert(`✅ ${intern.fullName} moved to Approval Center!`);
  };

  const handleRejectIntern = async () => {
    if (selectedUser?.applicationId) {
      try {
        await hrApi.rejectApplication(selectedUser.applicationId, { reason: rejectReason });
        await loadUsers();
        setShowRejectModal(false);
        alert(`⚠️ ${selectedUser.fullName} has been rejected.`);
      } catch (err) {
        console.error("Reject failed:", err);
        alert(err.message || "❌ Failed to reject intern.");
      }
      return;
    }

    const updatedUsers = users.filter(
      u => !(u.email === selectedUser.email && u.role === "intern")
    );

    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setShowRejectModal(false);

    alert(`⚠️ ${selectedUser.fullName} has been rejected and removed.`);
  };

  const handleRejectClick = (intern) => {
    setSelectedUser(intern);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleChat = (user) => {
    setSelectedUser(user);
    setActiveSection("messages");
  };

  const handlePMChat = (pm) => {
    handleChat(pm);
  };

  const handleViewPMInterns = (pm) => {
    alert(`Viewing interns under ${pm.fullName}`);
    console.log("PM clicked:", pm);
  };

  const handleNavigateToMessages = (user) => {
    setSelectedUser(user);
    setActiveSection("messages");
  };

  const handleCreateAnnouncement = async (announcement) => {
    try {
      await hrApi.createAnnouncement({
        title: announcement.title,
        content: announcement.content,
        priority: announcement.priority || "medium",
        audienceRoles: announcement.audienceRoles,
        pinned: announcement.pinned,
      });
      await loadAnnouncements();
      setShowAnnouncementModal(false);
      alert("✅ Announcement created successfully!");
    } catch (err) {
      console.error("Create announcement failed:", err);
      alert(err.message || "❌ Failed to create announcement");
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      const announcement = announcements.find((a) => a.id === id);
      await hrApi.deleteAnnouncement(id);
      await loadAnnouncements();
      alert(`ℹ️ "${announcement?.title || "Announcement"}" has been deleted.`);
    } catch (err) {
      console.error("Delete announcement failed:", err);
      alert(err.message || "❌ Failed to delete announcement");
    }
  };

  const handlePinAnnouncement = async (id) => {
    try {
      const announcement = announcements.find((a) => a.id === id);
      const nextPinned = !announcement?.pinned;
      await hrApi.updateAnnouncement(id, { pinned: nextPinned });
      await loadAnnouncements();
      if (nextPinned) {
        alert(`ℹ️ "${announcement?.title}" has been pinned.`);
      } else {
        alert(`ℹ️ "${announcement?.title}" has been unpinned.`);
      }
    } catch (err) {
      console.error("Pin announcement failed:", err);
      alert(err.message || "❌ Failed to update announcement");
    }
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);
    alert("✅ All notifications marked as read");
  };

  const markNotificationAsRead = (id) => {
    const updatedNotifications = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
  };

  const filteredInterns = (status) => {
    return users
      .filter(u => {
        if (u.role !== "intern") return false;

        if (status === "new") return !u.status || u.status === "";
        if (status === "pending") return u.status === INTERN_STATUS.PENDING;
        if (status === "active") return u.status === INTERN_STATUS.ACTIVE && u.internId;

        return true;
      })
      .filter(u => {
        const matchSearch =
          u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchSearch;
      });
  };

  const allPMs = users.filter(u => u.role === "pm");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const iconButtonStyle = {
    width: 40,
    height: 40,
    borderRadius: 10,
    border: `1px solid ${COLORS.borderGlass}`,
    background: "transparent",
    color: COLORS.textSecondary,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: GRADIENTS.primary, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{keyframes}</style>

      {/* ✅ FIXED SIDEBAR - EXACT PM DASHBOARD MATCH */}
      <aside
        style={{
          width: sidebarOpen ? 280 : 0,
          minHeight: "100vh",
          background: `linear-gradient(180deg, ${COLORS.bgSecondary} 0%, ${COLORS.bgPrimary} 100%)`,
          backdropFilter: "blur(20px)",
          borderRight: `1px solid ${COLORS.borderGlass}`,
          transition: "width 0.3s ease",
          overflow: "hidden",
          position: "fixed",
          left: 0,
          top: 0,
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
          {/* Logo Section */}
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
                <button onClick={() => setSidebarOpen(false)} style={iconButtonStyle}>
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
                  {currentHR?.fullName?.charAt(0) || "H"}
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: 14 }}>
                    {currentHR?.fullName || "HR Manager"}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>HR Manager</div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav style={{ flex: 1, padding: "0 12px", overflowY: "auto", overflowX: "hidden" }}>
            {navItems(stats).map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
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
                  background: activeSection === item.id ? GRADIENTS.accent : "transparent",
                  color: activeSection === item.id ? "white" : COLORS.textSecondary,
                  fontWeight: activeSection === item.id ? 600 : 400,
                  fontSize: 14,
                  transition: "all 0.2s ease",
                  animation: `slideIn 0.4s ease ${idx * 0.05}s both`,
                }}
              >
                <item.icon size={20} />
                <span style={{ flex: 1, textAlign: "left" }}>{item.label}</span>
                {item.badge > 0 && (
                  <span style={{
                    background: activeSection === item.id ? "rgba(255,255,255,0.2)" : COLORS.orange,
                    color: "white",
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 99,
                  }}>
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
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

      {/* ✅ FIXED MAIN CONTENT AREA */}
      <main style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
        marginLeft: sidebarOpen && !isMobile ? 280 : 0,
        transition: "margin-left 0.3s ease",
        position: "relative",
        height: "100vh",
        overflow: "hidden",
      }}>

        {/* ✅ FIXED TOP BAR - EXACT PM DASHBOARD MATCH */}
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
              <button onClick={() => setSidebarOpen(true)} style={iconButtonStyle}>
                <Menu size={22} />
              </button>
            )}
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>
                {navItems(stats).find(n => n.id === activeSection)?.label || "Dashboard"}
              </h1>
              <p style={{ fontSize: 13, color: COLORS.textMuted, margin: 0 }}>
                Manage your intern workforce
              </p>
            </div>
          </div>

          {/* Notifications & User Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Notifications Dropdown */}
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                style={{
                  ...iconButtonStyle,
                  position: "relative",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -4,
                      background: COLORS.red,
                      color: "white",
                      borderRadius: "50%",
                      width: 20,
                      height: 20,
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `2px solid ${COLORS.bgPrimary}`,
                    }}
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown Panel */}
              {showNotifications && (
                <div
                  data-notification-dropdown
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 60,
                    width: 360,
                    maxHeight: 480,
                    overflowY: "auto",
                    borderRadius: 16,
                    padding: 16,
                    zIndex: 2000,
                    background: "rgba(15, 32, 36, 0.95)",
                    backdropFilter: "blur(16px)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
                    animation: "slideUp 0.3s ease",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <h3
                      style={{
                        color: COLORS.textPrimary,
                        fontSize: 16,
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      Notifications
                    </h3>
                    <button
                      onClick={markAllAsRead}
                      style={{
                        background: "none",
                        border: "none",
                        color: COLORS.jungleTeal,
                        fontSize: 12,
                        cursor: "pointer",
                        fontWeight: 600,
                      }}
                    >
                      Mark all read
                    </button>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {notifications.length === 0 ? (
                      <div style={{ textAlign: "center", padding: 20 }}>
                        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationAsRead(notif.id)}
                          style={{
                            padding: 12,
                            background: notif.read
                              ? "rgba(255,255,255,0.06)"
                              : "rgba(20, 160, 140, 0.25)",
                            borderRadius: 12,
                            cursor: "pointer",
                            border: `1px solid ${
                              notif.read ? COLORS.borderGlass : COLORS.jungleTeal
                            }`,
                            transition: "all 0.2s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = notif.read
                              ? "rgba(255,255,255,0.08)"
                              : `${COLORS.jungleTeal}25`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = notif.read
                              ? "rgba(255,255,255,0.06)"
                              : `${COLORS.jungleTeal}15`;
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "start",
                              marginBottom: 4,
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 600,
                                fontSize: 14,
                                color: COLORS.textPrimary,
                              }}
                            >
                              {notif.title}
                            </span>
                            {!notif.read && (
                              <div
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  background: COLORS.red,
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </div>
                          <p
                            style={{
                              fontSize: 13,
                              color: "rgba(255,255,255,0.85)",
                              margin: 0,
                              marginBottom: 4,
                            }}
                          >
                            {notif.message}
                          </p>
                          <span
                            style={{
                              fontSize: 11,
                              color: "rgba(255,255,255,0.6)",
                            }}
                          >
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
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                background: GRADIENTS.accent,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                color: "white",
                cursor: "pointer",
              }}
            >
              {currentHR?.fullName?.charAt(0) || "H"}
            </div>
          </div>
        </header>

        {/* ✅ FIXED PAGE CONTENT - SCROLLABLE */}
        <div style={{ 
          flex: 1, 
          padding: 24, 
          overflowY: "auto",
          overflowX: "hidden",
          background: COLORS.bgPrimary,
        }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            {activeSection === "dashboard" && (
              <DashboardSection
                stats={stats}
                currentHR={currentHR}
                getGreeting={getGreeting}
                announcements={announcements}
                onCreateAnnouncement={() => setShowAnnouncementModal(true)}
                onDeleteAnnouncement={handleDeleteAnnouncement}
                onPinAnnouncement={handlePinAnnouncement}
              />
            )}

            {activeSection === "approval" && (
              <ApprovalSection
                interns={filteredInterns("pending")}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onApprove={handleApprove}
                onReject={handleRejectClick}
                currentHR={currentHR}
              />
            )}

            {activeSection === "active" && (
              <ActiveInterns onNavigateToMessages={handleNavigateToMessages} users={users} />
            )}

            {activeSection === "new" && (
              <NewRegistrationsSection
                interns={filteredInterns("new")}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onApprove={handleMoveToApproval}
                onReject={handleRejectClick}
              />
            )}

            {activeSection === 'projectManagers' && (
              <PMSection
                pms={allPMs}
                users={users}
                onViewInterns={handleViewPMInterns}
                onChat={handlePMChat}
              />
            )}

            {activeSection === "messages" && (
              <MessagesPage selectedIntern={selectedUser} />
            )}

            {activeSection === "reports" && (
              <ReportsSection
                users={users}
                reportsTab={reportsTab}
                setReportsTab={setReportsTab}
                currentHR={currentHR}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showRejectModal && (
        <Modal onClose={() => setShowRejectModal(false)}>
          <RejectModal
            intern={selectedUser}
            rejectReason={rejectReason}
            setRejectReason={setRejectReason}
            onReject={handleRejectIntern}
            onClose={() => setShowRejectModal(false)}
          />
        </Modal>
      )}

      {showProfileModal && selectedUser && (
        <Modal onClose={() => setShowProfileModal(false)} wide>
          <ProfileModal
            user={selectedUser}
            profileTab={profileTab}
            setProfileTab={setProfileTab}
            allPMs={allPMs}
            onChat={() => { setShowProfileModal(false); handleChat(selectedUser); }}
          />
        </Modal>
      )}

      {showAnnouncementModal && (
        <Modal onClose={() => setShowAnnouncementModal(false)}>
          <AnnouncementModal
            onSave={handleCreateAnnouncement}
            onClose={() => setShowAnnouncementModal(false)}
          />
        </Modal>
      )}

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 999, backdropFilter: "blur(4px)",
          }}
        />
      )}
    </div>
  );
}
