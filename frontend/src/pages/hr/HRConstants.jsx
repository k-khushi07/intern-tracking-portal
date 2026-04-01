// HRConstants.jsx 
import {
  Users, UserCheck, Clock, Home, FileText, Briefcase
} from "lucide-react";

// ==================== STATUS CONSTANTS ====================
export const INTERN_STATUS = {
  NEW: "",
  PENDING: "pending",
  ACTIVE: "active",
  DISABLED: "disabled",
};

// ==================== PM DASHBOARD COLORS (EXACT MATCH) ====================
export const COLORS = {
  // Main backgrounds
  bgPrimary: "#020617",
  bgSecondary: "#0a2528",
  
  // Surface & Glass
  surfaceGlass: "rgba(255, 255, 255, 0.06)",
  borderGlass: "rgba(255, 255, 255, 0.12)",
  
  // Brand colors - Bright Teal
  deepOcean: "#0f766e",
  jungleTeal: "#14b8a6",
  emeraldGlow: "#10b981",
  cyanHighlight: "#22d3ee",
  
  // Text
  textPrimary: "#f8fafc",
  textSecondary: "rgba(248, 250, 252, 0.7)",
  textMuted: "rgba(248, 250, 252, 0.5)",
  
  // Status colors
  orange: "#f59e0b",
  red: "#ef4444",
  purple: "#a78bfa",
  success: "#10b981",
  warning: "#f59e0b",
  error: "#ef4444",
  info: "#3b82f6",
  
  // Compatibility aliases
  teal: "#14b8a6",
  tealDark: "#0f766e",
  tealDeep: "#0f766e",
  cyan: "#22d3ee",
  peachGlow: "#ffe5d9",
};

export const GRADIENTS = {
  primary: `linear-gradient(135deg, ${COLORS.bgPrimary} 0%, ${COLORS.bgSecondary} 50%, ${COLORS.bgPrimary} 100%)`,
  accent: `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)`,
  emerald: `linear-gradient(135deg, ${COLORS.emeraldGlow} 0%, ${COLORS.jungleTeal} 100%)`,
  ocean: `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.cyanHighlight} 100%)`,
  welcome: `linear-gradient(135deg, #16a085 0%, ${COLORS.jungleTeal} 100%)`,
};

export const keyframes = `
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
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.8; }
  }
  @keyframes glow {
    0%, 100% { box-shadow: 0 0 20px rgba(20, 184, 166, 0.3); }
    50% { box-shadow: 0 0 40px rgba(20, 184, 166, 0.5); }
  }
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-10px); }
  }
`;

export const navItems = (stats) => [
  { id: "dashboard", icon: Home, label: "HR Dashboard", badge: 0 },
  { id: "new", icon: FileText, label: "New Registrations", badge: stats?.newRegistrations || 0 },
  { id: "approval", icon: Clock, label: "Approval Center", badge: stats?.pending || 0 },
  { id: "active", icon: UserCheck, label: "Active Interns", badge: 0 },
  { id: "projectManagers", icon: Briefcase, label: "Project Managers", badge: 0 },
];

export const glassCardStyle = {
  background: COLORS.surfaceGlass,
  backdropFilter: "blur(14px)",
  borderRadius: 18,
  padding: 24,
  border: `1px solid ${COLORS.borderGlass}`,
  boxShadow: `0 8px 30px rgba(15, 118, 110, 0.15)`,
};

export const inputStyle = {
  width: "100%",
  padding: "14px 16px",
  borderRadius: 12,
  border: `1px solid ${COLORS.borderGlass}`,
  background: COLORS.surfaceGlass,
  color: COLORS.textPrimary,
  outline: "none",
  fontSize: 14,
  fontFamily: "inherit",
  transition: "border-color 0.2s",
};

export const selectStyle = {
  padding: "10px 16px",
  borderRadius: 12,
  border: `1px solid ${COLORS.borderGlass}`,
  background: COLORS.surfaceGlass,
  color: COLORS.textPrimary,
  outline: "none",
  fontSize: 14,
  cursor: "pointer",
};

export const primaryButtonStyle = {
  padding: "12px 20px",
  borderRadius: 12,
  border: "none",
  background: GRADIENTS.accent,
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
  fontFamily: "inherit",
  transition: "transform 0.2s, box-shadow 0.2s",
};

export const secondaryButtonStyle = {
  padding: "12px 20px",
  borderRadius: 12,
  border: `1px solid ${COLORS.borderGlass}`,
  background: "transparent",
  color: COLORS.textSecondary,
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
  fontFamily: "inherit",
};

export const smallButtonStyle = {
  padding: "10px 20px",
  borderRadius: 12,
  border: "none",
  background: GRADIENTS.accent,
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
  fontFamily: "inherit",
  transition: "all 0.2s",
};

export const actionButtonStyle = {
  width: 36,
  height: 36,
  borderRadius: 10,
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "white",
};

export const tinyButtonStyle = {
  width: 28,
  height: 28,
  borderRadius: 6,
  border: "none",
  background: "transparent",
  color: COLORS.textMuted,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export const emailInputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: `1px solid ${COLORS.borderGlass}`,
  background: COLORS.surfaceGlass,
  color: COLORS.textPrimary,
  outline: "none",
  fontSize: 13,
};

export const emailPrimaryButtonStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  padding: "14px 20px",
  borderRadius: 12,
  border: "none",
  fontWeight: 600,
  background: GRADIENTS.accent,
  color: "white",
};

// Validation functions
export const validateEmail = (email) => {
  return /^[\w.-]+@[\w.-]+\.\w+$/.test(email.trim());
};

export const validateMultipleEmails = (emailString) => {
  if (!emailString || !emailString.trim()) return true;
  const emails = emailString.split(',').map(e => e.trim()).filter(e => e);
  return emails.every(email => validateEmail(email));
};

export const formatDate = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString();
};

export const formatTime = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

export const formatDateTime = (isoString) => {
  if (!isoString) return "—";
  return `${formatDate(isoString)} ${formatTime(isoString)}`;
};
