// frontend/src/pages/Admin/AdminLogin.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail } from 'lucide-react';
import { authApi } from '../../lib/apiClient';

const COLORS = {
  inkBlack: "#020617",
  backgroundSecondary: "#0a2528",
  deepOcean: "#0f766e",
  jungleTeal: "#14b8a6",
  emeraldGlow: "#10b981",
  racingRed: "#d90429",
};

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await authApi.login({
        email,
        password,
        expectedRole: "admin",
        rememberMe: false,
      });

      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          role: res.profile.role,
          fullName: res.profile.full_name,
          email: res.profile.email,
        })
      );
      navigate("/admin");
    } catch (err) {
      setError(err.message || "Error. Please try again.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${COLORS.inkBlack} 0%, ${COLORS.backgroundSecondary} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap');

        * {
          font-family: 'Poppins', sans-serif;
        }

        @keyframes pulse {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes glow {
          0%, 100% { 
            box-shadow: 0 0 20px ${COLORS.emeraldGlow}40,
                        0 0 40px ${COLORS.emeraldGlow}20;
          }
          50% { 
            box-shadow: 0 0 30px ${COLORS.emeraldGlow}60,
                        0 0 60px ${COLORS.emeraldGlow}40;
          }
        }

        .login-card {
          animation: fadeIn 0.6s ease;
        }

        .input-field {
          transition: all 0.3s ease;
        }

        .input-field:focus {
          background: rgba(255, 255, 255, 0.12) !important;
          border-color: ${COLORS.emeraldGlow} !important;
          box-shadow: 0 0 0 3px ${COLORS.emeraldGlow}30;
        }

        .login-button {
          transition: all 0.3s ease;
        }

        .login-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px ${COLORS.emeraldGlow}50;
        }

        .login-button:active {
          transform: translateY(0);
        }

        .sparkle {
          animation: pulse 3s ease-in-out infinite;
        }
      `}</style>

      {/* Animated Background */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        {/* Large gradient orb */}
        <div
          style={{
            position: "absolute",
            top: "30%",
            right: "-10%",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
            opacity: 0.25,
            filter: "blur(100px)",
            animation: "pulse 4s ease-in-out infinite",
          }}
        />

        {/* Small sparkles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="sparkle"
            style={{
              position: "absolute",
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              background: COLORS.emeraldGlow,
              boxShadow: `0 0 10px ${COLORS.emeraldGlow}`,
              top: `${20 + i * 12}%`,
              left: `${15 + i * 10}%`,
              animationDelay: `${i * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* Login Card */}
      <div
        className="login-card"
        style={{
          position: "relative",
          zIndex: 10,
          width: "100%",
          maxWidth: "400px",
          background: "rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(20px)",
          borderRadius: "20px",
          padding: "40px",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.5)",
        }}
      >
        {/* Shield Icon */}
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${COLORS.emeraldGlow}, ${COLORS.jungleTeal})`,
              marginBottom: "20px",
              animation: "glow 3s ease-in-out infinite",
            }}
          >
            <Shield size={38} color="white" strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "white", margin: 0 }}>
            Admin Login
          </h1>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Email */}
          <div style={{ position: "relative" }}>
            <Mail
              size={18}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: COLORS.jungleTeal,
                zIndex: 2,
              }}
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Email"
              className="input-field"
              style={{
                width: "100%",
                padding: "14px 14px 14px 45px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "10px",
                color: "white",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Password */}
          <div style={{ position: "relative" }}>
            <Lock
              size={18}
              style={{
                position: "absolute",
                left: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                color: COLORS.jungleTeal,
                zIndex: 2,
              }}
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Password"
              className="input-field"
              style={{
                width: "100%",
                padding: "14px 14px 14px 45px",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                borderRadius: "10px",
                color: "white",
                fontSize: "14px",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                padding: "12px",
                background: `${COLORS.racingRed}20`,
                border: `1px solid ${COLORS.racingRed}`,
                borderRadius: "10px",
                color: COLORS.racingRed,
                fontSize: "13px",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="login-button"
            style={{
              width: "100%",
              padding: "14px",
              background: `linear-gradient(135deg, ${COLORS.emeraldGlow}, ${COLORS.jungleTeal})`,
              border: "none",
              borderRadius: "10px",
              color: "white",
              fontSize: "15px",
              fontWeight: 700,
              cursor: "pointer",
              marginTop: "8px",
            }}
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}
