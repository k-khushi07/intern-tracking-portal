// HRHome.jsx - FIXED with PM Dashboard colors
import React, { useState, useEffect, useCallback } from "react";
import { Menu, Bell, LogOut, Sparkles, X, Send, FileText } from "lucide-react";
import { COLORS, GRADIENTS, keyframes, navItems, INTERN_STATUS } from "./HRConstants";
import {
  DashboardSection,
  ApprovalSection,
  NewRegistrationsSection,
  PMSection,
  ReportsSection,
  ActiveInterns,
  ProjectSubmissionsSection
} from "./HRSections";
import DocumentsSection from "./DocumentsSection";
import {
  Modal,
  RejectModal,
  buildRejectionEmailHtml,
  ProfileModal,
  AnnouncementModal,
} from "./HRComponents";

import MessagesPage from './MessagesPage';
import { authApi, hrApi, announcementsApi, notificationsApi } from "../../lib/apiClient";
import { getRealtimeSocket } from "../../lib/realtime";

export default function HRHome() {
  // State Management
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentHR, setCurrentHR] = useState(null);
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [apiStats, setApiStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [uiNotice, setUiNotice] = useState({ open: false, message: "", tone: "info" });

  const unreadCount = notifications.filter(n => !n.read).length;

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

  const resolveNameFromUsers = useCallback(
    ({ profileId, email }) => {
      const id = profileId ? String(profileId) : "";
      const mail = email ? String(email).trim().toLowerCase() : "";
      const match = (users || []).find(
        (u) => (id && String(u.id) === id) || (mail && String(u.email || "").trim().toLowerCase() === mail)
      );
      return match?.fullName || match?.name || match?.full_name || match?.email || "";
    },
    [users]
  );

  const parseWeekNumberFromText = (text) => {
    const match = String(text || "").match(/\\bweek\\s+(\\d+)\\b/i);
    return match?.[1] ? Number(match[1]) : null;
  };

  const parseIsoDateFromText = (text) => {
    const match = String(text || "").match(/\\b(\\d{4}-\\d{2}-\\d{2})\\b/);
    return match?.[1] || "";
  };

  const resolveActorName = useCallback(
    ({ title, rawTitle, message, metadata }) => {
      const labeled =
        metadata?.internName ||
        metadata?.internFullName ||
        metadata?.applicantName ||
        metadata?.senderName ||
        metadata?.actorName ||
        null;
      if (labeled) return String(labeled).trim();

      const senderProfileId = metadata?.senderProfileId || metadata?.sender_profile_id || null;
      if (senderProfileId) {
        const fromUsers = resolveNameFromUsers({ profileId: senderProfileId });
        if (fromUsers) return fromUsers;
      }

      const internId = metadata?.internId || metadata?.intern_id || null;
      if (internId) {
        const fromUsers = resolveNameFromUsers({ profileId: internId });
        if (fromUsers) return fromUsers;
        return "An intern";
      }

      const applicantEmail = metadata?.applicantEmail || metadata?.applicant_email || null;
      if (applicantEmail) {
        const fromUsers = resolveNameFromUsers({ email: applicantEmail });
        if (fromUsers) return fromUsers;
        return String(applicantEmail).trim();
      }

      if (String(title || "") === "New message") {
        const prefix = "New message from ";
        const raw = String(rawTitle || "");
        if (raw.startsWith(prefix)) return raw.slice(prefix.length).trim() || "Someone";
      }

      const msg = String(message || "").trim();
      const bySubmitted = msg.match(/^(.+?)\\s+submitted\\b/i)?.[1];
      if (bySubmitted) return bySubmitted.trim();
      const byCompleted = msg.match(/^(.+?)\\s+completed\\b/i)?.[1];
      if (byCompleted) return byCompleted.trim();
      const byRegistered = msg.match(/^(.+?)\\s+(has registered|registered)\\b/i)?.[1];
      if (byRegistered) return byRegistered.trim();

      return "Someone";
    },
    [resolveNameFromUsers]
  );

  const buildNotificationDetail = useCallback(
    ({ title, rawTitle, message, metadata }) => {
      const actor = resolveActorName({ title, rawTitle, message, metadata });

      switch (String(title || "")) {
        case "New intern registration":
          return `${actor} submitted a new registration.`;
        case "New report submitted": {
          const week = metadata?.weekNumber || metadata?.week_number || parseWeekNumberFromText(message);
          if (Number.isFinite(Number(week)) && Number(week) > 0) {
            return `${actor} submitted a Week ${Number(week)} report.`;
          }
          return message || `${actor} submitted a report.`;
        }
        case "Daily log submitted": {
          const date = metadata?.logDate || metadata?.log_date || parseIsoDateFromText(message);
          if (date) return `${actor} submitted a daily log for ${date}.`;
          return message || `${actor} submitted a daily log.`;
        }
        case "New message":
          return `${actor} sent you a message.`;
        case "Profile completed":
          return `${actor} completed their profile.`;
        case "Approval pending":
          return `${actor}'s application is awaiting approval.`;
        default:
          return message || "";
      }
    },
    [resolveActorName]
  );

  const mapApiNotification = useCallback(
    (n) => {
      const rawTitle = n?.title || "";
      const normalizedTitle = rawTitle.startsWith("New message") ? "New message" : rawTitle;
      const createdAt = n?.createdAt || n?.created_at || null;

      return {
        id: n.id,
        title: normalizedTitle,
        rawTitle,
        rawMessage: n.message || n.content || "",
        metadata: n.metadata || {},
        time: formatTimeAgo(createdAt) || "Just now",
        read: !!(n.read || n.is_read || n.readAt || n.read_at),
        type: n.type || "info",
        link: n.link || null,
        category: n.category || null,
        createdAt,
      };
    },
    [formatTimeAgo]
  );

  // Modal States
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
 
  // Filter States
  const [rejectReason, setRejectReason] = useState("");
  const [rejectEmailSubject, setRejectEmailSubject] = useState("Internship Application - Update");
  const [rejectEmailMessage, setRejectEmailMessage] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);
  const [profileTab, setProfileTab] = useState("personal");
  const [reportsTab, setReportsTab] = useState("review");
  const [activeInternsPmFilter, setActiveInternsPmFilter] = useState(null);

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
      loadDashboardMetrics();
    };

    const onNotification = (payload) => {
      const row = payload?.notification;
      if (!row) return;
      const mapped = mapApiNotification(row);
      setNotifications((prev) => {
        const next = [mapped, ...(prev || []).filter((p) => String(p.id) !== String(mapped.id))];
        return next.slice(0, 60);
      });
    };

    socket.on("itp:changed", onChanged);
    socket.on("itp:notification", onNotification);

    return () => {
      socket.off("itp:changed", onChanged);
      socket.off("itp:notification", onNotification);
    };
  }, [mapApiNotification]);

  useEffect(() => {
    if (!uiNotice.open) return undefined;
    const timer = window.setTimeout(() => {
      setUiNotice((prev) => ({ ...prev, open: false }));
    }, 3200);
    return () => window.clearTimeout(timer);
  }, [uiNotice.open]);

  const showNotice = (message, tone = "info") => {
    setUiNotice({ open: true, message, tone });
  };

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
      throw new Error("Forbidden");
    } catch (e) {
      console.error("Error loading HR (API):", e);
      localStorage.removeItem("currentUser");
      window.location.href = "/hr/login";
    }
  };

  const loadUsers = async () => {
    try {
      const res = await hrApi.users();
      const loadedUsers = res?.users || [];
      setUsers(loadedUsers);
    } catch (err) {
      console.error("Error loading users (API):", err);
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
      setAnnouncements([]);
    }
  };

  const loadDashboardMetrics = async () => {
    try {
      const [statsRes, analyticsRes] = await Promise.all([hrApi.stats(), hrApi.analytics()]);
      setApiStats(statsRes?.stats || null);
      setAnalytics(analyticsRes || null);
    } catch (err) {
      console.error("Failed to load HR analytics/stats:", err);
      setApiStats(null);
      setAnalytics(null);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await notificationsApi.list({ limit: 60 });
      const rows = res?.notifications || [];
      setNotifications(rows.map(mapApiNotification));
    } catch {
      setNotifications([]);
    }
  };

  // Data Loading
  useEffect(() => {
    const initializeData = async () => {
      await loadCurrentHR();
      await loadUsers();
      await loadAnnouncements();
      await loadDashboardMetrics();
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

  const fallbackStats = getStats();
  const stats = { ...(apiStats || {}), ...fallbackStats };
  const menuItems = [
    ...navItems(stats),
    { id: "project-submissions", label: "Project Submissions", icon: Send },
    { id: "documents", label: "Documents", icon: FileText },
  ];

  // Handlers
  const handleApprove = async (approval) => {
    try {
      if (!approval?.applicationId) {
        throw new Error("Application ID is required for approval.");
      }
      const res = await hrApi.approveApplication(approval.applicationId, {
        startDate: approval.startDate,
        endDate: approval.endDate,
        department: approval.department,
        mentorName: approval.mentorName,
        stipend: approval.stipend,
        password: approval.password,
        sendEmail: approval.sendEmail !== false,
        pmCode: approval.pmCode || undefined,
        cc: approval.cc || undefined,
        bcc: approval.bcc || undefined,
        offerLetterAttachment: approval.offerLetterAttachment || undefined,
      });
      await loadUsers();
      await loadDashboardMetrics();
      if (approval.showAlert !== false) {
        showNotice(`${approval.fullName || "Intern"} has been approved and activated.`, "success");
      }
      return res;
    } catch (err) {
      console.error("Approval error:", err);
      showNotice(err.message || "Something went wrong during approval. Please try again.", "error");
    }
  };

  const handleMoveToApproval = async (intern) => {
    if (!intern?.applicationId) {
      showNotice("Application ID missing for this intern.", "error");
      return;
    }
    try {
      await hrApi.setApplicationStatus(intern.applicationId, INTERN_STATUS.PENDING);
      await loadUsers();
      await loadDashboardMetrics();
      showNotice(`${intern.fullName} moved to Approval Center.`, "success");
    } catch (err) {
      console.error("Move to approval failed:", err);
      showNotice(err.message || "Failed to move intern to Approval Center.", "error");
    }
  };

  const handleBulkMoveToApproval = async (selectedInterns = []) => {
    const rows = Array.isArray(selectedInterns) ? selectedInterns : [];
    if (!rows.length) return { total: 0, success: 0, failed: [] };

    const applicationIds = rows.map((item) => item?.applicationId).filter(Boolean);
    const failed = [];
    if (applicationIds.length !== rows.length) {
      throw new Error("Some selected rows are missing application IDs.");
    }

    try {
      const result = await hrApi.bulkApplicationStatus({
        applicationIds,
        action: "pending",
      });
      const failedRows = (result?.results || []).filter((row) => !row.success);
      failed.push(...failedRows);

      await loadUsers();
      await loadDashboardMetrics();
      return {
        total: rows.length,
        success: Math.max(0, rows.length - failed.length),
        failed,
      };
    } catch (err) {
      console.error("Bulk move to approval failed:", err);
      throw err;
    }
  };

  const handleBulkRejectInterns = async (selectedInterns = [], reason = "") => {
    const rows = Array.isArray(selectedInterns) ? selectedInterns : [];
    if (!rows.length) return { total: 0, success: 0, failed: [] };
    const rejectionReason = String(reason || "").trim();
    if (!rejectionReason) {
      throw new Error("Rejection reason is required.");
    }

    const applicationIds = rows.map((item) => item?.applicationId).filter(Boolean);
    const failed = [];
    if (applicationIds.length !== rows.length) {
      throw new Error("Some selected rows are missing application IDs.");
    }

    try {
      const result = await hrApi.bulkApplicationStatus({
        applicationIds,
        action: "reject",
        rejectionReason,
      });
      const failedRows = (result?.results || []).filter((row) => !row.success);
      failed.push(...failedRows);

      await loadUsers();
      await loadDashboardMetrics();
      return {
        total: rows.length,
        success: Math.max(0, rows.length - failed.length),
        failed,
      };
    } catch (err) {
      console.error("Bulk reject failed:", err);
      throw err;
    }
  };

  const handleRejectIntern = async () => {
    if (!selectedUser?.applicationId) {
      showNotice("Application ID missing for selected intern.", "error");
      return;
    }
    try {
      setRejectSubmitting(true);
      await hrApi.rejectApplication(selectedUser.applicationId, {
        reason: rejectReason,
        sendEmail: true,
        subject: rejectEmailSubject,
        html: buildRejectionEmailHtml({
          name: selectedUser.fullName || selectedUser.name || "Candidate",
          message: rejectEmailMessage,
          reason: rejectReason,
        }),
      });
      await loadUsers();
      await loadDashboardMetrics();
      setShowRejectModal(false);
      showNotice(`${selectedUser.fullName} has been rejected.`, "success");
    } catch (err) {
      console.error("Reject failed:", err);
      showNotice(err.message || "Failed to reject intern.", "error");
    } finally {
      setRejectSubmitting(false);
    }
  };

  const handleRejectClick = (intern) => {
    setSelectedUser(intern);
    setRejectReason("");
    setRejectEmailSubject("Internship Application - Update");
    setRejectEmailMessage(
      "Thank you for taking the time to apply for the internship program at InternHub.\n\nAfter careful review, we’re unable to move forward with your application at this time.\n\nWe encourage you to apply again in the future and wish you the very best."
    );
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
    const pmCode = pm?.pmCode || pm?.pm_code;
    const pmName = pm?.fullName || pm?.name || pm?.full_name || pm?.email || pmCode;

    if (!pmCode) {
      showNotice("PM code missing for selected project manager.", "error");
      return;
    }

    setActiveInternsPmFilter({ code: pmCode, name: pmName });
    setActiveSection("active");
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
      showNotice("Announcement created successfully.", "success");
    } catch (err) {
      console.error("Create announcement failed:", err);
      showNotice(err.message || "Failed to create announcement", "error");
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    try {
      const announcement = announcements.find((a) => a.id === id);
      await hrApi.deleteAnnouncement(id);
      await loadAnnouncements();
      showNotice(`"${announcement?.title || "Announcement"}" has been deleted.`, "success");
    } catch (err) {
      console.error("Delete announcement failed:", err);
      showNotice(err.message || "Failed to delete announcement", "error");
    }
  };

  const handlePinAnnouncement = async (id) => {
    try {
      const announcement = announcements.find((a) => a.id === id);
      const nextPinned = !announcement?.pinned;
      await hrApi.updateAnnouncement(id, { pinned: nextPinned });
      await loadAnnouncements();
      if (nextPinned) {
        showNotice(`"${announcement?.title}" has been pinned.`, "success");
      } else {
        showNotice(`"${announcement?.title}" has been unpinned.`, "success");
      }
    } catch (err) {
      console.error("Pin announcement failed:", err);
      showNotice(err.message || "Failed to update announcement", "error");
    }
  };

  const refreshHrData = async () => {
    await Promise.all([loadUsers(), loadAnnouncements(), loadDashboardMetrics()]);
  };

  const markAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);
    notificationsApi.markAllRead().catch(() => {});
    showNotice("All notifications marked as read.", "success");
  };

  const markNotificationAsRead = (id) => {
    const updatedNotifications = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    notificationsApi.markRead(id).catch(() => {});
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

      {/* Sidebar */}
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
            {menuItems.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveSection(item.id);
                  setActiveInternsPmFilter(null);
                }}
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
                window.location.href = "/hr/login";
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

      {/* Main content area */}
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

        {/* Top bar */}
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
                {menuItems.find(n => n.id === activeSection)?.label || "Dashboard"}
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
                <div style={{
                  position: "absolute", top: "56px", right: 0,
                  width: "360px", maxHeight: "480px",
                  background: GRADIENTS.primary,
                  borderRadius: 20, padding: 0,
                  border: `1px solid ${COLORS.borderGlass}`,
                  boxShadow: "0 12px 40px rgba(0, 0, 0, 0.5)",
                  overflow: "hidden", zIndex: 2000,
                  animation: "fadeIn 0.2s ease",
                }} data-notification-dropdown>
                  <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLORS.borderGlass}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ fontSize: 16, fontWeight: 600, color: COLORS.textPrimary, margin: 0 }}>
                      Notifications
                    </h3>
                    <button
                      onClick={markAllAsRead}
                      disabled={unreadCount === 0}
                      style={{
                        background: "none", border: "none",
                        color: COLORS.jungleTeal, fontSize: 12,
                        cursor: unreadCount === 0 ? "default" : "pointer",
                        fontWeight: 600,
                        padding: "4px 8px", borderRadius: 6,
                        opacity: unreadCount === 0 ? 0.55 : 1,
                      }}
                    >
                      Mark all read
                    </button>
                  </div>
                  <div style={{ maxHeight: "400px", overflowY: "auto", padding: "8px" }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: "40px 20px", textAlign: "center" }}>
                        <Bell size={40} color={COLORS.textMuted} style={{ marginBottom: 12 }} />
                        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>No notifications</p>
                      </div>
                    ) : (
                      notifications.map((notif) => {
                        const detail = buildNotificationDetail({
                          title: notif.title,
                          rawTitle: notif.rawTitle,
                          message: notif.rawMessage,
                          metadata: notif.metadata,
                        });
                        const timeLabel = formatTimeAgo(notif.createdAt) || "Just now";

                        return (
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
                              {detail}
                            </p>
                            <span style={{ fontSize: 11, color: COLORS.textMuted }}>
                              {timeLabel}
                            </span>
                          </div>
                        );
                      })
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

        {/* Page content */}
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
                analytics={analytics}
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
                onDataChanged={refreshHrData}
                pms={allPMs}
              />
            )}

            {activeSection === "active" && (
              <ActiveInterns
                onNavigateToMessages={handleNavigateToMessages}
                users={users}
                initialPmCode={activeInternsPmFilter?.code || ""}
                initialPmName={activeInternsPmFilter?.name || ""}
                onClearPmFilter={() => setActiveInternsPmFilter(null)}
              />
            )}

            {activeSection === "new" && (
              <NewRegistrationsSection
                interns={filteredInterns("new")}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onApprove={handleMoveToApproval}
                onReject={handleRejectClick}
                onBulkMoveToApproval={handleBulkMoveToApproval}
                onBulkReject={handleBulkRejectInterns}
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

            {activeSection === "project-submissions" && (
              <ProjectSubmissionsSection isMobile={isMobile} />
            )}

            {activeSection === "documents" && <DocumentsSection />}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showRejectModal && (
        <Modal onClose={() => (!rejectSubmitting ? setShowRejectModal(false) : null)}>
          <RejectModal
            intern={selectedUser}
            rejectReason={rejectReason}
            setRejectReason={setRejectReason}
            emailSubject={rejectEmailSubject}
            setEmailSubject={setRejectEmailSubject}
            emailMessage={rejectEmailMessage}
            setEmailMessage={setRejectEmailMessage}
            isSubmitting={rejectSubmitting}
            onReject={handleRejectIntern}
            onClose={() => (!rejectSubmitting ? setShowRejectModal(false) : null)}
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

      {uiNotice.open && (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 20,
            zIndex: 3200,
            minWidth: 260,
            maxWidth: 420,
            padding: "12px 14px",
            borderRadius: 12,
            color: "white",
            border: `1px solid ${
              uiNotice.tone === "success"
                ? "rgba(16, 185, 129, 0.45)"
                : uiNotice.tone === "error"
                  ? "rgba(239, 68, 68, 0.45)"
                  : "rgba(20, 184, 166, 0.45)"
            }`,
            background:
              uiNotice.tone === "success"
                ? "rgba(16, 185, 129, 0.2)"
                : uiNotice.tone === "error"
                  ? "rgba(239, 68, 68, 0.2)"
                  : "rgba(20, 184, 166, 0.2)",
            backdropFilter: "blur(8px)",
            boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
          }}
        >
          {uiNotice.message}
        </div>
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




