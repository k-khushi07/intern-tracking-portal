// ReviewLogsPage.jsx
import React, { useState } from "react";
import { FileText, Calendar, Clock, CheckCircle, XCircle, Eye, Download, ChevronRight, TrendingUp } from "lucide-react";

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

export default function ReviewLogsPage({ weeklyReports, monthlyReports, isMobile }) {
  const [activeTab, setActiveTab] = useState("weekly");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const tnaData = [
    { week: 1, task: "Finalizing chatbot flow", planned: "Jan 8", action: "Research patterns, document flows", executed: "Jan 8", status: "Completed", reason: "-", deliverable: "Flow document" },
    { week: 1, task: "Preparing Q&A + menu", planned: "Jan 9", action: "Compile FAQ, design menu", executed: "Jan 9", status: "Completed", reason: "-", deliverable: "Q&A database" },
    { week: 1, task: "Designing chatbot UI", planned: "Jan 10", action: "Create wireframes", executed: "Jan 11", status: "Completed", reason: "Extra iterations", deliverable: "React components" },
    { week: 2, task: "Backend API setup", planned: "Jan 16", action: "Setup Express server", executed: "Jan 17", status: "Completed", reason: "Auth delay", deliverable: "API docs" },
    { week: 2, task: "Frontend-backend integration", planned: "Jan 18", action: "Connect React to APIs", executed: "-", status: "In Progress", reason: "-", deliverable: "Integrated app" },
  ];

  const handleApproveReport = (report) => {
    alert(`Approved report for ${report.internName}`);
  };

  const handleRejectReport = (report) => {
    const reason = prompt("Enter rejection reason:");
    if (reason) {
      alert(`Rejected report for ${report.internName}: ${reason}`);
    }
  };

  const handleViewDetail = (report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div className="animate-fadeIn" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
          <div>
            <h2 style={{ color: "white", fontSize: 24, fontWeight: 700, margin: 0 }}>Review Reports</h2>
            <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 8, fontSize: 14 }}>📄 Review weekly and monthly reports from your interns</p>
          </div>
          <button style={{ padding: "12px 20px", background: `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)`, color: "white", border: "none", borderRadius: 12, fontWeight: 600, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <Download size={18} />Export All
          </button>
        </div>

        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "rgba(74, 222, 128, 0.15)", borderRadius: 25, border: "1px solid rgba(74, 222, 128, 0.3)" }}>
          <div className="animate-pulse" style={{ width: 10, height: 10, borderRadius: "50%", background: "#4ade80" }} />
          <span style={{ color: "#4ade80", fontSize: 14, fontWeight: 500 }}>Live Sync with Google Docs/Sheets</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass" style={{ padding: 4, borderRadius: 16, marginBottom: 24, display: "inline-flex", gap: 4 }}>
        <button onClick={() => setActiveTab("weekly")} style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: activeTab === "weekly" ? `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})` : "transparent", color: "white", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.2s" }}>
          📅 Weekly Reports
        </button>
        <button onClick={() => setActiveTab("monthly")} style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: activeTab === "monthly" ? `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})` : "transparent", color: "white", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.2s" }}>
          📊 Monthly Reports
        </button>
        <button onClick={() => setActiveTab("tna")} style={{ padding: "12px 24px", borderRadius: 12, border: "none", background: activeTab === "tna" ? `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})` : "transparent", color: "white", fontWeight: 600, fontSize: 14, cursor: "pointer", transition: "all 0.2s" }}>
          📈 TNA Tracker
        </button>
      </div>

      {/* Weekly Reports */}
      {activeTab === "weekly" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {weeklyReports && weeklyReports.length > 0 ? (
            weeklyReports.map(report => (
              <div key={report.id} className="glass hover-lift" style={{ padding: 24, borderRadius: 18, transition: "all 0.3s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <h3 style={{ color: "white", fontSize: 18, fontWeight: 600, margin: 0 }}>Week {report.weekNumber} Report</h3>
                    <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 4, fontSize: 14 }}>{report.internName} • {report.dateRange}</p>
                  </div>
                  <span style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: report.status === "approved" ? `${COLORS.success}20` : report.status === "rejected" ? `${COLORS.racingRed}20` : `${COLORS.warning}20`, color: report.status === "approved" ? COLORS.success : report.status === "rejected" ? COLORS.racingRed : COLORS.warning, border: `1px solid ${report.status === "approved" ? COLORS.success : report.status === "rejected" ? COLORS.racingRed : COLORS.warning}40`, textTransform: "capitalize" }}>
                    {report.status}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
                  <div style={{ padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Total Hours</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.jungleTeal }}>{report.totalHours}h</div>
                  </div>
                  <div style={{ padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Days Worked</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.peachGlow }}>{report.daysWorked}</div>
                  </div>
                  <div style={{ padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Avg Hours/Day</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.purple }}>{(report.totalHours / report.daysWorked).toFixed(1)}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 8, fontWeight: 600 }}>Summary</div>
                  <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.7, fontSize: 14, margin: 0 }}>{report.summary}</p>
                </div>

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button onClick={() => handleViewDetail(report)} style={{ padding: "10px 18px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <Eye size={14} />View Details
                  </button>
                  {report.status === "pending" && (
                    <>
                      <button onClick={() => handleApproveReport(report)} style={{ padding: "10px 18px", background: `${COLORS.success}20`, border: `1px solid ${COLORS.success}40`, borderRadius: 10, color: COLORS.success, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        <CheckCircle size={14} />Approve
                      </button>
                      <button onClick={() => handleRejectReport(report)} style={{ padding: "10px 18px", background: `${COLORS.racingRed}20`, border: `1px solid ${COLORS.racingRed}40`, borderRadius: 10, color: COLORS.racingRed, fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                        <XCircle size={14} />Reject
                      </button>
                    </>
                  )}
                  <button style={{ padding: "10px 18px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <Download size={14} />Download
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="glass" style={{ padding: 60, borderRadius: 20, textAlign: "center" }}>
              <FileText size={48} color={COLORS.jungleTeal} style={{ marginBottom: 16, opacity: 0.5 }} />
              <h3 style={{ color: "white", fontSize: 20, marginBottom: 8 }}>No weekly reports</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Weekly reports will appear here</p>
            </div>
          )}
        </div>
      )}

      {/* Monthly Reports */}
      {activeTab === "monthly" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {monthlyReports && monthlyReports.length > 0 ? (
            monthlyReports.map(report => (
              <div key={report.id} className="glass hover-lift" style={{ padding: 24, borderRadius: 18, transition: "all 0.3s" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 16 }}>
                  <div>
                    <h3 style={{ color: "white", fontSize: 18, fontWeight: 600, margin: 0 }}>Monthly Report - {report.month}</h3>
                    <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 4, fontSize: 14 }}>{report.internName}</p>
                  </div>
                  <span style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, background: report.status === "approved" ? `${COLORS.success}20` : `${COLORS.warning}20`, color: report.status === "approved" ? COLORS.success : COLORS.warning, border: `1px solid ${report.status === "approved" ? COLORS.success : COLORS.warning}40`, textTransform: "capitalize" }}>
                    {report.status}
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 16, marginBottom: 16 }}>
                  <div style={{ padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Total Hours</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.jungleTeal }}>{report.totalHours}h</div>
                  </div>
                  <div style={{ padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Total Days</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.peachGlow }}>{report.totalDays}</div>
                  </div>
                  <div style={{ padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>Avg Hours/Day</div>
                    <div style={{ fontSize: 24, fontWeight: 700, color: COLORS.purple }}>{report.avgHoursPerDay}</div>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 8, fontWeight: 600 }}>Summary</div>
                  <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.7, fontSize: 14, margin: 0 }}>{report.summary}</p>
                </div>

                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => handleViewDetail(report)} style={{ padding: "10px 18px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <Eye size={14} />View Details
                  </button>
                  <button style={{ padding: "10px 18px", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                    <Download size={14} />Download
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="glass" style={{ padding: 60, borderRadius: 20, textAlign: "center" }}>
              <Calendar size={48} color={COLORS.jungleTeal} style={{ marginBottom: 16, opacity: 0.5 }} />
              <h3 style={{ color: "white", fontSize: 20, marginBottom: 8 }}>No monthly reports</h3>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Monthly reports will appear here</p>
            </div>
          )}
        </div>
      )}

      {/* TNA Tracker */}
      {activeTab === "tna" && (
        <div className="glass" style={{ borderRadius: 20, overflow: "hidden" }}>
          <div style={{ padding: 20, background: "rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255,255,255,0.1)", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "#0F9D58", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>📊</div>
              <div>
                <div style={{ color: "white", fontWeight: 600, fontSize: 17 }}>TNA Tracker - Weekly Timeline & Analysis</div>
                <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>Google Sheets • Real-time sync</div>
              </div>
            </div>
            <button style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 20px", background: "#0F9D58", borderRadius: 10, color: "white", border: "none", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>
              <Eye size={18} />View in Google Sheets
            </button>
          </div>

          <div style={{ padding: 20, overflowX: "auto" }}>
            <div style={{ background: "rgba(0,0,0,0.3)", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.1)", minWidth: 900 }}>
              <div style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px 1fr 80px 100px 1fr 1fr", background: "rgba(255,255,255,0.08)", padding: "14px 16px", gap: 12, fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase" }}>
                <div>Week</div>
                <div>Task</div>
                <div>Planned</div>
                <div>Action</div>
                <div>Executed</div>
                <div>Status</div>
                <div>Reason</div>
                <div>Deliverable</div>
              </div>

              {tnaData.map((row, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "60px 1fr 80px 1fr 80px 100px 1fr 1fr", padding: "14px 16px", gap: 12, borderBottom: idx < tnaData.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", fontSize: 13, color: "rgba(255,255,255,0.85)", alignItems: "center" }}>
                  <div style={{ background: COLORS.deepOcean, padding: "4px 8px", borderRadius: 6, fontWeight: 600, textAlign: "center", fontSize: 12 }}>W{row.week}</div>
                  <div style={{ fontWeight: 500 }}>{row.task}</div>
                  <div style={{ color: "rgba(255,255,255,0.6)" }}>{row.planned}</div>
                  <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{row.action}</div>
                  <div style={{ color: "rgba(255,255,255,0.6)" }}>{row.executed}</div>
                  <div>
                    <span style={{ padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, background: row.status === "Completed" ? "rgba(74, 222, 128, 0.2)" : row.status === "In Progress" ? "rgba(245, 158, 11, 0.2)" : "rgba(103, 146, 137, 0.2)", color: row.status === "Completed" ? "#4ade80" : row.status === "In Progress" ? "#f59e0b" : COLORS.jungleTeal }}>
                      {row.status}
                    </span>
                  </div>
                  <div style={{ color: row.reason !== "-" ? COLORS.peachGlow : "rgba(255,255,255,0.3)", fontSize: 12 }}>{row.reason}</div>
                  <div style={{ fontSize: 12 }}>{row.deliverable}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <div onClick={() => setShowDetailModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} className="glass animate-scaleIn" style={{ width: "100%", maxWidth: 600, borderRadius: 24, padding: 32 }}>
            <h2 style={{ color: "white", fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Report Details</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <InfoRow label="Intern" value={selectedReport.internName} />
              <InfoRow label="Period" value={selectedReport.dateRange || selectedReport.month} />
              <InfoRow label="Total Hours" value={`${selectedReport.totalHours}h`} />
              <InfoRow label="Days Worked" value={selectedReport.daysWorked || selectedReport.totalDays} />
              <InfoRow label="Status" value={selectedReport.status} />
              <InfoRow label="Submitted" value={new Date(selectedReport.submittedAt).toLocaleString()} />
            </div>
            <button onClick={() => setShowDetailModal(false)} style={{ width: "100%", padding: "14px 20px", background: `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)`, color: "white", border: "none", borderRadius: 12, fontWeight: 600, cursor: "pointer", fontSize: 14, marginTop: 24 }}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ padding: 14, background: "rgba(255,255,255,0.03)", borderRadius: 10 }}>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, color: "white", fontWeight: 500 }}>{value}</div>
    </div>
  );
}