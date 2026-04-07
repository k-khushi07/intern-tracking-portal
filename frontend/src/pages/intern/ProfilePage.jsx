//frontend/src/pages/intern/ProfilePage.jsx
import React, { useState, useCallback } from "react";
import {
  User, Mail, Phone, MapPin, GraduationCap, Briefcase,
  Calendar, Heart, Shield, Edit3, Save, X, Check,
  Camera, ChevronRight, AlertCircle, Building, Clock,
  BookOpen, Users, FileText, Sparkles, Upload
} from "lucide-react";
import { internApi } from "../../lib/apiClient";

// ==================== CONSTANTS ====================
const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
  success: "#4ade80",
  warning: "#f59e0b",
  purple: "#a78bfa",
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid rgba(103, 146, 137, 0.3)",
  background: "rgba(255,255,255,0.06)",
  color: "white",
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "'DM Sans', sans-serif",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

// ==================== UI COMPONENTS ====================
const InfoItem = ({ label, value, icon, editable, editValue, onChange, type = "text", options }) => {
  if (editable) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <label style={{ 
          fontSize: 12, 
          color: "rgba(255,255,255,0.5)", 
          fontWeight: 500,
          display: "flex",
          alignItems: "center",
          gap: 6
        }}>
          {icon && <span style={{ color: COLORS.jungleTeal }}>{icon}</span>}
          {label}
        </label>
        {type === "select" ? (
          <select
            value={editValue || ""}
            onChange={(e) => onChange(e.target.value)}
            style={{ ...inputStyle, cursor: "pointer" }}
          >
            <option value="" style={{ background: COLORS.inkBlack }}>Select {label}</option>
            {options?.map(opt => (
              <option key={opt} value={opt} style={{ background: COLORS.inkBlack }}>{opt}</option>
            ))}
          </select>
        ) : type === "textarea" ? (
          <textarea
            value={editValue || ""}
            onChange={(e) => onChange(e.target.value)}
            style={{ ...inputStyle, minHeight: 80, resize: "vertical" }}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        ) : (
          <input
            type={type}
            value={editValue || ""}
            onChange={(e) => onChange(e.target.value)}
            style={inputStyle}
            placeholder={`Enter ${label.toLowerCase()}`}
          />
        )}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ 
        fontSize: 12, 
        color: "rgba(255,255,255,0.5)", 
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        gap: 6
      }}>
        {icon && <span style={{ color: COLORS.jungleTeal }}>{icon}</span>}
        {label}
      </span>
      <span style={{ 
        fontSize: 15, 
        color: value ? "white" : "rgba(255,255,255,0.3)", 
        fontWeight: 500 
      }}>
        {value || "Not specified"}
      </span>
    </div>
  );
};

const ProfileSection = ({ title, icon, children, delay = 0, onEdit, isEditing, onSave, onCancel }) => (
  <div 
    className="glass" 
    style={{ 
      padding: 24, 
      borderRadius: 18,
      animation: `fadeInUp 0.4s ease-out ${delay * 0.1}s both`
    }}
  >
    <div style={{ 
      display: "flex", 
      justifyContent: "space-between", 
      alignItems: "center", 
      marginBottom: 20 
    }}>
      <h3 style={{ 
        fontSize: 16, 
        margin: 0,
        display: "flex", 
        alignItems: "center", 
        gap: 10, 
        color: "white", 
        fontWeight: 600 
      }}>
        <div style={{ 
          width: 36, 
          height: 36, 
          borderRadius: 10, 
          background: `rgba(103, 146, 137, 0.2)`, 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center", 
          color: COLORS.jungleTeal 
        }}>
          {icon}
        </div>
        {title}
      </h3>
      
      {isEditing ? (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={onCancel}
            style={{
              padding: "8px 16px",
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 8,
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s"
            }}
          >
            <X size={14} />
            Cancel
          </button>
          <button
            onClick={onSave}
            style={{
              padding: "8px 16px",
              background: `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)`,
              border: "none",
              borderRadius: 8,
              color: "white",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 0.2s"
            }}
          >
            <Save size={14} />
            Save
          </button>
        </div>
      ) : onEdit && (
        <button
          onClick={onEdit}
          style={{
            padding: "8px 14px",
            background: "rgba(103, 146, 137, 0.15)",
            border: `1px solid ${COLORS.jungleTeal}30`,
            borderRadius: 8,
            color: COLORS.jungleTeal,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.2s"
          }}
        >
          <Edit3 size={14} />
          Edit
        </button>
      )}
    </div>
    {children}
  </div>
);

const SkillTag = ({ skill, onRemove, editable }) => (
  <div style={{
    padding: "6px 12px",
    background: `${COLORS.jungleTeal}20`,
    border: `1px solid ${COLORS.jungleTeal}40`,
    borderRadius: 20,
    color: COLORS.jungleTeal,
    fontSize: 13,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    gap: 6
  }}>
    {skill}
    {editable && (
      <button
        onClick={() => onRemove(skill)}
        style={{
          background: "none",
          border: "none",
          color: COLORS.jungleTeal,
          cursor: "pointer",
          padding: 0,
          display: "flex",
          alignItems: "center"
        }}
      >
        <X size={14} />
      </button>
    )}
  </div>
);

