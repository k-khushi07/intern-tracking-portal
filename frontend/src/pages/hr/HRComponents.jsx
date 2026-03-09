// HRComponents.jsx - Reusable components for HR Dashboard
// ✅ UPDATED WITH VIEW APPLICATION BUTTON
import React, { useCallback, useEffect, useState } from "react";
import { FileText } from "lucide-react";
import {
  Check, X, Eye, EyeOff, Key, Mail, Phone, MapPin, Users, MessageSquare,
  GraduationCap, Calendar, Activity, Pin, Trash2, Plus, Download, Send,
  Search
} from "lucide-react";
import { COLORS, GRADIENTS, glassCardStyle, inputStyle, primaryButtonStyle, secondaryButtonStyle, smallButtonStyle, actionButtonStyle, tinyButtonStyle } from "./HRConstants";
import { hrApi } from "../../lib/apiClient";
import { getRealtimeSocket } from "../../lib/realtime";

// ==================== STAT COMPONENTS ====================
export function StatCard({ icon, label, value, color, delay = 0 }) {
  return (
    <div style={{
      ...glassCardStyle,
      display: "flex",
      alignItems: "center",
      gap: 16,
      animation: `slideUp 0.5s ease ${delay}s both`,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 14,
        background: `${color}20`,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#ffffff",  // Changed to white for visibility
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.textPrimary }}>{value}</div>
        <div style={{ fontSize: 13, color: COLORS.textMuted }}>{label}</div>
      </div>
    </div>
  );
}

export function StatMini({ icon, value, label, color }) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.1)",
      borderRadius: 12,
      padding: "12px 16px",
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}>
      <div style={{ color }}>{icon}</div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: "white" }}>{value}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>{label}</div>
      </div>
    </div>
  );
}

