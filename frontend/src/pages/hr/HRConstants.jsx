import {
  Users, UserCheck, Clock, Home, FileText, BarChart3, Briefcase
} from "lucide-react";


// Make sure these are NAMED exports, not default
export const COLORS = {
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


export const GRADIENTS = {
  primary: `linear-gradient(135deg, ${COLORS.bgPrimary} 0%, ${COLORS.bgSecondary} 50%, ${COLORS.bgPrimary} 100%)`,
  accent: `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)`,
  emerald: `linear-gradient(135deg, ${COLORS.emeraldGlow} 0%, ${COLORS.jungleTeal} 100%)`,
  ocean: `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.cyanHighlight} 100%)`,
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
  { id: "dashboard", icon: Home, label: "Dashboard" },
  { id: "approval", icon: Clock, label: "Approval Center", badge: stats.pending },
  { id: "active", icon: UserCheck, label: "Active Interns", badge: stats.active },
  { id: "new", icon: FileText, label: "New Registrations", badge: stats.newRegistrations },
  { id: "pms", icon: Briefcase, label: "Project Managers" },
  { id: "reports", icon: BarChart3, label: "Reports" },
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
  border: `1px solid rgba(255,255,255,0.15)`,
  background: "rgba(255,255,255,0.04)",
  color: COLORS.textPrimary,
  outline: "none",
  fontSize: 14,
  fontFamily: "inherit",
  transition: "border-color 0.2s",
};


export const selectStyle = {
  padding: "10px 16px",
  borderRadius: 12,
  border: `1px solid rgba(255,255,255,0.15)`,
  background: "rgba(255,255,255,0.04)",
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
  border: `1px solid rgba(255,255,255,0.2)`,
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
  padding: "8px 14px",
  borderRadius: 10,
  border: "none",
  background: GRADIENTS.accent,
  color: "white",
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 13,
  fontFamily: "inherit",
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
