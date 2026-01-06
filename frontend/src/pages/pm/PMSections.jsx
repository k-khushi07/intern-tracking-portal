// PMSections.jsx
import React from "react";
import {
  Users, FileText, Megaphone, Plus, Download, Clock, CheckCircle, Activity, TrendingUp
} from "lucide-react";
import { COLORS, GRADIENTS, glassCardStyle, smallButtonStyle } from "./PMConstants";
import {
  StatCard, StatMini, InternCard, DailyLogCard, AnnouncementCard,
  EmptyState, SearchBar
} from "./PMComponents";

// ==================== DASHBOARD SECTION ====================
export function DashboardSection({ 
  stats, 
  currentPM, 
  getGreeting, 
  recentInterns, 
  recentLogs, 
  announcements,
  onViewProfile,
  onViewLogs,
  onChat,
  onViewLogDetails,
  onCreateAnnouncement
}) {
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
              {getGreeting()}, {currentPM?.fullName?.split(" ")[0] || "there"}!
            </h2>
            <p style={{ color: "rgba(255,255,255,0.8)", marginTop: 8, fontSize: 15 }}>
              You have {stats.pendingLogs} pending logs to review and {stats.activeInterns} active interns.
            </p>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <StatMini icon={<Clock size={18} />} value={stats.pendingLogs} label="Pending" color={COLORS.orange} />
            <StatMini icon={<Users size={18} />} value={stats.activeInterns} label="Active" color={COLORS.emeraldGlow} />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        <StatCard icon={<Users size={24} />} label="My Interns" value={stats.activeInterns} color={COLORS.jungleTeal} delay={0} />
        <StatCard icon={<Clock size={24} />} label="Pending Logs" value={stats.pendingLogs} color={COLORS.orange} delay={0.1} />
        <StatCard icon={<CheckCircle size={24} />} label="Approved Today" value={stats.approvedToday} color={COLORS.emeraldGlow} delay={0.2} />
        <StatCard icon={<Activity size={24} />} label="Total Hours" value={`${stats.totalHours}h`} color={COLORS.purple} delay={0.3} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Recent Interns Activity */}
        <div style={{ ...glassCardStyle, animation: "slideUp 0.5s ease 0.2s both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: COLORS.textPrimary, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <Users size={20} color={COLORS.jungleTeal} />
              Recent Interns
            </h3>
            <span style={{ fontSize: 13, color: COLORS.textMuted }}>{stats.activeInterns} total</span>
          </div>
          {recentInterns.length === 0 ? (
            <EmptyState icon={<Users size={40} />} message="No interns assigned" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentInterns.map((intern, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    padding: 14,
                    borderRadius: 12,
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
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
                        fontSize: 14,
                        color: "white",
                      }}
                    >
                      {intern.fullName?.charAt(0) || "I"}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{intern.fullName}</div>
                      <div style={{ fontSize: 12, color: COLORS.textMuted }}>{intern.email}</div>
                    </div>
                  </div>
                  <button onClick={() => onViewProfile(intern)} style={{ ...smallButtonStyle, fontSize: 12, padding: "6px 12px" }}>
                    View
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Logs */}
        <div style={{ ...glassCardStyle, animation: "slideUp 0.5s ease 0.3s both" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: COLORS.textPrimary, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <FileText size={20} color={COLORS.orange} />
              Recent Logs
            </h3>
            <span style={{ fontSize: 13, color: COLORS.textMuted }}>{stats.pendingLogs} pending</span>
          </div>
          {recentLogs.length === 0 ? (
            <EmptyState icon={<CheckCircle size={40} />} message="No recent logs" />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {recentLogs.map((log, idx) => (
                <div
                  key={idx}
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    padding: 12,
                    borderRadius: 12,
                    borderLeft: `3px solid ${log.status === 'pending' ? COLORS.orange : COLORS.emeraldGlow}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: COLORS.textPrimary }}>{log.internName}</div>
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>{log.hours}h</span>
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textSecondary }}>{log.task?.substring(0, 50)}...</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <span style={{ fontSize: 11, color: COLORS.textMuted }}>{new Date(log.date).toLocaleDateString()}</span>
                    <button onClick={() => onViewLogDetails(log)} style={{ ...smallButtonStyle, fontSize: 11, padding: "4px 10px" }}>
                      Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Announcements Preview */}
      <div style={{ ...glassCardStyle, animation: "slideUp 0.5s ease 0.4s both" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: COLORS.textPrimary, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            <Megaphone size={20} color={COLORS.cyanHighlight} />
            My Announcements
          </h3>
          <button onClick={onCreateAnnouncement} style={smallButtonStyle}>
            <Plus size={16} /> New
          </button>
        </div>
        {announcements.length === 0 ? (
          <EmptyState icon={<Megaphone size={40} />} message="No announcements yet" subMessage="Create your first announcement" />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {announcements.slice(0, 3).map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} onDelete={() => {}} isOwner={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ==================== MY INTERNS SECTION ====================
export function MyInternsSection({ 
  interns, 
  searchTerm, 
  setSearchTerm, 
  onViewProfile, 
  onViewLogs,
  onChat 
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>
            My Interns
          </h2>
          <p style={{ color: COLORS.textMuted, marginTop: 4 }}>{interns.length} interns under your supervision</p>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search interns..." />
          <button style={smallButtonStyle}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {interns.length === 0 ? (
        <div style={glassCardStyle}>
          <EmptyState 
            icon={<Users size={48} />} 
            message="No interns assigned" 
            subMessage="Interns will appear here once HR assigns them to you" 
          />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {interns.map((intern, idx) => (
            <InternCard
              key={idx}
              intern={intern}
              onViewProfile={onViewProfile}
              onChat={onChat}
              onViewLogs={onViewLogs}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== DAILY LOGS SECTION ====================
export function DailyLogsSection({ 
  logs, 
  searchTerm, 
  setSearchTerm, 
  filterStatus,
  setFilterStatus,
  onApprove, 
  onReject, 
  onViewDetails 
}) {
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
            Daily Logs
          </h2>
          <p style={{ color: COLORS.textMuted, marginTop: 4 }}>
            {logs.filter(l => l.status === 'pending').length} pending logs to review
          </p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <SearchBar value={searchTerm} onChange={setSearchTerm} placeholder="Search logs..." />
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={selectStyle}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <button style={smallButtonStyle}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {logs.length === 0 ? (
        <div style={glassCardStyle}>
          <EmptyState icon={<FileText size={48} />} message="No logs found" />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 16 }}>
          {logs.map((log, idx) => (
            <DailyLogCard
              key={idx}
              log={log}
              onApprove={onApprove}
              onReject={onReject}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== ANNOUNCEMENTS SECTION ====================
export function AnnouncementsSection({ 
  announcements, 
  onCreateAnnouncement, 
  onDeleteAnnouncement 
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>
            Announcements
          </h2>
          <p style={{ color: COLORS.textMuted, marginTop: 4 }}>
            {announcements.length} announcements • Visible to your interns only
          </p>
        </div>
        <button onClick={onCreateAnnouncement} style={smallButtonStyle}>
          <Plus size={16} /> New Announcement
        </button>
      </div>

      {announcements.length === 0 ? (
        <div style={glassCardStyle}>
          <EmptyState 
            icon={<Megaphone size={48} />} 
            message="No announcements yet" 
            subMessage="Create announcements to keep your interns informed"
          />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {announcements.map((announcement) => (
            <div key={announcement.id} style={glassCardStyle}>
              <AnnouncementCard 
                announcement={announcement} 
                onDelete={onDeleteAnnouncement}
                isOwner={true}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ==================== REPORTS SECTION ====================
export function ReportsSection({ interns, logs, reportsTab, setReportsTab }) {
  const tabs = [
    { id: "summary", label: "Summary" },
    { id: "intern-performance", label: "Intern Performance" },
    { id: "attendance", label: "Attendance" },
    { id: "productivity", label: "Productivity" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>Reports</h2>
          <p style={{ color: COLORS.textMuted, marginTop: 4 }}>Analytics and performance insights</p>
        </div>
        <button style={smallButtonStyle}>
          <Download size={16} /> Export All
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 8, background: COLORS.surfaceGlass, padding: 6, borderRadius: 14, flexWrap: "wrap" }}>
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
        {reportsTab === "summary" && <SummaryReport interns={interns} logs={logs} />}
        {reportsTab === "intern-performance" && <InternPerformanceReport interns={interns} logs={logs} />}
        {reportsTab === "attendance" && <AttendanceReport interns={interns} />}
        {reportsTab === "productivity" && <ProductivityReport interns={interns} logs={logs} />}
      </div>
    </div>
  );
}

// ==================== REPORT COMPONENTS ====================
function SummaryReport({ interns, logs }) {
  const totalHours = logs.filter(l => l.status === 'approved').reduce((sum, log) => sum + (log.hours || 0), 0);
  const avgHoursPerIntern = interns.length > 0 ? (totalHours / interns.length).toFixed(1) : 0;
  const pendingLogs = logs.filter(l => l.status === 'pending').length;
  const approvedLogs = logs.filter(l => l.status === 'approved').length;

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
      <SummaryCard title="Total Interns" value={interns.length} subtitle="Under supervision" color={COLORS.jungleTeal} />
      <SummaryCard title="Total Hours" value={`${totalHours}h`} subtitle="This month" color={COLORS.emeraldGlow} />
      <SummaryCard title="Avg Hours/Intern" value={`${avgHoursPerIntern}h`} subtitle="Per intern" color={COLORS.cyanHighlight} />
      <SummaryCard title="Pending Reviews" value={pendingLogs} subtitle="Awaiting approval" color={COLORS.orange} />
      <SummaryCard title="Approved Logs" value={approvedLogs} subtitle="This month" color={COLORS.purple} />
    </div>
  );
}

function SummaryCard({ title, value, subtitle, color }) {
  return (
    <div style={{ background: COLORS.surfaceGlass, padding: 20, borderRadius: 14, border: `1px solid ${COLORS.borderGlass}` }}>
      <div style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 8 }}>{title}</div>
      <div style={{ fontSize: 32, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 12, color: COLORS.textMuted }}>{subtitle}</div>
    </div>
  );
}

function InternPerformanceReport({ interns, logs }) {
  const getInternStats = (intern) => {
    const internLogs = logs.filter(l => l.internEmail === intern.email);
    const approvedLogs = internLogs.filter(l => l.status === 'approved');
    const totalHours = approvedLogs.reduce((sum, log) => sum + (log.hours || 0), 0);
    const avgHours = approvedLogs.length > 0 ? (totalHours / approvedLogs.length).toFixed(1) : 0;
    
    return {
      totalHours,
      logsSubmitted: internLogs.length,
      avgHours,
    };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {interns.length === 0 ? (
        <EmptyState icon={<Users size={40} />} message="No interns to display" />
      ) : (
        interns.map((intern, idx) => {
          const stats = getInternStats(intern);
          return (
            <div key={idx} style={{ background: COLORS.surfaceGlass, padding: 16, borderRadius: 12, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: "50%", background: GRADIENTS.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white", fontSize: 18 }}>
                {intern.fullName?.charAt(0) || "I"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: COLORS.textPrimary }}>{intern.fullName}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>{intern.email}</div>
              </div>
              <div style={{ display: "flex", gap: 20 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.emeraldGlow }}>{stats.totalHours}h</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>Total Hours</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.cyanHighlight }}>{stats.logsSubmitted}</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>Logs</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.purple }}>{stats.avgHours}h</div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>Avg/Day</div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function AttendanceReport({ interns }) {
  // Mock attendance data - in real app, this would come from actual data
  const getAttendanceData = (intern) => {
    const total = 22;
    const present = Math.floor(Math.random() * 5) + 17; // Random between 17-22
    const percentage = Math.round((present / total) * 100);
    return { present, absent: total - present, percentage };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {interns.length === 0 ? (
        <EmptyState icon={<Calendar size={40} />} message="No attendance data" />
      ) : (
        interns.map((intern, idx) => {
          const attendance = getAttendanceData(intern);
          return (
            <div key={idx} style={{ background: COLORS.surfaceGlass, padding: 16, borderRadius: 12, display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", background: GRADIENTS.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white" }}>
                {intern.fullName?.charAt(0) || "I"}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: COLORS.textPrimary }}>{intern.fullName}</div>
                <div style={{ fontSize: 12, color: COLORS.textMuted }}>{attendance.present} present, {attendance.absent} absent</div>
              </div>
              <div style={{
                width: 50, height: 50, borderRadius: "50%",
                background: `conic-gradient(${attendance.percentage >= 90 ? COLORS.emeraldGlow : COLORS.orange} ${attendance.percentage * 3.6}deg, ${COLORS.surfaceGlass} 0deg)`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: COLORS.inkBlack, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: COLORS.textPrimary }}>
                  {attendance.percentage}%
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

function ProductivityReport({ interns, logs }) {
  const getProductivityScore = (intern) => {
    const internLogs = logs.filter(l => l.internEmail === intern.email && l.status === 'approved');
    const totalHours = internLogs.reduce((sum, log) => sum + (log.hours || 0), 0);
    const avgHours = internLogs.length > 0 ? totalHours / internLogs.length : 0;
    
    // Simple productivity score based on avg hours (max 8)
    const score = Math.min(Math.round((avgHours / 8) * 100), 100);
    return { score, totalHours, logsCount: internLogs.length };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {interns.length === 0 ? (
        <EmptyState icon={<TrendingUp size={40} />} message="No productivity data" />
      ) : (
        interns.map((intern, idx) => {
          const productivity = getProductivityScore(intern);
          return (
            <div key={idx} style={{ background: COLORS.surfaceGlass, padding: 16, borderRadius: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: "50%", background: GRADIENTS.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white" }}>
                  {intern.fullName?.charAt(0) || "I"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: COLORS.textPrimary }}>{intern.fullName}</div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted }}>{productivity.totalHours}h total • {productivity.logsCount} logs</div>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: productivity.score >= 80 ? COLORS.emeraldGlow : productivity.score >= 60 ? COLORS.orange : COLORS.racingRed }}>
                  {productivity.score}%
                </div>
              </div>
              <div style={{ height: 8, background: COLORS.inkBlack, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ 
                  height: "100%", 
                  width: `${productivity.score}%`, 
                  background: productivity.score >= 80 ? COLORS.emeraldGlow : productivity.score >= 60 ? COLORS.orange : COLORS.racingRed,
                  transition: "width 0.3s ease"
                }} />
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}