// ==================== CARD COMPONENTS ====================
// ✅ UPDATED PendingCard with "View Application" Button
export function PendingCard({ intern, onApprove, onReject, compact = false, showTimestamp = false }) {
  const [pdfFeedback, setPdfFeedback] = useState({ open: false, message: "", tone: "info" });

  const handleViewPDF = () => {
    if (!intern.applicationPDF || !intern.applicationPDF.base64) {
      setPdfFeedback({
        open: true,
        message: "Application PDF not available for this intern.",
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
      setPdfFeedback({
        open: true,
        message: "Error opening PDF. Please try again.",
        tone: "error",
      });
    }
  };

  return (
    <div style={{
      ...glassCardStyle,
      padding: compact ? 14 : 20,
      borderLeft: `4px solid ${COLORS.orange}`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
          <div style={{
            width: compact ? 40 : 48, height: compact ? 40 : 48, borderRadius: "50%",
            background: GRADIENTS.ocean,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, color: "white", fontSize: compact ? 14 : 16,
          }}>
            {intern.fullName?.charAt(0) || "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: compact ? 14 : 15 }}>
              {intern.fullName}
            </div>
            <div style={{ fontSize: 13, color: COLORS.textMuted, marginTop: 2 }}>{intern.email}</div>
            {intern.degree && !compact && (
              <div style={{ fontSize: 12, color: COLORS.jungleTeal, marginTop: 4 }}>{intern.degree}</div>
            )}
            {showTimestamp && intern.registeredAt && (
              <div style={{ fontSize: 11, color: COLORS.orange, marginTop: 4 }}>
                Registered: {new Date(intern.registeredAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
        {!compact && (
          <div style={{ display: "flex", gap: 8 }}>
            {intern.applicationPDF && (
              <button 
                onClick={handleViewPDF}
                title="View Application PDF"
                style={{ 
                  ...actionButtonStyle, 
                  background: COLORS.jungleTeal,
                }}
              >
                <FileText size={16} />
              </button>
            )}
            <button onClick={() => onApprove(intern)} style={{ ...actionButtonStyle, background: COLORS.emeraldGlow }}>
              <Check size={16} />
            </button>
            <button onClick={() => onReject(intern)} style={{ ...actionButtonStyle, background: COLORS.red }}>
              <X size={16} />
            </button>
          </div>
        )}
      </div>
      {compact && (
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          {intern.applicationPDF && (
            <button 
              onClick={handleViewPDF}
              style={{ 
                ...smallButtonStyle, 
                flex: 1, 
                background: COLORS.jungleTeal 
              }}
            >
              <FileText size={14} /> View App
            </button>
          )}
          <button onClick={() => onApprove(intern)} style={{ ...smallButtonStyle, flex: 1, background: COLORS.emeraldGlow }}>
            <Check size={14} /> Approve
          </button>
          <button onClick={() => onReject(intern)} style={{ ...smallButtonStyle, flex: 1, background: COLORS.red }}>
            <X size={14} /> Reject
          </button>
        </div>
      )}

      {pdfFeedback.open && (
        <Modal
          onClose={() =>
            setPdfFeedback({
              open: false,
              message: "",
              tone: "info",
            })
          }
        >
          <h3 style={{ margin: 0, color: COLORS.textPrimary, fontSize: 20 }}>Notice</h3>
          <p style={{ color: COLORS.textSecondary, marginTop: 10, marginBottom: 16 }}>
            {pdfFeedback.message}
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              onClick={() =>
                setPdfFeedback({
                  open: false,
                  message: "",
                  tone: "info",
                })
              }
              style={{
                ...primaryButtonStyle,
                padding: "10px 14px",
                background: pdfFeedback.tone === "error" ? COLORS.red : COLORS.jungleTeal,
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

export function ActiveInternCard({ intern, onViewProfile, onToggleDisable, onChat }) {
  return (
    <div style={{
      ...glassCardStyle,
      opacity: intern.disabled ? 0.6 : 1,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: GRADIENTS.accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, color: "white", fontSize: 18,
        }}>
          {intern.fullName?.charAt(0) || "?"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: 15 }}>{intern.fullName}</span>
            {intern.disabled && (
              <span style={{ fontSize: 10, background: COLORS.red, color: "white", padding: "2px 6px", borderRadius: 4, fontWeight: 600 }}>
                DISABLED
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: COLORS.textMuted }}>{intern.email}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <InfoItem icon={<Key size={14} />} label="PM Code" value={intern.pmCode || "—"} />
        <InfoItem icon={<GraduationCap size={14} />} label="Degree" value={intern.degree || "—"} />
        <InfoItem icon={<Calendar size={14} />} label="Joined" value={intern.approvedAt ? new Date(intern.approvedAt).toLocaleDateString() : "—"} />
        <InfoItem icon={<Activity size={14} />} label="Last Log" value={intern.lastLogTime || "—"} />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onViewProfile(intern)} style={{ ...smallButtonStyle, flex: 1 }}>
          <Eye size={14} /> View
        </button>
        <button onClick={() => onChat(intern)} style={{ ...smallButtonStyle, flex: 1 }}>
          <MessageSquare size={14} /> Chat
        </button>
        <button onClick={() => onToggleDisable(intern.email, intern.role)} style={{ ...smallButtonStyle, background: intern.disabled ? COLORS.emeraldGlow : COLORS.red }}>
          {intern.disabled ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
      </div>
    </div>
  );
}

export function PMCard({ pm, internCount, onViewProfile, onChat }) {
  return (
    <div style={glassCardStyle}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.jungleTeal})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, color: "white", fontSize: 20,
        }}>
          {pm.fullName?.charAt(0) || "P"}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: 16 }}>{pm.fullName}</div>
          <div style={{ fontSize: 13, color: COLORS.jungleTeal, fontWeight: 600 }}>PM Code: {pm.pmCode}</div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
        <InfoItem icon={<Mail size={14} />} value={pm.email} />
        {pm.phone && <InfoItem icon={<Phone size={14} />} value={pm.phone} />}
        {pm.location && <InfoItem icon={<MapPin size={14} />} value={pm.location} />}
        <InfoItem icon={<Users size={14} />} value={`${internCount} interns assigned`} highlight />
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => onViewProfile(pm)} style={{ ...smallButtonStyle, flex: 1 }}>
          <Eye size={14} /> View Interns
        </button>
        <button onClick={() => onChat(pm)} style={{ ...smallButtonStyle, flex: 1 }}>
          <MessageSquare size={14} /> Chat
        </button>
      </div>
    </div>
  );
}

export function AnnouncementCard({ announcement, onDelete, onPin }) {
  return (
    <div style={{
      background: announcement.pinned ? `${COLORS.deepOcean}15` : COLORS.surfaceGlass,
      borderRadius: 12,
      padding: 14,
      border: `1px solid ${announcement.pinned ? COLORS.deepOcean : COLORS.borderGlass}`,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            {announcement.pinned && <Pin size={14} color={COLORS.jungleTeal} />}
            <span style={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: 14 }}>{announcement.title}</span>
          </div>
          <p style={{ fontSize: 13, color: COLORS.textSecondary, margin: 0, lineHeight: 1.5 }}>
            {announcement.content}
          </p>
          <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 8 }}>
            {new Date(announcement.date).toLocaleDateString()}
          </div>
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          <button onClick={() => onPin(announcement.id)} style={tinyButtonStyle}>
            <Pin size={12} />
          </button>
          <button onClick={() => onDelete(announcement.id)} style={{ ...tinyButtonStyle, color: COLORS.red }}>
            <Trash2 size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== UI COMPONENTS ====================
export function InfoItem({ icon, label, value, highlight = false }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ color: COLORS.textMuted }}>{icon}</span>
      <span style={{ fontSize: 13, color: highlight ? COLORS.jungleTeal : COLORS.textSecondary }}>
        {label && <span style={{ color: COLORS.textMuted }}>{label}: </span>}
        {value}
      </span>
    </div>
  );
}

export function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position: "relative" }}>
      <Search size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: COLORS.textMuted }} />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ ...inputStyle, paddingLeft: 42, minWidth: 220 }}
      />
    </div>
  );
}

