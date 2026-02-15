//intern/DailyLogPage.jsx
import React, { useState, useMemo, useCallback } from "react";
import {
  BookOpen, X, Clock, CheckCircle, Star, AlertCircle,
  Calendar, ChevronDown, ChevronRight, FileText, Send,
  TrendingUp, BarChart3, Mail, Loader, Filter, Download,
  CalendarDays, FolderOpen, PieChart, Search, Lightbulb, Target
} from "lucide-react";

// ==================== CONSTANTS ====================
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

const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid rgba(103, 146, 137, 0.25)",
  background: "rgba(255,255,255,0.04)",
  color: "white",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "'DM Sans', sans-serif",
};

// ==================== DATE HELPERS ====================
const getWeekNumber = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 4 - (d.getDay() || 7));
  const yearStart = new Date(d.getFullYear(), 0, 1);
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

const getWeekDateRange = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    start: monday,
    end: sunday,
    label: `${monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  };
};

const getMonthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const formatMonth = (monthKey) => {
  const [year, month] = monthKey.split('-');
  return new Date(year, parseInt(month) - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

// ==================== SUMMARY GENERATORS ====================
const generateWeeklySummary = (week, weekKey) => {
  if (!week) return null;
  const logs = week.logs;
  const totalHours = week.totalHours;
  const daysWorked = logs.length;
  const avgHoursPerDay = daysWorked > 0 ? (totalHours / daysWorked).toFixed(1) : 0;

  const allTasks = logs
    .map(l => l.tasks)
    .filter(Boolean)
    .map(task => task.split('.').filter(s => s.trim().length > 10).slice(0, 2))
    .flat()
    .slice(0, 5);

  const allLearnings = logs
    .map(l => l.learnings)
    .filter(Boolean)
    .map(learning => learning.split('.').filter(s => s.trim().length > 10)[0])
    .filter(Boolean)
    .slice(0, 5);

  const blockers = logs
    .filter(l => l.blockers && l.blockers.toLowerCase() !== "none")
    .map(l => ({ date: l.date, blocker: l.blockers }));

  const consistencyScore = Math.min(100, (daysWorked / 5) * 100);
  const consistencyRating = consistencyScore >= 80 ? "Excellent" : 
    consistencyScore >= 60 ? "Good" : 
    consistencyScore >= 40 ? "Fair" : "Needs Improvement";
  const productivity = totalHours >= 35 ? "High" : 
    totalHours >= 25 ? "Good" : 
    totalHours >= 15 ? "Moderate" : "Low";

  return {
    weekKey,
    weekNumber: week.weekNumber,
    dateRange: week.dateRange.label,
    totalHours,
    daysWorked,
    avgHoursPerDay,
    consistencyRating,
    consistencyScore: Math.round(consistencyScore),
    productivity,
    accomplishments: allTasks,
    learnings: allLearnings,
    blockers,
    hasBlockers: blockers.length > 0,
    generatedAt: new Date().toISOString()
  };
};

const generateMonthlySummary = (month, monthKey) => {
  if (!month) return null;
  const logs = month.logs;
  const totalHours = month.totalHours;
  const totalDays = logs.length;
  const weeksCount = month.weekCount;
  const avgHoursPerDay = totalDays > 0 ? (totalHours / totalDays).toFixed(1) : 0;

  const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstHalf = sortedLogs.slice(0, Math.floor(sortedLogs.length / 2));
  const secondHalf = sortedLogs.slice(Math.floor(sortedLogs.length / 2));
  const firstHalfAvg = firstHalf.length > 0 
    ? firstHalf.reduce((sum, l) => sum + (l.hoursWorked || 0), 0) / firstHalf.length 
    : 0;
  const secondHalfAvg = secondHalf.length > 0 
    ? secondHalf.reduce((sum, l) => sum + (l.hoursWorked || 0), 0) / secondHalf.length 
    : 0;
  const productivityTrend = secondHalfAvg > firstHalfAvg * 1.1 ? "Increasing" : 
    secondHalfAvg < firstHalfAvg * 0.9 ? "Decreasing" : "Stable";

  const allAccomplishments = logs
    .map(l => l.tasks)
    .filter(Boolean)
    .join(' ')
    .split('.')
    .filter(s => s.trim().length > 15)
    .slice(0, 6);

  const allBlockers = logs
    .filter(l => l.blockers && l.blockers.toLowerCase() !== "none")
    .map(l => ({ date: l.date, blocker: l.blockers }));

  const consistencyScore = Math.min(100, (totalDays / (weeksCount * 5)) * 100);
  const consistencyRating = consistencyScore >= 80 ? "Excellent" : 
    consistencyScore >= 60 ? "Good" : 
    consistencyScore >= 40 ? "Fair" : "Needs Improvement";

  const recommendations = [];
  if (productivityTrend === "Decreasing") {
    recommendations.push("Review workload distribution to maintain productivity");
  }
  if (allBlockers.length > 3) {
    recommendations.push("Multiple blockers detected - schedule problem-solving sessions");
  }
  if (consistencyScore < 60) {
    recommendations.push("Improve logging consistency for better tracking");
  }
  if (recommendations.length === 0) {
    recommendations.push("Maintain current momentum - excellent work!");
  }

  return {
    monthKey,
    monthLabel: month.monthLabel,
    totalHours,
    totalDays,
    weeksCount,
    avgHoursPerDay,
    productivityTrend,
    consistencyRating,
    consistencyScore: Math.round(consistencyScore),
    accomplishments: allAccomplishments,
    blockers: allBlockers,
    hasBlockers: allBlockers.length > 0,
    recommendations,
    generatedAt: new Date().toISOString()
  };
};

// ==================== SAMPLE DATA ====================
const sampleLogs = [
  { id: 1, date: "2024-01-15", tasks: "Completed React component development for dashboard. Implemented responsive design patterns. Created reusable card components.", learnings: "React hooks, Context API, performance optimization techniques.", blockers: "None", hoursWorked: 8 },
  { id: 2, date: "2024-01-14", tasks: "API integration with backend services. Set up error handling and loading states.", learnings: "REST API best practices, async/await patterns in JavaScript.", blockers: "CORS issues - resolved with proxy configuration", hoursWorked: 7 },
  { id: 3, date: "2024-01-13", tasks: "Database schema design and MongoDB setup. Created indexes for optimization.", learnings: "NoSQL design patterns, indexing strategies, aggregation pipelines.", blockers: "None", hoursWorked: 6 },
  { id: 4, date: "2024-01-12", tasks: "User authentication module. Implemented JWT tokens and refresh logic.", learnings: "Security best practices, JWT implementation, OAuth 2.0 fundamentals.", blockers: "Token refresh logic was tricky - resolved after research", hoursWorked: 8 },
  { id: 5, date: "2024-01-11", tasks: "Frontend routing with React Router. Created protected route components.", learnings: "Client-side routing patterns, route guards, lazy loading.", blockers: "None", hoursWorked: 7 },
  { id: 6, date: "2024-01-08", tasks: "Code review and refactoring. Improved component structure.", learnings: "Clean code principles, component composition patterns.", blockers: "None", hoursWorked: 6 },
  { id: 7, date: "2024-01-07", tasks: "Testing with Jest and React Testing Library. Unit tests for utilities.", learnings: "TDD, mocking strategies, coverage reporting.", blockers: "Mocking external APIs was challenging", hoursWorked: 8 },
  { id: 8, date: "2024-01-05", tasks: "Performance optimization. Implemented memo, useMemo, useCallback.", learnings: "React performance patterns, profiling tools.", blockers: "None", hoursWorked: 7 },
  { id: 9, date: "2024-01-04", tasks: "Documentation. Created README and inline code docs.", learnings: "Technical writing, JSDoc comments, API documentation.", blockers: "None", hoursWorked: 5 },
  { id: 10, date: "2024-01-03", tasks: "Project setup. ESLint, Prettier, Husky configuration.", learnings: "Dev environment setup, linting rules, git hooks.", blockers: "Husky configuration took longer than expected", hoursWorked: 6 },
  { id: 11, date: "2023-12-28", tasks: "Year-end review and planning. Q1 roadmap creation.", learnings: "Reflection, goal setting, time management.", blockers: "None", hoursWorked: 4 },
  { id: 12, date: "2023-12-27", tasks: "Bug fixes. Resolved UI inconsistencies and mobile issues.", learnings: "Debugging techniques, browser dev tools, CSS specificity.", blockers: "None", hoursWorked: 6 },
];

// ==================== UI COMPONENTS ====================
const StatMini = ({ icon, label, value, color }) => (
  <div 
    className="glass" 
    style={{ 
      padding: 16, 
      borderRadius: 14, 
      display: "flex", 
      alignItems: "center", 
      gap: 12 
    }}
  >
    <div style={{ 
      width: 38, 
      height: 38, 
      borderRadius: 10, 
      background: `${color}20`, 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      color, 
      flexShrink: 0 
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "white", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>{label}</div>
    </div>
  </div>
);

const FilterChip = ({ active, label, count, onClick }) => (
  <button 
    onClick={onClick} 
    style={{ 
      padding: "8px 16px", 
      borderRadius: 20, 
      border: `1px solid ${active ? COLORS.jungleTeal : "rgba(255,255,255,0.1)"}`, 
      background: active ? `${COLORS.jungleTeal}20` : "rgba(255,255,255,0.05)", 
      color: active ? COLORS.jungleTeal : "rgba(255,255,255,0.6)", 
      cursor: "pointer", 
      fontSize: 13, 
      fontWeight: 500, 
      display: "flex", 
      alignItems: "center", 
      gap: 8,
      transition: "all 0.2s"
    }}
  >
    {label}
    <span style={{ 
      background: active ? COLORS.jungleTeal : "rgba(255,255,255,0.2)", 
      color: active ? "white" : "rgba(255,255,255,0.8)", 
      padding: "2px 8px", 
      borderRadius: 10, 
      fontSize: 11 
    }}>
      {count}
    </span>
  </button>
);

// ==================== SEARCH & FILTER BAR ====================
const SearchFilterBar = ({ searchQuery, setSearchQuery, activeFilter, setActiveFilter, filterCounts }) => (
  <div className="glass" style={{ padding: 20, borderRadius: 16, marginBottom: 20 }}>
    <div style={{ position: "relative", marginBottom: 16 }}>
      <Search 
        size={18} 
        style={{ 
          position: "absolute", 
          left: 14, 
          top: "50%", 
          transform: "translateY(-50%)", 
          color: "rgba(255,255,255,0.4)" 
        }} 
      />
      <input 
        type="text" 
        placeholder="Search tasks, learnings, or blockers..." 
        value={searchQuery} 
        onChange={(e) => setSearchQuery(e.target.value)} 
        style={{ ...inputStyle, paddingLeft: 44, background: "rgba(0,0,0,0.2)" }} 
      />
      {searchQuery && (
        <button 
          onClick={() => setSearchQuery('')} 
          style={{ 
            position: "absolute", 
            right: 14, 
            top: "50%", 
            transform: "translateY(-50%)", 
            background: "rgba(255,255,255,0.1)", 
            border: "none", 
            borderRadius: 6, 
            width: 24, 
            height: 24, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            cursor: "pointer", 
            color: "rgba(255,255,255,0.6)" 
          }}
        >
          ×
        </button>
      )}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        gap: 6, 
        color: "rgba(255,255,255,0.5)", 
        fontSize: 13 
      }}>
        <Filter size={16} />Filters:
      </div>
      <FilterChip 
        active={activeFilter === "all"} 
        label="All Logs" 
        count={filterCounts.all} 
        onClick={() => setActiveFilter("all")} 
      />
      <FilterChip 
        active={activeFilter === "blockers"} 
        label="With Blockers" 
        count={filterCounts.blockers} 
        onClick={() => setActiveFilter("blockers")} 
      />
      <FilterChip 
        active={activeFilter === "highHours"} 
        label="High Hours (8+)" 
        count={filterCounts.highHours} 
        onClick={() => setActiveFilter("highHours")} 
      />
    </div>
  </div>
);

// ==================== LOG ENTRY FORM ====================
const LogEntryForm = ({ onSubmit, onCancel, isMobile }) => {
  const [formData, setFormData] = useState({ 
    date: new Date().toISOString().split("T")[0], 
    tasks: "", 
    learnings: "", 
    blockers: "", 
    hoursWorked: "" 
  });

  const handleSubmit = (e) => { 
    e.preventDefault(); 
    onSubmit(formData); 
    setFormData({ 
      date: new Date().toISOString().split("T")[0], 
      tasks: "", 
      learnings: "", 
      blockers: "", 
      hoursWorked: "" 
    }); 
  };

  return (
    <div 
      className="glass" 
      style={{ 
        padding: isMobile ? 24 : 32, 
        borderRadius: 20, 
        marginBottom: 24, 
        animation: "scaleIn 0.3s ease-out" 
      }}
    >
      <h3 style={{ 
        color: "white", 
        marginBottom: 24, 
        fontSize: 20, 
        fontWeight: 700, 
        display: "flex", 
        alignItems: "center", 
        gap: 10 
      }}>
        <Star size={22} color={COLORS.peachGlow} />
        Log Today's Progress
      </h3>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <label style={{ 
            display: "block", 
            color: "rgba(255,255,255,0.9)", 
            marginBottom: 8, 
            fontWeight: 500, 
            fontSize: 14 
          }}>
            Date <span style={{ color: COLORS.racingRed }}>*</span>
          </label>
          <input 
            type="date" 
            value={formData.date} 
            onChange={(e) => setFormData({ ...formData, date: e.target.value })} 
            style={inputStyle} 
            required 
          />
        </div>
        <div>
          <label style={{ 
            display: "block", 
            color: "rgba(255,255,255,0.9)", 
            marginBottom: 8, 
            fontWeight: 500, 
            fontSize: 14 
          }}>
            Tasks completed <span style={{ color: COLORS.racingRed }}>*</span>
          </label>
          <textarea 
            placeholder="Describe the tasks you worked on today..." 
            value={formData.tasks} 
            onChange={(e) => setFormData({ ...formData, tasks: e.target.value })} 
            style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} 
            required 
          />
        </div>
        <div>
          <label style={{ 
            display: "block", 
            color: "rgba(255,255,255,0.9)", 
            marginBottom: 8, 
            fontWeight: 500, 
            fontSize: 14 
          }}>
            Learnings <span style={{ color: COLORS.racingRed }}>*</span>
          </label>
          <textarea 
            placeholder="Share your learnings..." 
            value={formData.learnings} 
            onChange={(e) => setFormData({ ...formData, learnings: e.target.value })} 
            style={{ ...inputStyle, minHeight: 100, resize: "vertical" }} 
            required 
          />
        </div>
        <div>
          <label style={{ 
            display: "block", 
            color: "rgba(255,255,255,0.9)", 
            marginBottom: 8, 
            fontWeight: 500, 
            fontSize: 14 
          }}>
            Blockers
          </label>
          <textarea 
            placeholder="Any obstacles? (or 'None')" 
            value={formData.blockers} 
            onChange={(e) => setFormData({ ...formData, blockers: e.target.value })} 
            style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} 
          />
        </div>
        <div>
          <label style={{ 
            display: "block", 
            color: "rgba(255,255,255,0.9)", 
            marginBottom: 8, 
            fontWeight: 500, 
            fontSize: 14 
          }}>
            Hours worked <span style={{ color: COLORS.racingRed }}>*</span>
          </label>
          <input 
            type="number" 
            placeholder="e.g., 8" 
            value={formData.hoursWorked} 
            onChange={(e) => setFormData({ ...formData, hoursWorked: e.target.value })} 
            style={{ ...inputStyle, maxWidth: 120 }} 
            min="0" 
            max="24" 
            required 
          />
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button 
            type="submit" 
            style={{ 
              padding: "14px 28px", 
              background: `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)`, 
              color: "white", 
              border: "none", 
              borderRadius: 12, 
              fontWeight: 600, 
              cursor: "pointer", 
              fontSize: 14, 
              display: "flex", 
              alignItems: "center", 
              gap: 8 
            }}
          >
            <CheckCircle size={18} />Save Entry
          </button>
          <button 
            type="button" 
            onClick={onCancel} 
            style={{ 
              padding: "14px 28px", 
              background: "rgba(255,255,255,0.08)", 
              color: "white", 
              border: "1px solid rgba(255,255,255,0.1)", 
              borderRadius: 12, 
              fontWeight: 600, 
              cursor: "pointer", 
              fontSize: 14 
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// ==================== LOG SECTION ====================
const LogSection = ({ title, content, icon, color }) => (
  <div>
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <div style={{ color }}>{icon}</div>
      <span style={{ fontWeight: 600, fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{title}</span>
    </div>
    <p style={{ 
      color: "rgba(255,255,255,0.85)", 
      margin: 0, 
      lineHeight: 1.7, 
      fontSize: 14, 
      paddingLeft: 24 
    }}>
      {content}
    </p>
  </div>
);

// ==================== LOG CARD ====================
const LogCard = ({ log, index }) => {
  const dayName = new Date(log.date).toLocaleDateString("en-US", { weekday: "long" });
  const hasBlocker = log.blockers && log.blockers.toLowerCase() !== "none";

  return (
    <div 
      className="glass" 
      style={{ 
        padding: 24, 
        borderRadius: 18, 
        animation: `fadeInUp 0.3s ease-out ${index * 0.05}s both` 
      }}
    >
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "flex-start", 
        marginBottom: 20, 
        flexWrap: "wrap", 
        gap: 12 
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ 
            width: 58, 
            height: 58, 
            borderRadius: 14, 
            background: `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)`, 
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center" 
          }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "white", lineHeight: 1 }}>
              {new Date(log.date).getDate()}
            </div>
            <div style={{ 
              fontSize: 10, 
              color: COLORS.peachGlow, 
              textTransform: "uppercase", 
              fontWeight: 600 
            }}>
              {new Date(log.date).toLocaleDateString("en-US", { month: "short" })}
            </div>
          </div>
          <div>
            <h4 style={{ color: "white", margin: 0, fontSize: 18, fontWeight: 600 }}>{dayName}</h4>
            <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 2 }}>
              {new Date(log.date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
          </div>
        </div>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 6, 
          background: `${COLORS.jungleTeal}20`, 
          padding: "8px 14px", 
          borderRadius: 20, 
          border: `1px solid ${COLORS.jungleTeal}30` 
        }}>
          <Clock size={14} color={COLORS.jungleTeal} />
          <span style={{ fontWeight: 600, color: COLORS.jungleTeal, fontSize: 14 }}>{log.hoursWorked}h</span>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <LogSection title="Tasks Completed" content={log.tasks} icon={<CheckCircle size={16} />} color={COLORS.jungleTeal} />
        <LogSection title="Learnings" content={log.learnings} icon={<Star size={16} />} color="#f59e0b" />
        {hasBlocker && <LogSection title="Blockers" content={log.blockers} icon={<AlertCircle size={16} />} color={COLORS.racingRed} />}
      </div>
    </div>
  );
};

// ==================== DAILY VIEW ====================
const DailyView = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="glass" style={{ padding: 60, borderRadius: 20, textAlign: "center" }}>
        <BookOpen size={48} color={COLORS.jungleTeal} style={{ marginBottom: 16, opacity: 0.5 }} />
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>No logs found. Try adjusting your search or filters.</p>
      </div>
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {logs.map((log, idx) => <LogCard key={log.id} log={log} index={idx} />)}
    </div>
  );
};

// ==================== WEEKLY VIEW ====================
const WeeklyView = ({ logsByWeek, sortedWeekKeys, expandedWeeks, toggleWeek, weeklySummaries, openSummaryModal, isMobile }) => {
  if (sortedWeekKeys.length === 0) {
    return (
      <div className="glass" style={{ padding: 60, borderRadius: 20, textAlign: "center" }}>
        <CalendarDays size={48} color={COLORS.jungleTeal} style={{ marginBottom: 16, opacity: 0.5 }} />
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 16 }}>No weekly data yet.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {sortedWeekKeys.map((weekKey, idx) => {
        const week = logsByWeek[weekKey];
        const isExpanded = expandedWeeks[weekKey];
        const hasSummary = !!weeklySummaries[weekKey];

        return (
          <div 
            key={weekKey} 
            className="glass" 
            style={{ 
              borderRadius: 18, 
              overflow: "hidden", 
              animation: `fadeInUp 0.3s ease-out ${idx * 0.05}s both` 
            }}
          >
            <div 
              onClick={() => toggleWeek(weekKey)} 
              style={{ 
                padding: "20px 24px", 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                cursor: "pointer", 
                background: isExpanded ? "rgba(103, 146, 137, 0.1)" : "transparent", 
                flexWrap: "wrap", 
                gap: 12,
                transition: "background 0.2s"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ 
                  width: 52, 
                  height: 52, 
                  borderRadius: 14, 
                  background: `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)`, 
                  display: "flex", 
                  flexDirection: "column", 
                  alignItems: "center", 
                  justifyContent: "center" 
                }}>
                  <div style={{ fontSize: 10, color: COLORS.peachGlow, fontWeight: 600, textTransform: "uppercase" }}>Week</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "white", lineHeight: 1 }}>{week.weekNumber}</div>
                </div>
                <div>
                  <div style={{ fontWeight: 600, color: "white", fontSize: 16 }}>{week.dateRange.label}</div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 2 }}>
                    {week.logs.length} entries • {week.totalHours} hours
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <button 
                  onClick={(e) => { e.stopPropagation(); openSummaryModal("weekly", weekKey); }} 
                  style={{ 
                    padding: "8px 16px", 
                    background: hasSummary ? `${COLORS.jungleTeal}30` : "rgba(255,255,255,0.08)", 
                    border: `1px solid ${hasSummary ? COLORS.jungleTeal : "rgba(255,255,255,0.1)"}`, 
                    borderRadius: 10, 
                    color: hasSummary ? COLORS.jungleTeal : "rgba(255,255,255,0.7)", 
                    cursor: "pointer", 
                    fontSize: 12, 
                    fontWeight: 600, 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 6 
                  }}
                >
                  <BarChart3 size={14} />
                  {hasSummary ? "View Summary" : "Generate Summary"}
                </button>
                {isExpanded 
                  ? <ChevronDown size={20} color="rgba(255,255,255,0.5)" /> 
                  : <ChevronRight size={20} color="rgba(255,255,255,0.5)" />
                }
              </div>
            </div>

            {isExpanded && (
              <div style={{ padding: "0 24px 24px" }}>
                <div style={{ 
                  background: "rgba(0,0,0,0.2)", 
                  borderRadius: 12, 
                  overflow: "hidden", 
                  border: "1px solid rgba(255,255,255,0.05)" 
                }}>
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: isMobile ? "1fr" : "100px 1fr 1fr 120px 80px", 
                    gap: 12, 
                    padding: "14px 18px", 
                    background: "rgba(103, 146, 137, 0.1)", 
                    borderBottom: "1px solid rgba(255,255,255,0.05)", 
                    fontSize: 11, 
                    fontWeight: 600, 
                    color: COLORS.jungleTeal, 
                    textTransform: "uppercase" 
                  }}>
                    {!isMobile && (
                      <>
                        <div>Date</div>
                        <div>Tasks</div>
                        <div>Learnings</div>
                        <div>Blockers</div>
                        <div>Hours</div>
                      </>
                    )}
                    {isMobile && <div>Log Details</div>}
                  </div>
                  {week.logs.map((log, idx) => (
                    <div 
                      key={log.id} 
                      style={{ 
                        display: "grid", 
                        gridTemplateColumns: isMobile ? "1fr" : "100px 1fr 1fr 120px 80px", 
                        gap: 12, 
                        padding: "16px 18px", 
                        borderBottom: idx < week.logs.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none", 
                        fontSize: 13, 
                        color: "rgba(255,255,255,0.8)", 
                        alignItems: "flex-start" 
                      }}
                    >
                      <div style={{ fontWeight: 600, color: "white" }}>
                        {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div style={{ lineHeight: 1.5 }}>
                        {log.tasks.substring(0, 100)}{log.tasks.length > 100 ? "..." : ""}
                      </div>
                      <div style={{ lineHeight: 1.5 }}>
                        {log.learnings.substring(0, 80)}{log.learnings.length > 80 ? "..." : ""}
                      </div>
                      <div style={{ 
                        color: log.blockers && log.blockers.toLowerCase() !== "none" ? COLORS.racingRed : "rgba(255,255,255,0.4)", 
                        fontSize: 12 
                      }}>
                        {log.blockers && log.blockers.toLowerCase() !== "none" 
                          ? log.blockers.substring(0, 30) + "..." 
                          : "None"
                        }
                      </div>
                      <div style={{ 
                        fontWeight: 700, 
                        color: COLORS.jungleTeal, 
                        display: "flex", 
                        alignItems: "center", 
                        gap: 4 
                      }}>
                        <Clock size={14} />{log.hoursWorked}h
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ==================== MONTHLY VIEW ====================
const MonthlyView = ({ logsByMonth, sortedMonthKeys, expandedMonths, toggleMonth, monthlySummaries, openSummaryModal, isMobile }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
    {sortedMonthKeys.map((monthKey, idx) => {
      const month = logsByMonth[monthKey];
      const isExpanded = expandedMonths[monthKey];
      const hasSummary = !!monthlySummaries[monthKey];

      return (
        <div 
          key={monthKey} 
          className="glass" 
          style={{ 
            borderRadius: 18, 
            overflow: "hidden", 
            animation: `fadeInUp 0.3s ease-out ${idx * 0.05}s both` 
          }}
        >
          <div 
            onClick={() => toggleMonth(monthKey)} 
            style={{ 
              padding: "24px", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              cursor: "pointer", 
              background: isExpanded ? "rgba(103, 146, 137, 0.1)" : "transparent", 
              flexWrap: "wrap", 
              gap: 12,
              transition: "background 0.2s"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ 
                width: 58, 
                height: 58, 
                borderRadius: 16, 
                background: `linear-gradient(135deg, ${COLORS.peachGlow}30 0%, ${COLORS.deepOcean} 100%)`, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center" 
              }}>
                <FolderOpen size={26} color={COLORS.peachGlow} />
              </div>
              <div>
                <div style={{ fontWeight: 700, color: "white", fontSize: 20 }}>{month.monthLabel}</div>
                <div style={{ 
                  color: "rgba(255,255,255,0.5)", 
                  fontSize: 13, 
                  marginTop: 4, 
                  display: "flex", 
                  gap: 16, 
                  flexWrap: "wrap" 
                }}>
                  <span>{month.logs.length} days</span>
                  <span>•</span>
                  <span>{month.weekCount} weeks</span>
                  <span>•</span>
                  <span>{month.totalHours} hours</span>
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button 
                onClick={(e) => { e.stopPropagation(); openSummaryModal("monthly", monthKey); }} 
                style={{ 
                  padding: "10px 20px", 
                  background: hasSummary ? `${COLORS.peachGlow}20` : "rgba(255,255,255,0.08)", 
                  border: `1px solid ${hasSummary ? COLORS.peachGlow : "rgba(255,255,255,0.1)"}`, 
                  borderRadius: 10, 
                  color: hasSummary ? COLORS.peachGlow : "rgba(255,255,255,0.7)", 
                  cursor: "pointer", 
                  fontSize: 13, 
                  fontWeight: 600, 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8 
                }}
              >
                <PieChart size={16} />
                {hasSummary ? "View Report" : "Generate Report"}
              </button>
              {isExpanded 
                ? <ChevronDown size={22} color="rgba(255,255,255,0.5)" /> 
                : <ChevronRight size={22} color="rgba(255,255,255,0.5)" />
              }
            </div>
          </div>

          {isExpanded && (
            <div style={{ padding: "0 24px 24px" }}>
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", 
                gap: 12 
              }}>
                {[
                  { label: "Total Hours", value: month.totalHours, color: COLORS.jungleTeal },
                  { label: "Days Logged", value: month.logs.length, color: COLORS.peachGlow },
                  { label: "Avg Hours/Day", value: (month.totalHours / month.logs.length).toFixed(1), color: COLORS.success },
                  { label: "Active Weeks", value: month.weekCount, color: COLORS.purple }
                ].map(stat => (
                  <div 
                    key={stat.label} 
                    style={{ 
                      padding: 16, 
                      background: `${stat.color}10`, 
                      borderRadius: 12, 
                      border: `1px solid ${stat.color}20`, 
                      textAlign: "center" 
                    }}
                  >
                    <div style={{ fontSize: 24, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    })}
  </div>
);

// ==================== SUMMARY COMPONENTS ====================
const SummarySection = ({ title, icon, color, children }) => (
  <div style={{ 
    padding: 18, 
    background: "rgba(0,0,0,0.2)", 
    borderRadius: 14, 
    borderLeft: `4px solid ${color}` 
  }}>
    <div style={{ 
      display: "flex", 
      alignItems: "center", 
      gap: 10, 
      marginBottom: 14, 
      color, 
      fontWeight: 600, 
      fontSize: 14 
    }}>
      {icon}{title}
    </div>
    {children}
  </div>
);

const ConsistencyBadge = ({ rating, score }) => {
  const getColor = () => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.jungleTeal;
    if (score >= 40) return "#f59e0b";
    return COLORS.racingRed;
  };

  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ 
        width: 80, 
        height: 80, 
        borderRadius: "50%", 
        background: `conic-gradient(${getColor()} ${score}%, rgba(255,255,255,0.1) ${score}%)`, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        margin: "0 auto 12px" 
      }}>
        <div style={{ 
          width: 64, 
          height: 64, 
          borderRadius: "50%", 
          background: COLORS.inkBlack, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          color: getColor(), 
          fontWeight: 700, 
          fontSize: 18 
        }}>
          {score}%
        </div>
      </div>
      <div style={{ color: getColor(), fontWeight: 600, fontSize: 14 }}>{rating}</div>
      <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>Consistency Rating</div>
    </div>
  );
};

// ==================== SUMMARY MODAL ====================
const SummaryModal = ({ type, summary, assignedPM, onClose, onSend, isSending, sendSuccess, isMobile }) => {
  if (!summary) return null;
  const isWeekly = type === "weekly";

  const handleExport = () => {
    const text = isWeekly 
      ? `WEEKLY SUMMARY\n${summary.dateRange}\n\nHours: ${summary.totalHours}\nDays: ${summary.daysWorked}\n\nAccomplishments:\n${summary.accomplishments.map(a => `• ${a}`).join('\n')}\n\nLearnings:\n${summary.learnings.map(l => `• ${l}`).join('\n')}`
      : `MONTHLY REPORT\n${summary.monthLabel}\n\nHours: ${summary.totalHours}\nDays: ${summary.totalDays}\nTrend: ${summary.productivityTrend}\n\nAccomplishments:\n${summary.accomplishments.map(a => `• ${a}`).join('\n')}\n\nRecommendations:\n${summary.recommendations.map(r => `→ ${r}`).join('\n')}`;
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getProductivityColor = (v) => {
    const val = v?.toLowerCase();
    if (["high", "increasing", "excellent"].includes(val)) return COLORS.success;
    if (["good", "stable"].includes(val)) return COLORS.jungleTeal;
    if (["moderate", "decreasing"].includes(val)) return "#f59e0b";
    return COLORS.racingRed;
  };

  return (
    <div style={{ 
      position: "fixed", 
      inset: 0, 
      background: "rgba(0,0,0,0.8)", 
      backdropFilter: "blur(8px)", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      zIndex: 2000, 
      padding: 20 
    }}>
      <div 
        className="glass" 
        style={{ 
          width: "100%", 
          maxWidth: 700, 
          maxHeight: "90vh", 
          overflowY: "auto", 
          borderRadius: 24, 
          animation: "scaleIn 0.3s ease-out" 
        }}
      >
        {/* Modal Header */}
        <div style={{ 
          padding: "24px 28px", 
          borderBottom: "1px solid rgba(255,255,255,0.1)", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          position: "sticky", 
          top: 0, 
          background: "rgba(7, 30, 34, 0.95)", 
          backdropFilter: "blur(20px)", 
          zIndex: 10 
        }}>
          <div>
            <h2 style={{ 
              color: "white", 
              margin: 0, 
              fontSize: 22, 
              fontWeight: 700, 
              display: "flex", 
              alignItems: "center", 
              gap: 10 
            }}>
              {isWeekly 
                ? <BarChart3 size={24} color={COLORS.jungleTeal} /> 
                : <PieChart size={24} color={COLORS.peachGlow} />
              }
              {isWeekly ? "Weekly Summary" : "Monthly Report"}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", margin: "6px 0 0", fontSize: 14 }}>
              {isWeekly ? summary.dateRange : summary.monthLabel}
            </p>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              background: "rgba(255,255,255,0.1)", 
              border: "none", 
              borderRadius: 10, 
              width: 40, 
              height: 40, 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              cursor: "pointer", 
              color: "white" 
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: 28 }}>
          {/* Stats Grid */}
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", 
            gap: 12, 
            marginBottom: 28 
          }}>
            {[
              { value: summary.totalHours, label: "Total Hours", icon: <Clock size={16} />, color: COLORS.jungleTeal },
              { value: isWeekly ? summary.daysWorked : summary.totalDays, label: isWeekly ? "Days Worked" : "Days Logged", icon: <Calendar size={16} />, color: COLORS.peachGlow },
              { value: summary.avgHoursPerDay, label: "Avg Hours/Day", icon: <Target size={16} />, color: COLORS.success },
              { value: isWeekly ? summary.productivity : summary.productivityTrend, label: isWeekly ? "Productivity" : "Trend", icon: <TrendingUp size={16} />, color: getProductivityColor(isWeekly ? summary.productivity : summary.productivityTrend) }
            ].map(stat => (
              <div 
                key={stat.label} 
                style={{ 
                  padding: 18, 
                  background: `${stat.color}15`, 
                  borderRadius: 14, 
                  border: `1px solid ${stat.color}30`, 
                  textAlign: "center" 
                }}
              >
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  gap: 8, 
                  marginBottom: 4 
                }}>
                  <span style={{ color: stat.color, opacity: 0.7 }}>{stat.icon}</span>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Content Sections */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Accomplishments */}
            <SummarySection title="Key Accomplishments" icon={<CheckCircle size={18} />} color={COLORS.jungleTeal}>
              {summary.accomplishments?.length > 0 ? (
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                  {summary.accomplishments.map((item, idx) => (
                    <li 
                      key={idx} 
                      style={{ 
                        color: "rgba(255,255,255,0.8)", 
                        lineHeight: 1.7, 
                        marginBottom: 8, 
                        paddingLeft: 20, 
                        position: "relative" 
                      }}
                    >
                      <span style={{ position: "absolute", left: 0, color: COLORS.jungleTeal }}>•</span>
                      {item.trim()}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ color: "rgba(255,255,255,0.5)", margin: 0 }}>No accomplishments recorded</p>
              )}
            </SummarySection>

            {/* Learnings (Weekly only) */}
            {isWeekly && summary.learnings?.length > 0 && (
              <SummarySection title="Key Learnings" icon={<Lightbulb size={18} />} color="#f59e0b">
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                  {summary.learnings.map((item, idx) => (
                    <li 
                      key={idx} 
                      style={{ 
                        color: "rgba(255,255,255,0.8)", 
                        lineHeight: 1.7, 
                        marginBottom: 8, 
                        paddingLeft: 20, 
                        position: "relative" 
                      }}
                    >
                      <span style={{ position: "absolute", left: 0, color: "#f59e0b" }}>•</span>
                      {item.trim()}
                    </li>
                  ))}
                </ul>
              </SummarySection>
            )}

            {/* Blockers */}
            {summary.hasBlockers ? (
              <SummarySection title="Challenges Encountered" icon={<AlertCircle size={18} />} color={COLORS.racingRed}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {summary.blockers.map((blocker, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        background: `${COLORS.racingRed}10`, 
                        border: `1px solid ${COLORS.racingRed}20`, 
                        borderRadius: 10, 
                        padding: "10px 14px", 
                        display: "flex", 
                        alignItems: "flex-start", 
                        gap: 10 
                      }}
                    >
                      <span style={{ 
                        fontSize: 11, 
                        color: COLORS.racingRed, 
                        fontWeight: 600, 
                        background: `${COLORS.racingRed}20`, 
                        padding: "2px 8px", 
                        borderRadius: 4, 
                        flexShrink: 0 
                      }}>
                        {new Date(blocker.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, lineHeight: 1.5 }}>
                        {blocker.blocker}
                      </span>
                    </div>
                  ))}
                </div>
              </SummarySection>
            ) : (
              <SummarySection title="Challenges" icon={<CheckCircle size={18} />} color={COLORS.success}>
                <div style={{ 
                  background: `${COLORS.success}10`, 
                  border: `1px solid ${COLORS.success}20`, 
                  borderRadius: 10, 
                  padding: "12px 16px", 
                  color: COLORS.success, 
                  fontWeight: 500, 
                  fontSize: 14 
                }}>
                  ✓ No significant blockers {isWeekly ? "this week" : "this month"}!
                </div>
              </SummarySection>
            )}

            {/* Recommendations (Monthly only) */}
            {!isWeekly && summary.recommendations && (
              <SummarySection title="Recommendations" icon={<Star size={18} />} color={COLORS.purple}>
                <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                  {summary.recommendations.map((rec, idx) => (
                    <li 
                      key={idx} 
                      style={{ 
                        color: "rgba(255,255,255,0.8)", 
                        lineHeight: 1.7, 
                        marginBottom: 8, 
                        paddingLeft: 20, 
                        position: "relative" 
                      }}
                    >
                      <span style={{ position: "absolute", left: 0, color: COLORS.purple }}>→</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </SummarySection>
            )}

            {/* Consistency Badge */}
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              padding: 20, 
              background: "rgba(255,255,255,0.03)", 
              borderRadius: 14, 
              marginTop: 8 
            }}>
              <ConsistencyBadge rating={summary.consistencyRating} score={summary.consistencyScore} />
            </div>
          </div>

          {/* Actions */}
          <div style={{ 
            marginTop: 28, 
            padding: 20, 
            background: "rgba(103, 146, 137, 0.1)", 
            borderRadius: 16, 
            border: `1px solid ${COLORS.jungleTeal}30` 
          }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              flexWrap: "wrap", 
              gap: 16 
            }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "white", marginBottom: 4 }}>
                  Share this report
                </div>
                <div style={{ 
                  fontSize: 13, 
                  color: "rgba(255,255,255,0.5)", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 6 
                }}>
                  <Mail size={14} />
                  {assignedPM?.fullName || "Project Manager"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button 
                  onClick={handleExport} 
                  style={{ 
                    padding: "12px 20px", 
                    background: "transparent", 
                    border: "1px solid rgba(255,255,255,0.1)", 
                    borderRadius: 12, 
                    color: "rgba(255,255,255,0.7)", 
                    cursor: "pointer", 
                    fontSize: 14, 
                    fontWeight: 600, 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 8 
                  }}
                >
                  <Download size={18} />Export
                </button>
                <button 
                  onClick={onSend} 
                  disabled={isSending || sendSuccess} 
                  style={{ 
                    padding: "12px 24px", 
                    background: sendSuccess 
                      ? COLORS.success 
                      : `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)`, 
                    color: "white", 
                    border: "none", 
                    borderRadius: 12, 
                    fontWeight: 600, 
                    cursor: isSending || sendSuccess ? "default" : "pointer", 
                    fontSize: 14, 
                    display: "flex", 
                    alignItems: "center", 
                    gap: 10, 
                    opacity: isSending ? 0.7 : 1 
                  }}
                >
                  {isSending ? (
                    <><Loader size={18} style={{ animation: "spin 1s linear infinite" }} />Sending...</>
                  ) : sendSuccess ? (
                    <><CheckCircle size={18} />Sent!</>
                  ) : (
                    <><Send size={18} />Send Report</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
function DailyLogPage({ isMobile = false, assignedPM }) {
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState("weekly");
  const [expandedWeeks, setExpandedWeeks] = useState({});
  const [expandedMonths, setExpandedMonths] = useState({});
  const [selectedWeekForSummary, setSelectedWeekForSummary] = useState(null);
  const [selectedMonthForSummary, setSelectedMonthForSummary] = useState(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryType, setSummaryType] = useState(null);
  const [weeklySummaries, setWeeklySummaries] = useState({});
  const [monthlySummaries, setMonthlySummaries] = useState({});
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [dailyLogs, setDailyLogs] = useState(sampleLogs);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  const defaultPM = assignedPM || { fullName: "Sarah Johnson", email: "sarah.johnson@company.com" };

  // Group logs by week
  const logsByWeek = useMemo(() => {
    const grouped = {};
    dailyLogs.forEach(log => {
      const weekRange = getWeekDateRange(log.date);
      const weekKey = weekRange.start.toISOString().split('T')[0];
      if (!grouped[weekKey]) {
        grouped[weekKey] = { 
          weekNumber: getWeekNumber(log.date), 
          dateRange: weekRange, 
          logs: [], 
          totalHours: 0 
        };
      }
      grouped[weekKey].logs.push(log);
      grouped[weekKey].totalHours += log.hoursWorked || 0;
    });
    Object.values(grouped).forEach(week => {
      week.logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    });
    return grouped;
  }, [dailyLogs]);

  // Group logs by month
  const logsByMonth = useMemo(() => {
    const grouped = {};
    dailyLogs.forEach(log => {
      const monthKey = getMonthKey(log.date);
      if (!grouped[monthKey]) {
        grouped[monthKey] = { 
          monthLabel: formatMonth(monthKey), 
          logs: [], 
          totalHours: 0, 
          weeks: new Set() 
        };
      }
      grouped[monthKey].logs.push(log);
      grouped[monthKey].totalHours += log.hoursWorked || 0;
      grouped[monthKey].weeks.add(getWeekDateRange(log.date).start.toISOString().split('T')[0]);
    });
    Object.values(grouped).forEach(month => {
      month.weekCount = month.weeks.size;
      delete month.weeks;
      month.logs.sort((a, b) => new Date(b.date) - new Date(a.date));
    });
    return grouped;
  }, [dailyLogs]);

  const sortedWeekKeys = useMemo(() => 
    Object.keys(logsByWeek).sort((a, b) => new Date(b) - new Date(a)), 
    [logsByWeek]
  );

  const sortedMonthKeys = useMemo(() => 
    Object.keys(logsByMonth).sort((a, b) => b.localeCompare(a)), 
    [logsByMonth]
  );

  // Filter logs
  const filteredLogs = useMemo(() => {
    let result = [...dailyLogs];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(log => 
        log.tasks.toLowerCase().includes(q) || 
        log.learnings.toLowerCase().includes(q) || 
        (log.blockers && log.blockers.toLowerCase().includes(q))
      );
    }
    if (activeFilter === 'blockers') {
      result = result.filter(log => log.blockers && log.blockers.toLowerCase() !== 'none');
    }
    if (activeFilter === 'highHours') {
      result = result.filter(log => log.hoursWorked >= 8);
    }
    return result;
  }, [dailyLogs, searchQuery, activeFilter]);

  const filterCounts = useMemo(() => ({
    all: dailyLogs.length,
    blockers: dailyLogs.filter(log => log.blockers && log.blockers.toLowerCase() !== 'none').length,
    highHours: dailyLogs.filter(log => log.hoursWorked >= 8).length
  }), [dailyLogs]);

  // Stats
  const stats = useMemo(() => ({
    totalLogs: dailyLogs.length,
    totalHours: dailyLogs.reduce((sum, log) => sum + (log.hoursWorked || 0), 0),
    totalWeeks: Object.keys(logsByWeek).length,
    totalMonths: Object.keys(logsByMonth).length,
    avgHoursPerDay: dailyLogs.length > 0 
      ? (dailyLogs.reduce((sum, log) => sum + (log.hoursWorked || 0), 0) / dailyLogs.length).toFixed(1) 
      : 0,
    totalBlockers: dailyLogs.filter(log => log.blockers && log.blockers.toLowerCase() !== 'none').length
  }), [dailyLogs, logsByWeek, logsByMonth]);

  // Handlers
  const handleSubmit = useCallback((formData) => {
    setDailyLogs(prev => [
      { id: Date.now(), ...formData, hoursWorked: parseInt(formData.hoursWorked) || 0 }, 
      ...prev
    ]);
    setShowForm(false);
  }, []);

  const toggleWeek = useCallback((weekKey) => 
    setExpandedWeeks(prev => ({ ...prev, [weekKey]: !prev[weekKey] })), 
    []
  );

  const toggleMonth = useCallback((monthKey) => 
    setExpandedMonths(prev => ({ ...prev, [monthKey]: !prev[monthKey] })), 
    []
  );

  const openSummaryModal = useCallback((type, key) => {
    setSummaryType(type);
    setSendSuccess(false);
    if (type === "weekly") {
      setSelectedWeekForSummary(key);
      if (!weeklySummaries[key]) {
        setWeeklySummaries(prev => ({ ...prev, [key]: generateWeeklySummary(logsByWeek[key], key) }));
      }
    } else {
      setSelectedMonthForSummary(key);
      if (!monthlySummaries[key]) {
        setMonthlySummaries(prev => ({ ...prev, [key]: generateMonthlySummary(logsByMonth[key], key) }));
      }
    }
    setShowSummaryModal(true);
  }, [logsByWeek, logsByMonth, weeklySummaries, monthlySummaries]);

  const sendReportToPM = useCallback(async () => {
    setIsSending(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSending(false);
    setSendSuccess(true);
    setTimeout(() => {
      setSendSuccess(false);
      setShowSummaryModal(false);
    }, 2500);
  }, []);

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: `linear-gradient(135deg, ${COLORS.inkBlack} 0%, #0a2e33 100%)`, 
      padding: 20 
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .glass { 
          background: rgba(255, 255, 255, 0.03); 
          backdrop-filter: blur(20px); 
          border: 1px solid rgba(255, 255, 255, 0.08); 
        }
        @keyframes scaleIn { 
          from { opacity: 0; transform: scale(0.95); } 
          to { opacity: 1; transform: scale(1); } 
        }
        @keyframes fadeInUp { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        @keyframes spin { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        {/* Stats Grid */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(6, 1fr)", 
          gap: 12, 
          marginBottom: 24 
        }}>
          <StatMini icon={<FileText size={18} />} label="Total Logs" value={stats.totalLogs} color={COLORS.jungleTeal} />
          <StatMini icon={<Clock size={18} />} label="Total Hours" value={stats.totalHours} color={COLORS.peachGlow} />
          <StatMini icon={<CalendarDays size={18} />} label="Weeks Logged" value={stats.totalWeeks} color={COLORS.purple} />
          <StatMini icon={<FolderOpen size={18} />} label="Months" value={stats.totalMonths} color="#f59e0b" />
          <StatMini icon={<TrendingUp size={18} />} label="Avg Hours/Day" value={stats.avgHoursPerDay} color={COLORS.success} />
          <StatMini icon={<AlertCircle size={18} />} label="Total Blockers" value={stats.totalBlockers} color={COLORS.racingRed} />
        </div>

        {/* Controls Bar */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: 20, 
          flexWrap: "wrap", 
          gap: 12 
        }}>
          {/* View Mode Tabs */}
          <div style={{ 
            display: "flex", 
            background: "rgba(255,255,255,0.05)", 
            borderRadius: 12, 
            padding: 4, 
            border: "1px solid rgba(255,255,255,0.08)" 
          }}>
            {[
              { id: "daily", label: "Daily", icon: <FileText size={16} /> },
              { id: "weekly", label: "Weekly", icon: <CalendarDays size={16} /> },
              { id: "monthly", label: "Monthly", icon: <FolderOpen size={16} /> }
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => setViewMode(tab.id)} 
                style={{ 
                  padding: "10px 18px", 
                  borderRadius: 10, 
                  border: "none", 
                  background: viewMode === tab.id ? COLORS.deepOcean : "transparent", 
                  color: viewMode === tab.id ? "white" : "rgba(255,255,255,0.6)", 
                  cursor: "pointer", 
                  fontSize: 13, 
                  fontWeight: 600, 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8,
                  transition: "all 0.2s"
                }}
              >
                {tab.icon}{tab.label}
              </button>
            ))}
          </div>

          {/* New Entry Button */}
          <button 
            onClick={() => setShowForm(!showForm)} 
            style={{ 
              padding: "12px 24px", 
              background: showForm 
                ? "rgba(255,255,255,0.08)" 
                : `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)`, 
              color: "white", 
              border: "none", 
              borderRadius: 12, 
              fontWeight: 600, 
              cursor: "pointer", 
              fontSize: 14, 
              display: "flex", 
              alignItems: "center", 
              gap: 8, 
              boxShadow: showForm ? "none" : `0 4px 20px ${COLORS.deepOcean}40`,
              transition: "all 0.2s"
            }}
          >
            {showForm ? <X size={18} /> : <BookOpen size={18} />}
            {showForm ? "Cancel" : "New Entry"}
          </button>
        </div>

        {/* Entry Form */}
        {showForm && (
          <LogEntryForm 
            onSubmit={handleSubmit} 
            onCancel={() => setShowForm(false)} 
            isMobile={isMobile} 
          />
        )}

        {/* Search & Filter (Daily view only) */}
        {viewMode === "daily" && (
          <SearchFilterBar 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            activeFilter={activeFilter} 
            setActiveFilter={setActiveFilter} 
            filterCounts={filterCounts} 
          />
        )}

        {/* Views */}
        {viewMode === "daily" && <DailyView logs={filteredLogs} />}
        {viewMode === "weekly" && (
          <WeeklyView 
            logsByWeek={logsByWeek} 
            sortedWeekKeys={sortedWeekKeys} 
            expandedWeeks={expandedWeeks} 
            toggleWeek={toggleWeek} 
            weeklySummaries={weeklySummaries} 
            openSummaryModal={openSummaryModal} 
            isMobile={isMobile} 
          />
        )}
        {viewMode === "monthly" && (
          <MonthlyView 
            logsByMonth={logsByMonth} 
            sortedMonthKeys={sortedMonthKeys} 
            expandedMonths={expandedMonths} 
            toggleMonth={toggleMonth} 
            monthlySummaries={monthlySummaries} 
            openSummaryModal={openSummaryModal} 
            isMobile={isMobile} 
          />
        )}

        {/* Summary Modal */}
        {showSummaryModal && (
          <SummaryModal 
            type={summaryType} 
            summary={summaryType === "weekly" 
              ? weeklySummaries[selectedWeekForSummary] 
              : monthlySummaries[selectedMonthForSummary]
            } 
            assignedPM={defaultPM} 
            onClose={() => setShowSummaryModal(false)} 
            onSend={sendReportToPM} 
            isSending={isSending} 
            sendSuccess={sendSuccess} 
            isMobile={isMobile} 
          />
        )}
      </div>
    </div>
  );
}

export default DailyLogPage;