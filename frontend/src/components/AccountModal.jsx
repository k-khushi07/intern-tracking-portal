import React, { useEffect, useMemo, useState } from "react";
import { FileText, KeyRound, Mail, Shield, User2, X } from "lucide-react";
import { authApi } from "../lib/apiClient";

function pillStyle({ tone }) {
  const t = String(tone || "muted").toLowerCase();
  const palette =
    t === "success"
      ? { border: "rgba(16,185,129,0.45)", bg: "rgba(16,185,129,0.14)", fg: "#a7f3d0" }
      : t === "warning"
        ? { border: "rgba(245,158,11,0.45)", bg: "rgba(245,158,11,0.14)", fg: "#fde68a" }
        : t === "info"
          ? { border: "rgba(34,211,238,0.45)", bg: "rgba(34,211,238,0.12)", fg: "#cffafe" }
          : { border: "rgba(255,255,255,0.18)", bg: "rgba(255,255,255,0.06)", fg: "rgba(255,255,255,0.75)" };

  return {
    fontSize: 11,
    fontWeight: 900,
    letterSpacing: "0.4px",
    padding: "4px 10px",
    borderRadius: 999,
    border: `1px solid ${palette.border}`,
    background: palette.bg,
    color: palette.fg,
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  };
}

function btnStyle(kind) {
  if (kind === "primary") {
    return {
      border: "none",
      background: "linear-gradient(135deg, rgba(20,184,166,0.9), rgba(15,118,110,0.9))",
      color: "white",
      padding: "10px 12px",
      borderRadius: 12,
      fontWeight: 900,
      cursor: "pointer",
      fontSize: 12,
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      whiteSpace: "nowrap",
      boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
    };
  }
  return {
    border: "1px solid rgba(255,255,255,0.14)",
    background: "rgba(255,255,255,0.06)",
    color: "white",
    padding: "10px 12px",
    borderRadius: 12,
    fontWeight: 900,
    cursor: "pointer",
    fontSize: 12,
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    whiteSpace: "nowrap",
  };
}

function InfoCard({ label, value, icon, mono = false }) {
  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.12)",
        background: "rgba(255,255,255,0.04)",
        borderRadius: 14,
        padding: 12,
        display: "grid",
        gap: 6,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 900 }}>
        <span style={{ color: "rgba(34,211,238,0.9)" }}>{icon}</span> {label}
      </div>
      <div
        style={{
          color: "white",
          fontSize: 14,
          fontWeight: 700,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          fontFamily: mono ? "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" : "inherit",
        }}
        title={String(value || "")}
      >
        {value || "—"}
      </div>
    </div>
  );
}

export default function AccountModal({ open, onClose }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let cancelled = false;
    if (!open) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") onClose?.();
    };
    document.addEventListener("keydown", onKeyDown);

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await authApi.me();
        if (cancelled) return;
        setProfile(res?.profile || null);
      } catch (e) {
        if (cancelled) return;
        setProfile(null);
        setError(e?.message || "Failed to load profile.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  const profileData = useMemo(
    () => (profile?.profile_data && typeof profile.profile_data === "object" ? profile.profile_data : {}),
    [profile]
  );
  const fullName = profile?.full_name || profile?.fullName || "";
  const email = profile?.email || "";
  const role = String(profile?.role || "").toUpperCase() || "USER";
  const status = String(profile?.status || "").trim() || "-";
  const pmCode = profile?.pm_code || profile?.pmCode || null;
  const internId = profile?.intern_id || profile?.internId || null;
  const profileCompleted = profile?.profile_completed === undefined ? null : !!profile.profile_completed;
  const profileId = profile?.id || null;

  const profilePictureUrl = profileData?.profilePictureUrl || null;
  const resumeUrl = profileData?.resumeUrl || null;

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(6px)",
        zIndex: 4000,
        display: "grid",
        placeItems: "center",
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(720px, 96vw)",
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(2, 6, 23, 0.92)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            padding: 16,
            borderBottom: "1px solid rgba(255,255,255,0.10)",
            background: "linear-gradient(135deg, rgba(15,118,110,0.30), rgba(2,6,23,0.00) 60%)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: 900, color: "white", letterSpacing: "0.2px" }}>My Profile</div>
            <button
              type="button"
              onClick={onClose}
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.85)",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
              }}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div style={{ padding: 16, display: "grid", gap: 14 }}>
          {loading && <div style={{ color: "rgba(255,255,255,0.7)" }}>Loading...</div>}
          {!loading && error && (
            <div style={{ padding: 10, borderRadius: 12, border: "1px solid rgba(239,68,68,0.35)", background: "rgba(239,68,68,0.12)", color: "#fecaca", fontSize: 13 }}>
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
                <div
                  style={{
                    width: 86,
                    height: 86,
                    borderRadius: 22,
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "linear-gradient(135deg, rgba(20,184,166,0.35), rgba(255,255,255,0.06))",
                    overflow: "hidden",
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 900,
                    color: "white",
                    fontSize: 26,
                    position: "relative",
                    boxShadow: "0 18px 60px rgba(0,0,0,0.35)",
                  }}
                >
                  <span style={{ position: "relative", zIndex: 1 }}>{(fullName || email || "U").charAt(0).toUpperCase()}</span>
                  {profilePictureUrl ? (
                    <img
                      src={profilePictureUrl}
                      alt="Profile"
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : null}
                </div>

                <div style={{ flex: 1, minWidth: 220 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: "white" }}>{fullName || "—"}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginTop: 6 }}>
                    <span style={pillStyle({ tone: "info" })}>{role}</span>
                    <span style={pillStyle({ tone: status.toLowerCase() === "active" ? "success" : "muted" })}>{status}</span>
                    {profileCompleted !== null && (
                      <span style={pillStyle({ tone: profileCompleted ? "success" : "warning" })}>
                        {profileCompleted ? "PROFILE COMPLETED" : "PROFILE PENDING"}
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, color: "rgba(255,255,255,0.72)", fontSize: 13 }}>
                    <Mail size={14} /> {email || "—"}
                  </div>
                </div>

                {resumeUrl && (
                  <button type="button" onClick={() => window.open(resumeUrl, "_blank", "noopener,noreferrer")} style={btnStyle("primary")}>
                    <FileText size={14} /> Resume
                  </button>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                <InfoCard icon={<User2 size={16} />} label="Full name" value={fullName || "—"} />
                <InfoCard icon={<Mail size={16} />} label="Email" value={email || "—"} />
                <InfoCard icon={<Shield size={16} />} label="Role" value={role} />
                <InfoCard icon={<KeyRound size={16} />} label="Status" value={status} />
                {pmCode && <InfoCard icon={<Shield size={16} />} label="PM code" value={String(pmCode)} />}
                {internId && <InfoCard icon={<Shield size={16} />} label="Intern ID" value={String(internId)} />}
                {profileId && <InfoCard mono icon={<Shield size={16} />} label="Profile ID" value={String(profileId)} />}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