export function EmptyState({ icon, message, subMessage }) {
  return (
    <div style={{ textAlign: "center", padding: 40 }}>
      <div style={{ color: COLORS.textMuted, marginBottom: 12 }}>{icon}</div>
      <p style={{ color: COLORS.textSecondary, margin: 0, fontWeight: 500 }}>{message}</p>
      {subMessage && <p style={{ color: COLORS.textMuted, margin: "8px 0 0 0", fontSize: 13 }}>{subMessage}</p>}
    </div>
  );
}

// ==================== MODAL COMPONENTS ====================
export function Modal({ children, onClose, wide = false }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
        backdropFilter: "blur(8px)", display: "flex", alignItems: "center",
        justifyContent: "center", zIndex: 1000, padding: 20, animation: "fadeIn 0.2s ease",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: GRADIENTS.primary, borderRadius: 20, padding: 28,
          maxWidth: wide ? 800 : 500, width: "100%", border: `1px solid ${COLORS.borderGlass}`,
          maxHeight: "90vh", overflowY: "auto", animation: "slideUp 0.3s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function ApprovalModal({ intern, pmCodeInput, setPmCodeInput, allPMs, onApprove, onClose }) {
  return (
    <>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 20 }}>
        Approve Intern
      </h2>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", background: GRADIENTS.ocean,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, color: "white", fontSize: 20,
        }}>
          {intern?.fullName?.charAt(0) || "?"}
        </div>
        <div>
          <div style={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: 16 }}>{intern?.fullName}</div>
          <div style={{ fontSize: 14, color: COLORS.textMuted }}>{intern?.email}</div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>
          Assign Project Manager
        </label>
        <div style={{ position: "relative" }}>
          <Key size={18} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: COLORS.textMuted }} />
          <input
            placeholder="Enter PM Code (e.g., PM001)"
            value={pmCodeInput}
            onChange={e => setPmCodeInput(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 44 }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
          {allPMs.slice(0, 5).map(pm => (
            <button
              key={pm.pmCode}
              onClick={() => setPmCodeInput(pm.pmCode)}
              style={{
                padding: "6px 12px", borderRadius: 8, border: `1px solid ${COLORS.borderGlass}`,
                background: pmCodeInput === pm.pmCode ? COLORS.deepOcean : "transparent",
                color: COLORS.textSecondary, fontSize: 12, cursor: "pointer",
              }}
            >
              {pm.pmCode}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onApprove} style={primaryButtonStyle}>
          <Check size={18} /> Approve Intern
        </button>
        <button onClick={onClose} style={secondaryButtonStyle}>Cancel</button>
      </div>
    </>
  );
}

export function RejectModal({ intern, rejectReason, setRejectReason, onReject, onClose }) {
  return (
    <>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 20 }}>
        Reject Registration
      </h2>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
        <div style={{
          width: 56, height: 56, borderRadius: "50%", background: COLORS.red,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, color: "white", fontSize: 20,
        }}>
          {intern?.fullName?.charAt(0) || "?"}
        </div>
        <div>
          <div style={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: 16 }}>{intern?.fullName}</div>
          <div style={{ fontSize: 14, color: COLORS.textMuted }}>{intern?.email}</div>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>
          Reason for Rejection (Optional)
        </label>
        <textarea
          placeholder="Provide a reason..."
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          style={{ ...inputStyle, minHeight: 100, resize: "vertical" }}
        />
      </div>

      <div style={{ display: "flex", gap: 12 }}>
        <button onClick={onReject} style={{ ...primaryButtonStyle, background: COLORS.red }}>
          <X size={18} /> Reject
        </button>
        <button onClick={onClose} style={secondaryButtonStyle}>
          Cancel
        </button>
      </div>
    </>
  );
}

