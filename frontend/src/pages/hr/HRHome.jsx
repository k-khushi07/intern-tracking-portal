import React, { useState, useEffect } from "react";
import { Menu, Bell, LogOut, Sparkles, X } from "lucide-react";
import { COLORS, GRADIENTS, keyframes, navItems } from "./HRConstants.jsx";
import {
  DashboardSection,
  ApprovalSection,
  ActiveInternsSection,
  NewRegistrationsSection,
  PMSection,
  ReportsSection
} from "./HRSections";
import {
  Modal,
  ApprovalModal,
  RejectModal,
  ProfileModal,
  AnnouncementModal,
  ChatModal,
} from "./HRComponents";


export default function HRHome() {
  // State Management
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentHR, setCurrentHR] = useState(null);
  const [users, setUsers] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [notifications] = useState(3);
 
  // Modal States
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
 
  // Filter States
  const [pmCodeInput, setPmCodeInput] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [filterPM, setFilterPM] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [profileTab, setProfileTab] = useState("personal");
  const [reportsTab, setReportsTab] = useState("daily");


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


  // Data Loading Functions
  const loadCurrentHR = () => {
    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
      if (user.role === "hr") {
        setCurrentHR(user);
      }
    } catch (e) {
      console.error("Error loading HR:", e);
    }
  };


  const loadUsers = () => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
      setUsers(storedUsers);
    } catch {
      setUsers([]);
    }
  };


  const loadAnnouncements = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("announcements") || "[]");
      setAnnouncements(stored.length ? stored : [
        { id: 1, title: "Welcome to Q4", content: "New intern orientation begins next week.", pinned: true, date: new Date().toISOString() },
        { id: 2, title: "Policy Update", content: "Updated remote work guidelines are now in effect.", pinned: false, date: new Date().toISOString() },
      ]);
    } catch {
      setAnnouncements([]);
    }
  };


  // Data Loading - Fixed to prevent cascading renders
  useEffect(() => {
    const initializeData = async () => {
      loadCurrentHR();
      loadUsers();
      loadAnnouncements();
    };
    initializeData();
  }, []);


  // Statistics
  const getStats = () => {
    const interns = users.filter(u => u.role === "intern");
    return {
      pending: interns.filter(u => !u.status).length,
      active: interns.filter(u => u.status === "active").length,
      total: interns.length,
      newRegistrations: interns.filter(u => !u.status && isRecent(u.registeredAt)).length,
      pms: users.filter(u => u.role === "pm").length,
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
  const handleApproveClick = (intern) => {
    setSelectedUser(intern);
    setPmCodeInput("");
    setShowApprovalModal(true);
  };


  const handleApproveIntern = () => {
    if (!pmCodeInput) {
      alert("Please enter a PM Code");
      return;
    }
    const pmExists = users.find(u => u.role === "pm" && u.pmCode === pmCodeInput);
    if (!pmExists) {
      alert("Invalid PM Code");
      return;
    }
    const updatedUsers = users.map(u => {
      if (u.email === selectedUser.email && u.role === "intern") {
        return {
          ...u,
          pmCode: pmCodeInput,
          status: "pending_profile_completion",
          approvedBy: currentHR?.email,
          approvedAt: new Date().toISOString(),
        };
      }
      return u;
    });
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setShowApprovalModal(false);
  };


  const handleRejectClick = (intern) => {
    setSelectedUser(intern);
    setRejectReason("");
    setShowRejectModal(true);
  };


  const handleRejectIntern = () => {
    const updatedUsers = users.filter(u => !(u.email === selectedUser.email && u.role === "intern"));
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setShowRejectModal(false);
  };


  const handleToggleDisable = (email, role) => {
    const updatedUsers = users.map(u => {
      if (u.email === email && u.role === role) {
        return { ...u, disabled: !u.disabled };
      }
      return u;
    });
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };


  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setProfileTab("personal");
    setShowProfileModal(true);
  };


  const handleChat = (user) => {
    setSelectedUser(user);
    setShowChatModal(true);
  };


  const handleCreateAnnouncement = (announcement) => {
    const newAnnouncement = {
      ...announcement,
      id: Date.now(),
      date: new Date().toISOString(),
    };
    const updated = [newAnnouncement, ...announcements];
    localStorage.setItem("announcements", JSON.stringify(updated));
    setAnnouncements(updated);
    setShowAnnouncementModal(false);
  };


  const handleDeleteAnnouncement = (id) => {
    const updated = announcements.filter(a => a.id !== id);
    localStorage.setItem("announcements", JSON.stringify(updated));
    setAnnouncements(updated);
  };


  const handlePinAnnouncement = (id) => {
    const updated = announcements.map(a => a.id === id ? { ...a, pinned: !a.pinned } : a);
    localStorage.setItem("announcements", JSON.stringify(updated));
    setAnnouncements(updated);
  };


  const filteredInterns = (status) => {
    return users
      .filter(u => {
        if (u.role !== "intern") return false;
        if (status === "pending") return !u.status;
        if (status === "active") return u.status === "active";
        if (status === "new") return !u.status && isRecent(u.registeredAt);
        return true;
      })
      .filter(u => {
        const matchSearch = u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          u.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchPM = !filterPM || u.pmCode === filterPM;
        const matchStatus = !filterStatus || (filterStatus === "disabled" ? u.disabled : !u.disabled);
        return matchSearch && matchPM && matchStatus;
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
          background: COLORS.surfaceGlass,
          backdropFilter: "blur(20px)",
          borderRight: `1px solid ${COLORS.borderGlass}`,
          transition: "width 0.3s ease",
          overflow: "hidden",
          position: isMobile ? "fixed" : "relative",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
        }}
      >
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
        <nav style={{ flex: 1, padding: "0 12px", overflowY: "auto" }}>
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
          <div style={{
            background: COLORS.surfaceGlass, borderRadius: 12, padding: 12,
            marginBottom: 12, border: `1px solid ${COLORS.borderGlass}`,
          }}>
            <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 8 }}>SYSTEM STATUS</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.emeraldGlow }} />
              <span style={{ fontSize: 12, color: COLORS.textSecondary }}>All systems operational</span>
            </div>
          </div>
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
      </aside>


      {/* Main Content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top Bar */}
        <header style={{
          height: 72,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          background: COLORS.surfaceGlass,
          backdropFilter: "blur(20px)",
          borderBottom: `1px solid ${COLORS.borderGlass}`,
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
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button style={{ ...iconButtonStyle, position: "relative" }}>
              <Bell size={20} />
              {notifications > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  width: 18, height: 18, borderRadius: "50%",
                  background: COLORS.red, color: "white",
                  fontSize: 10, fontWeight: 700,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {notifications}
                </span>
              )}
            </button>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", background: GRADIENTS.accent,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 700, color: "white", cursor: "pointer",
            }}>
              {currentHR?.fullName?.charAt(0) || "H"}
            </div>
          </div>
        </header>


        {/* Page Content */}
        <div style={{ flex: 1, padding: 24, overflowY: "auto" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            {activeSection === "dashboard" && (
              <DashboardSection
                stats={stats}
                currentHR={currentHR}
                getGreeting={getGreeting}
                announcements={announcements}
                pendingInterns={filteredInterns("pending").slice(0, 5)}
                onApprove={handleApproveClick}
                onReject={handleRejectClick}
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
                onApprove={handleApproveClick}
                onReject={handleRejectClick}
              />
            )}


            {activeSection === "active" && (
              <ActiveInternsSection
                interns={filteredInterns("active")}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterPM={filterPM}
                setFilterPM={setFilterPM}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                allPMs={allPMs}
                onViewProfile={handleViewProfile}
                onToggleDisable={handleToggleDisable}
                onChat={handleChat}
              />
            )}


            {activeSection === "new" && (
              <NewRegistrationsSection
                interns={filteredInterns("new")}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onApprove={handleApproveClick}
                onReject={handleRejectClick}
              />
            )}


            {activeSection === "pms" && (
              <PMSection
                pms={allPMs}
                users={users}
                onViewProfile={handleViewProfile}
                onChat={handleChat}
              />
            )}


            {activeSection === "reports" && (
              <ReportsSection
                users={users}
                reportsTab={reportsTab}
                setReportsTab={setReportsTab}
              />
            )}
          </div>
        </div>
      </main>


      {/* Modals */}
      {showApprovalModal && (
        <Modal onClose={() => setShowApprovalModal(false)}>
          <ApprovalModal
            intern={selectedUser}
            pmCodeInput={pmCodeInput}
            setPmCodeInput={setPmCodeInput}
            allPMs={allPMs}
            onApprove={handleApproveIntern}
            onClose={() => setShowApprovalModal(false)}
          />
        </Modal>
      )}


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


      {showChatModal && selectedUser && (
        <Modal onClose={() => setShowChatModal(false)} wide>
          <ChatModal user={selectedUser} currentUser={currentHR} />
        </Modal>
      )}


      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
            zIndex: 99, backdropFilter: "blur(4px)",
          }}
        />
      )}
    </div>
  );
}
