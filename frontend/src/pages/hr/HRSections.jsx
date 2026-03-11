// HRSections.jsx - My code
import React, { useState, useEffect } from "react";
import { EmailTemplateManager } from "./EmailTemplateManager";
import { Edit, Trash2, Pin, Calendar } from "lucide-react";
import {
  Clock, UserCheck, Users, Briefcase, CheckCircle2, FileText,
  Megaphone, Plus, Download, Send, Check, X, Mail, UserPlus, RefreshCw, Copy, Key, Lock, User,
  Search, Eye, Phone, TrendingUp, MessageCircle
} from "lucide-react";
import { COLORS, GRADIENTS, keyframes, glassCardStyle, smallButtonStyle,
  emailInputStyle, emailPrimaryButtonStyle } from "./HRConstants";
  
import {
  Modal, StatMini, PendingCard, ActiveInternCard,
  AnnouncementCard, EmptyState, SearchBar, DailyLogsReport,
  SummaryReport, TNAReport, AttendanceReport, PMPerformanceReport
} from "./HRComponents";
import { hrApi } from "../../lib/apiClient";

import ReviewLogsPage from "./ReviewLogsPage";
import ActiveInternsPage from "./ActiveInterns/ActiveInternsPage.jsx";
import ReportsInbox from "./ReportsInbox";

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

const DEPARTMENT_OPTIONS = ["SAP", "Oracle", "Accounts", "HR"];

