import React from "react";
import {
  Clock, UserCheck, Users, Briefcase, CheckCircle2, FileText,
  Megaphone, Plus, Download
} from "lucide-react";
import { COLORS, GRADIENTS, glassCardStyle, smallButtonStyle } from "./HRConstants";
import {
  StatCard, StatMini, PendingCard, ActiveInternCard, PMCard,
  AnnouncementCard, EmptyState, SearchBar, DailyLogsReport,
  SummaryReport, TNAReport, AttendanceReport, PMPerformanceReport
} from "./HRComponents";


// ==================== DASHBOARD SECTION ====================
export function DashboardSection({ stats, currentHR, getGreeting, announcements, pendingInterns, onApprove, onReject, onCreateAnnouncement, onDeleteAnnouncement, onPinAnnouncement }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Welcome Banner */}
      <div style={{
        ...glassCardStyle,
        background: GRADIENTS.accent,
        border: "none",
        animation: "slideUp 0.5s ease",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 28, fontWeight: 700, margin: 0, color: "white" }}>
              {getGreeting()}, {currentHR?.fullName?.split(" ")[0] || "there"}!
            </h2>
            <p style={{ color: "rgba(255,255,255,0.8)", marginTop: 8, fontSize: 15 }}>
              You have {stats.pending} pending approvals and {stats.newRegistrations} new registrations today.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <StatMini icon={<Clock size={18} />} value={stats.pending} label="Pending" color={COLORS.orange} />
            <StatMini icon={<UserCheck size={18} />} value={stats.active} label="Active" color={COLORS.emeraldGlow} />
          </div>
        </div>
      </div>


      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <StatCard icon={<Clock size={24} />} label="Pending Approvals" value={stats.pending} color={COLORS.orange} delay={0} />
        <StatCard icon={<UserCheck size={24} />} label="Active Interns" value={stats.active} color={COLORS.emeraldGlow} delay={0.1} />
        <StatCard icon={<Users size={24} />} label="Total Interns" value={stats.total} color={COLORS.jungleTeal} delay={0.2} />
        <StatCard icon={<Briefcase size={24} />} label="Project Managers" value={stats.pms} color={COLORS.purple} delay={0.3} />
      </div>


      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Pending Approvals Quick View */}
        <div style={{ ...glassCardStyle, animation: "slideUp 0.5s ease 0.2s both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: COLORS.textPrimary, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <Clock size={20} color={COLORS.orange} />
              Pending Approvals
            </h3>
            <span style={{ fontSize: 13, color: COLORS.textMuted }}>{stats.pending} total</span>
          </div>
          {pendingInterns.length === 0 ? (
            <EmptyState icon={<CheckCircle2 size={40} />} message="No pending approvals" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {pendingInterns.map((intern, idx) => (
                <PendingCard key={idx} intern={intern} onApprove={onApprove} onReject={onReject} compact />
              ))}
            </div>
          )}
        </div>


        {/* Announcements */}
        <div style={{ ...glassCardStyle, animation: "slideUp 0.5s ease 0.3s both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: COLORS.textPrimary, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <Megaphone size={20} color={COLORS.cyanHighlight} />
              Announcements
            </h3>
            <button onClick={onCreateAnnouncement} style={smallButtonStyle}>
              <Plus size={16} /> New
            </button>
          </div>
          {announcements.length === 0 ? (
            <EmptyState icon={<Megaphone size={40} />} message="No announcements yet" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {announcements.slice(0, 3).map((a) => (
                <AnnouncementCard key={a.id} announcement={a} onDelete={onDeleteAnnouncement} onPin={onPinAnnouncement} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ==================== APPROVAL SECTION ====================
export function ApprovalSection({ interns, searchTerm, setSearchTerm, onApprove, onReject }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>
            Approval Center
          </h2>
          <p style={{ color: COLORS.textMuted, marginTop: 4 }}>{interns.length} pending approvals</p>
        </div>
        <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search pending interns..." />
      </div>


      {interns.length === 0 ? (
        <div style={glassCardStyle}>
          <EmptyState icon={<CheckCircle2 size={48} />} message="No pending approvals" subMessage="All caught up!" />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 16 }}>
          {interns.map((intern, idx) => (
            <PendingCard key={idx} intern={intern} onApprove={onApprove} onReject={onReject} />
          ))}
        </div>
      )}
    </div>
  );
}


// ==================== ACTIVE INTERNS SECTION ====================
export function ActiveInternsSection({ interns, searchTerm, setSearchTerm, filterPM, setFilterPM, filterStatus, setFilterStatus, allPMs, onViewProfile, onToggleDisable, onChat }) {
  const selectStyle = {
    padding: "10px 16px",
    borderRadius: 12,
    border: `1px solid rgba(255,255,255,0.15)`,
    background: "rgba(255,255,255,0.04)",
    color: COLORS.textPrimary,
    outline: "none",
    fontSize: 14,
    cursor: "pointer",
  };


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>
            Active Interns
          </h2>
          <p style={{ color: COLORS.textMuted, marginTop: 4 }}>{interns.length} active interns</p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search interns..." />
          <select value={filterPM} onChange={e => setFilterPM(e.target.value)} style={selectStyle}>
            <option value="">All PMs</option>
            {allPMs.map(pm => <option key={pm.pmCode} value={pm.pmCode}>{pm.pmCode}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="disabled">Disabled</option>
          </select>
          <button onClick={() => alert("Export CSV")} style={smallButtonStyle}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>


      {interns.length === 0 ? (
        <div style={glassCardStyle}>
          <EmptyState icon={<Users size={48} />} message="No active interns found" />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {interns.map((intern, idx) => (
            <ActiveInternCard
              key={idx}
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
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>
            New Registrations
          </h2>
          <p style={{ color: COLORS.textMuted, marginTop: 4 }}>{interns.length} new this week</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search registrations..." />
          <button style={smallButtonStyle}>
            <CheckCircle2 size={16} /> Bulk Approve
          </button>
        </div>
      </div>


      {interns.length === 0 ? (
        <div style={glassCardStyle}>
          <EmptyState icon={<FileText size={48} />} message="No new registrations" />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 16 }}>
          {interns.map((intern, idx) => (
            <PendingCard key={idx} intern={intern} onApprove={onApprove} onReject={onReject} showTimestamp />
          ))}
        </div>
      )}
    </div>
  );
}


// ==================== PM SECTION ====================
export function PMSection({ pms, users, onViewProfile, onChat }) {
  const getInternCount = (pmCode) => users.filter(u => u.role === "intern" && u.pmCode === pmCode).length;


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>
          Project Managers
        </h2>
        <p style={{ color: COLORS.textMuted, marginTop: 4 }}>{pms.length} project managers</p>
      </div>


      {pms.length === 0 ? (
        <div style={glassCardStyle}>
          <EmptyState icon={<Briefcase size={48} />} message="No project managers" />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {pms.map((pm, idx) => (
            <PMCard
              key={idx}
              pm={pm}
              internCount={getInternCount(pm.pmCode)}
              onViewProfile={onViewProfile}
              onChat={onChat}
            />
          ))}
        </div>
      )}
    </div>
  );
}


// ==================== REPORTS SECTION ====================
export function ReportsSection({ users, reportsTab, setReportsTab }) {
  const tabs = [
    { id: "daily", label: "Daily Logs" },
    { id: "summary", label: "Summary" },
    { id: "tna", label: "TNA" },
    { id: "attendance", label: "Attendance" },
    { id: "pm", label: "PM Performance" },
  ];


  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: 12,
    border: `1px solid rgba(255,255,255,0.15)`,
    background: "rgba(255,255,255,0.04)",
    color: COLORS.textPrimary,
    outline: "none",
    fontSize: 14,
    fontFamily: "inherit",
    transition: "border-color 0.2s",
  };


  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>Reports</h2>
          <p style={{ color: COLORS.textMuted, marginTop: 4 }}>Analytics and performance data</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <input type="date" style={inputStyle} />
          <input type="date" style={inputStyle} />
          <button style={smallButtonStyle}>
            <Download size={16} /> Export All
          </button>
        </div>
      </div>


      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, background: COLORS.surfaceGlass, padding: 6, borderRadius: 14 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setReportsTab(tab.id)}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14,
              background: reportsTab === tab.id ? GRADIENTS.accent : "transparent",
              color: reportsTab === tab.id ? "white" : COLORS.textSecondary,
              transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>


      <div style={glassCardStyle}>
        {reportsTab === "daily" && <DailyLogsReport users={users} />}
        {reportsTab === "summary" && <SummaryReport users={users} />}
        {reportsTab === "tna" && <TNAReport users={users} />}
        {reportsTab === "attendance" && <AttendanceReport users={users} />}
        {reportsTab === "pm" && <PMPerformanceReport users={users} />}
      </div>
    </div>
  );
}
