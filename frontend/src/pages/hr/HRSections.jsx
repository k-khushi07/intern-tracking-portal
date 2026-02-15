// HRSections.jsx - My code
import React, { useState, useEffect } from "react";
import { EmailTemplateManager, processTemplateVariables } from "./EmailTemplateManager";
import { Edit, Trash2, Pin, Calendar } from "lucide-react";
import {
  Clock, UserCheck, Users, Briefcase, CheckCircle2, FileText,
  Megaphone, Plus, Download, Send, Check, X, Mail, UserPlus, RefreshCw, Copy, Key, Lock, User,
  Search, Eye, Phone, TrendingUp, MessageCircle
} from "lucide-react";
import { COLORS, GRADIENTS, keyframes, glassCardStyle, smallButtonStyle,
  emailInputStyle, emailPrimaryButtonStyle } from "./HRConstants";
  
import {
  StatMini, PendingCard, ActiveInternCard,
  AnnouncementCard, EmptyState, SearchBar, DailyLogsReport,
  SummaryReport, TNAReport, AttendanceReport, PMPerformanceReport
} from "./HRComponents";

import ReviewLogsPage from "./ReviewLogsPage";
import ActiveInternsPage from "./ActiveInterns/ActiveInternsPage.jsx";

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: `1px solid ${COLORS.borderGlass}`,
  background: COLORS.surfaceGlass,
  color: COLORS.textPrimary,
  outline: "none",
  fontSize: 14,
};

const primaryButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "12px 20px",
  borderRadius: 12,
  border: "none",
  color: "white",
  fontWeight: 600,
  fontSize: 14,
};

const secondaryButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "12px 20px",
  borderRadius: 12,
  border: `1px solid ${COLORS.borderGlass}`,
  background: "transparent",
  color: COLORS.textSecondary,
  fontWeight: 500,
  fontSize: 14,
};

const validateMultipleEmails = (emails) => {
  return emails
    .split(",")
    .map(e => e.trim())
    .every(email =>
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );
};

const INTERN_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  DISABLED: "disabled",
};