// ==================== DASHBOARD SECTION ====================
// ==================== DASHBOARD SECTION (PM Style) ====================
export function DashboardSection({
  stats,
  analytics,
  currentHR,
  getGreeting,
  announcements = [],
  onCreateAnnouncement,
  onDeleteAnnouncement,
  onPinAnnouncement,
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [formError, setFormError] = useState("");
  const [newAnnouncement, setNewAnnouncement] = useState({ 
    title: "", 
    content: "", 
    priority: "medium" 
  });

  const handleAddAnnouncement = () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.content.trim()) {
      setFormError("Please fill in all fields before creating the announcement.");
      return;
    }
    setFormError("");
    
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
    setFormError("");
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

      {/* Analytics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16, marginBottom: 24 }}>
        <AnalyticsListCard
          title="Domain Distribution"
          emptyLabel="No domain data"
          items={analytics?.charts?.domainWise || []}
        />
        <AnalyticsListCard
          title="Monthly Trend"
          emptyLabel="No monthly trend data"
          items={(analytics?.charts?.monthlyTrend || []).map((entry) => ({ name: entry.month, count: entry.count }))}
        />
        <AnalyticsListCard
          title="Top Colleges"
          emptyLabel="No college data"
          items={analytics?.charts?.topColleges || []}
        />
        <AnalyticsListCard
          title="Department Spread"
          emptyLabel="No department data"
          items={analytics?.charts?.departmentWise || []}
        />
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
              setFormError("");
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

              {formError ? (
                <div style={{ marginBottom: 14, color: COLORS.red, fontSize: 13 }}>
                  {formError}
                </div>
              ) : null}

              <div style={{ display: "flex", gap: 12 }}>
                <button 
                  onClick={() => {
                    setShowAddModal(false);
                    setFormError("");
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

function AnalyticsListCard({ title, items = [], emptyLabel }) {
  const top = (items || []).slice(0, 5);
  const max = Math.max(1, ...top.map((entry) => Number(entry.count || 0)));
  return (
    <div style={{ ...glassCardStyle, padding: 18 }}>
      <div style={{ color: COLORS.textPrimary, fontSize: 15, fontWeight: 700, marginBottom: 10 }}>{title}</div>
      {top.length === 0 ? (
        <div style={{ color: COLORS.textMuted, fontSize: 13 }}>{emptyLabel}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {top.map((entry, index) => (
            <div key={`${title}-${entry.name || index}`}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ color: COLORS.textSecondary, fontSize: 12, maxWidth: "74%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {entry.name || "-"}
                </span>
                <span style={{ color: COLORS.textPrimary, fontSize: 12, fontWeight: 700 }}>{entry.count || 0}</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.max(8, Math.round((Number(entry.count || 0) / max) * 100))}%`,
                    height: "100%",
                    borderRadius: 999,
                    background: GRADIENTS.accent,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
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
export function ApprovalSection({ interns, searchTerm, setSearchTerm, onApprove, onReject, onDataChanged }) {
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [password, setPassword] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [department, setDepartment] = useState("");
  const [mentorName, setMentorName] = useState("");
  const [pmCode, setPmCode] = useState("");
  const [stipend, setStipend] = useState("");
  const [nextInternId, setNextInternId] = useState("");
  const [loadingNextInternId, setLoadingNextInternId] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [bulkRejectError, setBulkRejectError] = useState("");
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState(null);
  const [offerLetterAttachment, setOfferLetterAttachment] = useState(null);
  const [approvalFeedback, setApprovalFeedback] = useState({
    open: false,
    title: "",
    message: "",
    tone: "info",
  });

  const openApprovalFeedback = ({ title, message, tone = "info" }) => {
    setApprovalFeedback({ open: true, title, message, tone });
  };

  const minDate = new Date().toISOString().slice(0, 10);

  const resolveDepartmentValue = () => {
    return String(department || "").trim();
  };

  const loadNextInternId = async () => {
    setLoadingNextInternId(true);
    try {
      const res = await hrApi.nextInternId();
      setNextInternId(res?.internId || "");
    } catch {
      setNextInternId("");
    } finally {
      setLoadingNextInternId(false);
    }
  };

  const generatePassword = () => {
    // Easy-to-share, easy-to-type: 8-digit numeric password.
    const length = 8;
    const digits = "0123456789";

    try {
      const bytes = new Uint8Array(length);
      window.crypto.getRandomValues(bytes);
      // First digit non-zero.
      let output = digits[(bytes[0] % 9) + 1];
      for (let i = 1; i < length; i += 1) output += digits[bytes[i] % 10];
      return output;
    } catch {
      // Fallback if crypto is unavailable.
      const min = 10 ** (length - 1);
      const max = 10 ** length - 1;
      return String(Math.floor(min + Math.random() * (max - min + 1)));
    }
  };

  useEffect(() => {
    const validIds = new Set((interns || []).map((intern) => String(intern.applicationId)));
    setSelectedIds((prev) => prev.filter((id) => validIds.has(String(id))));
    if (selectedIntern?.applicationId && !validIds.has(String(selectedIntern.applicationId))) {
      setSelectedIntern(null);
    }
  }, [interns, selectedIntern?.applicationId]);

  useEffect(() => {
    if (!selectedIntern?.applicationId) return;
    loadNextInternId();
  }, [selectedIntern?.applicationId]);

  const resetForm = () => {
    setSelectedIntern(null);
    setShowApproveConfirm(false);
    setPassword("");
    setStartDate("");
    setEndDate("");
    setDepartment("");
    setMentorName("");
    setPmCode("");
    setStipend("");
    setNextInternId("");
    setOfferLetterAttachment(null);
  };

  const handleInternSelect = (intern) => {
    const inferredDepartment = String(intern?.internshipDomain || intern?.degree || "").trim();
    const knownDepartment = DEPARTMENT_OPTIONS.find((item) => item.toLowerCase() === inferredDepartment.toLowerCase()) || "";
    setSelectedIntern(intern);
    setPassword(generatePassword());
    setStartDate("");
    setEndDate("");
    setDepartment(knownDepartment || "");
    setMentorName("");
    setPmCode("");
    setStipend("");
    setOfferLetterAttachment(null);
  };

  const computeOfferDuration = () => {
    const fallback = String(selectedIntern?.preferredDuration || selectedIntern?.duration || "").trim();
    if (!startDate || !endDate) return fallback;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return fallback;
    const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
    if (!Number.isFinite(days) || days <= 0) return fallback;
    return `${days} days`;
  };

  const handleApprove = () => {
    if (!selectedIntern?.applicationId) {
      openApprovalFeedback({
        title: "No selection",
        message: "Please select an application first.",
        tone: "error",
      });
      return;
    }
    const resolvedDepartment = resolveDepartmentValue();
    if (!startDate || !endDate || !resolvedDepartment || !mentorName.trim()) {
      openApprovalFeedback({
        title: "Missing fields",
        message: "Start date, end date, department, and mentor name are required.",
        tone: "error",
      });
      return;
    }
    if (startDate < minDate || endDate < minDate) {
      openApprovalFeedback({
        title: "Invalid date",
        message: "Past dates are not allowed.",
        tone: "error",
      });
      return;
    }
    if (endDate < startDate) {
      openApprovalFeedback({
        title: "Invalid date range",
        message: "End date must be on or after start date.",
        tone: "error",
      });
      return;
    }
    if (!password.trim()) {
      openApprovalFeedback({
        title: "Missing password",
        message: "Password is required.",
        tone: "error",
      });
      return;
    }
    setShowApproveConfirm(true);
  };

  const submitApprove = async () => {
    if (!selectedIntern?.applicationId) return;
    setShowApproveConfirm(false);
    setIsSubmitting(true);
    try {
      const resolvedDepartment = resolveDepartmentValue();
      const resolvedPmCode = String(pmCode || "").trim();
      const result = await onApprove({
        applicationId: selectedIntern.applicationId,
        startDate,
        endDate,
        department: resolvedDepartment,
        mentorName: mentorName.trim(),
        stipend: stipend.trim() || null,
        password: password.trim(),
        sendEmail: true,
        showAlert: false,
      });

      const resolvedInternId = result?.intern?.internId || "Generated";
      const resolvedPassword = result?.credentials?.password || password;
      const emailStatus = result?.emailSent ? "Approval email sent." : "Approval done (email not sent).";
      let pmAssignmentLine = "";

      if (resolvedPmCode && result?.intern?.id) {
        try {
          await hrApi.assignPm(result.intern.id, resolvedPmCode);
          pmAssignmentLine = `\nPM assigned: ${resolvedPmCode}`;
        } catch (error) {
          pmAssignmentLine = `\nPM assignment failed: ${resolvedPmCode}`;
          console.error("PM assignment failed:", error);
        }
      }
      openApprovalFeedback({
        title: "Approved successfully",
        message: `Intern ID: ${resolvedInternId}\nPassword: ${resolvedPassword}\n${emailStatus}${pmAssignmentLine}`,
        tone: "success",
      });
      resetForm();
      await loadNextInternId();
      if (typeof onDataChanged === "function") await onDataChanged();
    } catch (err) {
      openApprovalFeedback({
        title: "Approval failed",
        message: err?.message || "Failed to approve application.",
        tone: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = () => {
    if (!selectedIntern) {
      openApprovalFeedback({
        title: "No selection",
        message: "Please select an application first.",
        tone: "error",
      });
      return;
    }
    if (typeof onReject === "function") {
      onReject(selectedIntern);
      return;
    }
    openApprovalFeedback({
      title: "Action unavailable",
      message: "Reject handler is not configured.",
      tone: "error",
    });
  };

  const toggleSelect = (applicationId, checked) => {
    const id = String(applicationId);
    setSelectedIds((prev) => (checked ? Array.from(new Set([...prev, id])) : prev.filter((value) => value !== id)));
  };

  const toggleSelectAll = (checked) => {
    if (!checked) {
      setSelectedIds([]);
      return;
    }
    const all = (interns || []).map((intern) => String(intern.applicationId)).filter(Boolean);
    setSelectedIds(all);
  };

  const executeBulkAction = async (action, explicitReason = "") => {
    if (!selectedIds.length) {
      openApprovalFeedback({
        title: "No selection",
        message: "Select at least one application.",
        tone: "error",
      });
      return;
    }

    const payload = { applicationIds: selectedIds, action };
    if (action === "approve") {
      const resolvedDepartment = resolveDepartmentValue();
      if (!startDate || !endDate || !resolvedDepartment || !mentorName.trim()) {
        openApprovalFeedback({
          title: "Missing fields",
          message: "For bulk approve, fill start date, end date, department, and mentor in the right panel first.",
          tone: "error",
        });
        return;
      }
      if (startDate < minDate || endDate < minDate) {
        openApprovalFeedback({
          title: "Invalid date",
          message: "Past dates are not allowed.",
          tone: "error",
        });
        return;
      }
      if (endDate < startDate) {
        openApprovalFeedback({
          title: "Invalid date range",
          message: "End date must be on or after start date.",
          tone: "error",
        });
        return;
      }
      payload.startDate = startDate;
      payload.endDate = endDate;
      payload.department = resolvedDepartment;
      payload.mentorName = mentorName.trim();
      payload.stipend = stipend.trim() || null;
    }
    if (action === "reject") {
      const reason = String(explicitReason || "").trim();
      if (!reason) {
        setBulkRejectReason("");
        setBulkRejectError("");
        setShowBulkRejectModal(true);
        return;
      }
      payload.rejectionReason = reason;
    }

    setBulkSubmitting(true);
    try {
      const response = await hrApi.bulkApplicationStatus(payload);
      const rows = response?.results || [];
      const successCount = rows.filter((row) => row.success).length;
      const failed = rows.filter((row) => !row.success);
      if (failed.length > 0) {
        const summary = failed
          .slice(0, 3)
          .map((row) => `• ${row.applicationId}: ${row.error || "Failed"}`)
          .join("\n");
        openApprovalFeedback({
          title: "Bulk action completed with issues",
          message: `Success: ${successCount}\nFailed: ${failed.length}\n${summary ? `\n${summary}` : ""}`,
          tone: "error",
        });
      } else {
        openApprovalFeedback({
          title: "Bulk action completed",
          message: `Completed successfully for ${successCount} applications.`,
          tone: "success",
        });
      }
      setSelectedIds([]);
      if (typeof onDataChanged === "function") await onDataChanged();
    } catch (error) {
      openApprovalFeedback({
        title: "Bulk action failed",
        message: error?.message || "Bulk action failed.",
        tone: "error",
      });
    } finally {
      setBulkSubmitting(false);
    }
  };

  const openDetails = async (intern) => {
    if (!intern?.applicationId) return;
    setShowDetails(true);
    setDetailsLoading(true);
    setDetailsData(null);
    try {
      const response = await hrApi.applicationById(intern.applicationId);
      setDetailsData(response || null);
    } catch (error) {
      openApprovalFeedback({
        title: "Failed to load details",
        message: error?.message || "Failed to load application details.",
        tone: "error",
      });
      setShowDetails(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const allVisibleSelected = interns.length > 0 && selectedIds.length === interns.length;

  const submitBulkReject = async () => {
    const reason = String(bulkRejectReason || "").trim();
    if (!reason) {
      setBulkRejectError("Rejection reason is required.");
      return;
    }
    setShowBulkRejectModal(false);
    await executeBulkAction("reject", reason);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>Approval Center</h2>
          <p style={{ color: COLORS.textMuted, marginTop: 4 }}>{interns.length} interns awaiting final approval</p>
        </div>
        <SearchBar value={searchTerm || ""} onChange={setSearchTerm} placeholder="Search pending interns..." />
      </div>

      <div style={{ ...glassCardStyle, padding: 14, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.textSecondary, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={(event) => toggleSelectAll(event.target.checked)}
            style={{ width: 16, height: 16, accentColor: COLORS.jungleTeal }}
          />
          Select all visible
        </label>
        <div style={{ color: COLORS.textMuted, fontSize: 13 }}>{selectedIds.length} selected</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => executeBulkAction("under_review")} disabled={!selectedIds.length || bulkSubmitting} style={{ ...secondaryButtonStyle, padding: "8px 12px", fontSize: 12 }}>
            Mark Under Review
          </button>
          <button
            onClick={() => executeBulkAction("reject")}
            disabled={!selectedIds.length || bulkSubmitting}
            style={{ ...secondaryButtonStyle, padding: "8px 12px", fontSize: 12, borderColor: "rgba(239,68,68,0.45)", color: COLORS.red }}
          >
            Bulk Reject
          </button>
          <button
            onClick={() => executeBulkAction("approve")}
            disabled={!selectedIds.length || bulkSubmitting}
            style={{ ...primaryButtonStyle, padding: "8px 12px", fontSize: 12, background: GRADIENTS.accent, opacity: !selectedIds.length || bulkSubmitting ? 0.6 : 1 }}
          >
            Bulk Approve
          </button>
        </div>
      </div>

      {interns.length === 0 ? (
        <div style={glassCardStyle}>
          <EmptyState icon={<Check size={48} />} message="No pending approvals" subMessage="All caught up!" />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 24 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {interns.map((intern, index) => {
              const checked = selectedIds.includes(String(intern.applicationId));
              return (
                <div
                  key={intern.applicationId || intern.email || `pending-${index}`}
                  onClick={() => handleInternSelect(intern)}
                  style={{
                    ...glassCardStyle,
                    padding: 16,
                    cursor: "pointer",
                    borderTop: `2px solid ${selectedIntern?.applicationId === intern.applicationId ? COLORS.emeraldGlow : COLORS.borderGlass}`,
                    borderRight: `2px solid ${selectedIntern?.applicationId === intern.applicationId ? COLORS.emeraldGlow : COLORS.borderGlass}`,
                    borderBottom: `2px solid ${selectedIntern?.applicationId === intern.applicationId ? COLORS.emeraldGlow : COLORS.borderGlass}`,
                    borderLeft: `4px solid ${checked ? COLORS.cyanHighlight : COLORS.emeraldGlow}`,
                    transition: "all 0.2s",
                    background:
                      selectedIntern?.applicationId === intern.applicationId ? `${COLORS.emeraldGlow}15` : COLORS.surfaceGlass,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(event) => toggleSelect(intern.applicationId, event.target.checked)}
                      onClick={(event) => event.stopPropagation()}
                      style={{ width: 16, height: 16, accentColor: COLORS.jungleTeal }}
                    />
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        background: GRADIENTS.emerald,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        color: "white",
                      }}
                    >
                      {(intern.fullName || "?").charAt(0)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: 15 }}>{intern.fullName || "Intern"}</div>
                      <div style={{ fontSize: 13, color: COLORS.textMuted, overflow: "hidden", textOverflow: "ellipsis" }}>{intern.email}</div>
                      <div style={{ fontSize: 12, color: COLORS.emeraldGlow, marginTop: 4 }}>{intern.internshipDomain || intern.degree || "-"}</div>
                    </div>
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openDetails(intern);
                      }}
                      style={{ ...secondaryButtonStyle, padding: "8px 10px", fontSize: 12 }}
                    >
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={glassCardStyle}>
            {!selectedIntern ? (
              <EmptyState icon={<User size={48} />} message="Select an intern to approve" subMessage="Choose from the left list" />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h3 style={{ fontSize: 18, fontWeight: 600, color: COLORS.textPrimary, margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                  <Mail size={18} color={COLORS.emeraldGlow} />
                  Approve Application
                </h3>

                <div style={{ padding: 14, background: COLORS.surfaceGlass, borderRadius: 12, border: `1px solid ${COLORS.borderGlass}` }}>
                  <div style={{ fontWeight: 600, color: COLORS.textPrimary }}>{selectedIntern.fullName}</div>
                  <div style={{ fontSize: 13, color: COLORS.emeraldGlow }}>{selectedIntern.email}</div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: COLORS.textSecondary }}>Start Date *</label>
                    <input
                      type="date"
                      value={startDate}
                      min={minDate}
                      onChange={(event) => {
                        const nextStartDate = event.target.value;
                        setStartDate(nextStartDate);
                        if (endDate && nextStartDate && endDate < nextStartDate) {
                          setEndDate(nextStartDate);
                        }
                      }}
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: COLORS.textSecondary }}>End Date *</label>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || minDate}
                      onChange={(event) => setEndDate(event.target.value)}
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: COLORS.textSecondary }}>Department *</label>
                    <select value={department} onChange={(event) => setDepartment(event.target.value)} style={inputStyle}>
                      <option value="">Select department</option>
                      {DEPARTMENT_OPTIONS.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: COLORS.textSecondary }}>Mentor Name *</label>
                    <input value={mentorName} onChange={(event) => setMentorName(event.target.value)} placeholder="Mentor name" style={inputStyle} />
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: COLORS.textSecondary }}>PM Assignment (optional)</label>
                  <input value={pmCode} onChange={(event) => setPmCode(event.target.value)} placeholder="e.g. PM001" style={{ ...inputStyle, fontFamily: "monospace" }} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: COLORS.textSecondary }}>Stipend (optional)</label>
                    <input value={stipend} onChange={(event) => setStipend(event.target.value)} placeholder="e.g. 15000" style={inputStyle} />
                  </div>
                  <div>
                    <label style={{ display: "block", marginBottom: 6, fontSize: 13, color: COLORS.textSecondary }}>Intern ID</label>
                    <input value={loadingNextInternId ? "Loading..." : nextInternId || "Not available"} readOnly style={{ ...inputStyle, fontFamily: "monospace" }} />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, fontSize: 13, color: COLORS.textSecondary }}>
                      Portal Password *
                      <button onClick={() => setPassword(generatePassword())} type="button" style={{ border: "none", background: "transparent", color: COLORS.emeraldGlow, cursor: "pointer", fontSize: 12 }}>
                        Regenerate
                      </button>
                    </label>
                    <input value={password} onChange={(event) => setPassword(event.target.value)} style={{ ...inputStyle, fontFamily: "monospace" }} />
                  </div>
                  <div />
                </div>

                <EmailTemplateManager
                  internData={{
                    internName: selectedIntern.fullName || "",
                    internEmail: selectedIntern.email || "",
                    internId: nextInternId || selectedIntern.internId || selectedIntern.applicationId || "",
                    domain: resolveDepartmentValue() || selectedIntern.internshipDomain || selectedIntern.domain || "",
                    duration: computeOfferDuration(),
                    startDate: startDate ? new Date(startDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "",
                    pmCode: String(pmCode || "").trim(),
                  }}
                  onTemplateReady={(payload) => setOfferLetterAttachment(payload || null)}
                />

                <div style={{ fontSize: 12, color: COLORS.textMuted }}>
                  Intern ID is generated centrally in EDCS-YYYY-### format and stays in sequence for both HR and Admin creation.
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                  <button
                    onClick={handleApprove}
                    disabled={isSubmitting}
                    style={{
                      ...primaryButtonStyle,
                      flex: 1,
                      background: GRADIENTS.emerald,
                      opacity: isSubmitting ? 0.7 : 1,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                    }}
                  >
                    <Send size={16} /> {isSubmitting ? "Approving..." : "Approve"}
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={isSubmitting}
                    style={{
                      ...primaryButtonStyle,
                      background: `linear-gradient(135deg, ${COLORS.red}, #dc2626)`,
                      opacity: isSubmitting ? 0.7 : 1,
                      cursor: isSubmitting ? "not-allowed" : "pointer",
                    }}
                  >
                    <X size={16} /> Reject
                  </button>
                  <button onClick={resetForm} style={secondaryButtonStyle}>
                    <X size={16} /> Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showDetails && (
        <div
          onClick={() => !detailsLoading && setShowDetails(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2200,
            padding: 16,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(920px, 96vw)",
              maxHeight: "88vh",
              overflowY: "auto",
              borderRadius: 16,
              padding: 20,
              background: COLORS.bgSecondary,
              border: `1px solid ${COLORS.borderGlass}`,
            }}
          >
            {detailsLoading ? (
              <div style={{ color: COLORS.textSecondary }}>Loading application details...</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <h3 style={{ margin: 0, color: COLORS.textPrimary, fontSize: 20 }}>Application Detail</h3>
                  <button onClick={() => setShowDetails(false)} style={{ ...secondaryButtonStyle, padding: "8px 12px" }}>
                    Close
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                  <DetailItem label="Name" value={detailsData?.application?.applicantName || "-"} />
                  <DetailItem label="Email" value={detailsData?.application?.email || "-"} />
                  <DetailItem label="Phone" value={detailsData?.application?.phone || "-"} />
                  <DetailItem label="College" value={detailsData?.application?.college || "-"} />
                  <DetailItem label="Domain" value={detailsData?.application?.domain || "-"} />
                  <DetailItem label="CGPA" value={detailsData?.application?.cgpa ?? "-"} />
                  <DetailItem label="Status" value={detailsData?.application?.status || "-"} />
                  <DetailItem label="Submitted" value={detailsData?.application?.submittedAt ? new Date(detailsData.application.submittedAt).toLocaleString() : "-"} />
                  <DetailItem
                    label="Resume"
                    value={detailsData?.application?.resumeUrl ? "Open" : "-"}
                    link={detailsData?.application?.resumeUrl || ""}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showApproveConfirm && selectedIntern && (
        <Modal onClose={() => (!isSubmitting ? setShowApproveConfirm(false) : null)}>
          <h3 style={{ margin: 0, color: COLORS.textPrimary, fontSize: 22, fontWeight: 700 }}>
            Confirm Approval
          </h3>
          <p style={{ color: COLORS.textSecondary, marginTop: 10, marginBottom: 16 }}>
            Approve <strong>{selectedIntern.fullName}</strong> with these details:
          </p>
          <div style={{ ...glassCardStyle, padding: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div style={{ color: COLORS.textSecondary, fontSize: 13 }}>Start Date</div>
            <div style={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: 13 }}>{startDate}</div>
            <div style={{ color: COLORS.textSecondary, fontSize: 13 }}>End Date</div>
            <div style={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: 13 }}>{endDate}</div>
            <div style={{ color: COLORS.textSecondary, fontSize: 13 }}>Department</div>
            <div style={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: 13 }}>{department}</div>
            <div style={{ color: COLORS.textSecondary, fontSize: 13 }}>Mentor</div>
            <div style={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: 13 }}>{mentorName}</div>
            <div style={{ color: COLORS.textSecondary, fontSize: 13 }}>Stipend</div>
            <div style={{ color: COLORS.textPrimary, fontWeight: 600, fontSize: 13 }}>{stipend || "N/A"}</div>
          </div>
          {offerLetterAttachment?.templateName ? (
            <p style={{ color: COLORS.textMuted, marginTop: 10, marginBottom: 8, fontSize: 12 }}>
              Offer letter ready: <strong>{offerLetterAttachment.templateName}</strong>
            </p>
          ) : null}
          <p style={{ color: COLORS.textMuted, marginTop: 12, marginBottom: 16, fontSize: 12 }}>
            Account credentials will be created automatically.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              onClick={() => setShowApproveConfirm(false)}
              disabled={isSubmitting}
              style={{ ...secondaryButtonStyle, padding: "10px 14px", opacity: isSubmitting ? 0.6 : 1 }}
            >
              Cancel
            </button>
            <button
              onClick={submitApprove}
              disabled={isSubmitting}
              style={{
                ...primaryButtonStyle,
                padding: "10px 14px",
                background: GRADIENTS.emerald,
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              {isSubmitting ? "Approving..." : "Confirm Approve"}
            </button>
          </div>
        </Modal>
      )}

      {showBulkRejectModal && (
        <Modal onClose={() => (!bulkSubmitting ? setShowBulkRejectModal(false) : null)}>
          <h3 style={{ margin: 0, color: COLORS.textPrimary, fontSize: 20 }}>Reject selected applications</h3>
          <p style={{ color: COLORS.textSecondary, marginTop: 10, marginBottom: 14, fontSize: 14 }}>
            Enter one rejection reason for all selected applications.
          </p>
          <textarea
            value={bulkRejectReason}
            onChange={(event) => {
              setBulkRejectReason(event.target.value);
              if (bulkRejectError) setBulkRejectError("");
            }}
            rows={5}
            placeholder="Reason is required..."
            style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
          />
          {bulkRejectError ? (
            <div style={{ marginTop: 8, color: COLORS.red, fontSize: 12 }}>{bulkRejectError}</div>
          ) : null}
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              onClick={() => setShowBulkRejectModal(false)}
              disabled={bulkSubmitting}
              style={{ ...secondaryButtonStyle, padding: "10px 14px", opacity: bulkSubmitting ? 0.6 : 1 }}
            >
              Cancel
            </button>
            <button
              onClick={submitBulkReject}
              disabled={bulkSubmitting}
              style={{
                ...primaryButtonStyle,
                padding: "10px 14px",
                background: COLORS.red,
                opacity: bulkSubmitting ? 0.6 : 1,
              }}
            >
              {bulkSubmitting ? "Rejecting..." : "Confirm Reject"}
            </button>
          </div>
        </Modal>
      )}

      {approvalFeedback.open && (
        <Modal
          onClose={() =>
            setApprovalFeedback({
              open: false,
              title: "",
              message: "",
              tone: "info",
            })
          }
        >
          <h3 style={{ margin: 0, color: COLORS.textPrimary, fontSize: 20 }}>
            {approvalFeedback.title || "Update"}
          </h3>
          <p style={{ color: COLORS.textSecondary, marginTop: 10, marginBottom: 16, whiteSpace: "pre-line" }}>
            {approvalFeedback.message}
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() =>
                setApprovalFeedback({
                  open: false,
                  title: "",
                  message: "",
                  tone: "info",
                })
              }
              style={{
                ...primaryButtonStyle,
                padding: "10px 16px",
                background:
                  approvalFeedback.tone === "success"
                    ? COLORS.emeraldGlow
                    : approvalFeedback.tone === "error"
                      ? COLORS.red
                      : GRADIENTS.accent,
              }}
            >
              OK
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function DetailItem({ label, value, link }) {
  return (
    <div style={{ padding: 10, borderRadius: 10, border: `1px solid ${COLORS.borderGlass}`, background: "rgba(255,255,255,0.03)" }}>
      <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 4 }}>{label}</div>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer" style={{ color: COLORS.cyanHighlight, fontSize: 13, textDecoration: "none" }}>
          {value}
        </a>
      ) : (
        <div style={{ fontSize: 13, color: COLORS.textPrimary, overflowWrap: "anywhere" }}>{value}</div>
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

      {/* Filters */}
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

      {/* List */}
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
export function NewRegistrationsSection({
  interns,
  searchTerm,
  setSearchTerm,
  onApprove,
  onReject,
  onBulkMoveToApproval,
  onBulkReject,
}) {
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [emailContent, setEmailContent] = useState("");
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingTime, setMeetingTime] = useState("");
  const [meetingLink, setMeetingLink] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsData, setDetailsData] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [bulkRejectReason, setBulkRejectReason] = useState("");
  const [bulkRejectError, setBulkRejectError] = useState("");
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [bulkFeedback, setBulkFeedback] = useState({
    open: false,
    title: "",
    message: "",
    tone: "info",
  });

  const getDefaultEmailTemplate = (intern, date = "[To be scheduled]", time = "", link = "") => {
    const dateTimeText = date !== "[To be scheduled]"
      ? `${date}${time ? " at " + time : ""}`
      : date;
   
    const linkText = link
      ? `Meeting Link: ${link}`
      : "Meeting Link: [Will be shared shortly]";

    return `Dear ${intern?.fullName || "[Intern Name]"},

Thank you for your application to our internship program. We have carefully reviewed your profile and are impressed with your qualifications.

We would like to schedule a meeting with you to discuss the next steps and learn more about your interests.

MEETING DETAILS:
-------------------------
Date & Time: ${dateTimeText}
${linkText}
-------------------------

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

  useEffect(() => {
    const valid = new Set((interns || []).map((intern) => String(intern.applicationId || intern.email || "")));
    setSelectedIds((prev) => prev.filter((id) => valid.has(String(id))));
    if (selectedIntern) {
      const key = String(selectedIntern.applicationId || selectedIntern.email || "");
      if (!valid.has(key)) setSelectedIntern(null);
    }
  }, [interns, selectedIntern]);

  const handleInternSelect = async (intern, options = {}) => {
    setSelectedIntern(intern);
    setEmailContent(getDefaultEmailTemplate(intern));
    setCc("");
    setBcc("");
    setMeetingDate("");
    setMeetingTime("");
    setMeetingLink("");

    if (options.openDetails && intern?.applicationId) {
      await openDetails(intern);
    }
  };

  const openDetails = async (intern) => {
    if (!intern?.applicationId) {
      openBulkFeedback({
        title: "Details unavailable",
        message: "Application details are unavailable for this record.",
        tone: "error",
      });
      return;
    }
    setShowDetails(true);
    setDetailsLoading(true);
    setDetailsData(null);
    try {
      const response = await hrApi.applicationById(intern.applicationId);
      setDetailsData(response || null);
    } catch (error) {
      openBulkFeedback({
        title: "Failed to load details",
        message: error?.message || "Failed to load application details.",
        tone: "error",
      });
      setShowDetails(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewPDF = (intern) => {
    if (!intern.applicationPDF || !intern.applicationPDF.base64) {
      openBulkFeedback({
        title: "PDF unavailable",
        message: "Application PDF is not available for this intern.",
        tone: "error",
      });
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
      openBulkFeedback({
        title: "PDF open failed",
        message: "Error opening PDF. Please try again.",
        tone: "error",
      });
    }
  };

  const rowKey = (intern) => String(intern?.applicationId || intern?.email || "");

  const openBulkFeedback = ({ title, message, tone = "info" }) => {
    setBulkFeedback({ open: true, title, message, tone });
  };

  const toggleSelect = (intern, checked) => {
    const key = rowKey(intern);
    setSelectedIds((prev) => (checked ? Array.from(new Set([...prev, key])) : prev.filter((id) => id !== key)));
  };

  const toggleSelectAll = (checked) => {
    if (!checked) {
      setSelectedIds([]);
      return;
    }
    const all = (interns || []).map((intern) => rowKey(intern)).filter(Boolean);
    setSelectedIds(all);
  };

  const handleSendEmail = async () => {
    if (!selectedIntern || !emailContent.trim()) {
      openBulkFeedback({
        title: "Missing details",
        message: "Please select an intern and write an email.",
        tone: "error",
      });
      return;
    }

    // Validate CC/BCC
    if (cc && !validateMultipleEmails(cc)) {
      openBulkFeedback({
        title: "Invalid CC format",
        message: "Use comma-separated emails.\nExample: example1@mail.com, example2@mail.com",
        tone: "error",
      });
      return;
    }

    if (bcc && !validateMultipleEmails(bcc)) {
      openBulkFeedback({
        title: "Invalid BCC format",
        message: "Use comma-separated emails.\nExample: example1@mail.com, example2@mail.com",
        tone: "error",
      });
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: selectedIntern.email,
          cc: cc || undefined,
          bcc: bcc || undefined,
          subject: "Internship Application - Next Steps",
          html: emailContent.replace(/\n/g, '<br>'),
        }),
      });

      if (!res.ok) throw new Error("Email failed");
     
      openBulkFeedback({
        title: "Email sent",
        message: `Email sent successfully to ${selectedIntern.fullName}.`,
        tone: "success",
      });
    } catch (err) {
      console.warn("Email sending failed:", err);
      openBulkFeedback({
        title: "Email failed",
        message: `Email could not be sent: ${err.message}\nYou can still accept the intern and meeting details will be saved.`,
        tone: "error",
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleAccept = () => {
    if (!selectedIntern) {
      openBulkFeedback({
        title: "No selection",
        message: "Please select an intern first.",
        tone: "error",
      });
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
    if (!selectedIntern) {
      openBulkFeedback({
        title: "No selection",
        message: "Please select an intern first.",
        tone: "error",
      });
      return;
    }
    setShowRejectConfirm(true);
  };

  const confirmReject = () => {
    if (!selectedIntern) {
      setShowRejectConfirm(false);
      return;
    }
    onReject(selectedIntern);
    setShowRejectConfirm(false);
    setSelectedIntern(null);
    setEmailContent("");
    setCc("");
    setBcc("");
    setMeetingDate("");
    setMeetingTime("");
    setMeetingLink("");
  };

  const handleBulkMove = async () => {
    if (!selectedIds.length) {
      openBulkFeedback({
        title: "No selection",
        message: "Select at least one registration.",
        tone: "error",
      });
      return;
    }
    if (typeof onBulkMoveToApproval !== "function") {
      openBulkFeedback({
        title: "Action unavailable",
        message: "Bulk move action is not configured.",
        tone: "error",
      });
      return;
    }
    const selectedRows = (interns || []).filter((intern) => selectedIds.includes(rowKey(intern)));
    setBulkSubmitting(true);
    try {
      const result = await onBulkMoveToApproval(selectedRows);
      setSelectedIds([]);
      if (selectedIntern && selectedRows.some((row) => rowKey(row) === rowKey(selectedIntern))) {
        setSelectedIntern(null);
      }
      const failed = Array.isArray(result?.failed) ? result.failed : [];
      const successCount = Number.isFinite(result?.success)
        ? result.success
        : Math.max(0, selectedRows.length - failed.length);
      if (failed.length > 0) {
        const summary = failed
          .slice(0, 3)
          .map((row) => `• ${row.applicationId || "Unknown"}: ${row.error || "Failed"}`)
          .join("\n");
        openBulkFeedback({
          title: "Bulk move completed with issues",
          message: `Moved ${successCount}/${selectedRows.length} registrations.\n\nFailed: ${failed.length}${summary ? `\n${summary}` : ""}`,
          tone: "error",
        });
      } else {
        openBulkFeedback({
          title: "Bulk move completed",
          message: `Moved ${successCount} registration(s) to Approval Center.`,
          tone: "success",
        });
      }
    } catch (error) {
      openBulkFeedback({
        title: "Bulk move failed",
        message: error?.message || "Failed to move selected registrations.",
        tone: "error",
      });
    } finally {
      setBulkSubmitting(false);
    }
  };

  const handleBulkReject = async () => {
    if (!selectedIds.length) {
      openBulkFeedback({
        title: "No selection",
        message: "Select at least one registration.",
        tone: "error",
      });
      return;
    }
    if (typeof onBulkReject !== "function") {
      openBulkFeedback({
        title: "Action unavailable",
        message: "Bulk reject action is not configured.",
        tone: "error",
      });
      return;
    }
    setBulkRejectReason("");
    setBulkRejectError("");
    setShowBulkRejectModal(true);
  };

  const submitBulkReject = async () => {
    const reason = String(bulkRejectReason || "").trim();
    if (!reason) {
      setBulkRejectError("Rejection reason is required.");
      return;
    }
    if (!selectedIds.length) {
      setShowBulkRejectModal(false);
      openBulkFeedback({
        title: "No selection",
        message: "Select at least one registration.",
        tone: "error",
      });
      return;
    }
    const selectedRows = (interns || []).filter((intern) => selectedIds.includes(rowKey(intern)));
    setBulkSubmitting(true);
    try {
      const result = await onBulkReject(selectedRows, reason);
      setSelectedIds([]);
      if (selectedIntern && selectedRows.some((row) => rowKey(row) === rowKey(selectedIntern))) {
        setSelectedIntern(null);
      }
      setShowBulkRejectModal(false);
      const failed = Array.isArray(result?.failed) ? result.failed : [];
      const successCount = Number.isFinite(result?.success)
        ? result.success
        : Math.max(0, selectedRows.length - failed.length);
      if (failed.length > 0) {
        const summary = failed
          .slice(0, 3)
          .map((row) => `• ${row.applicationId || "Unknown"}: ${row.error || "Failed"}`)
          .join("\n");
        openBulkFeedback({
          title: "Bulk reject completed with issues",
          message: `Rejected ${successCount}/${selectedRows.length} registrations.\n\nFailed: ${failed.length}${summary ? `\n${summary}` : ""}`,
          tone: "error",
        });
      } else {
        openBulkFeedback({
          title: "Bulk reject completed",
          message: `Rejected ${successCount} registration(s).`,
          tone: "success",
        });
      }
    } catch (error) {
      setShowBulkRejectModal(false);
      openBulkFeedback({
        title: "Bulk reject failed",
        message: error?.message || "Failed to reject selected registrations.",
        tone: "error",
      });
    } finally {
      setBulkSubmitting(false);
    }
  };

  const allVisibleSelected = interns.length > 0 && selectedIds.length === interns.length;

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

      <div style={{ ...glassCardStyle, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.textSecondary, fontSize: 13 }}>
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={(event) => toggleSelectAll(event.target.checked)}
            style={{ width: 16, height: 16, accentColor: COLORS.jungleTeal }}
          />
          Select all visible
        </label>
        <div style={{ color: COLORS.textMuted, fontSize: 13 }}>{selectedIds.length} selected</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={handleBulkMove}
            disabled={!selectedIds.length || bulkSubmitting}
            style={{ ...primaryButtonStyle, padding: "8px 12px", fontSize: 12, background: GRADIENTS.accent, opacity: !selectedIds.length || bulkSubmitting ? 0.6 : 1 }}
          >
            Move Selected to Approval
          </button>
          <button
            onClick={handleBulkReject}
            disabled={!selectedIds.length || bulkSubmitting}
            style={{ ...secondaryButtonStyle, padding: "8px 12px", fontSize: 12, borderColor: "rgba(239,68,68,0.45)", color: COLORS.red }}
          >
            Reject Selected
          </button>
        </div>
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
              const internKey = rowKey(intern);
              const isSelected = rowKey(selectedIntern) === internKey;
              const checked = selectedIds.includes(internKey);
              return (
                <div
                  key={internKey || `registration-${idx}`}
                  onClick={() => handleInternSelect(intern, { openDetails: true })}
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
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => toggleSelect(intern, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ width: 16, height: 16, accentColor: COLORS.jungleTeal }}
                      />
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
                    
                    {/* View Application button */}
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
                    
                    {/* View Application button in header */}
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
                    <strong>Workflow:</strong> Send acknowledgment email, then move the intern to Approval Center. Meeting details are saved with the intern record.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showDetails && (
        <div
          onClick={() => !detailsLoading && setShowDetails(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2200,
            padding: 16,
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              width: "min(920px, 96vw)",
              maxHeight: "88vh",
              overflowY: "auto",
              borderRadius: 16,
              padding: 20,
              background: COLORS.bgSecondary,
              border: `1px solid ${COLORS.borderGlass}`,
            }}
          >
            {detailsLoading ? (
              <div style={{ color: COLORS.textSecondary }}>Loading application details...</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                  <h3 style={{ margin: 0, color: COLORS.textPrimary, fontSize: 20 }}>Application Detail</h3>
                  <button onClick={() => setShowDetails(false)} style={{ ...secondaryButtonStyle, padding: "8px 12px" }}>
                    Close
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
                  <DetailItem label="Name" value={detailsData?.application?.applicantName || "-"} />
                  <DetailItem label="Email" value={detailsData?.application?.email || "-"} />
                  <DetailItem label="Phone" value={detailsData?.application?.phone || "-"} />
                  <DetailItem label="College" value={detailsData?.application?.college || "-"} />
                  <DetailItem label="Domain" value={detailsData?.application?.domain || "-"} />
                  <DetailItem label="CGPA" value={detailsData?.application?.cgpa ?? "-"} />
                  <DetailItem label="Status" value={detailsData?.application?.status || "-"} />
                  <DetailItem label="Submitted" value={detailsData?.application?.submittedAt ? new Date(detailsData.application.submittedAt).toLocaleString() : "-"} />
                  <DetailItem
                    label="Resume"
                    value={detailsData?.application?.resumeUrl ? "Open" : "-"}
                    link={detailsData?.application?.resumeUrl || ""}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showBulkRejectModal && (
        <Modal onClose={() => (!bulkSubmitting ? setShowBulkRejectModal(false) : null)}>
          <h3 style={{ margin: 0, color: COLORS.textPrimary, fontSize: 20 }}>Reject Selected Registrations</h3>
          <p style={{ color: COLORS.textSecondary, marginTop: 10, marginBottom: 14, fontSize: 14 }}>
            Enter one rejection reason for all selected registrations.
          </p>
          <textarea
            value={bulkRejectReason}
            onChange={(event) => {
              setBulkRejectReason(event.target.value);
              if (bulkRejectError) setBulkRejectError("");
            }}
            rows={5}
            placeholder="Reason is required..."
            style={{ ...inputStyle, resize: "vertical", minHeight: 120 }}
          />
          {bulkRejectError ? (
            <div style={{ marginTop: 8, color: COLORS.red, fontSize: 12 }}>{bulkRejectError}</div>
          ) : null}
          <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              onClick={() => setShowBulkRejectModal(false)}
              disabled={bulkSubmitting}
              style={{ ...secondaryButtonStyle, padding: "10px 14px", opacity: bulkSubmitting ? 0.6 : 1 }}
            >
              Cancel
            </button>
            <button
              onClick={submitBulkReject}
              disabled={bulkSubmitting}
              style={{
                ...primaryButtonStyle,
                padding: "10px 14px",
                background: COLORS.red,
                opacity: bulkSubmitting ? 0.6 : 1,
              }}
            >
              {bulkSubmitting ? "Rejecting..." : "Confirm Reject"}
            </button>
          </div>
        </Modal>
      )}

      {showRejectConfirm && selectedIntern && (
        <Modal onClose={() => setShowRejectConfirm(false)}>
          <h3 style={{ margin: 0, color: COLORS.textPrimary, fontSize: 20 }}>Confirm reject</h3>
          <p style={{ color: COLORS.textSecondary, marginTop: 10, marginBottom: 16 }}>
            Are you sure you want to reject <strong>{selectedIntern.fullName}</strong>?
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button
              onClick={() => setShowRejectConfirm(false)}
              style={{ ...secondaryButtonStyle, padding: "10px 14px" }}
            >
              Cancel
            </button>
            <button
              onClick={confirmReject}
              style={{ ...primaryButtonStyle, padding: "10px 14px", background: COLORS.red }}
            >
              Confirm Reject
            </button>
          </div>
        </Modal>
      )}

      {bulkFeedback.open && (
        <Modal
          onClose={() =>
            setBulkFeedback({
              open: false,
              title: "",
              message: "",
              tone: "info",
            })
          }
        >
          <h3 style={{ margin: 0, color: COLORS.textPrimary, fontSize: 20 }}>{bulkFeedback.title || "Bulk action"}</h3>
          <p style={{ color: COLORS.textSecondary, marginTop: 10, marginBottom: 16, whiteSpace: "pre-line" }}>
            {bulkFeedback.message}
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() =>
                setBulkFeedback({
                  open: false,
                  title: "",
                  message: "",
                  tone: "info",
                })
              }
              style={{
                ...primaryButtonStyle,
                padding: "10px 16px",
                background: bulkFeedback.tone === "success" ? COLORS.emeraldGlow : bulkFeedback.tone === "error" ? COLORS.red : GRADIENTS.accent,
              }}
            >
              OK
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ==================== PM SECTION ====================
export function PMSection({ pms, users, onViewInterns, onChat }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentTab, setDepartmentTab] = useState("All");

  const DEPARTMENT_TABS = ["All", "SAP", "ORACLE", "ACCOUNTS", "HR"];

  const normalizeDepartment = (value) => {
    const upper = String(value || "").trim().toUpperCase();
    if (upper === "SAP") return "SAP";
    if (upper === "ORACLE") return "ORACLE";
    if (upper === "ACCOUNTS" || upper === "ACCOUNT" || upper === "ACCOUNTING") return "ACCOUNTS";
    if (upper === "HR" || upper === "HUMAN RESOURCES") return "HR";
    return "";
  };

  const getInternDepartment = (intern) =>
    intern?.department ||
    intern?.internshipDomain ||
    intern?.domain ||
    intern?.internship_domain ||
    intern?.department_name ||
    intern?.departmentName ||
    "";

  const getInternCount = (pmCode) => {
    const pmKey = String(pmCode || "");
    const interns = (users || []).filter((u) => u.role === "intern" && String(u.pmCode || u.pm_code || "") === pmKey);
    if (departmentTab === "All") return interns.length;
    return interns.filter((intern) => normalizeDepartment(getInternDepartment(intern)) === departmentTab).length;
  };

  const filteredPMs = pms.filter((pm) => {
    const searchLower = searchQuery.toLowerCase();
    const displayName = (pm.name || pm.fullName || "").toLowerCase();
    const email = (pm.email || "").toLowerCase();
    const code = (pm.pmCode || "").toLowerCase();

    const matchesSearch = (
      displayName.includes(searchLower) ||
      email.includes(searchLower) ||
      code.includes(searchLower)
    );
    const matchesDepartment = departmentTab === "All" ? true : getInternCount(pm.pmCode) > 0;
    return matchesSearch && matchesDepartment;
  });

  const totalAssignedInterns = filteredPMs.reduce((sum, pm) => sum + getInternCount(pm.pmCode), 0);
  const activePMs = filteredPMs.filter(pm => pm.status === "active").length;

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
                {filteredPMs.length}
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

      {/* Search Bar */}
      <div
        className="glass animate-fadeIn stagger-4"
        style={{
          padding: "16px",
          borderRadius: "12px",
          marginBottom: "24px",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
          {DEPARTMENT_TABS.map((tab) => {
            const selected = tab === departmentTab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setDepartmentTab(tab)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "10px",
                  border: selected ? `1px solid ${COLORS.deepOcean}` : "1px solid rgba(103, 146, 137, 0.25)",
                  background: selected ? `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})` : "rgba(103, 146, 137, 0.08)",
                  color: selected ? COLORS.peachGlow : "rgba(255, 229, 217, 0.85)",
                  fontSize: "12px",
                  fontWeight: 700,
                  letterSpacing: "0.3px",
                  cursor: "pointer",
                }}
              >
                {tab}
              </button>
            );
          })}
        </div>
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

      {/* PMs Grid */}
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
export function ReportsSection() {
  return <ReportsInbox />;
}

// ==================== ACTIVE INTERNS FULL PAGE WRAPPER ====================
export const ActiveInterns = ({ onNavigateToMessages, users, initialPmCode, initialPmName, onClearPmFilter }) => (
  <ActiveInternsPage
    onNavigateToMessages={onNavigateToMessages}
    users={users}
    initialPmCode={initialPmCode}
    initialPmName={initialPmName}
    onClearPmFilter={onClearPmFilter}
  />
);