export function ChatModal({ user }) {
  const [messages, setMessages] = useState([
    { id: 1, from: "them", text: "Hi, I have a question about my assignment.", time: "10:30 AM" },
    { id: 2, from: "me", text: "Sure, how can I help?", time: "10:32 AM" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), from: "me", text: input, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) }]);
    setInput("");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: 500 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14, paddingBottom: 16, borderBottom: `1px solid ${COLORS.borderGlass}`, marginBottom: 16 }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%", background: GRADIENTS.accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, color: "white", fontSize: 18,
        }}>
          {user?.fullName?.charAt(0) || "?"}
        </div>
        <div>
          <div style={{ fontWeight: 600, color: COLORS.textPrimary }}>{user?.fullName}</div>
          <div style={{ fontSize: 12, color: COLORS.emeraldGlow }}>Online</div>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, marginBottom: 16 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ display: "flex", justifyContent: msg.from === "me" ? "flex-end" : "flex-start" }}>
            <div style={{
              maxWidth: "70%", padding: "10px 14px", borderRadius: 14,
              background: msg.from === "me" ? GRADIENTS.accent : COLORS.surfaceGlass,
              color: COLORS.textPrimary,
            }}>
              <p style={{ margin: 0, fontSize: 14 }}>{msg.text}</p>
              <span style={{ fontSize: 10, color: COLORS.textMuted }}>{msg.time}</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          style={{ ...inputStyle, flex: 1 }}
        />
        <button onClick={handleSend} style={primaryButtonStyle}>
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}

export function ProfileModal({ user, profileTab, setProfileTab, onChat }) {
  const tabs = [
    { id: "personal", label: "Personal" },
    { id: "academic", label: "Academic" },
    { id: "internship", label: "Internship" },
    { id: "logs", label: "Daily Logs" },
    { id: "reports", label: "Reports" },
    { id: "performance", label: "Performance" },
  ];

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", background: GRADIENTS.accent,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, color: "white", fontSize: 26,
        }}>
          {user?.fullName?.charAt(0) || "?"}
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 24, color: COLORS.textPrimary }}>{user?.fullName}</h2>
          <p style={{ margin: "4px 0 0 0", color: COLORS.textMuted }}>{user?.degree || user?.role}</p>
        </div>
        <button onClick={onChat} style={primaryButtonStyle}>
          <MessageSquare size={18} /> Chat
        </button>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 24, flexWrap: "wrap", background: COLORS.surfaceGlass, padding: 6, borderRadius: 12 }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setProfileTab(tab.id)}
            style={{
              padding: "8px 14px", borderRadius: 8, border: "none", cursor: "pointer",
              fontWeight: 600, fontSize: 13,
              background: profileTab === tab.id ? GRADIENTS.accent : "transparent",
              color: profileTab === tab.id ? "white" : COLORS.textSecondary,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {profileTab === "personal" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <ProfileField label="Full Name" value={user?.fullName} />
            <ProfileField label="Email" value={user?.email} />
            <ProfileField label="Phone" value={user?.phone || "Not provided"} />
            <ProfileField label="Date of Birth" value={user?.dob || "Not provided"} />
          </div>
        )}
        {profileTab === "academic" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <ProfileField label="Degree" value={user?.degree || "Not provided"} />
            <ProfileField label="University" value={user?.university || "Not provided"} />
            <ProfileField label="Major" value={user?.major || "Not provided"} />
            <ProfileField label="Graduation Year" value={user?.graduationYear || "Not provided"} />
          </div>
        )}
        {profileTab === "internship" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <ProfileField label="PM Code" value={user?.pmCode || "Not assigned"} />
            <ProfileField label="Status" value={user?.status || "Pending"} />
            <ProfileField label="Approved By" value={user?.approvedBy || "—"} />
            <ProfileField label="Approved At" value={user?.approvedAt ? new Date(user.approvedAt).toLocaleDateString() : "—"} />
          </div>
        )}
        {profileTab === "logs" && <LogsTable />}
        {profileTab === "reports" && <ReportsTab user={user} />}
        {profileTab === "performance" && <PerformanceTab />}
      </div>
    </>
  );
}

