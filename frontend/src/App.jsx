import React from "react";
//import { Routes, Route } from "react-router-dom";

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import AuthPage from "./pages/AuthPage";

import AdminHome from "./pages/Admin/AdminHome";
import AdminLogin from "./pages/Admin/AdminLogin";

import PMHome from "./pages/pm/PMHome";
import HRHome from "./pages/hr/HRHome";
import InternHome from "./pages/intern/InternHome";

import ProfileSetup from "./pages/intern/ProfileSetup";
import InternApplicationForm from './pages/InternApplicationForm';


// Inside your Routes:
function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />

      <Route path="/apply" element={<InternApplicationForm />} />


      {/* Admin */}
      <Route path="/login" element={<AdminLogin />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminHome />} />

      {/* Dashboards */}
      <Route path="/dashboard/admin" element={<AdminHome />} />
      <Route path="/dashboard/pm" element={<PMHome />} />
      <Route path="/dashboard/hr" element={<HRHome />} />
      <Route path="/dashboard/intern" element={<InternHome />} />

      {/* Other */}
      <Route path="/profile-setup" element={<ProfileSetup />} />
    </Routes>
  );
}

export default App;