// ==================== DASHBOARD SECTION ====================
// ==================== DASHBOARD SECTION (PM Style) ====================
export function DashboardSection({ stats, currentHR, getGreeting, announcements = [], onCreateAnnouncement, onDeleteAnnouncement, onPinAnnouncement }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [newAnnouncement, setNewAnnouncement] = useState({ 
    title: "", 
    content: "", 
    priority: "medium" 
  });

  const handleAddAnnouncement = () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      alert("Please fill in all fields");
      return;
    }
    
    if (editingAnnouncement) {
      const updatedAnnouncement = {
        ...editingAnnouncement,
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        priority: newAnnouncement.priority,
        date: new Date().toISOString()
      };
      
      const updated = announcements.map(a => 
        a.id === editingAnnouncement.id ? updatedAnnouncement : a
      );
      
      localStorage.setItem("announcements", JSON.stringify(updated));
      alert("✅ Announcement updated successfully!");
      setEditingAnnouncement(null);
    } else {
      const announcement = { 
        id: Date.now(), 
        title: newAnnouncement.title,
        content: newAnnouncement.content,
        priority: newAnnouncement.priority,
        date: new Date().toISOString(),
        pinned: false
      };
      
      onCreateAnnouncement(announcement);
    }
    
    setNewAnnouncement({ title: "", content: "", priority: "medium" });
    setShowAddModal(false);
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setNewAnnouncement({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority || "medium"
    });
    setShowAddModal(true);
  };

  const handlePinAnnouncement = (id) => {
    onPinAnnouncement(id);
  };

  const handleDeleteAnnouncement = (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    onDeleteAnnouncement(id);
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <style>{keyframes}</style>

      {/* Welcome Banner - PM Style */}
      <div style={{
        ...glassCardStyle,
        background: GRADIENTS.accent,
        border: "none",
        animation: "slideUp 0.5s ease",
        marginBottom: 24,
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255, 255, 255, 0.12)", padding: "8px 16px", borderRadius: 30, marginBottom: 12, border: "1px solid rgba(255, 255, 255, 0.2)" }}>
              <CheckCircle2 size={16} color="white" />
              <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>
                {getGreeting()}!
              </span>
            </div>
            
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "white", fontFamily: "'Inter', system-ui, sans-serif" }}>
              Welcome back, {currentHR?.fullName?.split(" ")[0] || "HR"}!
            </h2>
            <p style={{ color: "rgba(255,255,255,0.8)", marginTop: 8, fontSize: 15 }}>
              You're managing {stats?.total || 0} intern{(stats?.total || 0) !== 1 ? "s" : ""}. Keep the workforce running smoothly!
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid - PM Style */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard icon={<Clock size={24} />} label="Pending Approvals" value={stats?.pending || 0} color={COLORS.orange} delay={0} />
        <StatCard icon={<UserCheck size={24} />} label="Active Interns" value={stats?.active || 0} color={COLORS.emeraldGlow} delay={0.1} />
        <StatCard icon={<Users size={24} />} label="Total Interns" value={stats?.total || 0} color={COLORS.purple} delay={0.2} />
        <StatCard icon={<Briefcase size={24} />} label="Project Managers" value={stats?.pms || 0} color={COLORS.jungleTeal} delay={0.3} />
      </div>

      {/* Announcements - PM Style */}
      <div style={{ ...glassCardStyle, animation: "slideUp 0.5s ease 0.3s both" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center", gap: 10, margin: 0, fontFamily: "'Inter', system-ui, sans-serif" }}>
            <Megaphone size={20} color={COLORS.jungleTeal} /> Announcements
          </h3>
          <button 
            onClick={() => {
              setEditingAnnouncement(null);
              setNewAnnouncement({ title: "", content: "", priority: "medium" });
              setShowAddModal(true);
            }} 
            style={{ 
              padding: "10px 20px", 
              background: GRADIENTS.accent,
              color: "white", 
              border: "none", 
              borderRadius: 12, 
              fontSize: 14, 
              fontWeight: 600, 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              gap: 8, 
              transition: "all 0.2s",
              fontFamily: "'Inter', system-ui, sans-serif"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(20, 184, 166, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            <Plus size={18} />New
          </button>
        </div>
        
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxHeight: 600, overflowY: "auto" }}>
          {announcements.length > 0 ? (
            announcements.map((ann) => (
              <AnnouncementCardPM
                key={ann.id} 
                announcement={ann} 
                onDelete={() => handleDeleteAnnouncement(ann.id)}
                onEdit={() => handleEditAnnouncement(ann)}
                onPin={() => handlePinAnnouncement(ann.id)}
              />
            ))
          ) : (
            <div style={{ textAlign: "center", padding: 60, color: COLORS.textMuted }}>
              <Megaphone size={48} color={COLORS.jungleTeal} style={{ marginBottom: 16, opacity: 0.5 }} />
              <h4 style={{ color: COLORS.textPrimary, fontSize: 18, marginBottom: 8, fontFamily: "'Inter', system-ui, sans-serif" }}>No announcements yet</h4>
              <p style={{ fontSize: 14, marginTop: 8 }}>Click "New" to create your first announcement</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Announcement Modal - PM Style */}
      {showAddModal && (
        <div 
          onClick={() => {
            setShowAddModal(false);
            setEditingAnnouncement(null);
          }}
          style={{ 
            position: "fixed", inset: 0, 
            background: "rgba(0,0,0,0.7)", 
            backdropFilter: "blur(8px)", 
            display: "flex", alignItems: "center", 
            justifyContent: "center", zIndex: 2000, padding: 20 
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{ 
              width: "100%", 
              maxWidth: 500, 
              borderRadius: 20,
              background: GRADIENTS.primary,
              border: `1px solid ${COLORS.borderGlass}`,
              padding: 28
            }}
          >
            <div style={{ paddingBottom: 24, borderBottom: `1px solid ${COLORS.borderGlass}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ color: COLORS.textPrimary, margin: 0, fontSize: 22, fontWeight: 700, fontFamily: "'Inter', system-ui, sans-serif" }}>
                {editingAnnouncement ? "Edit Announcement" : "New Announcement"}
              </h2>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingAnnouncement(null);
                }} 
                style={{ background: COLORS.surfaceGlass, border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: COLORS.textPrimary }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ paddingTop: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", color: COLORS.textPrimary, marginBottom: 8, fontWeight: 500, fontSize: 14, fontFamily: "'Inter', system-ui, sans-serif" }}>Title *</label>
                <input 
                  type="text" 
                  value={newAnnouncement.title} 
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} 
                  placeholder="e.g., Team Meeting Tomorrow" 
                  style={{ 
                    width: "100%", 
                    padding: "12px 16px", 
                    borderRadius: 12, 
                    border: `1px solid ${COLORS.borderGlass}`, 
                    background: COLORS.surfaceGlass, 
                    color: COLORS.textPrimary, 
                    fontSize: 14, 
                    outline: "none",
                    fontFamily: "'Inter', system-ui, sans-serif"
                  }} 
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", color: COLORS.textPrimary, marginBottom: 8, fontWeight: 500, fontSize: 14, fontFamily: "'Inter', system-ui, sans-serif" }}>Message *</label>
                <textarea 
                  value={newAnnouncement.content} 
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })} 
                  placeholder="Write your message..." 
                  rows={4} 
                  style={{ 
                    width: "100%", 
                    padding: "12px 16px", 
                    borderRadius: 12, 
                    border: `1px solid ${COLORS.borderGlass}`, 
                    background: COLORS.surfaceGlass, 
                    color: COLORS.textPrimary, 
                    fontSize: 14, 
                    outline: "none", 
                    resize: "vertical", 
                    fontFamily: "'Inter', system-ui, sans-serif"
                  }} 
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", color: COLORS.textPrimary, marginBottom: 8, fontWeight: 500, fontSize: 14, fontFamily: "'Inter', system-ui, sans-serif" }}>Priority</label>
                <div style={{ display: "flex", gap: 12 }}>
                  {["high", "medium", "low"].map(priority => (
                    <button 
                      key={priority} 
                      onClick={() => setNewAnnouncement({ ...newAnnouncement, priority })} 
                      style={{ 
                        flex: 1, 
                        padding: "10px 16px", 
                        borderRadius: 10, 
                        border: `2px solid ${newAnnouncement.priority === priority ? (priority === "high" ? COLORS.red : priority === "medium" ? COLORS.orange : COLORS.jungleTeal) : COLORS.borderGlass}`, 
                        background: newAnnouncement.priority === priority ? `${priority === "high" ? COLORS.red : priority === "medium" ? COLORS.orange : COLORS.jungleTeal}20` : "transparent", 
                        color: COLORS.textPrimary, 
                        cursor: "pointer", 
                        fontSize: 13, 
                        fontWeight: 600, 
                        textTransform: "capitalize", 
                        transition: "all 0.2s",
                        fontFamily: "'Inter', system-ui, sans-serif"
                      }}
                    >
                      {priority}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button 
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingAnnouncement(null);
                  }} 
                  style={{ 
                    flex: 1, 
                    padding: "14px 20px", 
                    background: COLORS.surfaceGlass, 
                    color: COLORS.textSecondary, 
                    border: `1px solid ${COLORS.borderGlass}`, 
                    borderRadius: 12, 
                    fontWeight: 600, 
                    cursor: "pointer", 
                    fontSize: 14,
                    fontFamily: "'Inter', system-ui, sans-serif"
                  }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddAnnouncement} 
                  style={{ 
                    flex: 1, 
                    padding: "14px 20px", 
                    background: GRADIENTS.accent, 
                    color: "white", 
                    border: "none", 
                    borderRadius: 12, 
                    fontWeight: 600, 
                    cursor: "pointer", 
                    fontSize: 14,
                    fontFamily: "'Inter', system-ui, sans-serif"
                  }}
                >
                  {editingAnnouncement ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== STAT CARD (PM Style) ====================
function StatCard({ icon, label, value, color, delay }) {
  return (
    <div style={{
      ...glassCardStyle,
      display: "flex",
      alignItems: "center",
      gap: 16,
      animation: `slideUp 0.5s ease ${delay}s both`,
    }}>
      <div style={{
        width: 52, 
        height: 52, 
        borderRadius: 14,
        background: `${color}20`,
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        color: color,
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.textPrimary, fontFamily: "'Inter', system-ui, sans-serif" }}>{value}</div>
        <div style={{ fontSize: 13, color: COLORS.textMuted }}>{label}</div>
      </div>
    </div>
  );
}

// ==================== ANNOUNCEMENT CARD (PM Style) ====================
function AnnouncementCardPM({ announcement, onDelete, onEdit, onPin }) {
  const priorityConfig = {
    high: { color: COLORS.red, bg: `${COLORS.red}15`, border: `${COLORS.red}30` },
    medium: { color: COLORS.orange, bg: `${COLORS.orange}15`, border: `${COLORS.orange}30` },
    low: { color: COLORS.jungleTeal, bg: `${COLORS.jungleTeal}15`, border: `${COLORS.jungleTeal}30` }
  };
  const config = priorityConfig[announcement.priority || "medium"] || priorityConfig.medium;
  
  return (
    <div style={{ 
      padding: 20, 
      borderRadius: 12, 
      background: announcement.pinned ? `${COLORS.deepOcean}15` : COLORS.surfaceGlass, 
      border: announcement.pinned ? `1px solid ${COLORS.deepOcean}` : `1px solid ${COLORS.borderGlass}`, 
      transition: "all 0.2s",
      position: "relative"
    }}>
      {announcement.pinned && (
        <div style={{ 
          position: "absolute", 
          top: 12, 
          right: 12, 
          background: `${COLORS.jungleTeal}20`, 
          padding: "4px 10px", 
          borderRadius: 20, 
          fontSize: 10, 
          fontWeight: 700, 
          color: COLORS.jungleTeal,
          display: "flex",
          alignItems: "center",
          gap: 4,
          border: `1px solid ${COLORS.jungleTeal}40`,
          fontFamily: "'Inter', system-ui, sans-serif"
        }}>
          <Pin size={10} />
          PINNED
        </div>
      )}
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 12, paddingRight: announcement.pinned ? 80 : 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: COLORS.textPrimary, marginBottom: 4, fontFamily: "'Inter', system-ui, sans-serif" }}>{announcement.title}</div>
          <span style={{ background: config.bg, color: config.color, padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", border: `1px solid ${config.border}`, fontFamily: "'Inter', system-ui, sans-serif" }}>
            {announcement.priority || "medium"}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onPin();
            }}
            style={{ 
              background: announcement.pinned ? `${COLORS.jungleTeal}25` : COLORS.surfaceGlass, 
              border: "none", 
              borderRadius: 8, 
              width: 32, 
              height: 32, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              cursor: "pointer", 
              color: COLORS.jungleTeal, 
              transition: "all 0.2s", 
              flexShrink: 0 
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = `${COLORS.jungleTeal}30`}
            onMouseLeave={(e) => e.currentTarget.style.background = announcement.pinned ? `${COLORS.jungleTeal}25` : COLORS.surfaceGlass}
            title={announcement.pinned ? "Unpin announcement" : "Pin announcement"}
          >
            <Pin size={14} style={{ transform: announcement.pinned ? "rotate(0deg)" : "rotate(45deg)", transition: "transform 0.2s" }} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            style={{ 
              background: COLORS.surfaceGlass, 
              border: "none", 
              borderRadius: 8, 
              width: 32, 
              height: 32, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              cursor: "pointer", 
              color: COLORS.jungleTeal, 
              transition: "all 0.2s", 
              flexShrink: 0 
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = `${COLORS.jungleTeal}25`}
            onMouseLeave={(e) => e.currentTarget.style.background = COLORS.surfaceGlass}
            title="Edit announcement"
          >
            <Edit size={14} />
          </button>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            style={{ 
              background: `${COLORS.red}15`, 
              border: "none", 
              borderRadius: 8, 
              width: 32, 
              height: 32, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              cursor: "pointer", 
              color: COLORS.red, 
              transition: "all 0.2s", 
              flexShrink: 0 
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = `${COLORS.red}25`}
            onMouseLeave={(e) => e.currentTarget.style.background = `${COLORS.red}15`}
            title="Delete announcement"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <p style={{ fontSize: 14, color: COLORS.textSecondary, marginBottom: 10, lineHeight: 1.6 }}>
        {announcement.content}
      </p>
      <div style={{ fontSize: 12, color: COLORS.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
        <Calendar size={12} />
        {new Date(announcement.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}
// ==================== APPROVAL SECTION ====================
export function ApprovalSection({ interns, searchTerm, setSearchTerm, onApprove, currentHR }) {
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [internId, setInternId] = useState("");
  const [password, setPassword] = useState("");
  const [pmCode, setPmCode] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [offerLetterPDF, setOfferLetterPDF] = useState(null);

  // Generate sequential Intern ID
  const generateInternId = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const existingInterns = users.filter(u => u.internId).map(u => u.internId);
   
    let maxNumber = 0;
    existingInterns.forEach(id => {
      const num = parseInt(id.replace("INT", ""));
      if (num > maxNumber) maxNumber = num;
    });
   
    const nextNumber = maxNumber + 1;
    return `INT${String(nextNumber).padStart(3, "0")}`;
  };

  // Generate 8-character password
  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#$";
    let password = "";
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // Get approval email template
  const getApprovalEmailTemplate = (intern, internId, password, pmCode) => {
    const portalLink = `${window.location.origin}/login`;
   
    return `Dear ${intern?.fullName || "[Name]"},

Congratulations! 🎉

We are pleased to inform you that you have been selected for our internship program at InternHub.

YOUR CREDENTIALS:
━━━━━━━━━━━━━━━━━━━━━━━━━
Intern ID: ${internId}
Password: ${password}
PM Code: ${pmCode}
━━━━━━━━━━━━━━━━━━━━━━━━━

NEXT STEPS:
1. Visit the InternHub Portal: ${portalLink}
2. Login with your Intern ID, Password, and PM Code
3. Complete your profile setup
4. Review the attached Offer Letter carefully
5. Your start date and further instructions will be shared soon

📎 Please find your formal Offer Letter attached to this email.

We are excited to have you on board!

If you have any questions, please feel free to reach out to us.

Best regards,
HR Team
InternHub`;
  };

  // ✅ NEW: Get rejection email template
  const getRejectionEmailTemplate = (intern) => {
    return `Dear ${intern?.fullName || "[Name]"},

Thank you for your interest in the internship program at InternHub and for taking the time to apply.

After careful consideration of all applications, we regret to inform you that we are unable to offer you a position in our current internship program.

This decision was difficult as we received many qualified applications. We encourage you to continue developing your skills and to apply for future opportunities with us.

We wish you the best of luck in your career endeavors.

Best regards,
HR Team
InternHub`;
  };

  // Handle intern selection
  const handleInternSelect = (intern) => {
    setSelectedIntern(intern);
    const newInternId = generateInternId();
    const newPassword = generatePassword();
    setInternId(newInternId);
    setPassword(newPassword);
    setPmCode("");
    setEmailContent(getApprovalEmailTemplate(intern, newInternId, newPassword, "[PM Code]"));
    setCc("");
    setBcc("");
  };

  // Regenerate password
  const handleRegeneratePassword = () => {
    const newPassword = generatePassword();
    setPassword(newPassword);
    setEmailContent(getApprovalEmailTemplate(selectedIntern, internId, newPassword, pmCode || "[PM Code]"));
  };

  // Update email template when PM code changes
  const handlePmCodeChange = (value) => {
    setPmCode(value);
    setEmailContent(getApprovalEmailTemplate(selectedIntern, internId, password, value || "[PM Code]"));
  };

  // Handle offer letter template ready
  const handleOfferLetterReady = (pdfData) => {
    setOfferLetterPDF(pdfData);
    console.log("📎 Offer letter PDF ready:", pdfData.filename);
  };

  // ✅ NEW: Handle rejection
  const handleReject = async () => {
    if (!selectedIntern) {
      alert("⚠️ Please select an intern first");
      return;
    }

    const rejectionEmail = getRejectionEmailTemplate(selectedIntern);

    const confirmed = window.confirm(
      `Send rejection email and remove intern from approval queue?\n\n` +
      `To: ${selectedIntern.email}\n` +
      `Name: ${selectedIntern.fullName}\n\n` +
      `This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsSending(true);

    try {
      // Try to send rejection email
      let emailSent = false;
      try {
        console.log("📧 Sending rejection email to:", selectedIntern.email);

        const emailPayload = {
          to: selectedIntern.email,
          subject: "InternHub Internship Application Update",
          html: rejectionEmail.replace(/\n/g, '<br>'),
        };

        const response = await fetch("http://localhost:5000/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailPayload),
        });

        if (response.ok) {
          emailSent = true;
          console.log("✅ Rejection email sent successfully!");
        } else {
          const errorData = await response.json();
          console.warn("⚠️ Email failed:", errorData);
        }
      } catch (emailError) {
        console.warn("⚠️ Email service unavailable:", emailError.message);
      }

      // Remove intern from users
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const updatedUsers = users.filter(u => u.email !== selectedIntern.email);
      localStorage.setItem("users", JSON.stringify(updatedUsers));

      const emailStatus = emailSent
        ? "✅ Rejection email sent successfully!"
        : "⚠️ Email could not be sent (check backend), but intern was removed.";

      alert(
        `✅ ${selectedIntern.fullName} has been REJECTED and removed.\n\n` +
        `${emailStatus}`
      );

      // Reset form and trigger parent update
      setSelectedIntern(null);
      setInternId("");
      setPassword("");
      setPmCode("");
      setEmailContent("");
      setCc("");
      setBcc("");
      setOfferLetterPDF(null);

      // Force page refresh to update the list
      window.location.reload();

    } catch (error) {
      console.error("❌ Error:", error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // ✅ FIXED: Complete approval function with proper email payload
  const handleFinalApprove = async () => {
    // Validation
    if (!selectedIntern || !internId || !password) {
      alert("⚠️ Error: Missing credentials. Please try again.");
      return;
    }

    if (!pmCode || !pmCode.trim()) {
      alert("⚠️ PM Code is required for approval");
      return;
    }

    // Validate PM Code exists
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const pmExists = users.find(u => u.role === "pm" && u.pmCode === pmCode);
   
    if (!pmExists) {
      alert(`❌ Invalid PM Code: ${pmCode}\n\nPlease enter a valid PM Code from the list.`);
      return;
    }

    if (!emailContent.trim()) {
      alert("⚠️ Email content cannot be empty");
      return;
    }

    // Validate CC/BCC emails
    if (cc && !validateMultipleEmails(cc)) {
      alert("⚠️ Invalid CC email format. Use comma-separated emails:\nexample1@mail.com, example2@mail.com");
      return;
    }

    if (bcc && !validateMultipleEmails(bcc)) {
      alert("⚠️ Invalid BCC email format. Use comma-separated emails:\nexample1@mail.com, example2@mail.com");
      return;
    }

    const confirmed = window.confirm(
      `Send approval email with offer letter and activate intern?\n\n` +
      `To: ${selectedIntern.email}\n` +
      `${cc ? `CC: ${cc}\n` : ''}` +
      `${bcc ? `BCC: ${bcc}\n` : ''}` +
      `\nIntern ID: ${internId}\n` +
      `Password: ${password}\n` +
      `PM Code: ${pmCode}\n` +
      `Attachment: ${offerLetterPDF ? 'Offer Letter PDF ✓' : 'No attachment'}\n\n` +
      `This will immediately activate the intern account.`
    );

    if (!confirmed) return;

    setIsSending(true);

    try {
      // Try to send email with offer letter attachment
      let emailSent = false;
      try {
        console.log("📧 Sending approval email with offer letter to:", selectedIntern.email);
       
        // ✅ FIXED: Proper email format matching backend expectations
        const emailPayload = {
          to: selectedIntern.email,
          subject: "🎉 Congratulations! InternHub Selection - Offer Letter Attached",
          html: emailContent.replace(/\n/g, '<br>'), // Convert plain text to HTML
        };

        // Add CC/BCC if provided
        if (cc) emailPayload.cc = cc;
        if (bcc) emailPayload.bcc = bcc;

        // Add attachment if available
        if (offerLetterPDF && offerLetterPDF.pdfBase64) {
          emailPayload.attachments = [
            {
              filename: offerLetterPDF.filename,
              content: offerLetterPDF.pdfBase64,
            }
          ];
        }

        console.log("📨 Email payload prepared:", {
          to: emailPayload.to,
          hasAttachment: !!emailPayload.attachments
        });

        const response = await fetch("http://localhost:5000/api/send-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailPayload),
        });

        if (response.ok) {
          emailSent = true;
          console.log("✅ Email with offer letter sent successfully!");
        } else {
          const errorData = await response.json();
          console.warn("⚠️ Email failed:", errorData);
        }
      } catch (emailError) {
        console.warn("⚠️ Email service unavailable:", emailError.message);
      }

      // ALWAYS approve and move to active
      const updatedIntern = {
        ...selectedIntern,
        internId: internId,
        password: password,
        pmCode: pmCode,
        status: INTERN_STATUS.ACTIVE,
        approvedAt: new Date().toISOString(),
        approvedBy: currentHR?.email || "HR",
        credentialsSent: emailSent,
        emailSentAt: emailSent ? new Date().toISOString() : null,
        offerLetterSent: offerLetterPDF ? true : false,
        offerLetterPDF: offerLetterPDF || null,
      };

      // Save and update
      onApprove(updatedIntern);

      const emailStatus = emailSent
        ? "✅ Email with offer letter sent successfully!"
        : "⚠️ Email could not be sent (check backend), but intern was approved.";

      alert(
        `✅ ${selectedIntern.fullName} has been APPROVED and ACTIVATED!\n\n` +
        `${emailStatus}\n\n` +
        `Intern ID: ${internId}\n` +
        `Password: ${password}\n` +
        `PM Code: ${pmCode}\n` +
        `Offer Letter: ${offerLetterPDF ? 'Attached ✓' : 'Not attached'}\n\n` +
        `The intern can now login and complete their profile.`
      );

      // Reset form
      setSelectedIntern(null);
      setInternId("");
      setPassword("");
      setPmCode("");
      setEmailContent("");
      setCc("");
      setBcc("");
      setOfferLetterPDF(null);

    } catch (error) {
      console.error("❌ Error:", error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  // Get all available PMs
  const allPMs = JSON.parse(localStorage.getItem("users") || "[]").filter(u => u.role === "pm");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>
            Approval Center
          </h2>
          <p style={{ color: COLORS.textMuted, marginTop: 4 }}>
            {interns.length} interns awaiting final approval
          </p>
        </div>
        <SearchBar value={searchTerm || ''} onChange={setSearchTerm} placeholder="Search pending interns..." />
      </div>

      {interns.length === 0 ? (
        <div style={glassCardStyle}>
          <EmptyState icon={<Check size={48} />} message="No pending approvals" subMessage="All caught up!" />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 24 }}>
          {/* Left: Intern List - ✅ FIXED: Added unique keys */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {interns.map((intern, idx) => (
              <div
                key={intern.email || `intern-${idx}`}
                onClick={() => handleInternSelect(intern)}
                style={{
                  ...glassCardStyle,
                  padding: 16,
                  cursor: "pointer",
                  borderTop: `2px solid ${selectedIntern?.email === intern.email ? COLORS.emeraldGlow : COLORS.borderGlass}`,
                  borderRight: `2px solid ${selectedIntern?.email === intern.email ? COLORS.emeraldGlow : COLORS.borderGlass}`,
                  borderBottom: `2px solid ${selectedIntern?.email === intern.email ? COLORS.emeraldGlow : COLORS.borderGlass}`,
                  borderLeft: `4px solid ${COLORS.emeraldGlow}`,
                  transition: "all 0.2s",
                  background: selectedIntern?.email === intern.email ? `${COLORS.emeraldGlow}15` : COLORS.surfaceGlass,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: "50%",
                    background: GRADIENTS.emerald,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, color: "white", fontSize: 16,
                  }}>
                    {intern.fullName?.charAt(0) || "?"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: 15 }}>
                      {intern.fullName}
                    </div>
                    <div style={{ fontSize: 13, color: COLORS.textMuted }}>{intern.email}</div>
                    <div style={{ fontSize: 12, color: COLORS.emeraldGlow, marginTop: 4 }}>{intern.degree}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Right: Approval Form */}
          <div style={glassCardStyle}>
            {!selectedIntern ? (
              <EmptyState
                icon={<User size={48} />}
                message="Select an intern to approve"
                subMessage="Click on any intern from the list"
              />
            ) : (
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: COLORS.textPrimary, marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
                  <Mail size={20} color={COLORS.emeraldGlow} />
                  Approve & Activate Intern
                </h3>

                {/* Intern Info */}
                <div style={{ marginBottom: 16, padding: 14, background: COLORS.surfaceGlass, borderRadius: 12, border: `1px solid ${COLORS.borderGlass}` }}>
                  <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 6 }}>To:</div>
                  <div style={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: 16 }}>{selectedIntern.fullName}</div>
                  <div style={{ fontSize: 13, color: COLORS.emeraldGlow, marginTop: 2 }}>{selectedIntern.email}</div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>{selectedIntern.degree}</div>
                </div>

                {/* Credentials Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                  {/* Intern ID - ✅ FIXED: Controlled input */}
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: COLORS.textSecondary, fontWeight: 500 }}>
                      Intern ID
                    </label>
                    <div style={{ position: "relative" }}>
                      <User size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: COLORS.emeraldGlow }} />
                      <input
                        type="text"
                        value={internId || ''}
                        readOnly
                        style={{ ...inputStyle, paddingLeft: 40, background: COLORS.surfaceGlass, fontWeight: 600, color: COLORS.emeraldGlow }}
                      />
                    </div>
                  </div>

                  {/* Password - ✅ FIXED: Controlled input */}
                  <div>
                    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, fontSize: 13, color: COLORS.textSecondary, fontWeight: 500 }}>
                      Password
                      <button
                        onClick={handleRegeneratePassword}
                        style={{
                          padding: "4px 8px",
                          background: "transparent",
                          border: `1px solid ${COLORS.borderGlass}`,
                          borderRadius: 6,
                          color: COLORS.textSecondary,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                        }}
                      >
                        <RefreshCw size={12} /> New
                      </button>
                    </label>
                    <div style={{ position: "relative" }}>
                      <Lock size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: COLORS.orange }} />
                      <input
                        type="text"
                        value={password || ''}
                        readOnly
                        style={{ ...inputStyle, paddingLeft: 40, background: COLORS.surfaceGlass, fontWeight: 600, color: COLORS.orange, fontFamily: "monospace" }}
                      />
                    </div>
                  </div>

                  {/* PM Code - ✅ FIXED: Controlled input */}
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: COLORS.textSecondary, fontWeight: 500 }}>
                      PM Code *
                    </label>
                    <div style={{ position: "relative" }}>
                      <Key size={16} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: COLORS.jungleTeal }} />
                      <input
                        type="text"
                        placeholder="PM001"
                        value={pmCode || ''}
                        onChange={(e) => handlePmCodeChange(e.target.value.toUpperCase())}
                        style={{ ...inputStyle, paddingLeft: 40 }}
                      />
                    </div>
                  </div>
                </div>

                {/* Available PMs - ✅ FIXED: Added unique keys */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8 }}>Available PM Codes (click to select):</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {allPMs.map(pm => (
                      <button
                        key={pm.pmCode || pm.email}
                        onClick={() => handlePmCodeChange(pm.pmCode)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 8,
                          border: `1px solid ${pmCode === pm.pmCode ? COLORS.jungleTeal : COLORS.borderGlass}`,
                          background: pmCode === pm.pmCode ? `${COLORS.jungleTeal}20` : COLORS.surfaceGlass,
                          color: pmCode === pm.pmCode ? COLORS.jungleTeal : COLORS.textSecondary,
                          fontSize: 12,
                          cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                      >
                        {pm.pmCode} - {pm.fullName}
                      </button>
                    ))}
                  </div>
                </div>

                {/* EMAIL TEMPLATE MANAGER - OFFER LETTER */}
                <EmailTemplateManager
                  internData={{
                    internName: selectedIntern?.fullName,
                    internEmail: selectedIntern?.email,
                    internId: internId,
                    password: password,
                    pmCode: pmCode,
                    domain: selectedIntern?.internshipDomain || selectedIntern?.degree,
                    duration: selectedIntern?.preferredDuration || '3 months',
                    startDate: 'To be announced',
                    hrName: currentHR?.fullName || 'HR Manager'
                  }}
                  onTemplateReady={handleOfferLetterReady}
                />

                {/* CC and BCC Fields - ✅ FIXED: Controlled inputs */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: COLORS.textSecondary, fontWeight: 500 }}>
                      CC (optional, comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="email1@ex.com, email2@ex.com"
                      value={cc || ''}
                      onChange={(e) => setCc(e.target.value)}
                      style={inputStyle}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: COLORS.textSecondary, fontWeight: 500 }}>
                      BCC (optional, comma-separated)
                    </label>
                    <input
                      type="text"
                      placeholder="email1@ex.com, email2@ex.com"
                      value={bcc || ''}
                      onChange={(e) => setBcc(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* Email Content - ✅ FIXED: Controlled input */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: COLORS.textSecondary, fontWeight: 500 }}>
                    Email Message
                  </label>
                  <textarea
                    value={emailContent || ''}
                    onChange={(e) => setEmailContent(e.target.value)}
                    style={{
                      ...inputStyle,
                      minHeight: 200,
                      resize: "vertical",
                      fontFamily: "monospace",
                      fontSize: 12,
                      lineHeight: 1.5,
                    }}
                  />
                </div>

                {/* Action Buttons - ✅ ADDED REJECT BUTTON */}
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={handleFinalApprove}
                    disabled={isSending || !pmCode}
                    style={{
                      ...primaryButtonStyle,
                      flex: 1,
                      background: GRADIENTS.emerald,
                      opacity: (isSending || !pmCode) ? 0.6 : 1,
                      cursor: (isSending || !pmCode) ? "not-allowed" : "pointer",
                    }}
                  >
                    <Send size={16} /> {isSending ? "Processing..." : "Approve & Activate"}
                  </button>
                  
                  <button
                    onClick={handleReject}
                    disabled={isSending}
                    style={{
                      ...primaryButtonStyle,
                      background: `linear-gradient(135deg, ${COLORS.red}, #dc2626)`,
                      opacity: isSending ? 0.6 : 1,
                      cursor: isSending ? "not-allowed" : "pointer",
                    }}
                  >
                    <X size={16} /> Reject
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedIntern(null);
                      setInternId("");
                      setPassword("");
                      setPmCode("");
                      setEmailContent("");
                      setCc("");
                      setBcc("");
                      setOfferLetterPDF(null);
                    }}
                    style={{
                      ...secondaryButtonStyle,
                      padding: "12px 20px",
                    }}
                  >
                    <X size={16} /> Cancel
                  </button>
                </div>

                {/* Info Box */}
                <div style={{
                  marginTop: 16,
                  padding: 12,
                  background: `${COLORS.jungleTeal}15`,
                  borderRadius: 10,
                  border: `1px solid ${COLORS.jungleTeal}`,
                }}>
                  <p style={{ fontSize: 12, color: COLORS.textSecondary, margin: 0 }}>
                    💡 <strong>Actions:</strong> <span style={{ color: COLORS.emeraldGlow }}>Approve</span> sends credentials + offer letter and activates the intern. <span style={{ color: COLORS.red }}>Reject</span> sends rejection email and removes the intern permanently.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== ACTIVE INTERNS SECTION ====================