function ProfileField({ label, value }) {
  return (
    <div style={{ background: COLORS.surfaceGlass, padding: 14, borderRadius: 12, border: `1px solid ${COLORS.borderGlass}` }}>
      <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>{value}</div>
    </div>
  );
}

function LogsTable() {
  const mockLogs = [
    { date: "2024-01-15", hours: 8, task: "Dashboard development", status: "Approved" },
    { date: "2024-01-14", hours: 7, task: "API integration", status: "Approved" },
    { date: "2024-01-13", hours: 8, task: "Bug fixes", status: "Pending" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <span style={{ fontSize: 14, color: COLORS.textMuted }}>Recent daily logs</span>
        <button style={smallButtonStyle}><Download size={14} /> Export</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {mockLogs.map((log, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 12, background: COLORS.surfaceGlass, padding: 12, borderRadius: 10 }}>
            <div style={{ fontSize: 13, color: COLORS.textMuted, width: 80 }}>{log.date}</div>
            <div style={{ fontSize: 13, color: COLORS.textSecondary, flex: 1 }}>{log.task}</div>
            <div style={{ fontSize: 13, color: COLORS.jungleTeal }}>{log.hours}h</div>
            <span style={{
              fontSize: 11, padding: "2px 8px", borderRadius: 4,
              background: log.status === "Approved" ? COLORS.emeraldGlow : COLORS.orange,
              color: "white", fontWeight: 600,
            }}>{log.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportsTab({ user }) {
  const internId = user?.id || null;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tnaItems, setTnaItems] = useState([]);
  const [blueprint, setBlueprint] = useState(null);
  const [links, setLinks] = useState({ tnaSheetUrl: "", blueprintDocUrl: "" });

  const load = useCallback(async () => {
    if (!internId) return;
    setLoading(true);
    setError("");
    try {
      const [tnaRes, blueprintRes, linksRes] = await Promise.all([
        hrApi.internTna(internId),
        hrApi.internBlueprint(internId),
        hrApi.internReportLinks(internId),
      ]);
      setTnaItems(tnaRes?.items || []);
      setBlueprint(blueprintRes?.blueprint || null);
      setLinks({
        tnaSheetUrl: linksRes?.links?.tnaSheetUrl || "",
        blueprintDocUrl: linksRes?.links?.blueprintDocUrl || "",
      });
    } catch (e) {
      setError(e?.message || "Failed to load intern reports");
      setTnaItems([]);
      setBlueprint(null);
    } finally {
      setLoading(false);
    }
  }, [internId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const socket = getRealtimeSocket();
    const onChanged = (payload) => {
      if (!payload) return;
      if (payload.internId && payload.internId !== internId) return;
      if (!["tna", "blueprint", "report_links"].includes(payload.entity)) return;
      load();
    };
    socket.on("itp:changed", onChanged);
    return () => socket.off("itp:changed", onChanged);
  }, [internId, load]);

  const completed = (tnaItems || []).filter((i) => (i.status || "") === "completed").length;
  const blocked = (tnaItems || []).filter((i) => (i.status || "") === "blocked").length;
  const bpData = blueprint?.data || {};

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {loading && (
        <div style={{ background: COLORS.surfaceGlass, padding: 16, borderRadius: 12, border: `1px solid ${COLORS.borderGlass}`, color: COLORS.textMuted }}>
          Loading…
        </div>
      )}
      {!loading && error && (
        <div style={{ background: COLORS.surfaceGlass, padding: 16, borderRadius: 12, border: `1px solid ${COLORS.borderGlass}`, borderLeft: `4px solid ${COLORS.orange}` }}>
          <div style={{ fontWeight: 700, color: COLORS.textPrimary }}>Could not load reports</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 6 }}>{error}</div>
        </div>
      )}
      {!loading && !error && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
            <div style={{ background: COLORS.surfaceGlass, padding: 16, borderRadius: 12, border: `1px solid ${COLORS.borderGlass}` }}>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8 }}>TNA Rows</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.textPrimary }}>{(tnaItems || []).length}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>Total</div>
            </div>
            <div style={{ background: COLORS.surfaceGlass, padding: 16, borderRadius: 12, border: `1px solid ${COLORS.borderGlass}` }}>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8 }}>Completed</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.emeraldGlow }}>{completed}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>TNA</div>
            </div>
            <div style={{ background: COLORS.surfaceGlass, padding: 16, borderRadius: 12, border: `1px solid ${COLORS.borderGlass}` }}>
              <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 8 }}>Blocked</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: COLORS.orange }}>{blocked}</div>
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>TNA</div>
            </div>
          </div>

          <div style={{ background: COLORS.surfaceGlass, padding: 16, borderRadius: 12, border: `1px solid ${COLORS.borderGlass}` }}>
            <div style={{ fontWeight: 700, color: COLORS.textPrimary, marginBottom: 10 }}>External links (optional)</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontSize: 12, color: COLORS.textMuted, overflow: "hidden", textOverflow: "ellipsis" }}>
                  TNA Sheet: {links.tnaSheetUrl || "—"}
                </div>
                {links.tnaSheetUrl && (
                  <button onClick={() => window.open(links.tnaSheetUrl, "_blank", "noopener,noreferrer")} style={tinyButtonStyle}>
                    <Eye size={14} /> Open
                  </button>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                <div style={{ fontSize: 12, color: COLORS.textMuted, overflow: "hidden", textOverflow: "ellipsis" }}>
                  Blueprint Doc: {links.blueprintDocUrl || "—"}
                </div>
                {links.blueprintDocUrl && (
                  <button onClick={() => window.open(links.blueprintDocUrl, "_blank", "noopener,noreferrer")} style={tinyButtonStyle}>
                    <Eye size={14} /> Open
                  </button>
                )}
              </div>
            </div>
          </div>

          <div style={{ ...glassCardStyle, padding: 16 }}>
            <div style={{ fontWeight: 800, color: COLORS.textPrimary, marginBottom: 8 }}>Blueprint</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ background: COLORS.surfaceGlass, padding: 12, borderRadius: 12, border: `1px solid ${COLORS.borderGlass}` }}>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>Objective</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6 }}>{bpData.objective || "—"}</div>
              </div>
              <div style={{ background: COLORS.surfaceGlass, padding: 12, borderRadius: 12, border: `1px solid ${COLORS.borderGlass}` }}>
                <div style={{ fontSize: 12, color: COLORS.textMuted, marginBottom: 6 }}>Scope</div>
                <div style={{ fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6 }}>{bpData.scope || "—"}</div>
              </div>
            </div>
          </div>

          <div style={{ background: COLORS.surfaceGlass, padding: 16, borderRadius: 12, border: `1px solid ${COLORS.borderGlass}` }}>
            <div style={{ fontWeight: 800, color: COLORS.textPrimary, marginBottom: 10 }}>Latest TNA rows</div>
            {(tnaItems || []).slice(0, 6).map((i) => (
              <div key={i.id} style={{ display: "flex", justifyContent: "space-between", gap: 10, padding: "10px 0", borderBottom: `1px solid ${COLORS.borderGlass}` }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, color: COLORS.textPrimary, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {i.task || "—"}
                  </div>
                  <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>
                    Week {i.week_number || "—"} • Planned {i.planned_date || "—"}
                  </div>
                </div>
                <div style={{ fontSize: 12, fontWeight: 800, color: (i.status || "") === "completed" ? COLORS.emeraldGlow : (i.status || "") === "blocked" ? COLORS.orange : COLORS.jungleTeal }}>
                  {(i.status || "pending").replace("_", " ")}
                </div>
              </div>
            ))}
            {(tnaItems || []).length === 0 && (
              <div style={{ fontSize: 12, color: COLORS.textMuted }}>No TNA rows yet.</div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function PerformanceTab() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        <div style={{ background: COLORS.surfaceGlass, padding: 16, borderRadius: 12, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.emeraldGlow }}>92%</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>Attendance</div>
        </div>
        <div style={{ background: COLORS.surfaceGlass, padding: 16, borderRadius: 12, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.jungleTeal }}>4.5</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>Avg Rating</div>
        </div>
        <div style={{ background: COLORS.surfaceGlass, padding: 16, borderRadius: 12, textAlign: "center" }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: COLORS.cyanHighlight }}>15</div>
          <div style={{ fontSize: 12, color: COLORS.textMuted }}>Tasks Done</div>
        </div>
      </div>
    </div>
  );
}

