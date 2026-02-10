//frontend/src/pages/Dashboard.jsx
import React, { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminHome from "./Admin/AdminHome";
import HRHome from "./hr/HRHome";
import PMHome from "./pm/PMHome";
import InternHome from "./intern/InternHome";

export default function Dashboard() {
  const { role } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    try {
      const currentUser = JSON.parse(localStorage.getItem("currentUser"));
      if (!currentUser) {
        navigate("/");
        return;
      }

      // Check if role matches
      if (currentUser.role !== role) {
        console.warn("Role mismatch - redirecting");
        navigate("/");
        return;
      }
    } catch (err) {
      console.error("Error checking user:", err);
      navigate("/");
    }
  }, [role, navigate]);

  // Route to specific dashboard based on role
  if (role === "admin") {
    return <AdminHome />;
  }

  if (role === "hr") {
    return <HRHome />;
  }

  if (role === "pm") {
    return <PMHome />;
  }

  if (role === "intern") {
    return <InternHome />;
  }

  // If unknown role, redirect to login
  return (
    <div style={{ minHeight: "100vh", background: "#071e22", color: "white", padding: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center" }}>
        <h2>Invalid Role</h2>
        <p>Redirecting to login...</p>
      </div>
    </div>
  );
}