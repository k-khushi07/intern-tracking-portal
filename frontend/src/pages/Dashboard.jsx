import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function Dashboard() {
  const { role } = useParams();
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const cu = JSON.parse(localStorage.getItem("currentUser"));
      setUser(cu);
    } catch {
      setUser(null);
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("currentUser");
    navigate("/");
  };

  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "#071e22", color: "white", padding: 24 }}>
        <p>No user logged in. Redirecting to login...</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#071e22", color: "white", padding: 24 }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <h1 style={{ textTransform: "capitalize" }}>{role} dashboard</h1>
        <p>Welcome, <strong>{user.fullName || user.email}</strong></p>
        <div style={{ marginTop: 12 }}>
          <p>Email: {user.email}</p>
          <p>Phone: {user.phone || "—"}</p>
          {user.dob && <p>Date of birth: {user.dob}</p>}
          {user.degree && <p>Degree: {user.degree}</p>}
          {user.pmCode && <p>PM Code: {user.pmCode}</p>}
          <p>Registered on: {new Date(user.createdAt).toLocaleString()}</p>
        </div>

        <div style={{ marginTop: 20 }}>
          <button onClick={logout} style={{ padding: "10px 14px", borderRadius: 8, border: "none", cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}