export function AnnouncementModal({ onSave, onClose }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [targetInterns, setTargetInterns] = useState(true);
  const [targetPMs, setTargetPMs] = useState(true);
  const [audienceError, setAudienceError] = useState("");

  return (
    <>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary, marginBottom: 20 }}>
        Create Announcement
      </h2>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>Title</label>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title..." style={inputStyle} />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14, color: COLORS.textPrimary }}>Content</label>
        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Announcement content..." style={{ ...inputStyle, minHeight: 100 }} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: COLORS.textPrimary, marginBottom: 10 }}>
          Audience
        </div>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={targetInterns} onChange={(e) => setTargetInterns(e.target.checked)} />
            <span style={{ fontSize: 14, color: COLORS.textSecondary }}>Interns</span>
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={targetPMs} onChange={(e) => setTargetPMs(e.target.checked)} />
            <span style={{ fontSize: 14, color: COLORS.textSecondary }}>PMs</span>
          </label>
        </div>
        <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 8 }}>
          Select who should see this announcement.
        </div>
        {audienceError ? (
          <div style={{ marginTop: 8, fontSize: 12, color: COLORS.red }}>{audienceError}</div>
        ) : null}
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
          <input type="checkbox" checked={pinned} onChange={e => setPinned(e.target.checked)} />
          <span style={{ fontSize: 14, color: COLORS.textSecondary }}>Pin this announcement</span>
        </label>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <button
          onClick={() => {
            const roles = [];
            if (targetInterns) roles.push("intern");
            if (targetPMs) roles.push("pm");
            if (!roles.length) {
              setAudienceError("Please select at least one audience (Interns and/or PMs).");
              return;
            }
            setAudienceError("");
            onSave({ title, content, pinned, audienceRoles: roles });
          }}
          style={primaryButtonStyle}
        >
          <Plus size={18} /> Create
        </button>
        <button onClick={onClose} style={secondaryButtonStyle}>Cancel</button>
      </div>
    </>
  );
}