const StatCard = ({ icon, label, value, color }) => (
  <div style={{
    padding: 16,
    background: `${color}10`,
    borderRadius: 12,
    border: `1px solid ${color}20`,
    display: "flex",
    alignItems: "center",
    gap: 12
  }}>
    <div style={{
      width: 40,
      height: 40,
      borderRadius: 10,
      background: `${color}20`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: color
    }}>
      {icon}
    </div>
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, color: "white" }}>{value}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{label}</div>
    </div>
  </div>
);

// ==================== TOAST NOTIFICATION ====================
const Toast = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      padding: "14px 20px",
      background: type === "success" ? COLORS.success : type === "error" ? COLORS.racingRed : COLORS.jungleTeal,
      color: "white",
      borderRadius: 12,
      boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
      display: "flex",
      alignItems: "center",
      gap: 10,
      zIndex: 3000,
      animation: "slideInRight 0.3s ease-out"
    }}>
      {type === "success" ? <Check size={18} /> : <AlertCircle size={18} />}
      {message}
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
function ProfilePage({ intern: propIntern, isMobile = false, onBack, onProfileUpdated }) {
  const [intern, setIntern] = useState(propIntern || null);
  const [editingSection, setEditingSection] = useState(null);
  const [editData, setEditData] = useState({});
  const [toast, setToast] = useState(null);
  const [newSkill, setNewSkill] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = React.useRef(null);

  React.useEffect(() => {
    if (propIntern) setIntern(propIntern);
  }, [propIntern]);

  if (!intern) {
    return (
      <div style={{ color: "rgba(255,255,255,0.7)", padding: 24 }}>
        Loading profile...
      </div>
    );
  }

  const profileData = intern?.profile_data || intern?.profileData || {};
  const nestedProfileData = intern?.profile?.profile_data || {};
  const legacyProfile = intern?.profile || {};
  const profile = Object.keys(profileData).length ? profileData : legacyProfile;
  const profilePictureUrl =
    profileData.profilePictureUrl ||
    profileData.profilePicturUrl ||
    profileData.profile_picture_url ||
    nestedProfileData.profilePictureUrl ||
    legacyProfile.profilePictureUrl ||
    legacyProfile.profile_picture_url ||
    intern?.profilePictureUrl ||
    intern?.profile_picture_url ||
    null;
  const resumeUrl =
    profileData.resumeUrl ||
    profileData.resume_url ||
    nestedProfileData.resumeUrl ||
    legacyProfile.resumeUrl ||
    legacyProfile.resume_url ||
    intern?.resumeUrl ||
    intern?.resume_url ||
    null;

  const pickValue = (...values) => {
    for (const value of values) {
      if (value !== undefined && value !== null && value !== "") return value;
    }
    return "";
  };

  const parseDateOnly = (value) => {
    if (!value) return null;
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return null;
    dt.setHours(0, 0, 0, 0);
    return dt;
  };

  const buildAddressLine = ({ address, city, state, pincode }) => {
    const parts = [];
    if (address) parts.push(String(address).trim());
    if (city) parts.push(String(city).trim());
    if (state) parts.push(String(state).trim());
    const base = parts.filter(Boolean).join(", ");
    const pin = String(pincode || "").trim();
    if (pin) return base ? `${base} - ${pin}` : pin;
    return base;
  };

  const buildLifecycleBadge = ({ start, end, startLabel, profileStatus, overrideReason }) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (overrideReason && profileStatus === "active") {
      return { label: "Manually Activated by Admin", color: "#60a5fa", outlined: true };
    }
    if (overrideReason && profileStatus === "inactive") {
      return { label: "Manually Deactivated by Admin", color: "#9ca3af", outlined: false };
    }
    if (start && today < start) {
      return { label: `Pending — starts ${startLabel || ""}`.trim(), color: "#f97316", outlined: false };
    }
    if (end) {
      const graceEnd = new Date(end);
      graceEnd.setDate(graceEnd.getDate() + 7);
      if (today <= end) {
        return { label: "Active", color: "#22c55e", outlined: false };
      }
      if (today <= graceEnd) {
        const daysLeft = Math.max(0, Math.ceil((graceEnd - today) / 86400000));
        return { label: `Grace Period — ${daysLeft} days left`, color: "#facc15", outlined: false };
      }
      return { label: "Inactive", color: "#ef4444", outlined: false };
    }
    return { label: "Active", color: "#22c55e", outlined: false };
  };

  // Start editing a section
  const startEditing = useCallback((section) => {
    setEditingSection(section);
    setEditData({ ...intern, profile: { ...profile } });
  }, [intern, profile]);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingSection(null);
    setEditData({});
  }, []);

  // Save changes
  const saveChanges = useCallback(async () => {
    if (isSaving) return;
    if (!editingSection) return;

    setIsSaving(true);
    setToast(null);

    try {
      const baseProfileData = Object.keys(profileData || {}).length ? profileData : profile;
      const nextProfileData = { ...baseProfileData, ...(editData?.profile || {}) };

      if (editData?.fullName !== undefined) nextProfileData.fullName = editData.fullName;
      if (editData?.email !== undefined) nextProfileData.email = editData.email;
      if (editData?.phone !== undefined) nextProfileData.phone = editData.phone;
      if (editData?.dob !== undefined) nextProfileData.dob = editData.dob;

      const res = await internApi.updateMe({ profileData: nextProfileData });
      const updated = res?.profile;
      const updatedProfileData =
        updated && typeof updated.profile_data === "object" ? updated.profile_data : nextProfileData;

      const nextIntern = {
        ...intern,
        fullName: editData.fullName ?? intern.fullName,
        email: editData.email ?? intern.email,
        phone: updatedProfileData.phone || editData.phone || intern.phone || "",
        dob: updatedProfileData.dob || editData.dob || intern.dob || "",
        degree: updatedProfileData.degree || editData.degree || intern.degree || "",
        profile: updatedProfileData,
      };

      setIntern(nextIntern);
      setEditingSection(null);
      setEditData({});
      setToast({ message: "Profile updated successfully!", type: "success" });
      onProfileUpdated?.();
    } catch (err) {
      console.error("Failed to save profile:", err);
      setToast({
        message: err?.message || "Failed to update profile. Please try again.",
        type: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }, [editData, editingSection, intern, isSaving, onProfileUpdated, profileData, profile]);

  // Update edit data
  const updateField = useCallback((field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateProfileField = useCallback((field, value) => {
    setEditData(prev => ({
      ...prev,
      profile: { ...prev.profile, [field]: value }
    }));
  }, []);

  const handleProfilePhotoUpload = useCallback(async (file) => {
    if (!file) return;
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      const baseProfileData = Object.keys(profileData || {}).length ? profileData : profile;
      const nextProfileData = { ...baseProfileData };
      delete nextProfileData.profilePicture;
      delete nextProfileData.resume;

      const res = await internApi.updateMe({
        profileData: nextProfileData,
        fileUploads: {
          profilePicture: {
            name: file.name,
            type: file.type,
            dataUrl,
          },
        },
      });

      const updated = res?.profile;
      const updatedProfileData =
        updated && typeof updated.profile_data === "object" ? updated.profile_data : nextProfileData;

      setIntern((prev) => ({
        ...prev,
        profile_data: updatedProfileData,
        profileData: updatedProfileData,
        profile: updatedProfileData,
      }));

      setToast({ message: "Profile picture updated.", type: "success" });
      onProfileUpdated?.();
    } catch (err) {
      console.error("Failed to upload profile picture:", err);
      setToast({ message: err?.message || "Failed to upload profile picture.", type: "error" });
    }
  }, [profileData, onProfileUpdated, profile]);

  const handleResumeUpload = useCallback(async (file) => {
    if (!file) return;
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });

      const baseProfileData = Object.keys(profileData || {}).length ? profileData : profile;
      const nextProfileData = { ...baseProfileData };
      delete nextProfileData.profilePicture;
      delete nextProfileData.resume;

      const res = await internApi.updateMe({
        profileData: nextProfileData,
        fileUploads: {
          resume: {
            name: file.name,
            type: file.type,
            dataUrl,
          },
        },
      });

      const updated = res?.profile;
      const updatedProfileData =
        updated && typeof updated.profile_data === "object" ? updated.profile_data : nextProfileData;

      setIntern((prev) => ({
        ...prev,
        profile_data: updatedProfileData,
        profileData: updatedProfileData,
        profile: updatedProfileData,
      }));

      setToast({ message: "Resume updated.", type: "success" });
      onProfileUpdated?.();
    } catch (err) {
      console.error("Failed to upload resume:", err);
      setToast({ message: err?.message || "Failed to upload resume.", type: "error" });
    }
  }, [profileData, onProfileUpdated, profile]);

  // Add skill
  const addSkill = useCallback(() => {
    if (newSkill.trim() && !editData.profile?.skills?.includes(newSkill.trim())) {
      setEditData(prev => ({
        ...prev,
        profile: {
          ...prev.profile,
          skills: [...(prev.profile?.skills || []), newSkill.trim()]
        }
      }));
      setNewSkill("");
    }
  }, [newSkill, editData]);

  // Remove skill
  const removeSkill = useCallback((skillToRemove) => {
    setEditData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        skills: prev.profile?.skills?.filter(s => s !== skillToRemove) || []
      }
    }));
  }, []);

  const isEditing = (section) => editingSection === section;
  const currentData = editingSection ? editData : intern;
  const currentProfile = editingSection ? editData.profile : profile;
  const currentProfileData = currentData?.profile_data || currentData?.profileData || currentProfile || {};
  const currentNestedProfileData = currentData?.profile?.profile_data || {};
  const currentLegacyProfile = currentData?.profile || {};

  const fullName = pickValue(
    currentProfileData.fullName,
    currentProfileData.full_name,
    currentNestedProfileData.fullName,
    currentLegacyProfile.fullName,
    currentData?.fullName,
    currentData?.full_name,
    currentData?.name
  );
  const email = pickValue(
    currentProfileData.email,
    currentNestedProfileData.email,
    currentLegacyProfile.email,
    currentData?.email
  );
  const phone = pickValue(
    currentProfileData.phone,
    currentProfileData.phoneNumber,
    currentProfileData.mobile,
    currentProfileData.contactPhone,
    currentProfileData.contact_number,
    currentNestedProfileData.phone,
    currentLegacyProfile.phone,
    currentData?.phone
  );
  const dob = pickValue(
    currentProfileData.dateOfBirth,
    currentProfileData.dob,
    currentProfileData.birthDate,
    currentProfileData.birth_date,
    currentNestedProfileData.dateOfBirth,
    currentLegacyProfile.dob,
    currentData?.dob
  );
  const degree = pickValue(
    currentProfileData.degree,
    currentProfileData.qualification,
    currentNestedProfileData.degree,
    currentLegacyProfile.degree,
    currentData?.degree
  );
  const pmCode = pickValue(
    currentProfileData.pmCode,
    currentProfileData.pm_code,
    currentNestedProfileData.pmCode,
    currentLegacyProfile.pmCode,
    currentData?.pmCode,
    currentData?.pm_code
  );
  const bloodGroup = pickValue(
    currentProfileData.bloodGroup,
    currentNestedProfileData.bloodGroup,
    currentLegacyProfile.bloodGroup
  );
  const gender = pickValue(
    currentProfileData.gender,
    currentProfileData.sex,
    currentNestedProfileData.gender,
    currentLegacyProfile.gender
  );
  const bio = pickValue(
    currentProfileData.bio,
    currentNestedProfileData.bio,
    currentLegacyProfile.bio
  );
  const skills = pickValue(
    currentProfileData.skills,
    currentNestedProfileData.skills,
    currentLegacyProfile.skills
  );
  const skillsList = Array.isArray(skills) ? skills : [];
  const linkedIn = pickValue(
    currentProfileData.linkedIn,
    currentProfileData.linkedin,
    currentNestedProfileData.linkedIn,
    currentLegacyProfile.linkedIn
  );
  const github = pickValue(
    currentProfileData.github,
    currentNestedProfileData.github,
    currentLegacyProfile.github
  );
  const address = pickValue(
    currentProfileData.address,
    currentNestedProfileData.address,
    currentLegacyProfile.address
  );
  const city = pickValue(
    currentProfileData.city,
    currentNestedProfileData.city,
    currentLegacyProfile.city
  );
  const state = pickValue(
    currentProfileData.state,
    currentNestedProfileData.state,
    currentLegacyProfile.state
  );
  const pincode = pickValue(
    currentProfileData.pincode,
    currentProfileData.zip,
    currentProfileData.postalCode,
    currentNestedProfileData.pincode,
    currentLegacyProfile.pincode
  );
  const fullAddress = buildAddressLine({ address, city, state, pincode });
  const emergencyContactName = pickValue(
    currentProfileData.emergencyContactName,
    currentNestedProfileData.emergencyContactName,
    currentLegacyProfile.emergencyContactName
  );
  const emergencyRelation = pickValue(
    currentProfileData.emergencyRelation,
    currentNestedProfileData.emergencyRelation,
    currentLegacyProfile.emergencyRelation
  );
  const emergencyContactPhone = pickValue(
    currentProfileData.emergencyContactPhone,
    currentNestedProfileData.emergencyContactPhone,
    currentLegacyProfile.emergencyContactPhone
  );
  const collegeName = pickValue(
    currentProfileData.collegeName,
    currentProfileData.college,
    currentProfileData.university,
    currentNestedProfileData.collegeName,
    currentLegacyProfile.collegeName
  );
  const department = pickValue(
    currentProfileData.department,
    currentProfileData.domain,
    currentProfileData.team,
    currentNestedProfileData.department,
    currentLegacyProfile.department
  );
  const semester = pickValue(
    currentProfileData.semester,
    currentNestedProfileData.semester,
    currentLegacyProfile.semester
  );
  const guideName = pickValue(
    currentProfileData.guideName,
    currentNestedProfileData.guideName,
    currentLegacyProfile.guideName
  );
  const guideEmail = pickValue(
    currentProfileData.guideEmail,
    currentNestedProfileData.guideEmail,
    currentLegacyProfile.guideEmail
  );
  const internshipDuration = pickValue(
    currentProfileData.internshipDuration,
    currentNestedProfileData.internshipDuration,
    currentLegacyProfile.internshipDuration
  );
  const startDate = pickValue(
    currentProfileData.startDate,
    currentProfileData.start_date,
    currentProfileData.internshipStartDate,
    currentNestedProfileData.startDate,
    currentLegacyProfile.startDate
  );
  const endDate = pickValue(
    currentProfileData.endDate,
    currentProfileData.end_date,
    currentProfileData.internshipEndDate,
    currentNestedProfileData.endDate,
    currentLegacyProfile.endDate
  );
  const overrideReason = pickValue(
    intern?.approved_intern?.override_reason,
    intern?.approved_intern?.overrideReason,
    intern?.approvedIntern?.override_reason,
    intern?.approvedIntern?.overrideReason
  );
  const normalizedProfileStatus = String(intern?.status || currentData?.status || "").trim().toLowerCase();
  const lifecycleBadge = buildLifecycleBadge({
    start: parseDateOnly(startDate),
    end: parseDateOnly(endDate),
    startLabel: startDate,
    profileStatus: normalizedProfileStatus,
    overrideReason,
  });
  const workMode = pickValue(
    currentProfileData.workMode,
    currentNestedProfileData.workMode,
    currentLegacyProfile.workMode
  );
  const expectedOutcome = pickValue(
    currentProfileData.expectedOutcome,
    currentNestedProfileData.expectedOutcome,
    currentLegacyProfile.expectedOutcome
  );

  // Calculate internship progress
  const calculateProgress = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
  };

  const progress = calculateProgress();

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diff = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : 0;
  };

  const daysRemaining = getDaysRemaining();

  return (
    <div style={{ 
      minHeight: "100vh", 
      background: `linear-gradient(135deg, ${COLORS.inkBlack} 0%, #0a2e33 100%)`, 
      padding: isMobile ? 16 : 24 
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .glass { 
          background: rgba(255, 255, 255, 0.03); 
          backdrop-filter: blur(20px); 
          border: 1px solid rgba(255, 255, 255, 0.08); 
        }
        @keyframes fadeInUp { 
          from { opacity: 0; transform: translateY(20px); } 
          to { opacity: 1; transform: translateY(0); } 
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        input:focus, textarea:focus, select:focus {
          border-color: ${COLORS.jungleTeal} !important;
          box-shadow: 0 0 0 3px rgba(103, 146, 137, 0.15);
        }
        select option {
          background: ${COLORS.inkBlack};
          color: white;
        }
      `}</style>

      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Back Button */}
        {onBack && (
          <button
            onClick={onBack}
            style={{
              marginBottom: 20,
              padding: "10px 16px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 10,
              color: "rgba(255,255,255,0.7)",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 8,
              transition: "all 0.2s"
            }}
          >
            <ChevronRight size={18} style={{ transform: "rotate(180deg)" }} />
            Back to Dashboard
          </button>
        )}

        {/* Profile Header */}
        <div 
          style={{
            padding: isMobile ? 24 : 32, 
            borderRadius: 24, 
            marginBottom: 24,
            background: `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)`,
            border: `1px solid rgba(103, 146, 137, 0.3)`,
            position: "relative",
            overflow: "hidden",
            animation: "fadeInUp 0.4s ease-out"
          }}
        >
          {/* Background Pattern */}
          <div style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 300,
            height: 300,
            background: `radial-gradient(circle, ${COLORS.peachGlow}10 0%, transparent 70%)`,
            transform: "translate(30%, -30%)"
          }} />

          <div style={{ 
            display: "flex", 
            alignItems: "flex-start", 
            gap: 24, 
            flexWrap: "wrap",
            position: "relative",
            zIndex: 1
          }}>
            {/* Avatar */}
            <div style={{ position: "relative" }}>
              <div style={{
                width: 100,
                height: 100,
                borderRadius: 24,
                background: `linear-gradient(135deg, ${COLORS.peachGlow} 0%, ${COLORS.jungleTeal} 100%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: 36,
                color: COLORS.inkBlack,
                boxShadow: `0 12px 40px rgba(255, 229, 217, 0.3)`,
                fontFamily: "'Outfit', sans-serif",
                overflow: "hidden",
                position: "relative",
              }}>
                {profilePictureUrl ? (
                  <img
                    src={profilePictureUrl}
                    alt="Profile"
                    style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : (
                  <span style={{ position: "relative", zIndex: 1 }}>
                    {fullName?.split(" ").map(n => n[0]).join("") || "IN"}
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: "absolute",
                  bottom: -4,
                  right: -4,
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: COLORS.inkBlack,
                  border: `2px solid ${COLORS.peachGlow}`,
                  color: COLORS.peachGlow,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Camera size={14} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleProfilePhotoUpload(file);
                  e.target.value = "";
                }}
              />
            </div>

            {/* Basic Info */}
            <div style={{ flex: 1, minWidth: 250 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <h1 style={{ 
                  color: "white", 
                  margin: 0, 
                  fontSize: isMobile ? 26 : 32, 
                  fontFamily: "'Outfit', sans-serif", 
                  fontWeight: 700 
                }}>
                  {intern?.fullName}
                </h1>
                {lifecycleBadge?.label ? (
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 800,
                      border: `1px solid ${lifecycleBadge.color}`,
                      color: lifecycleBadge.color,
                      background: lifecycleBadge.outlined ? "transparent" : `${lifecycleBadge.color}22`,
                      letterSpacing: "0.2px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {lifecycleBadge.label}
                  </span>
                ) : null}
              </div>
              <p style={{ 
                color: COLORS.peachGlow, 
                margin: "6px 0 0", 
                fontSize: 16,
                fontWeight: 500
              }}>
                {intern?.degree}
              </p>
              
              <div style={{ 
                display: "flex", 
                gap: 20, 
                marginTop: 16, 
                flexWrap: "wrap" 
              }}>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8, 
                  color: "rgba(255,255,255,0.85)", 
                  fontSize: 14 
                }}>
                  <Mail size={16} />
                  {intern?.email}
                </div>
                <div style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8, 
                  color: "rgba(255,255,255,0.85)", 
                  fontSize: 14 
                }}>
                  <Phone size={16} />
                  {intern?.phone}
                </div>
              </div>

              {/* Quick Stats */}
              <div style={{ 
                display: "flex", 
                gap: 12, 
                marginTop: 20,
                flexWrap: "wrap"
              }}>
                <div style={{
                  padding: "8px 14px",
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  color: "white",
                  fontSize: 13,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}>
                  <Shield size={14} />
                  {intern?.pmCode}
                </div>
                <div style={{
                  padding: "8px 14px",
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  color: "white",
                  fontSize: 13,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}>
                  <Clock size={14} />
                  {workMode || "Not set"}
                </div>
                <div style={{
                  padding: "8px 14px",
                  background: "rgba(255,255,255,0.15)",
                  borderRadius: 10,
                  color: "white",
                  fontSize: 13,
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}>
                  <Calendar size={14} />
                  {internshipDuration || "Not set"}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
                {resumeUrl ? (
                  <button
                    type="button"
                    onClick={() => window.open(resumeUrl, "_blank", "noopener,noreferrer")}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 14,
                      border: "1px solid rgba(255,255,255,0.28)",
                      background: "rgba(0,0,0,0.18)",
                      color: "white",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    <FileText size={16} /> Open Resume
                  </button>
                ) : (
                  <div style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>
                    Resume not uploaded yet.
                  </div>
                )}
                <label
                  style={{
                    padding: "10px 14px",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.28)",
                    background: "rgba(0,0,0,0.18)",
                    color: "white",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    fontWeight: 700,
                    fontSize: 13,
                  }}
                >
                  <Upload size={16} /> Upload Resume
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    style={{ display: "none" }}
                    onChange={(e) => handleResumeUpload(e.target.files?.[0])}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          {startDate && endDate && (
            <div style={{ marginTop: 24, position: "relative", zIndex: 1 }}>
              <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                marginBottom: 8,
                fontSize: 13,
                color: "rgba(255,255,255,0.8)"
              }}>
                <span>Internship Progress</span>
                <span style={{ fontWeight: 600 }}>{progress}% Complete</span>
              </div>
              <div style={{
                height: 8,
                background: "rgba(255,255,255,0.2)",
                borderRadius: 4,
                overflow: "hidden"
              }}>
                <div style={{
                  height: "100%",
                  width: `${progress}%`,
                  background: `linear-gradient(90deg, ${COLORS.peachGlow} 0%, ${COLORS.success} 100%)`,
                  borderRadius: 4,
                  transition: "width 0.5s ease-out"
                }} />
              </div>
              {daysRemaining !== null && (
                <div style={{ 
                  marginTop: 8, 
                  fontSize: 12, 
                  color: "rgba(255,255,255,0.6)",
                  display: "flex",
                  justifyContent: "space-between"
                }}>
                  <span>Started: {new Date(startDate).toLocaleDateString()}</span>
                  <span style={{ color: daysRemaining < 30 ? COLORS.warning : "rgba(255,255,255,0.6)" }}>
                    {daysRemaining} days remaining
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", 
          gap: 16, 
          marginBottom: 24 
        }}>
          <StatCard 
            icon={<Calendar size={20} />} 
            label="Days Active" 
            value={startDate ? Math.floor((new Date() - new Date(startDate)) / (1000 * 60 * 60 * 24)) : 0} 
            color={COLORS.jungleTeal} 
          />
          <StatCard 
            icon={<BookOpen size={20} />} 
            label="Skills" 
            value={skillsList.length} 
            color={COLORS.peachGlow} 
          />
          <StatCard 
            icon={<FileText size={20} />} 
            label="Projects" 
            value="1" 
            color={COLORS.purple} 
          />
          <StatCard 
            icon={<Users size={20} />} 
            label="Team Size" 
            value="5" 
            color={COLORS.warning} 
          />
        </div>

        {/* Profile Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          
          {/* Personal Information */}
          <ProfileSection 
            title="Personal Information" 
            icon={<User size={20} />} 
            delay={1}
            onEdit={() => startEditing("personal")}
            isEditing={isEditing("personal")}
            onSave={saveChanges}
            onCancel={cancelEditing}
          >
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", 
              gap: 20 
            }}>
              <InfoItem 
                label="Full Name" 
                value={fullName}
                editable={isEditing("personal")}
                editValue={editData?.fullName}
                onChange={(v) => updateField("fullName", v)}
              />
              <InfoItem 
                label="Date of Birth" 
                value={dob ? new Date(dob).toLocaleDateString() : null}
                editable={isEditing("personal")}
                editValue={editData?.dob}
                onChange={(v) => updateField("dob", v)}
                type="date"
              />
              <InfoItem 
                label="Blood Group" 
                value={bloodGroup}
                editable={isEditing("personal")}
                editValue={editData?.profile?.bloodGroup}
                onChange={(v) => updateProfileField("bloodGroup", v)}
                type="select"
                options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
              />
              <InfoItem 
                label="Gender" 
                value={gender}
                editable={isEditing("personal")}
                editValue={editData?.profile?.gender}
                onChange={(v) => updateProfileField("gender", v)}
                type="select"
                options={["Female", "Male", "Other", "Prefer not to say"]}
              />
              <InfoItem 
                label="Email" 
                value={email}
                editable={isEditing("personal")}
                editValue={editData?.email}
                onChange={(v) => updateField("email", v)}
                type="email"
              />
              <InfoItem 
                label="Phone" 
                value={phone}
                editable={isEditing("personal")}
                editValue={editData?.phone}
                onChange={(v) => updateField("phone", v)}
                type="tel"
              />
              <InfoItem 
                label="PM Code" 
                value={pmCode}
                editable={false}
              />
            </div>
          </ProfileSection>

          {/* Bio & Skills */}
          <ProfileSection 
            title="About & Skills" 
            icon={<Sparkles size={20} />} 
            delay={2}
            onEdit={() => startEditing("skills")}
            isEditing={isEditing("skills")}
            onSave={saveChanges}
            onCancel={cancelEditing}
          >
            <div style={{ marginBottom: 20 }}>
              <InfoItem 
                label="Bio" 
                value={bio}
                editable={isEditing("skills")}
                editValue={editData?.profile?.bio}
                onChange={(v) => updateProfileField("bio", v)}
                type="textarea"
              />
            </div>
            
            <div>
              <label style={{ 
                fontSize: 12, 
                color: "rgba(255,255,255,0.5)", 
                fontWeight: 500,
                display: "block",
                marginBottom: 10
              }}>
                Skills
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(isEditing("skills") ? editData?.profile?.skills : skillsList)?.map(skill => (
                  <SkillTag 
                    key={skill} 
                    skill={skill} 
                    editable={isEditing("skills")}
                    onRemove={removeSkill}
                  />
                ))}
                {isEditing("skills") && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(e) => setNewSkill(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && addSkill()}
                      placeholder="Add skill..."
                      style={{ 
                        ...inputStyle, 
                        width: 120, 
                        padding: "6px 12px",
                        fontSize: 13
                      }}
                    />
                    <button
                      onClick={addSkill}
                      style={{
                        padding: "6px 12px",
                        background: COLORS.jungleTeal,
                        border: "none",
                        borderRadius: 8,
                        color: "white",
                        cursor: "pointer",
                        fontSize: 13
                      }}
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ 
              display: "grid", 
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
              gap: 20,
              marginTop: 20
            }}>
              <InfoItem 
                label="LinkedIn" 
                value={linkedIn}
                editable={isEditing("skills")}
                editValue={editData?.profile?.linkedIn}
                onChange={(v) => updateProfileField("linkedIn", v)}
              />
              <InfoItem 
                label="GitHub" 
                value={github}
                editable={isEditing("skills")}
                editValue={editData?.profile?.github}
                onChange={(v) => updateProfileField("github", v)}
              />
            </div>
          </ProfileSection>

          {/* Address */}
          <ProfileSection 
            title="Address" 
            icon={<MapPin size={20} />} 
            delay={3}
            onEdit={() => startEditing("address")}
            isEditing={isEditing("address")}
            onSave={saveChanges}
            onCancel={cancelEditing}
          >
            {isEditing("address") ? (
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
                gap: 20 
              }}>
                <div style={{ gridColumn: isMobile ? "1" : "1 / -1" }}>
                  <InfoItem 
                    label="Street Address" 
                    value={address}
                    editable
                    editValue={editData?.profile?.address}
                    onChange={(v) => updateProfileField("address", v)}
                  />
                </div>
                <InfoItem 
                  label="City" 
                  value={city}
                  editable
                  editValue={editData?.profile?.city}
                  onChange={(v) => updateProfileField("city", v)}
                />
                <InfoItem 
                  label="State" 
                  value={state}
                  editable
                  editValue={editData?.profile?.state}
                  onChange={(v) => updateProfileField("state", v)}
                />
                <InfoItem 
                  label="Pincode" 
                  value={pincode}
                  editable
                  editValue={editData?.profile?.pincode}
                  onChange={(v) => updateProfileField("pincode", v)}
                />
              </div>
            ) : (
              <InfoItem
                label="Address"
                value={fullAddress}
                editable={false}
              />
            )}
          </ProfileSection>

          {/* Emergency Contact */}
          <ProfileSection 
            title="Emergency Contact" 
            icon={<Heart size={20} />} 
            delay={4}
            onEdit={() => startEditing("emergency")}
            isEditing={isEditing("emergency")}
            onSave={saveChanges}
            onCancel={cancelEditing}
          >
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", 
              gap: 20 
            }}>
              <InfoItem 
                label="Contact Name" 
                value={emergencyContactName}
                editable={isEditing("emergency")}
                editValue={editData?.profile?.emergencyContactName}
                onChange={(v) => updateProfileField("emergencyContactName", v)}
              />
              <InfoItem 
                label="Relation" 
                value={emergencyRelation}
                editable={isEditing("emergency")}
                editValue={editData?.profile?.emergencyRelation}
                onChange={(v) => updateProfileField("emergencyRelation", v)}
                type="select"
                options={["Father", "Mother", "Spouse", "Sibling", "Friend", "Other"]}
              />
              <InfoItem 
                label="Phone" 
                value={emergencyContactPhone}
                editable={isEditing("emergency")}
                editValue={editData?.profile?.emergencyContactPhone}
                onChange={(v) => updateProfileField("emergencyContactPhone", v)}
                type="tel"
              />
            </div>
          </ProfileSection>

          {/* Academic Details */}
          <ProfileSection 
            title="Academic Details" 
            icon={<GraduationCap size={20} />} 
            delay={5}
            onEdit={() => startEditing("academic")}
            isEditing={isEditing("academic")}
            onSave={saveChanges}
            onCancel={cancelEditing}
          >
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", 
              gap: 20 
            }}>
              <div style={{ gridColumn: isMobile ? "1" : "1 / -1" }}>
                <InfoItem 
                  label="College / University" 
                  value={collegeName}
                  editable={isEditing("academic")}
                  editValue={editData?.profile?.collegeName}
                  onChange={(v) => updateProfileField("collegeName", v)}
                />
              </div>
              <InfoItem 
                label="Department" 
                value={department}
                editable={isEditing("academic")}
                editValue={editData?.profile?.department}
                onChange={(v) => updateProfileField("department", v)}
              />
              <InfoItem 
                label="Degree" 
                value={degree}
                editable={isEditing("academic")}
                editValue={editData?.profile?.degree}
                onChange={(v) => updateProfileField("degree", v)}
              />
              <InfoItem 
                label="Semester" 
                value={semester}
                editable={isEditing("academic")}
                editValue={editData?.profile?.semester}
                onChange={(v) => updateProfileField("semester", v)}
              />
              <InfoItem 
                label="Faculty Guide" 
                value={guideName}
                editable={isEditing("academic")}
                editValue={editData?.profile?.guideName}
                onChange={(v) => updateProfileField("guideName", v)}
              />
              <InfoItem 
                label="Guide Email" 
                value={guideEmail}
                editable={isEditing("academic")}
                editValue={editData?.profile?.guideEmail}
                onChange={(v) => updateProfileField("guideEmail", v)}
                type="email"
              />
            </div>
          </ProfileSection>

          {/* Internship Details */}
          <ProfileSection 
            title="Internship Details" 
            icon={<Briefcase size={20} />} 
            delay={6}
            onEdit={() => startEditing("internship")}
            isEditing={isEditing("internship")}
            onSave={saveChanges}
            onCancel={cancelEditing}
          >
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", 
              gap: 20 
            }}>
              <InfoItem 
                label="Duration" 
                value={internshipDuration}
                editable={isEditing("internship")}
                editValue={editData?.profile?.internshipDuration}
                onChange={(v) => updateProfileField("internshipDuration", v)}
                type="select"
                options={["1 Month", "2 Months", "3 Months", "4 Months", "5 Months", "6 Months", "12 Months"]}
              />
              <InfoItem 
                label="Start Date" 
                value={startDate ? new Date(startDate).toLocaleDateString() : null}
                editable={isEditing("internship")}
                editValue={editData?.profile?.startDate}
                onChange={(v) => updateProfileField("startDate", v)}
                type="date"
              />
              <InfoItem 
                label="End Date" 
                value={endDate ? new Date(endDate).toLocaleDateString() : null}
                editable={isEditing("internship")}
                editValue={editData?.profile?.endDate}
                onChange={(v) => updateProfileField("endDate", v)}
                type="date"
              />
              <InfoItem 
                label="Work Mode" 
                value={workMode}
                editable={isEditing("internship")}
                editValue={editData?.profile?.workMode}
                onChange={(v) => updateProfileField("workMode", v)}
                type="select"
                options={["On-site", "Remote", "Hybrid"]}
              />
              <div style={{ gridColumn: isMobile ? "1" : "span 2" }}>
                <InfoItem 
                  label="Expected Outcome" 
                  value={expectedOutcome}
                  editable={isEditing("internship")}
                  editValue={editData?.profile?.expectedOutcome}
                  onChange={(v) => updateProfileField("expectedOutcome", v)}
                />
              </div>
            </div>
          </ProfileSection>
        </div>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
    </div>
  );
}

export default ProfilePage;
