//frontend/src/pages/intern/ProfileSetup.jsx
import React, { useState, useEffect } from "react";
import { User, MapPin, Phone, Heart, GraduationCap, Calendar, Briefcase, Upload, Image, FileText, CheckCircle } from "lucide-react";
import { authApi, internApi } from "../../lib/apiClient";

const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
};

const buildStoredFilesFromProfile = (profileData = {}) => {
  const sanitized = typeof profileData === "object" && profileData ? profileData : {};
  return {
    profilePicture: sanitized.profilePictureUrl
      ? {
          url: sanitized.profilePictureUrl,
          filename: sanitized.profilePictureMeta?.filename || "Profile picture",
        }
      : null,
    resume: sanitized.resumeUrl
      ? {
          url: sanitized.resumeUrl,
          filename: sanitized.resumeMeta?.filename || sanitized.resumeFileName || "Resume / CV",
        }
      : null,
  };
};

export default function InternProfileSetup() {
  const [currentUser, setCurrentUser] = useState(null);
  const [step, setStep] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [storedFiles, setStoredFiles] = useState({ profilePicture: null, resume: null });

  const [profile, setProfile] = useState({
    // Personal Details
    address: "",
    city: "",
    state: "",
    pincode: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyRelation: "",
    bloodGroup: "",
    
    // Academic Details
    collegeName: "",
    department: "",
    semester: "",
    guideName: "",
    guideEmail: "",
    guidePhone: "",
    
    // Internship Details
    internshipDuration: "",
    startDate: "",
    endDate: "",
    workMode: "",
    expectedOutcome: "",
    bio: "",
    
    // Documents
    profilePicture: null,
    resume: null,
  });
  const [fileUploads, setFileUploads] = useState({ profilePicture: null, resume: null });

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  async function loadCurrentUser() {
    try {
      const me = await authApi.me();
      if (me?.profile?.role !== "intern") {
        window.location.href = "/";
        return;
      }

      const profileData =
        me.profile && typeof me.profile.profile_data === "object" ? me.profile.profile_data : {};
      const existingFiles = buildStoredFilesFromProfile(profileData);
<<<<<<< HEAD
      setStoredFiles(existingFiles);
      setProfile((prev) => ({
        ...prev,
        ...(profileData || {}),
        profilePicture: prev.profilePicture || existingFiles.profilePicture?.url || profileData.profilePictureUrl || null,
        resume: prev.resume || existingFiles.resume?.url || profileData.resumeUrl || null,
      }));
=======
      if (existingFiles.profilePicture || existingFiles.resume) {
        setStoredFiles(existingFiles);
        setProfile((prev) => ({
          ...prev,
          profilePicture: prev.profilePicture || existingFiles.profilePicture?.url || null,
          resume: prev.resume || existingFiles.resume?.url || null,
        }));
      }
>>>>>>> origin/khush

      const u = {
        role: me.profile.role,
        fullName: me.profile.full_name,
        email: me.profile.email,
        pmCode: me.profile.pm_code || null,
        internId: me.profile.intern_id || null,
        profileCompleted: !!me.profile.profile_completed,
        profileData,
      };
      localStorage.setItem("currentUser", JSON.stringify(u));
      setCurrentUser(u);
      return;
    } catch (error) {
      console.error("Error loading intern (API):", error);
    }

    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
      if (user.role === "intern") {
        const cachedProfileData = user.profileData || {};
        const cachedFiles = buildStoredFilesFromProfile(cachedProfileData);
<<<<<<< HEAD
        setStoredFiles(cachedFiles);
        setProfile((prev) => ({
          ...prev,
          ...(cachedProfileData || {}),
          profilePicture: prev.profilePicture || cachedFiles.profilePicture?.url || cachedProfileData.profilePictureUrl || null,
          resume: prev.resume || cachedFiles.resume?.url || cachedProfileData.resumeUrl || null,
        }));
=======
        if (cachedFiles.profilePicture || cachedFiles.resume) {
          setStoredFiles(cachedFiles);
          setProfile((prev) => ({
            ...prev,
            profilePicture: prev.profilePicture || cachedFiles.profilePicture?.url || null,
            resume: prev.resume || cachedFiles.resume?.url || null,
          }));
        }
>>>>>>> origin/khush
        setCurrentUser(user);
      } else {
        window.location.href = "/";
      }
    } catch {
      window.location.href = "/";
    }
  }

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      loadCurrentUser();
    }, 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const handleChange = (field, value) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const handleFileChange = (field, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfile((prev) => ({ ...prev, [field]: reader.result }));
    };
    reader.readAsDataURL(file);
    setFileUploads((prev) => ({ ...prev, [field]: file }));
  };

  const validateStep = (stepNum) => {
    setError("");
    
    if (stepNum === 1) {
      if (!profile.address || !profile.city || !profile.state || !profile.pincode) {
        setError("Please fill all address fields");
        return false;
      }
      if (!profile.emergencyContactName || !profile.emergencyContactPhone || !profile.emergencyRelation) {
        setError("Please fill all emergency contact fields");
        return false;
      }
      if (!profile.bloodGroup) {
        setError("Please select your blood group");
        return false;
      }
    }
    
    if (stepNum === 2) {
      if (!profile.collegeName || !profile.department || !profile.semester) {
        setError("Please fill all academic fields");
        return false;
      }
      if (!profile.guideName || !profile.guideEmail || !profile.guidePhone) {
        setError("Please fill all guide details");
        return false;
      }
    }
    
    if (stepNum === 3) {
      if (!profile.internshipDuration || !profile.startDate || !profile.endDate || !profile.workMode) {
        setError("Please fill all internship fields");
        return false;
      }
      if (!profile.bio || profile.bio.length < 20) {
        setError("Bio must be at least 20 characters");
        return false;
      }
    }
    
    if (stepNum === 4) {
      if (!profile.profilePicture) {
        setError("Please upload a profile picture");
        return false;
      }
      if (!profile.resume) {
        setError("Please upload your resume");
        return false;
      }
    }
    
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 4) {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setError("");
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    try {
      console.log("Starting profile save...");
      console.log("Current user:", currentUser);

      if (!currentUser || !currentUser.email) {
        setError("User session expired. Please login again.");
        setTimeout(() => window.location.href = "/", 2000);
        return;
      }

      const profilePicturePreview = profile.profilePicture;
      const resumePreview = profile.resume;
      const cleanProfile = { ...profile };
      delete cleanProfile.profilePicture;
      delete cleanProfile.resume;

      const buildUploadPayload = (fieldKey, previewValue) => {
        const file = fileUploads[fieldKey];
        if (!file || !previewValue) return null;
        return {
          name: file.name,
          type: file.type,
          dataUrl: previewValue,
        };
      };

      const profilePictureUpload = buildUploadPayload("profilePicture", profilePicturePreview);
      const resumeUpload = buildUploadPayload("resume", resumePreview);
      const uploadsPayload = {};
      if (profilePictureUpload) uploadsPayload.profilePicture = profilePictureUpload;
      if (resumeUpload) uploadsPayload.resume = resumeUpload;

      const result = await internApi.updateMe({
        profileData: cleanProfile,
        profileCompleted: true,
        fileUploads: Object.keys(uploadsPayload).length ? uploadsPayload : undefined,
      });
      const updatedProfileData = result?.profile?.profile_data || {};
      const refreshedFiles = buildStoredFilesFromProfile(updatedProfileData);
      if (refreshedFiles.profilePicture || refreshedFiles.resume) {
        setStoredFiles(refreshedFiles);
      }

      const users = JSON.parse(localStorage.getItem("users") || "[]");
      console.log("Total users before update:", users.length);

      const updatedUsers = users.map((u) => {
        if (u.email === currentUser.email && u.role === "intern") {
          console.log("Found matching user, updating...");
          return {
            ...u,
            profile: cleanProfile,
            profileData: updatedProfileData,
            profileCompleted: true,
            status: "active",
            profileCompletedAt: new Date().toISOString(),
          };
        }
        return u;
      });

      localStorage.setItem("users", JSON.stringify(updatedUsers));
      console.log("Users saved to localStorage");

      const updatedCurrentUser = {
        ...currentUser,
        profile: cleanProfile,
        profileCompleted: true,
        status: "active",
        profileData: updatedProfileData,
      };
      localStorage.setItem("currentUser", JSON.stringify(updatedCurrentUser));
      console.log("Current user updated");

      setSuccess("Profile setup complete! Redirecting to dashboard...");
      setTimeout(() => {
        window.location.href = "/intern/dashboard";
      }, 1500);
    } catch (error) {
      console.error("Error saving profile:", error);
      console.error("Error details:", error.message);
      setError(`Failed to save profile: ${error.message}. Please try with smaller files or contact support.`);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${COLORS.inkBlack} 0%, ${COLORS.deepOcean} 50%, ${COLORS.jungleTeal} 100%)`,
        color: "white",
        padding: isMobile ? 16 : 32,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 700,
            height: 700,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
            opacity: 0.3,
            filter: "blur(120px)",
            animation: "pulse 4s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.45; transform: translate(-50%, -50%) scale(1.08); }
        }
      `}</style>

      <div style={{ position: "relative", zIndex: 10, maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: isMobile ? 32 : 48, margin: 0, fontWeight: 800 }}>
            Complete Your Profile
          </h1>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: isMobile ? 14 : 16, marginTop: 8 }}>
            Welcome, {currentUser?.fullName}! Let's set up your internship profile.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 32,
            gap: 8,
          }}
        >
          {[
            { num: 1, label: "Personal", icon: User },
            { num: 2, label: "Academic", icon: GraduationCap },
            { num: 3, label: "Internship", icon: Briefcase },
            { num: 4, label: "Documents", icon: FileText },
          ].map((s) => (
            <StepIndicator
              key={s.num}
              step={s.num}
              label={s.label}
              icon={s.icon}
              active={step === s.num}
              completed={step > s.num}
              isMobile={isMobile}
            />
          ))}
        </div>

        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
            borderRadius: 24,
            padding: isMobile ? 20 : 40,
            border: "1px solid rgba(255,255,255,0.12)",
            minHeight: 400,
          }}
        >
          {step === 1 && <PersonalDetailsStep profile={profile} onChange={handleChange} isMobile={isMobile} />}
          {step === 2 && <AcademicDetailsStep profile={profile} onChange={handleChange} isMobile={isMobile} />}
          {step === 3 && <InternshipDetailsStep profile={profile} onChange={handleChange} isMobile={isMobile} />}
          {step === 4 && (
            <DocumentsStep
              profile={profile}
              onFileChange={handleFileChange}
              isMobile={isMobile}
              storedFiles={storedFiles}
            />
          )}

          {error && (
            <div
              style={{
                background: COLORS.racingRed,
                color: "white",
                padding: 12,
                borderRadius: 8,
                marginTop: 20,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          {success && (
            <div
              style={{
                background: "#4ade80",
                color: "white",
                padding: 12,
                borderRadius: 8,
                marginTop: 20,
                fontWeight: 600,
              }}
            >
              {success}
            </div>
          )}

          <div style={{ display: "flex", gap: 12, marginTop: 32, justifyContent: "space-between" }}>
            {step > 1 ? (
              <button onClick={handleBack} style={secondaryButtonStyle}>
                Back
              </button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <button onClick={handleNext} style={primaryButtonStyle}>
                Next
              </button>
            ) : (
              <button onClick={handleSubmit} style={primaryButtonStyle}>
                <CheckCircle size={18} /> Complete Setup
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepIndicator({ label, icon: StepIcon, active, completed, isMobile }) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div
        style={{
          width: isMobile ? 48 : 56,
          height: isMobile ? 48 : 56,
          borderRadius: "50%",
          background: completed ? "#4ade80" : active ? "white" : "rgba(255,255,255,0.1)",
          color: completed || active ? COLORS.inkBlack : "rgba(255,255,255,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          border: active ? `3px solid ${COLORS.peachGlow}` : "none",
          transition: "all 0.3s",
        }}
      >
        {completed ? <CheckCircle size={isMobile ? 24 : 28} /> : React.createElement(StepIcon, { size: isMobile ? 20 : 24 })}
      </div>
      {!isMobile && (
        <div
          style={{
            fontSize: 13,
            fontWeight: active ? 700 : 600,
            color: active ? "white" : "rgba(255,255,255,0.6)",
          }}
        >
          {label}
        </div>
      )}
    </div>
  );
}

function PersonalDetailsStep({ profile, onChange, isMobile }) {
  return (
    <div>
      <h2 style={{ fontSize: isMobile ? 20 : 24, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
        <User size={24} /> Personal Details
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <InputField
          label="Full Address"
          value={profile.address}
          onChange={(v) => onChange("address", v)}
          placeholder="Enter your complete address"
          fullWidth
        />
        <InputField
          label="City"
          value={profile.city}
          onChange={(v) => onChange("city", v)}
          placeholder="City"
        />
        <InputField
          label="State"
          value={profile.state}
          onChange={(v) => onChange("state", v)}
          placeholder="State"
        />
        <InputField
          label="Pincode"
          value={profile.pincode}
          onChange={(v) => onChange("pincode", v)}
          placeholder="Pincode"
          type="text"
        />
      </div>

      <h3 style={{ fontSize: isMobile ? 18 : 20, marginTop: 32, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <Phone size={20} /> Emergency Contact
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <InputField
          label="Contact Name"
          value={profile.emergencyContactName}
          onChange={(v) => onChange("emergencyContactName", v)}
          placeholder="Full name"
        />
        <InputField
          label="Contact Phone"
          value={profile.emergencyContactPhone}
          onChange={(v) => onChange("emergencyContactPhone", v)}
          placeholder="Phone number"
          type="tel"
        />
        <InputField
          label="Relation"
          value={profile.emergencyRelation}
          onChange={(v) => onChange("emergencyRelation", v)}
          placeholder="e.g., Father, Mother"
        />
        <SelectField
          label="Blood Group"
          value={profile.bloodGroup}
          onChange={(v) => onChange("bloodGroup", v)}
          options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]}
          icon={<Heart size={16} />}
        />
      </div>
    </div>
  );
}

function AcademicDetailsStep({ profile, onChange, isMobile }) {
  return (
    <div>
      <h2 style={{ fontSize: isMobile ? 20 : 24, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
        <GraduationCap size={24} /> Academic Details
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <InputField
          label="College Name"
          value={profile.collegeName}
          onChange={(v) => onChange("collegeName", v)}
          placeholder="Your college/university"
          fullWidth
        />
        <InputField
          label="Department"
          value={profile.department}
          onChange={(v) => onChange("department", v)}
          placeholder="e.g., Computer Science"
        />
        <InputField
          label="Current Semester"
          value={profile.semester}
          onChange={(v) => onChange("semester", v)}
          placeholder="e.g., 6th Semester"
        />
      </div>

      <h3 style={{ fontSize: isMobile ? 18 : 20, marginTop: 32, marginBottom: 16 }}>
        Guide Details
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <InputField
          label="Guide Name"
          value={profile.guideName}
          onChange={(v) => onChange("guideName", v)}
          placeholder="Professor/Guide name"
        />
        <InputField
          label="Guide Email"
          value={profile.guideEmail}
          onChange={(v) => onChange("guideEmail", v)}
          placeholder="guide@college.edu"
          type="email"
        />
        <InputField
          label="Guide Phone"
          value={profile.guidePhone}
          onChange={(v) => onChange("guidePhone", v)}
          placeholder="Guide's phone number"
          type="tel"
        />
      </div>
    </div>
  );
}

function InternshipDetailsStep({ profile, onChange, isMobile }) {
  return (
    <div>
      <h2 style={{ fontSize: isMobile ? 20 : 24, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
        <Briefcase size={24} /> Internship Details
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        <InputField
          label="Duration (in months)"
          value={profile.internshipDuration}
          onChange={(v) => onChange("internshipDuration", v)}
          placeholder="e.g., 3 months"
          type="text"
        />
        <InputField
          label="Start Date"
          value={profile.startDate}
          onChange={(v) => onChange("startDate", v)}
          type="date"
        />
        <InputField
          label="End Date"
          value={profile.endDate}
          onChange={(v) => onChange("endDate", v)}
          type="date"
        />
        <SelectField
          label="Work Mode"
          value={profile.workMode}
          onChange={(v) => onChange("workMode", v)}
          options={["Remote", "On-site", "Hybrid"]}
          icon={<MapPin size={16} />}
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <InputField
          label="Expected Outcome"
          value={profile.expectedOutcome}
          onChange={(v) => onChange("expectedOutcome", v)}
          placeholder="What do you hope to achieve?"
          fullWidth
        />
      </div>

      <div style={{ marginTop: 20 }}>
        <label style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
          Bio / Introduction
        </label>
        <textarea
          value={profile.bio}
          onChange={(e) => onChange("bio", e.target.value)}
          placeholder="Tell us about yourself, your interests, and goals (minimum 20 characters)"
          style={{
            width: "100%",
            minHeight: 120,
            padding: 12,
            borderRadius: 12,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.08)",
            color: "white",
            outline: "none",
            fontSize: 14,
            resize: "vertical",
            fontFamily: "inherit",
          }}
        />
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>
          {profile.bio.length} characters
        </div>
      </div>
    </div>
  );
}

function DocumentsStep({ profile, onFileChange, isMobile, storedFiles }) {
  return (
    <div>
      <h2 style={{ fontSize: isMobile ? 20 : 24, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
        <FileText size={24} /> Upload Documents
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <FileUploadField
          label="Profile Picture"
          icon={<Image size={20} />}
          accept="image/*"
          currentFile={profile.profilePicture}
          onChange={(file) => onFileChange("profilePicture", file)}
          description="Upload a professional photo (JPG, PNG)"
          existingFile={storedFiles?.profilePicture}
        />

        <FileUploadField
          label="Resume / CV"
          icon={<Upload size={20} />}
          accept=".pdf,.doc,.docx"
          currentFile={profile.resume}
          onChange={(file) => onFileChange("resume", file)}
          description="Upload your resume (PDF, DOC, DOCX)"
          existingFile={storedFiles?.resume}
        />
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, placeholder, type = "text", fullWidth = false }) {
  const fieldId = `field-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div style={{ gridColumn: fullWidth ? "1 / -1" : "auto" }}>
      <label htmlFor={fieldId} style={{ display: "block", marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
        {label}
      </label>
      <input
        id={fieldId}
        name={fieldId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options, icon }) {
  const fieldId = `select-${label.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <div>
      <label htmlFor={fieldId} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontWeight: 600, fontSize: 14 }}>
        {icon} {label}
      </label>
      <select id={fieldId} name={fieldId} value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  );
}

function FileUploadField({ label, icon, accept, currentFile, onChange, description, existingFile }) {
  return (
    <div
      style={{
        background: "rgba(255,255,255,0.04)",
        padding: 20,
        borderRadius: 12,
        border: "2px dashed rgba(255,255,255,0.2)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        {icon}
        <label style={{ fontWeight: 600, fontSize: 16 }}>{label}</label>
      </div>
      <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", marginBottom: 12 }}>{description}</p>

      <input
        type="file"
        accept={accept}
        onChange={(e) => onChange(e.target.files[0])}
        style={{ display: "none" }}
        id={`file-${label}`}
      />
      <label
        htmlFor={`file-${label}`}
        style={{
          ...primaryButtonStyle,
          display: "inline-flex",
          cursor: "pointer",
        }}
      >
        <Upload size={16} /> Choose File
      </label>

      {currentFile && (
        <div
          style={{
            marginTop: 12,
            padding: 8,
            background: "rgba(255,255,255,0.08)",
            borderRadius: 8,
            fontSize: 13,
            color: "#4ade80",
            fontWeight: 600,
          }}
        >
          ✓ File uploaded successfully
        </div>
      )}
      {existingFile?.url && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: "rgba(255,255,255,0.75)",
            display: "flex",
            gap: 6,
            alignItems: "center",
          }}
        >
          <span>Saved file:</span>
          <a
            href={existingFile.url}
            target="_blank"
            rel="noreferrer"
            style={{ color: "#a5f3fc", textDecoration: "underline", fontWeight: 600 }}
          >
            {existingFile.filename || "View"}
          </a>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.08)",
  color: "white",
  outline: "none",
  fontSize: 14,
};

const primaryButtonStyle = {
  padding: "12px 24px",
  borderRadius: 999,
  border: "none",
  background: "white",
  color: COLORS.inkBlack,
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: 8,
  fontSize: 14,
};

const secondaryButtonStyle = {
  padding: "12px 24px",
  borderRadius: 999,
  border: "1px solid rgba(255,255,255,0.3)",
  background: "transparent",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 14,
};