// ==================== NOTIFICATION COMPONENTS ====================
export function NotificationModal({ notifications, onClose, onClear, onMarkAsRead }) {
  return (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: COLORS.textPrimary, margin: 0 }}>
          Notifications
        </h2>
        <button onClick={onClear} style={{ ...smallButtonStyle, background: COLORS.red }}>
          <Trash2 size={16} /> Clear All
        </button>
      </div>

      {notifications.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <p style={{ color: COLORS.textMuted }}>No notifications</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, maxHeight: 400, overflowY: "auto" }}>
          {notifications.map(notification => (
            <div
              key={notification.id}
              onClick={() => onMarkAsRead(notification.id)}
              style={{
                padding: 16,
                borderRadius: 12,
                background: notification.read ? COLORS.surfaceGlass : `${COLORS.jungleTeal}15`,
                border: `1px solid ${notification.read ? COLORS.borderGlass : COLORS.jungleTeal}`,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, color: COLORS.textPrimary, fontSize: 14, marginBottom: 4 }}>
                    {notification.title}
                  </div>
                  <div style={{ fontSize: 13, color: COLORS.textSecondary, marginBottom: 6 }}>
                    {notification.message}
                  </div>
                  <div style={{ fontSize: 11, color: COLORS.textMuted }}>{notification.time}</div>
                </div>
                {!notification.read && (
                  <div style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: COLORS.jungleTeal, flexShrink: 0,
                  }} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 20 }}>
        <button onClick={onClose} style={secondaryButtonStyle}>
          Close
        </button>
      </div>
    </>
  );
}

