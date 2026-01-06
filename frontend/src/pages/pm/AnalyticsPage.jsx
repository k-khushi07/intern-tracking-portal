// AnalyticsPage.jsx
import React, { useState } from "react";
import { BarChart3, TrendingUp, Clock, Users, Target, Award, Calendar, ChevronDown } from "lucide-react";

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

export default function AnalyticsPage({ interns, weeklyReports, isMobile }) {
  const [timeRange, setTimeRange] = useState("month");
  const [selectedMetric, setSelectedMetric] = useState("hours");

  const totalHours = interns.reduce((sum, i) => sum + (i.hoursLogged || 0), 0);
  const totalTasks = interns.reduce((sum, i) => sum + (i.tasksCompleted || 0), 0);
  const avgHoursPerIntern = interns.length > 0 ? (totalHours / interns.length).toFixed(1) : 0;
  const topPerformer = interns.reduce((top, intern) => (intern.hoursLogged || 0) > (top.hoursLogged || 0) ? intern : top, interns[0]);

  const weeklyData = [
    { week: "Week 1", hours: 145, tasks: 28 },
    { week: "Week 2", hours: 168, tasks: 32 },
    { week: "Week 3", hours: 152, tasks: 30 },
    { week: "Week 4", hours: 178, tasks: 35 },
  ];

  const internPerformance = interns.map(intern => ({
    name: intern.fullName,
    hours: intern.hoursLogged || 0,
    tasks: intern.tasksCompleted || 0,
    efficiency: intern.hoursLogged > 0 ? ((intern.tasksCompleted || 0) / intern.hoursLogged * 10).toFixed(1) : 0
  })).sort((a, b) => b.hours - a.hours);

  const maxHours = Math.max(...internPerformance.map(i => i.hours), 1);

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto" }}>
      {/* Header */}
      <div className="animate-fadeIn" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <h2 style={{ color: "white", fontSize: 24, fontWeight: 700, margin: 0 }}>Analytics Dashboard</h2>
          <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 8, fontSize: 14 }}>Track team performance and productivity metrics</p>
        </div>
        
        <div style={{ display: "flex", gap: 12 }}>
          <select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} style={{ padding: "10px 16px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 14, cursor: "pointer", outline: "none" }}>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="animate-fadeIn stagger-2" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
        <MetricCard icon={<Clock size={22} />} label="Total Hours" value={`${totalHours}h`} change="+12%" positive={true} color={COLORS.jungleTeal} />
        <MetricCard icon={<Target size={22} />} label="Tasks Completed" value={totalTasks} change="+8%" positive={true} color={COLORS.peachGlow} />
        <MetricCard icon={<Users size={22} />} label="Avg Hours/Intern" value={`${avgHoursPerIntern}h`} change="+5%" positive={true} color={COLORS.purple} />
        <MetricCard icon={<Award size={22} />} label="Top Performer" value={topPerformer?.fullName?.split(" ")[0] || "N/A"} change="Updated" positive={true} color={COLORS.success} />
      </div>

      {/* Charts Section */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr", gap: 24, marginBottom: 24 }}>
        {/* Weekly Trend Chart */}
        <div className="glass animate-fadeIn stagger-3" style={{ padding: 24, borderRadius: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
            <h3 style={{ color: "white", fontSize: 18, fontWeight: 600, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <TrendingUp size={20} color={COLORS.jungleTeal} /> Weekly Trend
            </h3>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setSelectedMetric("hours")} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: selectedMetric === "hours" ? COLORS.jungleTeal : "rgba(255,255,255,0.05)", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Hours</button>
              <button onClick={() => setSelectedMetric("tasks")} style={{ padding: "6px 12px", borderRadius: 8, border: "none", background: selectedMetric === "tasks" ? COLORS.jungleTeal : "rgba(255,255,255,0.05)", color: "white", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Tasks</button>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {weeklyData.map((week, idx) => (
              <div key={idx}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{week.week}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.jungleTeal }}>
                    {selectedMetric === "hours" ? `${week.hours}h` : `${week.tasks} tasks`}
                  </span>
                </div>
                <div style={{ height: 12, background: "rgba(255,255,255,0.05)", borderRadius: 6, overflow: "hidden" }}>
                  <div style={{ 
                    height: "100%", 
                    width: `${(selectedMetric === "hours" ? week.hours / 200 : week.tasks / 40) * 100}%`,
                    background: `linear-gradient(90deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)`,
                    borderRadius: 6,
                    transition: "width 1s ease"
                  }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="glass animate-fadeIn stagger-4" style={{ padding: 24, borderRadius: 20 }}>
          <h3 style={{ color: "white", fontSize: 18, fontWeight: 600, margin: 0, marginBottom: 24 }}>Summary</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <SummaryItem icon={<Users size={18} />} label="Active Interns" value={interns.length} color={COLORS.jungleTeal} />
            <SummaryItem icon={<Clock size={18} />} label="Total Hours" value={`${totalHours}h`} color={COLORS.peachGlow} />
            <SummaryItem icon={<Target size={18} />} label="Completed Tasks" value={totalTasks} color={COLORS.purple} />
            <SummaryItem icon={<BarChart3 size={18} />} label="Avg Efficiency" value="7.8/10" color={COLORS.success} />
          </div>

          <div style={{ marginTop: 24, padding: 16, background: "rgba(103, 146, 137, 0.15)", borderRadius: 12, border: "1px solid rgba(103, 146, 137, 0.3)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <Award size={18} color={COLORS.warning} />
              <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Top Performer</span>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "white", marginBottom: 4 }}>
              {topPerformer?.fullName || "N/A"}
            </div>
            <div style={{ fontSize: 13, color: COLORS.jungleTeal, fontWeight: 600 }}>
              {topPerformer?.hoursLogged || 0}h logged
            </div>
          </div>
        </div>
      </div>

      {/* Intern Performance Leaderboard */}
      <div className="glass animate-fadeIn stagger-5" style={{ padding: 24, borderRadius: 20 }}>
        <h3 style={{ color: "white", fontSize: 18, fontWeight: 600, margin: 0, marginBottom: 24, display: "flex", alignItems: "center", gap: 10 }}>
          <Award size={20} color={COLORS.jungleTeal} /> Intern Performance Leaderboard
        </h3>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {internPerformance.map((intern, idx) => (
            <div key={idx} style={{ padding: 20, background: idx === 0 ? "rgba(255, 215, 0, 0.1)" : "rgba(255,255,255,0.03)", borderRadius: 14, border: idx === 0 ? "2px solid rgba(255, 215, 0, 0.3)" : "1px solid rgba(255,255,255,0.06)", transition: "all 0.3s" }}
              onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
              onMouseLeave={(e) => e.currentTarget.style.background = idx === 0 ? "rgba(255, 215, 0, 0.1)" : "rgba(255,255,255,0.03)"}>
              
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 12 }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: idx === 0 ? "#FFD700" : idx === 1 ? "#C0C0C0" : idx === 2 ? "#CD7F32" : "rgba(255,255,255,0.3)", fontFamily: "'Outfit', sans-serif", minWidth: 32 }}>
                  #{idx + 1}
                </div>
                
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `linear-gradient(135deg, ${COLORS.jungleTeal} 0%, ${COLORS.deepOcean} 100%)`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 18, color: "white" }}>
                  {intern.name.charAt(0)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 16, color: "white" }}>{intern.name}</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Efficiency: {intern.efficiency}/10</div>
                </div>

                <div style={{ display: "flex", gap: 24 }}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.jungleTeal }}>{intern.hours}h</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Hours</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.peachGlow }}>{intern.tasks}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Tasks</div>
                  </div>
                </div>
              </div>

              <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(intern.hours / maxHours) * 100}%`, background: idx === 0 ? "linear-gradient(90deg, #FFD700 0%, #FFA500 100%)" : `linear-gradient(90deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)`, borderRadius: 4, transition: "width 1s ease" }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, label, value, change, positive, color }) {
  return (
    <div className="glass hover-lift" style={{ padding: 20, borderRadius: 16, transition: "all 0.3s" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", color: color, border: `1px solid ${color}30` }}>
          {icon}
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{label}</div>
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color: "white", fontFamily: "'Outfit', sans-serif", lineHeight: 1, marginBottom: 8 }}>{value}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <TrendingUp size={14} color={positive ? COLORS.success : COLORS.racingRed} />
        <span style={{ fontSize: 12, fontWeight: 600, color: positive ? COLORS.success : COLORS.racingRed }}>{change}</span>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>vs last {label === "Top Performer" ? "update" : "period"}</span>
      </div>
    </div>
  );
}

function SummaryItem({ icon, label, value, color }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}20`, display: "flex", alignItems: "center", justifyContent: "center", color: color, flexShrink: 0 }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "white", fontFamily: "'Outfit', sans-serif" }}>{value}</div>
      </div>
    </div>
  );
}