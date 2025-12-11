import React from "react";
import { Routes, Route } from "react-router-dom";
import AuthPage from "./pages/AuthPage";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AdminHome from "./pages/admin/AdminHome";
import PMHome from "./pages/pm/PMHome";
import HRHome from "./pages/hr/HRHome"; 
import InternHome from "./pages/intern/InternHome";  
import PMInternChat from "./pages/chat/PMInternChat";
import ProfileSetup from "./pages/intern/ProfileSetup";

function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard/:role" element={<Dashboard />} />
      <Route path="/dashboard/admin" element={<AdminHome />} />
      <Route path="/dashboard/pm" element={<PMHome />} />
      <Route path="/dashboard/hr" element={<HRHome />} /> 
      <Route path="/dashboard/intern" element={<InternHome />} />
      <Route path="/chat" element={<PMInternChat />} />
      <Route path="/profile-setup" element={<ProfileSetup />} />
    </Routes>
  );
}

export default App;