// ==================== REPORT COMPONENTS ====================
export function DailyLogsReport() {
  const logs = [
    { date: "2024-01-15", intern: "John Doe", hours: 8, task: "Dashboard development", status: "Approved" },
    { date: "2024-01-15", intern: "Jane Smith", hours: 7, task: "API testing", status: "Pending" },
    { date: "2024-01-14", intern: "John Doe", hours: 8, task: "Bug fixes", status: "Approved" },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
        <span style={{ color: COLORS.textMuted }}>{logs.length} logs found</span>
        <button style={smallButtonStyle}><Download size={14} /> Export</button>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {logs.map((log, idx) => (
          <div key={idx} style={{ display: "flex", alignItems: "center", gap: 16, background: COLORS.surfaceGlass, padding: 14, borderRadius: 12 }}>
            <div style={{ width: 80, fontSize: 13, color: COLORS.textMuted }}>{log.date}</div>
            <div style={{ width: 120, fontSize: 13, color: COLORS.textPrimary, fontWeight: 500 }}>{log.intern}</div>
            <div style={{ flex: 1, fontSize: 13, color: COLORS.textSecondary }}>{log.task}</div>
            <div style={{ width: 50, fontSize: 13, color: COLORS.jungleTeal }}>{log.hours}h</div>
            <span style={{
              fontSize: 11, padding: "3px 10px", borderRadius: 6,
              background: log.status === "Approved" ? COLORS.emeraldGlow : COLORS.orange,
              color: "white", fontWeight: 600,
            }}>{log.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SummaryReport() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
      <SummaryCard title="Total Hours Logged" value="1,245h" subtitle="This month" color={COLORS.emeraldGlow} />
      <SummaryCard title="Average Daily Hours" value="7.2h" subtitle="Per intern" color={COLORS.jungleTeal} />
      <SummaryCard title="Tasks Completed" value="342" subtitle="This month" color={COLORS.cyanHighlight} />
      <SummaryCard title="Pending Reviews" value="28" subtitle="Awaiting approval" color={COLORS.orange} />
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

export function TNAReport() {
  const tnaData = [
    { project: "Dashboard Redesign", submissions: 15, approved: 12, pending: 3 },
    { project: "API Development", submissions: 8, approved: 6, pending: 2 },
    { project: "Mobile App", submissions: 20, approved: 18, pending: 2 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {tnaData.map((item, idx) => (
        <div key={idx} style={{ background: COLORS.surfaceGlass, padding: 16, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontWeight: 600, color: COLORS.textPrimary }}>{item.project}</div>
            <div style={{ fontSize: 13, color: COLORS.textMuted }}>{item.submissions} submissions</div>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.emeraldGlow }}>{item.approved}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>Approved</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.orange }}>{item.pending}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>Pending</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AttendanceReport() {
  const attendanceData = [
    { intern: "John Doe", present: 20, absent: 2, percentage: 91 },
    { intern: "Jane Smith", present: 21, absent: 1, percentage: 95 },
    { intern: "Mike Johnson", present: 18, absent: 4, percentage: 82 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {attendanceData.map((item, idx) => (
        <div key={idx} style={{ background: COLORS.surfaceGlass, padding: 16, borderRadius: 12, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: GRADIENTS.accent, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, color: "white" }}>
            {item.intern.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: COLORS.textPrimary }}>{item.intern}</div>
            <div style={{ fontSize: 12, color: COLORS.textMuted }}>{item.present} present, {item.absent} absent</div>
          </div>
          <div style={{
            width: 50, height: 50, borderRadius: "50%",
            background: `conic-gradient(${item.percentage >= 90 ? COLORS.emeraldGlow : COLORS.orange} ${item.percentage * 3.6}deg, ${COLORS.surfaceGlass} 0deg)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: COLORS.bgPrimary, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: COLORS.textPrimary }}>
              {item.percentage}%
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function PMPerformanceReport() {
  const pmData = [
    { name: "Test Project Manager", pmCode: "PM001", interns: 4, tasksCompleted: 45 },
    { name: "Khushi", pmCode: "PM002", interns: 0, tasksCompleted: 0 },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {pmData.map((pm, idx) => (
        <div key={idx} style={{ background: COLORS.surfaceGlass, padding: 16, borderRadius: 12, display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{
            width: 48, height: 48, borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.purple}, ${COLORS.jungleTeal})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, color: "white", fontSize: 18
          }}>
            {pm.name.charAt(0)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: COLORS.textPrimary }}>{pm.name}</div>
            <div style={{ fontSize: 12, color: COLORS.jungleTeal }}>{pm.pmCode}</div>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.cyanHighlight }}>{pm.interns}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>Interns</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.purple }}>{pm.tasksCompleted}</div>
              <div style={{ fontSize: 11, color: COLORS.textMuted }}>Tasks</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
