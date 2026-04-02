import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import AuthPage from "./pages/AuthPage";

import AdminHome from "./pages/Admin/AdminHome";
import AdminLogin from "./pages/Admin/AdminLogin";

import PMHome from "./pages/pm/PMHome";
import HRHome from "./pages/hr/HRHome";
import InternHome from "./pages/intern/InternHome";
import HRInternProfilePage from "./pages/hr/ActiveInterns/InternProfilePage";
import PMInternProfilePage from "./pages/pm/InternProfilePage";

import ProfileSetup from "./pages/intern/ProfileSetup";
import InternApplicationForm from './pages/InternApplicationForm';
import RequireRole from "./components/RequireRole";


// Inside your Routes:
function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/apply" element={<InternApplicationForm />} />

      {/* Separated portals */}
      <Route path="/intern/login" element={<AuthPage forcedRole="intern" />} />
      <Route
        path="/intern/dashboard"
        element={
          <RequireRole role="intern">
            <InternHome />
          </RequireRole>
        }
      />
      <Route
        path="/intern/profile-setup"
        element={
          <RequireRole role="intern">
            <ProfileSetup />
          </RequireRole>
        }
      />

      <Route path="/hr/login" element={<AuthPage forcedRole="hr" />} />
      <Route
        path="/hr/dashboard"
        element={
          <RequireRole role="hr">
            <HRHome />
          </RequireRole>
        }
      />
      <Route
        path="/hr/interns/:internId"
        element={
          <RequireRole role="hr">
            <HRInternProfilePage />
          </RequireRole>
        }
      />

      <Route path="/pm/login" element={<AuthPage forcedRole="pm" />} />
      <Route
        path="/pm/dashboard"
        element={
          <RequireRole role="pm">
            <PMHome />
          </RequireRole>
        }
      />
      <Route
        path="/pm/interns/:internId"
        element={
          <RequireRole role="pm">
            <PMInternProfilePage />
          </RequireRole>
        }
      />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/dashboard"
        element={
          <RequireRole role="admin">
            <AdminHome />
          </RequireRole>
        }
      />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />

      {/* Backward-compatibility redirects */}
      <Route path="/login" element={<Navigate to="/admin/login" replace />} />
      <Route path="/dashboard/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/dashboard/pm" element={<Navigate to="/pm/dashboard" replace />} />
      <Route path="/dashboard/hr" element={<Navigate to="/hr/dashboard" replace />} />
      <Route path="/dashboard/intern" element={<Navigate to="/intern/dashboard" replace />} />
      <Route path="/profile-setup" element={<Navigate to="/intern/profile-setup" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
