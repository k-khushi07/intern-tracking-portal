// OverviewPage.jsx - Updated to match HR Dashboard Design
import React, { useState, useEffect } from "react";
import { Users, Clock, CheckCircle, FileText, Coffee, Target, Bell, Plus, X, Calendar, Trash2, Edit, Pin, Sparkles } from "lucide-react";

// ==================== DESIGN SYSTEM (Matching HR Dashboard) ====================
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
  emerald: `linear-gradient(135deg, ${COLORS.emeraldGlow} 0%, ${COLORS.jungleTeal} 100%)`,
  ocean: `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.cyanHighlight} 100%)`,
};

const glassCardStyle = {
  background: COLORS.surfaceGlass,
  backdropFilter: "blur(14px)",
  borderRadius: 18,
  padding: 24,
  border: `1px solid ${COLORS.borderGlass}`,
  boxShadow: `0 8px 30px rgba(15, 118, 110, 0.15)`,
};

const keyframes = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(-20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
`;

export default function OverviewPage({ pm, interns, stats, sharedAnnouncements = [] }) {
  const [announcements, setAnnouncements] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [newAnnouncement, setNewAnnouncement] = useState({ 
    title: "", 
    message: "", 
    priority: "medium" 
  });

  useEffect(() => {
    const loadAnnouncements = async () => {
      try {
        const saved = JSON.parse(localStorage.getItem("pmAnnouncements") || "[]");
        const pmAnnouncements = saved.filter((announcement) => announcement.pmCode === pm?.pmCode);

        if (pmAnnouncements.length === 0) {
          const sample = [
            {
              id: Date.now(),
              title: "Welcome New Interns!",
              message: "Please complete your profile setup and daily logs consistently.",
              date: new Date().toISOString(),
              priority: "high",
              pmCode: pm?.pmCode,
            },
            {
              id: Date.now() + 1,
              title: "Weekly Sync Meeting",
              message: "Remember our team standup every Monday at 10 AM.",
              date: new Date(Date.now() - 86400000).toISOString(),
              priority: "medium",
              pmCode: pm?.pmCode,
            },
          ];
          setAnnouncements(sample);
          localStorage.setItem("pmAnnouncements", JSON.stringify([...saved, ...sample]));
        } else {
          setAnnouncements(pmAnnouncements);
        }
      } catch (error) {
        console.error("Error loading announcements:", error);
        setAnnouncements([]);
      }
    };

    loadAnnouncements();
  }, [pm?.pmCode]);

  const mappedSharedAnnouncements = (sharedAnnouncements || []).map((a) => ({
    id: a.id,
    title: a.title,
    message: a.content,
    date: a.created_at || a.createdAt,
    priority: a.priority || "medium",
    pinned: !!a.pinned,
    pmCode: pm?.pmCode,
    readOnly: true,
    from: a.created_by?.full_name || a.created_by?.email || "HR",
  }));

  const displayAnnouncements = [...mappedSharedAnnouncements, ...announcements];

  const handleAddAnnouncement = () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
      alert("Please fill in all fields");
      return;
    }
    
    if (editingAnnouncement) {
      const updated = announcements.map(a => 
        a.id === editingAnnouncement.id 
          ? { ...a, ...newAnnouncement, date: new Date().toISOString() }
          : a
      );
      setAnnouncements(updated);
      
      try {
        const allAnnouncements = JSON.parse(localStorage.getItem("pmAnnouncements") || "[]");
        const updatedAll = allAnnouncements.map(a => 
          a.id === editingAnnouncement.id 
            ? { ...a, ...newAnnouncement, date: new Date().toISOString() }
            : a
        );
        localStorage.setItem("pmAnnouncements", JSON.stringify(updatedAll));
        alert("Announcement updated successfully!");
      } catch (error) {
        console.error("Error updating announcement:", error);
      }
      setEditingAnnouncement(null);
    } else {
      const announcement = { 
        id: Date.now(), 
        ...newAnnouncement, 
        date: new Date().toISOString(), 
        pmCode: pm?.pmCode 
      };
      
      const updated = [...announcements, announcement];
      setAnnouncements(updated);
      
      try {
        const allAnnouncements = JSON.parse(localStorage.getItem("pmAnnouncements") || "[]");
        localStorage.setItem("pmAnnouncements", JSON.stringify([...allAnnouncements, announcement]));
        alert("Announcement created successfully!");
      } catch (error) {
        console.error("Error saving announcement:", error);
      }
    }
    
    setNewAnnouncement({ title: "", message: "", priority: "medium" });
    setShowAddModal(false);
  };

  const handleEditAnnouncement = (announcement) => {
    setEditingAnnouncement(announcement);
    setNewAnnouncement({
      title: announcement.title,
      message: announcement.message,
      priority: announcement.priority
    });
    setShowAddModal(true);
  };

  const handlePinAnnouncement = (id) => {
    const updated = announcements.map(a => 
      a.id === id ? { ...a, pinned: !a.pinned } : a
    );
    
    const sorted = updated.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.date) - new Date(a.date);
    });
    
    setAnnouncements(sorted);
    
    try {
      const allAnnouncements = JSON.parse(localStorage.getItem("pmAnnouncements") || "[]");
      const updatedAll = allAnnouncements.map(a => 
        a.id === id ? { ...a, pinned: !a.pinned } : a
      );
      localStorage.setItem("pmAnnouncements", JSON.stringify(updatedAll));
    } catch (error) {
      console.error("Error pinning announcement:", error);
    }
  };

  const handleDeleteAnnouncement = (id) => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;
    
    const updated = announcements.filter(a => a.id !== id);
    setAnnouncements(updated);
    
    try {
      const allAnnouncements = JSON.parse(localStorage.getItem("pmAnnouncements") || "[]");
      localStorage.setItem("pmAnnouncements", JSON.stringify(allAnnouncements.filter(a => a.id !== id)));
      alert("Announcement deleted successfully!");
    } catch (error) {
      console.error("Error deleting announcement:", error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <style>{keyframes}</style>

      {/* Welcome Banner - Matching HR Dashboard */}
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
              <Coffee size={16} color="white" />
              <span style={{ color: "white", fontSize: 13, fontWeight: 600 }}>
                {getGreeting()}!
              </span>
            </div>
            
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "white", fontFamily: "'Inter', system-ui, sans-serif" }}>
              Welcome back, {pm?.fullName?.split(" ")[0] || "PM"}!
            </h2>
            <p style={{ color: "rgba(255,255,255,0.8)", marginTop: 8, fontSize: 15 }}>
              You're managing {interns.length} intern{interns.length !== 1 ? "s" : ""}. Keep guiding them towards excellence!
            </p>
          </div>
        </div>
      </div>

      {/* Stats Grid - Matching HR Dashboard */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard icon={<Users size={24} />} label="Active Interns" value={stats.activeInterns} color={COLORS.emeraldGlow} delay={0} />
        <StatCard icon={<Clock size={24} />} label="Hours Logged" value={`${stats.totalHours}h`} color={COLORS.jungleTeal} delay={0.1} />
        <StatCard icon={<CheckCircle size={24} />} label="Tasks Done" value={stats.totalTasks} color={COLORS.purple} delay={0.2} />
        <StatCard icon={<FileText size={24} />} label="Pending" value={stats.pendingReports} color={COLORS.orange} delay={0.3} />
      </div>

      {/* Announcements - Matching HR Dashboard */}
      <div style={{ ...glassCardStyle, animation: "slideUp 0.5s ease 0.3s both" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ color: COLORS.textPrimary, fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center", gap: 10, margin: 0, fontFamily: "'Inter', system-ui, sans-serif" }}>
            <Bell size={20} color={COLORS.jungleTeal} /> Announcements
          </h3>
          <button 
            onClick={() => {
              setEditingAnnouncement(null);
              setNewAnnouncement({ title: "", message: "", priority: "medium" });
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
          {displayAnnouncements.length > 0 ? (
            displayAnnouncements.map((ann) => (
              <AnnouncementCard 
                key={ann.id} 
                announcement={ann} 
                onDelete={ann.readOnly ? null : () => handleDeleteAnnouncement(ann.id)}
                onEdit={ann.readOnly ? null : () => handleEditAnnouncement(ann)}
                onPin={ann.readOnly ? null : () => handlePinAnnouncement(ann.id)}
              />
            ))
          ) : (
            <div style={{ textAlign: "center", padding: 60, color: COLORS.textMuted }}>
              <Bell size={48} color={COLORS.jungleTeal} style={{ marginBottom: 16, opacity: 0.5 }} />
              <h4 style={{ color: COLORS.textPrimary, fontSize: 18, marginBottom: 8, fontFamily: "'Inter', system-ui, sans-serif" }}>No announcements yet</h4>
              <p style={{ fontSize: 14, marginTop: 8 }}>New intern orientation begins next week.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Announcement Modal */}
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
                  value={newAnnouncement.message} 
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })} 
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

// ==================== STAT COMPONENTS (Matching HR Dashboard) ====================
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

function AnnouncementCard({ announcement, onDelete, onEdit, onPin }) {
  const priorityConfig = {
    high: { color: COLORS.red, bg: `${COLORS.red}15`, border: `${COLORS.red}30` },
    medium: { color: COLORS.orange, bg: `${COLORS.orange}15`, border: `${COLORS.orange}30` },
    low: { color: COLORS.jungleTeal, bg: `${COLORS.jungleTeal}15`, border: `${COLORS.jungleTeal}30` }
  };
  const config = priorityConfig[announcement.priority] || priorityConfig.medium;
  
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
            {announcement.priority}
          </span>
          {announcement.readOnly && (
            <span
              style={{
                marginLeft: 8,
                background: `${COLORS.jungleTeal}10`,
                color: COLORS.jungleTeal,
                padding: "3px 10px",
                borderRadius: 20,
                fontSize: 10,
                fontWeight: 700,
                border: `1px solid ${COLORS.jungleTeal}30`,
                fontFamily: "'Inter', system-ui, sans-serif",
              }}
            >
              HR
            </span>
          )}
        </div>
        {!announcement.readOnly && (
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
        )}
      </div>
      <p style={{ fontSize: 14, color: COLORS.textSecondary, marginBottom: 10, lineHeight: 1.6 }}>
        {announcement.message}
      </p>
      <div style={{ fontSize: 12, color: COLORS.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
        <Calendar size={12} />
        {new Date(announcement.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}
