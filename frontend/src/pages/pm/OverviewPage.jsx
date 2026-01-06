// OverviewPage.jsx - Complete and Fully Functional
import React, { useState, useEffect } from "react";
import { Users, Clock, CheckCircle, FileText, Coffee, Target, Zap, Bell, ChevronRight, Plus, X, Calendar, Trash2, Download, TrendingUp, AlertCircle, Edit, Pin } from "lucide-react";

const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
  success: "#4ade80",
  warning: "#f59e0b",
  purple: "#a78bfa",
};

export default function OverviewPage({ pm, interns, stats, isMobile, weeklyReports }) {
  const [announcements, setAnnouncements] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [newAnnouncement, setNewAnnouncement] = useState({ 
    title: "", 
    message: "", 
    priority: "medium" 
  });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadAnnouncements();
  }, [pm]);

  const loadAnnouncements = async () => {
    try {
      const saved = JSON.parse(localStorage.getItem("pmAnnouncements") || "[]");
      const pmAnnouncements = saved.filter(a => a.pmCode === pm?.pmCode);
      
      if (pmAnnouncements.length === 0) {
        const sample = [
          { 
            id: Date.now(), 
            title: "Welcome New Interns!", 
            message: "Please complete your profile setup and daily logs consistently.", 
            date: new Date().toISOString(), 
            priority: "high", 
            pmCode: pm?.pmCode 
          },
          { 
            id: Date.now() + 1, 
            title: "Weekly Sync Meeting", 
            message: "Remember our team standup every Monday at 10 AM.", 
            date: new Date(Date.now() - 86400000).toISOString(), 
            priority: "medium", 
            pmCode: pm?.pmCode 
          }
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

  const handleAddAnnouncement = () => {
    if (!newAnnouncement.title.trim() || !newAnnouncement.message.trim()) {
      alert("Please fill in all fields");
      return;
    }
    
    if (editingAnnouncement) {
      // Update existing announcement
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
      // Create new announcement
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
    
    // Sort: pinned first, then by date
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

  const handleExportStats = async () => {
    setIsExporting(true);
    
    try {
      const data = {
        exportDate: new Date().toISOString(),
        pm: {
          name: pm?.fullName,
          code: pm?.pmCode,
          email: pm?.email
        },
        stats: {
          activeInterns: stats.activeInterns,
          totalHours: stats.totalHours,
          totalTasks: stats.totalTasks,
          pendingReports: stats.pendingReports
        },
        interns: interns.map(i => ({
          name: i.fullName,
          email: i.email,
          degree: i.degree,
          hours: i.hoursLogged || 0,
          tasks: i.tasksCompleted || 0,
          status: i.status || "active"
        })),
        announcements: announcements.map(a => ({
          title: a.title,
          message: a.message,
          priority: a.priority,
          date: a.date
        }))
      };
      
      // Create downloadable file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pm-overview-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert("Overview data exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const quickActions = [
    { 
      icon: <FileText size={20} />, 
      label: "Review Reports", 
      desc: `${stats.pendingReports} pending`, 
      color: COLORS.jungleTeal,
      action: () => alert("Navigating to Review Reports... (Connect to parent component)")
    },
    { 
      icon: <Users size={20} />, 
      label: "View Interns", 
      desc: `${interns.length} active`, 
      color: COLORS.peachGlow,
      action: () => alert("Navigating to My Interns... (Connect to parent component)")
    },
    { 
      icon: <Target size={20} />, 
      label: "Analytics", 
      desc: "View insights", 
      color: COLORS.warning,
      action: () => alert("Navigating to Analytics... (Connect to parent component)")
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      {/* Hero Section */}
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
        <div style={{ position: "absolute", top: -100, right: -100, width: 400, height: 400, background: `radial-gradient(circle, ${COLORS.peachGlow}15 0%, transparent 60%)`, borderRadius: "50%", animation: "float 6s ease-in-out infinite" }} />
        <div style={{ position: "absolute", bottom: -80, left: -80, width: 300, height: 300, background: `radial-gradient(circle, ${COLORS.jungleTeal}20 0%, transparent 60%)`, borderRadius: "50%", animation: "float 8s ease-in-out infinite reverse" }} />
        
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 40, position: "relative", zIndex: 1, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255, 229, 217, 0.12)", padding: "8px 16px", borderRadius: 30, marginBottom: 20, border: "1px solid rgba(255, 229, 217, 0.2)" }}>
              <Coffee size={16} color={COLORS.peachGlow} />
              <span style={{ color: COLORS.peachGlow, fontSize: 13, fontWeight: 600 }}>
                {getGreeting()}!
              </span>
            </div>
            
            <h2 style={{ fontSize: isMobile ? 36 : 48, margin: 0, color: "white", fontFamily: "'Outfit', sans-serif", fontWeight: 800, lineHeight: 1.1, marginBottom: 12 }}>
              Welcome back,<br />
              <span style={{ background: `linear-gradient(135deg, ${COLORS.peachGlow} 0%, ${COLORS.jungleTeal} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {pm?.fullName?.split(" ")[0] || "PM"}!
              </span>
            </h2>
            
            <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 16, margin: "16px 0 0", maxWidth: 400, lineHeight: 1.7 }}>
              You're doing great managing {interns.length} intern{interns.length !== 1 ? "s" : ""}. Keep guiding them towards excellence!
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <HeroStatCard icon={<Users size={22} />} value={stats.activeInterns} label="Active Interns" color={COLORS.peachGlow} delay={0} />
            <HeroStatCard icon={<Clock size={22} />} value={`${stats.totalHours}h`} label="Hours Logged" color={COLORS.jungleTeal} delay={1} />
            <HeroStatCard icon={<CheckCircle size={22} />} value={stats.totalTasks} label="Tasks Done" color={COLORS.purple} delay={2} />
            <HeroStatCard icon={<FileText size={22} />} value={stats.pendingReports} label="Pending" color={COLORS.warning} delay={3} />
          </div>
        </div>
      </div>

      {/* Announcements - Full Width */}
      <div className="glass animate-fadeIn stagger-3" style={{ padding: 24, borderRadius: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ color: "white", fontSize: 18, fontWeight: 600, display: "flex", alignItems: "center", gap: 10, margin: 0 }}>
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
              background: COLORS.jungleTeal,
              color: "white", border: "none", borderRadius: 10, 
              fontSize: 14, fontWeight: 600, cursor: "pointer", 
              display: "flex", alignItems: "center", gap: 8, 
              transition: "all 0.2s" 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(103, 146, 137, 0.4)";
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
              <AnnouncementCard 
                key={ann.id} 
                announcement={ann} 
                onDelete={() => handleDeleteAnnouncement(ann.id)}
                onEdit={() => handleEditAnnouncement(ann)}
                onPin={() => handlePinAnnouncement(ann.id)}
              />
            ))
          ) : (
            <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.5)" }}>
              <Bell size={48} color={COLORS.jungleTeal} style={{ marginBottom: 16, opacity: 0.5 }} />
              <h4 style={{ color: "white", fontSize: 18, marginBottom: 8 }}>No announcements yet</h4>
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
            background: "rgba(0,0,0,0.8)", 
            backdropFilter: "blur(8px)", 
            display: "flex", alignItems: "center", 
            justifyContent: "center", zIndex: 2000, padding: 20 
          }}
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="glass animate-scaleIn" 
            style={{ width: "100%", maxWidth: 500, borderRadius: 24 }}
          >
            <div style={{ padding: 24, borderBottom: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2 style={{ color: "white", margin: 0, fontSize: 20, fontWeight: 700 }}>
                {editingAnnouncement ? "Edit Announcement" : "New Announcement"}
              </h2>
              <button 
                onClick={() => {
                  setShowAddModal(false);
                  setEditingAnnouncement(null);
                }} 
                style={{ background: "rgba(255,255,255,0.1)", border: "none", borderRadius: 10, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "white" }}
              >
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: 24 }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", color: "rgba(255,255,255,0.9)", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Title *</label>
                <input 
                  type="text" 
                  value={newAnnouncement.title} 
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })} 
                  placeholder="e.g., Team Meeting Tomorrow" 
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(103, 146, 137, 0.25)", background: "rgba(255,255,255,0.04)", color: "white", fontSize: 14, outline: "none" }} 
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", color: "rgba(255,255,255,0.9)", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Message *</label>
                <textarea 
                  value={newAnnouncement.message} 
                  onChange={(e) => setNewAnnouncement({ ...newAnnouncement, message: e.target.value })} 
                  placeholder="Write your message..." 
                  rows={4} 
                  style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(103, 146, 137, 0.25)", background: "rgba(255,255,255,0.04)", color: "white", fontSize: 14, outline: "none", resize: "vertical", fontFamily: "inherit" }} 
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", color: "rgba(255,255,255,0.9)", marginBottom: 8, fontWeight: 500, fontSize: 14 }}>Priority</label>
                <div style={{ display: "flex", gap: 12 }}>
                  {["high", "medium", "low"].map(priority => (
                    <button 
                      key={priority} 
                      onClick={() => setNewAnnouncement({ ...newAnnouncement, priority })} 
                      style={{ 
                        flex: 1, padding: "10px 16px", borderRadius: 10, 
                        border: `2px solid ${newAnnouncement.priority === priority ? (priority === "high" ? COLORS.racingRed : priority === "medium" ? COLORS.warning : COLORS.jungleTeal) : "rgba(255,255,255,0.1)"}`, 
                        background: newAnnouncement.priority === priority ? `${priority === "high" ? COLORS.racingRed : priority === "medium" ? COLORS.warning : COLORS.jungleTeal}20` : "transparent", 
                        color: "white", cursor: "pointer", fontSize: 13, 
                        fontWeight: 600, textTransform: "capitalize", 
                        transition: "all 0.2s" 
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
                  style={{ flex: 1, padding: "14px 20px", background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontWeight: 600, cursor: "pointer", fontSize: 14 }}
                >
                  Cancel
                </button>
                <button 
                  onClick={handleAddAnnouncement} 
                  style={{ flex: 1, padding: "14px 20px", background: `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)`, color: "white", border: "none", borderRadius: 12, fontWeight: 600, cursor: "pointer", fontSize: 14 }}
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

function HeroStatCard({ icon, value, label, color, delay }) {
  return (
    <div 
      className="animate-scaleIn" 
      style={{ 
        background: "rgba(255,255,255,0.06)", 
        backdropFilter: "blur(10px)", 
        borderRadius: 18, padding: 20, 
        border: "1px solid rgba(255,255,255,0.1)", 
        display: "flex", flexDirection: "column", gap: 12, 
        animationDelay: `${delay * 0.1}s`, 
        opacity: 0, transition: "all 0.3s ease" 
      }}
      onMouseEnter={(e) => { 
        e.currentTarget.style.background = "rgba(255,255,255,0.1)"; 
        e.currentTarget.style.borderColor = `${color}40`; 
      }}
      onMouseLeave={(e) => { 
        e.currentTarget.style.background = "rgba(255,255,255,0.06)"; 
        e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; 
      }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", color: color, border: `1px solid ${color}30` }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 800, color: "white", fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginTop: 4, fontWeight: 500 }}>{label}</div>
      </div>
    </div>
  );
}

function AnnouncementCard({ announcement, onDelete, onEdit, onPin }) {
  const priorityConfig = {
    high: { color: COLORS.racingRed, bg: `${COLORS.racingRed}15`, border: `${COLORS.racingRed}30` },
    medium: { color: COLORS.warning, bg: `${COLORS.warning}15`, border: `${COLORS.warning}30` },
    low: { color: COLORS.jungleTeal, bg: `${COLORS.jungleTeal}15`, border: `${COLORS.jungleTeal}30` }
  };
  const config = priorityConfig[announcement.priority] || priorityConfig.medium;
  
  return (
    <div 
      className="hover-lift" 
      style={{ 
        padding: 20, borderRadius: 16, 
        background: announcement.pinned ? "rgba(103, 146, 137, 0.08)" : "rgba(255,255,255,0.03)", 
        border: announcement.pinned ? `1px solid ${COLORS.jungleTeal}40` : "1px solid rgba(255,255,255,0.06)", 
        borderLeft: `4px solid ${config.color}`, 
        transition: "all 0.2s",
        position: "relative"
      }}
    >
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
          border: `1px solid ${COLORS.jungleTeal}40`
        }}>
          <Pin size={10} />
          PINNED
        </div>
      )}
      
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10, gap: 12, paddingRight: announcement.pinned ? 80 : 0 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: "white", marginBottom: 4 }}>{announcement.title}</div>
          <span style={{ background: config.bg, color: config.color, padding: "3px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", border: `1px solid ${config.border}` }}>
            {announcement.priority}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onPin();
            }}
            style={{ 
              background: announcement.pinned ? `${COLORS.jungleTeal}25` : "rgba(103, 146, 137, 0.15)", 
              border: "none", 
              borderRadius: 8, width: 32, height: 32, 
              display: "flex", alignItems: "center", 
              justifyContent: "center", cursor: "pointer", 
              color: COLORS.jungleTeal, transition: "all 0.2s", 
              flexShrink: 0 
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(103, 146, 137, 0.3)"}
            onMouseLeave={(e) => e.currentTarget.style.background = announcement.pinned ? `${COLORS.jungleTeal}25` : "rgba(103, 146, 137, 0.15)"}
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
              background: "rgba(103, 146, 137, 0.15)", border: "none", 
              borderRadius: 8, width: 32, height: 32, 
              display: "flex", alignItems: "center", 
              justifyContent: "center", cursor: "pointer", 
              color: COLORS.jungleTeal, transition: "all 0.2s", 
              flexShrink: 0 
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(103, 146, 137, 0.25)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(103, 146, 137, 0.15)"}
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
              background: "rgba(217, 4, 41, 0.15)", border: "none", 
              borderRadius: 8, width: 32, height: 32, 
              display: "flex", alignItems: "center", 
              justifyContent: "center", cursor: "pointer", 
              color: COLORS.racingRed, transition: "all 0.2s", 
              flexShrink: 0 
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = "rgba(217, 4, 41, 0.25)"}
            onMouseLeave={(e) => e.currentTarget.style.background = "rgba(217, 4, 41, 0.15)"}
            title="Delete announcement"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", marginBottom: 10, lineHeight: 1.6 }}>
        {announcement.message}
      </p>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 6 }}>
        <Calendar size={12} />
        {new Date(announcement.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );
}