export function ActiveInternsSection({
  interns,
  searchTerm,
  setSearchTerm,
  filterPM,
  setFilterPM,
  filterStatus,
  setFilterStatus,
  allPMs,
  onViewProfile,
  onToggleDisable,
  onChat,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary }}>
            Active Interns
          </h2>
          <p style={{ color: COLORS.textMuted }}>{interns.length} active interns</p>
        </div>

        <SearchBar
          value={searchTerm || ''}
          onChange={setSearchTerm}
          placeholder="Search active interns..."
        />
      </div>

      {/* Filters - ✅ FIXED: Controlled inputs */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <select value={filterPM || ''} onChange={(e) => setFilterPM(e.target.value)} style={inputStyle}>
          <option value="">All PMs</option>
          {allPMs.map(pm => (
            <option key={pm.pmCode || pm.email} value={pm.pmCode}>
              {pm.pmCode} - {pm.fullName}
            </option>
          ))}
        </select>

        <select value={filterStatus || ''} onChange={(e) => setFilterStatus(e.target.value)} style={inputStyle}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* List - ✅ FIXED: Added unique keys */}
      {interns.length === 0 ? (
        <div style={glassCardStyle}>
          <EmptyState icon={<Users size={48} />} message="No active interns" />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {interns.map((intern, idx) => (
            <ActiveInternCard
              key={intern.internId || intern.email || `active-intern-${idx}`}
              intern={intern}
              onViewProfile={onViewProfile}
              onToggleDisable={onToggleDisable}
              onChat={onChat}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== NEW REGISTRATIONS SECTION ====================
export function NewRegistrationsSection({ interns, searchTerm, setSearchTerm, onApprove, onReject }) {
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [emailContent, setEmailContent] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [isSending, setIsSending] = useState(false);

  const getDefaultEmailTemplate = (intern, date = "[To be scheduled]", time = "", link = "") => {
    const dateTimeText = date !== "[To be scheduled]"
      ? `${date}${time ? " at " + time : ""}`
      : date;
   
    const linkText = link
      ? `🔗 Meeting Link: ${link}`
      : "🔗 Meeting Link: [Will be shared shortly]";

    return `Dear ${intern?.fullName || "[Intern Name]"},

Thank you for your application to our internship program. We have carefully reviewed your profile and are impressed with your qualifications.

We would like to schedule a meeting with you to discuss the next steps and learn more about your interests.

📅 MEETING DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━
Date & Time: ${dateTimeText}
${linkText}
━━━━━━━━━━━━━━━━━━━━━━━━━

Please confirm your availability by replying to this email.

We look forward to speaking with you!

Best regards,
HR Team
InternHub`;
  };

  // Update email template when meeting details change
  useEffect(() => {
    if (selectedIntern) {
      const dateText = meetingDate
        ? new Date(meetingDate).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : "[To be scheduled]";
      setEmailContent(getDefaultEmailTemplate(selectedIntern, dateText, meetingTime, meetingLink));
    }
  }, [meetingDate, meetingTime, meetingLink, selectedIntern]);

  const handleInternSelect = (intern) => {
    setSelectedIntern(intern);
    setEmailContent(getDefaultEmailTemplate(intern));
    setCc("");
    setBcc("");
    setMeetingDate("");
    setMeetingTime("");
    setMeetingLink("");
  };

  // ✅ ADD THIS FUNCTION - View Application PDF
  const handleViewPDF = (intern) => {
    if (!intern.applicationPDF || !intern.applicationPDF.base64) {
      alert('⚠️ Application PDF not available for this intern.');
      return;
    }

    try {
      // Open PDF in new tab
      const pdfWindow = window.open('', '_blank');
      if (pdfWindow) {
        pdfWindow.document.write(`
          <html>
            <head>
              <title>Application - ${intern.fullName}</title>
              <style>
                body { margin: 0; padding: 0; }
                iframe { width: 100%; height: 100vh; border: none; }
              </style>
            </head>
            <body>
              <iframe src="${intern.applicationPDF.base64}"></iframe>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error('Error viewing PDF:', error);
      alert('❌ Error opening PDF. Please try again.');
    }
  };

  const handleSendEmail = async () => {
    if (!selectedIntern || !emailContent.trim()) {
      alert("⚠️ Please select an intern and write an email");
      return;
    }

    // Validate CC/BCC
    if (cc && !validateMultipleEmails(cc)) {
      alert("⚠️ Invalid CC email format. Use comma-separated emails:\nexample1@mail.com, example2@mail.com");
      return;
    }

    if (bcc && !validateMultipleEmails(bcc)) {
      alert("⚠️ Invalid BCC email format. Use comma-separated emails:\nexample1@mail.com, example2@mail.com");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("http://localhost:5000/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedIntern.email,
          cc: cc || undefined,
          bcc: bcc || undefined,
          subject: "Internship Application – Next Steps",
          html: emailContent.replace(/\n/g, '<br>'),
        }),
      });

      if (!res.ok) throw new Error("Email failed");
     
      alert(`✅ Email sent successfully to ${selectedIntern.fullName}`);
    } catch (err) {
      console.warn("Email sending failed:", err);
      alert(`⚠️ Email could not be sent: ${err.message}\n\nYou can still accept the intern - meeting details will be saved.`);
    } finally {
      setIsSending(false);
    }
  };

  const handleAccept = () => {
    if (!selectedIntern) {
      alert("⚠️ Please select an intern first");
      return;
    }

    const internWithMeetingData = {
      ...selectedIntern,
      meetingDate: meetingDate || null,
      meetingTime: meetingTime || null,
      meetingLink: meetingLink || null,
      meetingScheduledAt: meetingDate ? new Date().toISOString() : null,
      acknowledgmentEmailSent: true,
    };

    onApprove(internWithMeetingData);

    // Reset form
    setSelectedIntern(null);
    setEmailContent("");
    setCc("");
    setBcc("");
    setMeetingDate("");
    setMeetingTime("");
    setMeetingLink("");
  };

  const handleReject = () => {
    if (!selectedIntern) return;
   
    if (window.confirm(`Are you sure you want to reject ${selectedIntern.fullName}?`)) {
      onReject(selectedIntern);
      setSelectedIntern(null);
      setEmailContent("");
      setCc("");
      setBcc("");
      setMeetingDate("");
      setMeetingTime("");
      setMeetingLink("");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>
            New Registrations
          </h2>
          <p style={{ color: COLORS.textMuted, marginTop: 4 }}>
            {interns.length} awaiting review
          </p>
        </div>
        <SearchBar value={searchTerm || ''} onChange={setSearchTerm} placeholder="Search registrations..." />
      </div>

      {/* No interns state */}
      {interns.length === 0 ? (
        <div style={glassCardStyle}>
          <EmptyState icon={<Mail size={48} />} message="No new registrations" subMessage="All registrations have been processed" />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 24 }}>
          {/* Left: Intern List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {interns.map((intern, idx) => {
              const isSelected = selectedIntern?.email === intern.email;
              return (
                <div
                  key={intern.email || `registration-${idx}`}
                  onClick={() => handleInternSelect(intern)}
                  style={{
                    ...glassCardStyle,
                    padding: 16,
                    cursor: "pointer",
                    border: isSelected ? `2px solid ${COLORS.jungleTeal}` : `1px solid ${COLORS.borderGlass}`,
                    background: isSelected ? `${COLORS.jungleTeal}15` : COLORS.surfaceGlass,
                    transition: "all 0.2s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: "50%",
                        background: GRADIENTS.ocean,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 700, color: "white", fontSize: 16,
                      }}>
                        {intern.fullName?.charAt(0) || "?"}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: 15 }}>
                          {intern.fullName}
                        </div>
                        <div style={{ fontSize: 13, color: COLORS.textMuted }}>{intern.email}</div>
                        <div style={{ fontSize: 12, color: COLORS.jungleTeal, marginTop: 4 }}>{intern.degree}</div>
                      </div>
                    </div>
                    
                    {/* ✅ ADD VIEW APPLICATION BUTTON */}
                    {intern.applicationPDF && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent selecting the intern when clicking the button
                          handleViewPDF(intern);
                        }}
                        title="View Application PDF"
                        style={{ 
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          border: "none",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                          background: COLORS.jungleTeal,
                          transition: "transform 0.2s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <FileText size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: Email Composer */}
          <div style={glassCardStyle}>
            {!selectedIntern ? (
              <EmptyState icon={<Mail size={40} />} message="Select an intern to send email" />
            ) : (
              <>
                <h3 style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 18, fontWeight: 600, color: COLORS.textPrimary }}>
                  <Mail size={20} color={COLORS.jungleTeal} />
                  Send Acknowledgment Email
                </h3>

                {/* Intern Info with View Application Button */}
                <div style={{ marginBottom: 16, padding: 14, background: COLORS.surfaceGlass, borderRadius: 12, border: `1px solid ${COLORS.borderGlass}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 6 }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 6 }}>To:</div>
                      <div style={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: 16 }}>{selectedIntern.fullName}</div>
                      <div style={{ fontSize: 13, color: COLORS.jungleTeal, marginTop: 2 }}>{selectedIntern.email}</div>
                      <div style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 4 }}>{selectedIntern.degree}</div>
                    </div>
                    
                    {/* ✅ VIEW APPLICATION BUTTON IN HEADER */}
                    {selectedIntern.applicationPDF && (
                      <button 
                        onClick={() => handleViewPDF(selectedIntern)}
                        style={{ 
                          padding: "8px 14px",
                          borderRadius: 10,
                          border: "none",
                          background: COLORS.jungleTeal,
                          color: "white",
                          fontWeight: 600,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: 6,
                          fontSize: 13,
                          transition: "transform 0.2s",
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                      >
                        <FileText size={14} /> View Application
                      </button>
                    )}
                  </div>
                </div>

                {/* Meeting Details Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: COLORS.textSecondary, fontWeight: 500 }}>
                      Meeting Date
                    </label>
                    <input
                      type="date"
                      value={meetingDate || ''}
                      onChange={(e) => setMeetingDate(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: COLORS.textSecondary, fontWeight: 500 }}>
                      Meeting Time
                    </label>
                    <input
                      type="time"
                      value={meetingTime || ''}
                      onChange={(e) => setMeetingTime(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: COLORS.textSecondary, fontWeight: 500 }}>
                      Meeting Link (optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://meet.google.com/..."
                      value={meetingLink || ''}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                {/* CC/BCC */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: COLORS.textSecondary, fontWeight: 500 }}>
                      CC (optional, comma-separated)
                    </label>
                    <input
                      type="text"
                      value={cc || ''}
                      onChange={(e) => setCc(e.target.value)}
                      placeholder="email1@ex.com, email2@ex.com"
                      style={emailInputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: COLORS.textSecondary, fontWeight: 500 }}>
                      BCC (optional, comma-separated)
                    </label>
                    <input
                      type="text"
                      value={bcc || ''}
                      onChange={(e) => setBcc(e.target.value)}
                      placeholder="email1@ex.com, email2@ex.com"
                      style={emailInputStyle}
                    />
                  </div>
                </div>

                {/* Email Message */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: COLORS.textSecondary, fontWeight: 500 }}>
                    Email Message
                  </label>
                  <textarea
                    value={emailContent || ''}
                    onChange={(e) => setEmailContent(e.target.value)}
                    style={{
                      ...emailInputStyle,
                      minHeight: 220,
                      fontFamily: "monospace",
                      fontSize: 12,
                      resize: "vertical"
                    }}
                  />
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
                  <button
                    onClick={handleSendEmail}
                    disabled={isSending}
                    style={{
                      ...emailPrimaryButtonStyle,
                      opacity: isSending ? 0.6 : 1,
                      cursor: isSending ? "not-allowed" : "pointer",
                    }}
                  >
                    <Send size={16} /> {isSending ? "Sending..." : "Send Email"}
                  </button>

                  <button
                    onClick={handleAccept}
                    style={{
                      ...smallButtonStyle,
                      background: COLORS.emeraldGlow
                    }}
                  >
                    <Check size={16} /> Accept & Move to Approval
                  </button>

                  <button
                    onClick={handleReject}
                    style={{
                      ...smallButtonStyle,
                      background: COLORS.red
                    }}
                  >
                    <X size={16} /> Reject
                  </button>
                </div>

                {/* Info Box */}
                <div style={{
                  padding: 12,
                  background: `${COLORS.jungleTeal}15`,
                  borderRadius: 10,
                  border: `1px solid ${COLORS.jungleTeal}`,
                }}>
                  <p style={{ fontSize: 12, color: COLORS.textSecondary, margin: 0 }}>
                    💡 <strong>Workflow:</strong> Send acknowledgment email → Accept to move to Approval Center. Meeting details will be saved with the intern's record.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== PM SECTION ====================
export function PMSection({ pms, users, onViewInterns, onChat }) {
  const [searchQuery, setSearchQuery] = useState("");

  const getInternCount = (pmCode) =>
    users.filter(u => u.role === "intern" && u.pmCode === pmCode).length;

  const totalAssignedInterns = pms.reduce((sum, pm) => sum + getInternCount(pm.pmCode), 0);
  const activePMs = pms.filter(pm => pm.status === "active").length;

  const filteredPMs = pms.filter((pm) => {
    const searchLower = searchQuery.toLowerCase();
    const displayName = (pm.name || pm.fullName || "").toLowerCase();
    const email = (pm.email || "").toLowerCase();
    const code = (pm.pmCode || "").toLowerCase();

    return (
      displayName.includes(searchLower) ||
      email.includes(searchLower) ||
      code.includes(searchLower)
    );
  });

  return (
    <div className="animate-fadeIn">
      {/* Stats Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          className="glass hover-lift animate-fadeIn stagger-1"
          style={{
            padding: "16px",
            borderRadius: "12px",
            background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "12px", color: COLORS.textSecondary, marginBottom: "4px" }}>
                Total PMs
              </p>
              <h3 style={{ fontSize: "24px", fontWeight: "700", color: COLORS.textPrimary }}>
                {pms.length}
              </h3>
            </div>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "rgba(255, 255, 255, 0.2)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Briefcase size={20} color="white" />
            </div>
          </div>
        </div>

        <div
          className="glass hover-lift animate-fadeIn stagger-2"
          style={{
            padding: "16px",
            borderRadius: "12px",
            background: `linear-gradient(135deg, rgba(103, 146, 137, 0.3), rgba(29, 120, 116, 0.3))`,
            border: `1px solid rgba(103, 146, 137, 0.3)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "12px", color: COLORS.textSecondary, marginBottom: "4px" }}>
                Assigned Interns
              </p>
              <h3 style={{ fontSize: "24px", fontWeight: "700", color: COLORS.textPrimary }}>
                {totalAssignedInterns}
              </h3>
            </div>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "rgba(103, 146, 137, 0.3)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Users size={20} color={COLORS.jungleTeal} />
            </div>
          </div>
        </div>

        <div
          className="glass hover-lift animate-fadeIn stagger-3"
          style={{
            padding: "16px",
            borderRadius: "12px",
            background: `linear-gradient(135deg, rgba(103, 146, 137, 0.3), rgba(29, 120, 116, 0.3))`,
            border: `1px solid rgba(103, 146, 137, 0.3)`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p style={{ fontSize: "12px", color: COLORS.textSecondary, marginBottom: "4px" }}>
                Active PMs
              </p>
              <h3 style={{ fontSize: "24px", fontWeight: "700", color: COLORS.textPrimary }}>
                {activePMs}
              </h3>
            </div>
            <div
              style={{
                width: "40px",
                height: "40px",
                background: "rgba(103, 146, 137, 0.3)",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <TrendingUp size={20} color={COLORS.jungleTeal} />
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar - ✅ FIXED: Controlled input */}
      <div
        className="glass animate-fadeIn stagger-4"
        style={{
          padding: "16px",
          borderRadius: "12px",
          marginBottom: "24px",
        }}
      >
        <div style={{ position: "relative" }}>
          <Search
            size={18}
            color={COLORS.textMuted}
            style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
          />
          <input
            type="text"
            placeholder="Search by name, email, or PM code..."
            value={searchQuery || ''}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px 12px 44px",
              background: "rgba(103, 146, 137, 0.1)",
              border: `1px solid rgba(103, 146, 137, 0.3)`,
              borderRadius: "10px",
              color: COLORS.textPrimary,
              fontSize: "14px",
              transition: "all 0.3s ease",
            }}
          />
        </div>
      </div>

      {/* PMs Grid - ✅ FIXED: Added unique keys */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(380px, 1fr))",
          gap: "24px",
        }}
      >
        {filteredPMs.map((pm, index) => {
          const internCount = getInternCount(pm.pmCode);
         
          return (
            <div
              key={pm.pmCode || pm.email || `pm-${index}`}
              className={`glass hover-lift animate-fadeIn stagger-${(index % 5) + 1}`}
              style={{
                padding: "24px",
                borderRadius: "16px",
                background: "rgba(29, 120, 116, 0.1)",
                border: `1px solid rgba(103, 146, 137, 0.3)`,
              }}
            >
              {/* PM Header */}
              <div style={{ display: "flex", alignItems: "flex-start", marginBottom: "20px" }}>
                <div
                  style={{
                    width: "60px",
                    height: "60px",
                    background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "700",
                    fontSize: "20px",
                    color: "white",
                    marginRight: "16px",
                    flexShrink: 0,
                  }}
                >
                  {(pm.name || pm.fullName || "PM")
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .toUpperCase() || "PM"}
                </div>
                <div style={{ flex: 1 }}>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: "700",
                      color: COLORS.textPrimary,
                      marginBottom: "4px",
                    }}
                  >
                    {pm.name || pm.fullName || "Project Manager"}
                  </h3>
                  <div
                    style={{
                      display: "inline-block",
                      padding: "4px 12px",
                      background: `linear-gradient(135deg, ${COLORS.jungleTeal}20, ${COLORS.deepOcean}20)`,
                      border: `1px solid ${COLORS.jungleTeal}`,
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: COLORS.jungleTeal,
                    }}
                  >
                    PM Code: {pm.pmCode}
                  </div>
                </div>
              </div>

              {/* PM Details */}
              <div style={{ marginBottom: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "10px",
                    fontSize: "13px",
                    color: COLORS.textSecondary,
                  }}
                >
                  <Mail size={16} color={COLORS.jungleTeal} />
                  <span>{pm.email || "No email"}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    marginBottom: "10px",
                    fontSize: "13px",
                    color: COLORS.textSecondary,
                  }}
                >
                  <Phone size={16} color={COLORS.jungleTeal} />
                  <span>{pm.phone || "No phone"}</span>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "13px",
                    color: COLORS.textSecondary,
                  }}
                >
                  <Users size={16} color={COLORS.jungleTeal} />
                  <span>{internCount} {internCount === 1 ? 'intern' : 'interns'} assigned</span>
                </div>
              </div>

              {/* Status Badge */}
              <div style={{ marginBottom: "20px" }}>
                <span
                  style={{
                    display: "inline-block",
                    padding: "6px 14px",
                    background: pm.status === "active"
                      ? "rgba(34, 197, 94, 0.2)"
                      : "rgba(239, 68, 68, 0.2)",
                    border: `1px solid ${pm.status === "active" ? "#fbbf24" : COLORS.red}`,
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: pm.status === "active" ? "#fbbf24" : COLORS.red,
                    textTransform: "uppercase",
                  }}
                >
                  {pm.status || "Active"}
                </span>
              </div>

              {/* Quick Stats */}
              <div
                style={{
                  padding: "16px",
                  background: "rgba(103, 146, 137, 0.1)",
                  borderRadius: "10px",
                  marginBottom: "20px",
                  textAlign: "center",
                }}
              >
                <p style={{ fontSize: "11px", color: COLORS.textMuted, marginBottom: "6px" }}>
                  Assigned Interns
                </p>
                <p style={{ fontSize: "28px", fontWeight: "700", color: COLORS.textPrimary }}>
                  {internCount}
                </p>
                <p style={{ fontSize: "12px", color: COLORS.textSecondary, marginTop: "4px" }}>
                  Under supervision
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => onViewInterns && onViewInterns(pm)}
                  disabled={internCount === 0}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: internCount > 0
                      ? `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`
                      : "rgba(103, 146, 137, 0.2)",
                    border: "none",
                    borderRadius: "10px",
                    color: "white",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: internCount > 0 ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.3s ease",
                    opacity: internCount > 0 ? 1 : 0.5,
                  }}
                  onMouseEnter={(e) => {
                    if (internCount > 0) {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "0 6px 20px rgba(103, 146, 137, 0.4)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (internCount > 0) {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                >
                  <Eye size={18} />
                  View Interns
                </button>
                <button
                  onClick={() => onChat && onChat(pm)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    background: "rgba(103, 146, 137, 0.2)",
                    border: `1px solid ${COLORS.jungleTeal}`,
                    borderRadius: "10px",
                    color: COLORS.textPrimary,
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.3s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(103, 146, 137, 0.3)";
                    e.currentTarget.style.transform = "translateY(-2px)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(103, 146, 137, 0.2)";
                    e.currentTarget.style.transform = "translateY(0)";
                  }}
                >
                  <MessageCircle size={18} />
                  Chat
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredPMs.length === 0 && (
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
            <Briefcase size={36} color="white" />
          </div>
          <h3 style={{ fontSize: "20px", fontWeight: "700", color: COLORS.textPrimary, marginBottom: "8px" }}>
            No Project Managers Found
          </h3>
          <p style={{ fontSize: "14px", color: COLORS.textMuted }}>
            {searchQuery ? "Try adjusting your search criteria" : "No project managers registered yet"}
          </p>
        </div>
      )}
    </div>
  );
}

// ==================== REPORTS SECTION ====================
export function ReportsSection({ users, reportsTab, setReportsTab, currentHR }) {
  const addNotification = (notification) => {
    alert(`${notification.title}: ${notification.message}`);
  };

  // No tabs, no header - just directly render ReviewLogsPage
  return (
    <ReviewLogsPage
      pmEmail={currentHR?.email || "hr@company.com"}
      addNotification={addNotification}
    />
  );
}

// ==================== ACTIVE INTERNS FULL PAGE WRAPPER ====================
export const ActiveInterns = ({ onNavigateToMessages }) => (
  <ActiveInternsPage onNavigateToMessages={onNavigateToMessages} />
);