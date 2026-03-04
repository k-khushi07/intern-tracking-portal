import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../lib/apiClient";

const COLORS = {
  inkBlack: "#020617",
  backgroundSecondary: "#0a2528",
  deepOcean: "#0f766e",
  jungleTeal: "#14b8a6",
  emeraldGlow: "#10b981",
  racingRed: "#d90429",
  surfaceGlass: "rgba(255, 255, 255, 0.06)",
  borderGlass: "rgba(255, 255, 255, 0.12)",
};

export default function AuthPage() {
  const [role, setRole] = useState("intern");
  const [isMobile, setIsMobile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  const handleInput = (event) => {
    setLoginData((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setError("");

    try {
      const response = await authApi.login({
        email: loginData.email,
        password: loginData.password,
        expectedRole: role,
        rememberMe,
      });

      const profile = response.profile;
      const currentUser = {
        role: profile.role,
        fullName: profile.full_name,
        email: profile.email,
        pmCode: profile.pm_code || null,
        internId: profile.intern_id || null,
        profileCompleted: !!profile.profile_completed,
      };

      localStorage.setItem("currentUser", JSON.stringify(currentUser));
      if (rememberMe) {
        localStorage.setItem("remember", "1");
      } else {
        localStorage.removeItem("remember");
      }

      if (currentUser.role === "intern" && !currentUser.profileCompleted) {
        navigate("/profile-setup");
        return;
      }
      navigate(`/dashboard/${currentUser.role}`);
    } catch (requestError) {
      localStorage.removeItem("currentUser");
      setError(requestError?.message || "Login failed.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, ${COLORS.inkBlack} 0%, ${COLORS.backgroundSecondary} 40%, ${COLORS.deepOcean} 100%)`,
        color: "white",
      }}
    >
      <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%,-50%)",
            width: 800,
            height: 800,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal}, ${COLORS.emeraldGlow})`,
            opacity: 0.35,
            filter: "blur(120px)",
            animation: "pulse 3s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes pulse {
          0%,100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.65; transform: scale(1.05); }
        }
        input::placeholder { color: rgba(255,255,255,0.7); opacity:1; }
      `}</style>

      <div
        style={{
          position: "relative",
          zIndex: 10,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? 24 : 40,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1200,
            display: "flex",
            gap: isMobile ? 24 : 48,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 280, textAlign: isMobile ? "center" : "left" }}>
            <h1 style={{ fontSize: isMobile ? 48 : 72, margin: 0, fontWeight: 800 }}>
              Welcome.
            </h1>
            <p style={{ color: "rgba(255,255,255,0.85)", marginTop: 12 }}>
              Internship Portal System
            </p>
            <p style={{ color: "rgba(255,255,255,0.7)", marginTop: 16, maxWidth: 520 }}>
              Manage your internship journey with ease and track your progress effectively.
            </p>
          </div>

          <div style={{ width: "100%", maxWidth: 480 }}>
            <div
              style={{
                backdropFilter: "blur(20px)",
                background: COLORS.surfaceGlass,
                borderRadius: 28,
                padding: isMobile ? 20 : 36,
                border: `1px solid ${COLORS.borderGlass}`,
                boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ textAlign: "center", marginBottom: 18 }}>
                <div
                  style={{
                    width: isMobile ? 72 : 88,
                    height: isMobile ? 72 : 88,
                    borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.25)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <User size={isMobile ? 34 : 40} color="white" />
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                {["intern", "hr", "pm"].map((roleOption) => (
                  <button
                    key={roleOption}
                    onClick={() => {
                      setRole(roleOption);
                      setError("");
                    }}
                    type="button"
                    style={{
                      flex: 1,
                      padding: "10px 14px",
                      borderRadius: 999,
                      border: "none",
                      cursor: "pointer",
                      fontWeight: 700,
                      background: role === roleOption ? COLORS.jungleTeal : "transparent",
                      color: "white",
                      boxShadow: role === roleOption ? "0 6px 18px rgba(20, 184, 166, 0.4)" : "none",
                      textTransform: "capitalize",
                      transition: "all 0.2s",
                    }}
                  >
                    {roleOption === "pm" ? "PM" : roleOption}
                  </button>
                ))}
              </div>

              <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div style={{ position: "relative" }}>
                  <Mail
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "rgba(255,255,255,0.7)",
                    }}
                    size={18}
                  />
                  <input
                    name="email"
                    value={loginData.email}
                    onChange={handleInput}
                    placeholder="EMAIL"
                    style={inputStyle}
                    required
                    autoComplete="email"
                  />
                </div>

                <div style={{ position: "relative" }}>
                  <Lock
                    style={{
                      position: "absolute",
                      left: 14,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "rgba(255,255,255,0.7)",
                    }}
                    size={18}
                  />
                  <input
                    name="password"
                    value={loginData.password}
                    onChange={handleInput}
                    type={showPassword ? "text" : "password"}
                    placeholder="PASSWORD"
                    style={inputStyle}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    style={eyeBtnStyle}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
                  <label style={{ display: "flex", gap: 8, alignItems: "center", color: "rgba(255,255,255,0.9)" }}>
                    <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
                    Remember me
                  </label>
                </div>

                {error && <div style={{ color: COLORS.racingRed, fontWeight: 700 }}>{error}</div>}

                <button type="submit" style={submitStyle}>
                  Login
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.14)",
  borderRadius: 999,
  padding: "14px 48px 14px 44px",
  color: "white",
  outline: "none",
  boxSizing: "border-box",
  fontWeight: 600,
};

const eyeBtnStyle = {
  position: "absolute",
  right: 12,
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  color: "rgba(255,255,255,0.8)",
  cursor: "pointer",
};

const submitStyle = {
  width: "100%",
  padding: "14px",
  borderRadius: 999,
  border: "none",
  fontWeight: 800,
  cursor: "pointer",
  background: "linear-gradient(135deg, #14b8a6, #10b981)",
  color: "white",
  boxShadow: "0 4px 14px rgba(20, 184, 166, 0.4)",
  transition: "all 0.2s",
};
