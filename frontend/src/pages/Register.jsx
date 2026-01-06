import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
};

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState("intern");
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    dob: "",
    degree: "",
    password: "",
    pmCode: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handle = (e) =>
    setForm((s) => ({ ...s, [e.target.name]: e.target.value }));

  const getUsers = () => {
    try {
      return JSON.parse(localStorage.getItem("users") || "[]");
    } catch {
      return [];
    }
  };

  const saveUser = (user) => {
    const users = getUsers();
    users.push(user);
    localStorage.setItem("users", JSON.stringify(users));
  };

  const validate = () => {
    setError("");

    if (!form.fullName) return "Full name is required.";
    if (!form.email) return "Email is required.";
    if (!form.phone) return "Phone number is required.";
    if (!/^\d{8}$/.test(form.password))
      return "Password must be 8-digit numeric.";

    if (role === "intern") {
      if (!form.dob) return "Date of birth is required.";
      if (!form.degree) return "Degree is required.";
    }

    if (role === "pm" && !form.pmCode)
      return "PM Code is required for PM role.";

    // unique email per role
    const existing = getUsers().find(
      (u) =>
        u.email.toLowerCase() === form.email.toLowerCase() &&
        u.role === role
    );
    if (existing)
      return "A user with that email and role already exists.";

    return null;
  };

  const handleRegister = (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    const newUser = {
      role,
      fullName: form.fullName,
      email: form.email.toLowerCase(),
      phone: form.phone,
      dob: form.dob || null,
      degree: form.degree || null,
      password: form.password,
      pmCode: form.pmCode || null,
      createdAt: new Date().toISOString(),
    };

    saveUser(newUser);
    setSuccess("You have successfully registered! Redirecting to login...");
    setTimeout(() => {
      navigate("/");
    }, 1500);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${COLORS.inkBlack}, ${COLORS.deepOcean})`,
        color: "white",
        padding: 32,
      }}
    >
      <div
        style={{
          maxWidth: 980,
          margin: "0 auto",
          display: "flex",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: 280 }}>
          <h2 style={{ marginTop: 12 }}>Register</h2>
          <p style={{ color: "rgba(255,255,255,0.8)" }}>
            Select role and fill required fields.
          </p>

          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            {["intern", "hr", "pm"].map((r) => (
              <button
                key={r}
                onClick={() => {
                  setRole(r);
                  setError("");
                  setSuccess("");
                }}
                style={{
                  padding: "8px 12px",
                  borderRadius: 999,
                  border: "none",
                  cursor: "pointer",
                  background: role === r ? "white" : "transparent",
                  color: role === r ? COLORS.inkBlack : "white",
                  fontWeight: 700,
                }}
              >
                {r === "pm" ? "PM" : r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div
          style={{
            flex: 1.3,
            minWidth: 320,
            background: "rgba(255,255,255,0.03)",
            padding: 20,
            borderRadius: 12,
          }}
        >
          <form
            onSubmit={handleRegister}
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <label>Full Name</label>
            <input
              name="fullName"
              value={form.fullName}
              type="text"
              onChange={handle}
              style={smallInput}
              placeholder="Enter your full name"
            />

            {/* INTERN FIELDS */}
            {role === "intern" && (
              <>
                <label>Email</label>
                <input
                  name="email"
                  value={form.email}
                  type="email"
                  onChange={handle}
                  style={smallInput}
                  placeholder="Enter your Email"
                />

                <label>Phone Number</label>
                <input
                  name="phone"
                  value={form.phone}
                  type="tel"
                  onChange={handle}
                  style={smallInput}
                  placeholder="+91"
                />

                <label>Date of Birth</label>
                <input
                  name="dob"
                  value={form.dob}
                  type="text"
                  onChange={handle}
                  style={smallInput}
                  placeholder="dd-mm-yyyy"
                />

                <label>Degree</label>
                <input
                  name="degree"
                  value={form.degree}
                  type="text"
                  onChange={handle}
                  style={smallInput}
                  placeholder="Enter your Degree"
                />

                <label>Password (8-digit numeric)</label>
                <input
                  name="password"
                  value={form.password}
                  type="password"
                  onChange={handle}
                  style={smallInput}
                  placeholder="Enter your password"
                />
              </>
            )}

            {/* HR FIELDS */}
            {role === "hr" && (
              <>
                <label>Phone Number</label>
                <input
                  name="phone"
                  value={form.phone}
                  type="tel"
                  onChange={handle}
                  style={smallInput}
                  placeholder="+91"
                />

                <label>Email</label>
                <input
                  name="email"
                  value={form.email}
                  type="email"
                  onChange={handle}
                  style={smallInput}
                  placeholder="Enter your Email"
                />

                <label>Password (8-digit numeric)</label>
                <input
                  name="password"
                  value={form.password}
                  type="password"
                  onChange={handle}
                  style={smallInput}
                  placeholder="Enter your password"
                />
              </>
            )}

            {/* PM FIELDS */}
            {role === "pm" && (
              <>
                <label>Phone Number</label>
                <input
                  name="phone"
                  value={form.phone}
                  type="tel"
                  onChange={handle}
                  style={smallInput}
                  placeholder="+91"
                />

                <label>Email</label>
                <input
                  name="email"
                  value={form.email}
                  type="email"
                  onChange={handle}
                  style={smallInput}
                  placeholder="Enter your Email"
                />

                <label>Password (8-digit numeric)</label>
                <input
                  name="password"
                  value={form.password}
                  type="password"
                  onChange={handle}
                  style={smallInput}
                  placeholder="Enter your password"
                />

                <label>PM Code</label>
                <input
                  name="pmCode"
                  value={form.pmCode}
                  type="text"
                  onChange={handle}
                  style={smallInput}
                  placeholder="Enter your PM code (Ex: 0023)"
                />
              </>
            )}

            {error && (
              <div
                style={{
                  color: COLORS.racingRed,
                  fontWeight: 700,
                }}
              >
                {error}
              </div>
            )}
            {success && (
              <div
                style={{
                  color: "limegreen",
                  fontWeight: 700,
                }}
              >
                {success}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  background: "white",
                  color: COLORS.inkBlack,
                  fontWeight: 700,
                }}
              >
                Register
              </button>

              <button
                type="button"
                onClick={() => navigate("/")}
                style={{
                  padding: "10px 14px",
                  borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "transparent",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                Back to Login
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

const smallInput = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.02)",
  color: "white",
  outline: "none",
};
