//AuthPage.jsx
import React, { useState, useEffect } from "react";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";


const COLORS = {
  inkBlack: "#020617",
  backgroundSecondary: "#0a2528",
  deepOcean: "#0f766e",
  jungleTeal: "#14b8a6",
  emeraldGlow: "#10b981",
  peachGlow: "#ffe5d9",
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


  // 🔧 TEST ADMIN FUNCTION
  const createTestAdmin = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
   
    const adminExists = users.some(u => u.email === "admin@test.com");
    if (adminExists) {
      alert("⚠️ Admin user already exists!\n\nLogin with:\nEmail: admin@test.com\nPassword: 12345678");
      return;
    }
   
    users.push({
      role: "admin",
      fullName: "Admin User",
      email: "admin@test.com",
      password: "12345678",
      phone: "1234567890",
      createdAt: new Date().toISOString()
    });
    localStorage.setItem("users", JSON.stringify(users));
    alert("✅ Admin user created successfully!\n\nLogin with:\nEmail: admin@test.com\nPassword: 12345678\n\nThen go to: /dashboard/admin");
  };


  // 👨‍💼 TEST PM FUNCTION
  const createTestPM = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
   
    const pmExists = users.some(u => u.email === "pm@test.com");
    if (pmExists) {
      alert("⚠️ PM user already exists!\n\nLogin with:\nEmail: pm@test.com\nPassword: 12345678");
      return;
    }
   
    users.push({
      role: "pm",
      fullName: "Test Project Manager",
      email: "pm@test.com",
      password: "12345678",
      phone: "9876543210",
      pmCode: "PM001",
      createdAt: new Date().toISOString()
    });
    localStorage.setItem("users", JSON.stringify(users));
    alert("✅ PM user created successfully!\n\nLogin with:\nEmail: pm@test.com\nPassword: 12345678\n\nThen go to: /dashboard/pm");
  };


  // 🎓 TEST INTERNS FUNCTION
  const createTestInterns = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
   
    const testInterns = [
      {
        role: "intern",
        fullName: "Alex Kumar",
        email: "alex@intern.com",
        password: "12345678",
        phone: "4445556666",
        pmCode: "PM001",
        degree: "Computer Science",
        dob: "2000-05-15",
        createdAt: new Date().toISOString()
      },
      {
        role: "intern",
        fullName: "Sarah Johnson",
        email: "sarah@intern.com",
        password: "12345678",
        phone: "5556667777",
        pmCode: "PM001",
        degree: "Data Science",
        dob: "2001-08-22",
        createdAt: new Date().toISOString()
      },
      {
        role: "intern",
        fullName: "Mike Chen",
        email: "mike@intern.com",
        password: "12345678",
        phone: "6667778888",
        pmCode: "PM001",
        degree: "Software Engineering",
        dob: "1999-12-10",
        createdAt: new Date().toISOString()
      }
    ];
   
    let addedCount = 0;
    testInterns.forEach(intern => {
      const exists = users.some(u => u.email === intern.email);
      if (!exists) {
        users.push(intern);
        addedCount++;
      }
    });
   
    localStorage.setItem("users", JSON.stringify(users));
   
    if (addedCount > 0) {
      alert(`✅ ${addedCount} test intern(s) created and assigned to PM001!\n\nAll interns have password: 12345678`);
    } else {
      alert("⚠️ All test interns already exist!");
    }
  };


  // 👔 TEST HR FUNCTION
  const createTestHR = () => {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
   
    const hrExists = users.some(u => u.email === "hr@test.com");
    if (hrExists) {
      alert("⚠️ HR user already exists!\n\nLogin with:\nEmail: hr@test.com\nPassword: 12345678");
      return;
    }
   
    users.push({
      role: "hr",
      fullName: "Test HR Manager",
      email: "hr@test.com",
      password: "12345678",
      phone: "1112223333",
      createdAt: new Date().toISOString()
    });
    localStorage.setItem("users", JSON.stringify(users));
    alert("✅ HR user created successfully!\n\nLogin with:\nEmail: hr@test.com\nPassword: 12345678\n\nThen go to: /dashboard/hr");
  };


  // responsiveness
  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 900);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);


  const handleInput = (e) =>
    setLoginData((s) => ({ ...s, [e.target.name]: e.target.value }));


  const getUsers = () => {
    try {
      return JSON.parse(localStorage.getItem("users") || "[]");
    } catch {
      return [];
    }
  };


  const handleLogin = (e) => {
    e.preventDefault();
    setError("");


    const users = getUsers();
    const user = users.find(
      (u) => u.role === role && u.email.toLowerCase() === loginData.email.toLowerCase()
    );


    if (!user) {
      setError("No account found for this role and email. Contact your administrator.");
      return;
    }


    if (user.password !== loginData.password) {
      setError("Incorrect password.");
      return;
    }


    // Save current user
    localStorage.setItem("currentUser", JSON.stringify(user));
    if (rememberMe) {
      localStorage.setItem("remember", "1");
    } else {
      localStorage.removeItem("remember");
    }


    // ✅ CHECK IF INTERN NEEDS PROFILE SETUP
    if (role === "intern" && !user.profileCompleted) {
      navigate("/profile-setup");
    } else {
      navigate(`/dashboard/${role}`);
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
      {/* 🔧 TEST BUTTONS - FIXED TOP RIGHT */}
      <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          onClick={createTestAdmin}
          style={{
            padding: '12px 24px',
            background: COLORS.emeraldGlow,
            color: 'white',
            border: 'none',
            borderRadius: '999px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 6px 16px rgba(16, 185, 129, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
          }}
        >
          🔧 Create Test Admin
        </button>


        <button
          onClick={createTestPM}
          style={{
            padding: '12px 24px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '999px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
          }}
        >
          👨‍💼 Create Test PM
        </button>


        <button
          onClick={createTestInterns}
          style={{
            padding: '12px 24px',
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            borderRadius: '999px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 6px 16px rgba(139, 92, 246, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
          }}
        >
          🎓 Create Test Interns
        </button>


        <button
          onClick={createTestHR}
          style={{
            padding: '12px 24px',
            background: '#ec4899',
            color: 'white',
            border: 'none',
            borderRadius: '999px',
            cursor: 'pointer',
            fontWeight: 700,
            fontSize: '14px',
            boxShadow: '0 4px 12px rgba(236, 72, 153, 0.4)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
            e.target.style.boxShadow = '0 6px 16px rgba(236, 72, 153, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
            e.target.style.boxShadow = '0 4px 12px rgba(236, 72, 153, 0.4)';
          }}
        >
          👔 Create Test HR
        </button>
      </div>


      {/* animated orb */}
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
          {/* left welcome */}
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


          {/* right card */}
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


              {/* Role Tabs */}
              <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
                {["intern", "hr", "pm"].map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
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
                      background: role === r ? COLORS.jungleTeal : "transparent",
                      color: "white",
                      boxShadow: role === r ? "0 6px 18px rgba(20, 184, 166, 0.4)" : "none",
                      textTransform: "capitalize",
                      transition: "all 0.2s",
                    }}
                  >
                    {r === "pm" ? "PM" : r}
                  </button>
                ))}
              </div>


              {/* Form */}
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
                    onClick={() => setShowPassword((s) => !s)}
                    style={eyeBtnStyle}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>


                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 14 }}>
                  <label style={{ display: "flex", gap: 8, alignItems: "center", color: "rgba(255,255,255,0.9)" }}>
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
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


// styles
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
