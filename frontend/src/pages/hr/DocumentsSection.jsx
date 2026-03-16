import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FileDown, FileSpreadsheet, FileText, RotateCcw, Upload } from "lucide-react";
import { COLORS, glassCardStyle } from "./HRConstants";
import { EmailTemplateManager } from "./EmailTemplateManager";
import { hrApi } from "../../lib/apiClient";

const BUNDLED_CERTIFICATE_TEMPLATE_URL = "/templates/EDCS_Certificate_Template.docx";
const BUNDLED_CERTIFICATE_TEMPLATE_FILENAME = "EDCS_Certificate_Template.docx";
const BUNDLED_CERTIFICATE_TEMPLATE_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const buttonBase = {
  padding: "10px 12px",
  borderRadius: 12,
  border: `1px solid ${COLORS.borderGlass}`,
  background: "rgba(255,255,255,0.06)",
  color: "white",
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 8,
  fontWeight: 800,
  fontSize: 13,
};

export default function DocumentsSection() {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState({ open: false, tone: "info", message: "" });
  const [certificateInfo, setCertificateInfo] = useState({
    filename: null,
    updatedAt: null,
    hasContent: false,
    warning: null,
  });
  const [uploadingCertificate, setUploadingCertificate] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const certRes = await hrApi.certificateTemplateInfo();
      const doc = certRes?.document || {};
      setCertificateInfo({
        filename: doc.filename || null,
        updatedAt: doc.updatedAt || null,
        hasContent: !!doc.hasContent,
        warning: certRes?.warning || null,
      });
    } catch (err) {
      setNotice({ open: true, tone: "error", message: err?.message || "Failed to load documents." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const internDataStub = useMemo(
    () => ({
      internName: "[INTERN_NAME]",
      internEmail: "[INTERN_EMAIL]",
      internId: "[INTERN_ID]",
      domain: "[DOMAIN]",
      duration: "[DURATION]",
      startDate: "[START_DATE]",
      pmCode: "[PM_CODE]",
    }),
    []
  );

  const onUploadCertificateClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const uploadCertificateFromUrl = async ({ url, filename, mimeType }) => {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) throw new Error("Failed to load bundled certificate template.");
    const blob = await res.blob();
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error("Failed to read certificate template."));
      reader.readAsDataURL(blob);
    });
    await hrApi.uploadCertificateTemplate({
      filename,
      mimeType,
      contentBase64: String(dataUrl || ""),
    });
  };

  const useDefaultCertificateTemplate = async () => {
    setUploadingCertificate(true);
    try {
      await uploadCertificateFromUrl({
        url: BUNDLED_CERTIFICATE_TEMPLATE_URL,
        filename: BUNDLED_CERTIFICATE_TEMPLATE_FILENAME,
        mimeType: BUNDLED_CERTIFICATE_TEMPLATE_MIME,
      });
      await load();
      setNotice({ open: true, tone: "success", message: "Default certificate template set." });
    } catch (err) {
      setNotice({ open: true, tone: "error", message: err?.message || "Failed to set default certificate template." });
    } finally {
      setUploadingCertificate(false);
    }
  };

  const certificateTemplateKind = useMemo(() => {
    if (!certificateInfo.hasContent) return null;
    if (certificateInfo.filename === BUNDLED_CERTIFICATE_TEMPLATE_FILENAME) return "default";
    return "custom";
  }, [certificateInfo.hasContent, certificateInfo.filename]);

  const onCertificateSelected = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const name = String(file.name || "").trim();
    if (!name) {
      setNotice({ open: true, tone: "error", message: "Invalid file name." });
      return;
    }

    const ext = name.split(".").pop()?.toLowerCase() || "";
    const allowed = ["docx", "doc", "pdf"];
    if (!allowed.includes(ext)) {
      setNotice({ open: true, tone: "error", message: "Upload a .docx, .doc, or .pdf file." });
      return;
    }

    setUploadingCertificate(true);
    try {
      const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read file."));
        reader.readAsDataURL(file);
      });

      await hrApi.uploadCertificateTemplate({
        filename: name,
        mimeType: file.type || "",
        contentBase64: String(dataUrl || ""),
      });
      await load();
      setNotice({ open: true, tone: "success", message: "Certificate template uploaded." });
    } catch (err) {
      setNotice({ open: true, tone: "error", message: err?.message || "Failed to upload certificate template." });
    } finally {
      setUploadingCertificate(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 28, fontWeight: 900, color: COLORS.textPrimary }}>Documents</div>
          <div style={{ marginTop: 8, color: COLORS.textMuted, fontSize: 13 }}>
            General HR templates (editable) + downloadables for interns.
          </div>
        </div>
        {loading ? (
          <div style={{ color: COLORS.textMuted, fontSize: 12 }}>Loading…</div>
        ) : null}
      </div>

      <div style={{ ...glassCardStyle, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div style={{ fontWeight: 900, color: COLORS.textPrimary }}>Tracking templates</div>
        </div>
        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a href="/templates/tna_tracker_template.csv" download style={{ ...buttonBase, textDecoration: "none" }}>
            <FileSpreadsheet size={16} /> TNA Tracker (CSV)
          </a>
          <a href="/templates/project_blueprint_template.txt" download style={{ ...buttonBase, textDecoration: "none" }}>
            <FileText size={16} /> Blueprint (TXT)
          </a>
        </div>
        <div style={{ marginTop: 10, color: COLORS.textMuted, fontSize: 12, lineHeight: 1.5 }}>
          Tip: For Google sync, enable backend Google credentials and set report links per intern.
        </div>
      </div>

      <div style={{ ...glassCardStyle, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 900, color: COLORS.textPrimary }}>Internship completion certificate template</div>
            <div style={{ marginTop: 6, color: COLORS.textMuted, fontSize: 12 }}>
              Upload a custom DOCX, or use the built-in default. Download the active template anytime.
            </div>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".doc,.docx,.pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
          onChange={onCertificateSelected}
          style={{ display: "none" }}
        />

        <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            onClick={onUploadCertificateClick}
            disabled={uploadingCertificate}
            style={{ ...buttonBase, opacity: uploadingCertificate ? 0.7 : 1 }}
          >
            <Upload size={16} /> {uploadingCertificate ? "Uploading…" : "Upload custom template"}
          </button>
          <button
            type="button"
            onClick={useDefaultCertificateTemplate}
            disabled={uploadingCertificate}
            style={{ ...buttonBase, opacity: uploadingCertificate ? 0.7 : 1 }}
            title="Resets the active template to the built-in default"
          >
            <RotateCcw size={16} /> Use default template
          </button>
          <button
            type="button"
            onClick={() => window.open(hrApi.downloadCertificateTemplate(), "_blank", "noopener,noreferrer")}
            disabled={!certificateInfo.hasContent}
            style={{ ...buttonBase, opacity: certificateInfo.hasContent ? 1 : 0.5, cursor: certificateInfo.hasContent ? "pointer" : "default" }}
          >
            <FileDown size={16} /> Download active template
          </button>
          {certificateTemplateKind ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", color: COLORS.textMuted, fontSize: 12 }}>
              <span
                style={{
                  padding: "4px 10px",
                  borderRadius: 999,
                  fontWeight: 900,
                  border:
                    certificateTemplateKind === "custom"
                      ? "1px solid rgba(16, 185, 129, 0.45)"
                      : "1px solid rgba(34, 211, 238, 0.35)",
                  background: certificateTemplateKind === "custom" ? "rgba(16, 185, 129, 0.15)" : "rgba(34, 211, 238, 0.12)",
                  color: certificateTemplateKind === "custom" ? COLORS.success : COLORS.cyanHighlight,
                }}
              >
                {certificateTemplateKind === "custom" ? "Custom active" : "Default active"}
              </span>
              <span>{certificateInfo.filename || "Unnamed template"}</span>
            </div>
          ) : (
            <div style={{ color: COLORS.textMuted, fontSize: 12 }}>No template uploaded</div>
          )}
        </div>

        {certificateInfo.warning ? (
          <div style={{ marginTop: 10, color: COLORS.orange, fontSize: 12 }}>
            {certificateInfo.warning}
          </div>
        ) : null}
      </div>

      <div style={{ ...glassCardStyle, padding: 18 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontWeight: 900, color: COLORS.textPrimary }}>Offer letter templates</div>
            <div style={{ marginTop: 6, color: COLORS.textMuted, fontSize: 12 }}>
              Edit/create offer letter templates for approval emails.
            </div>
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <EmailTemplateManager
            internData={internDataStub}
            onTemplateReady={() => {}}
          />
        </div>
      </div>

      {notice.open ? (
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 12,
            border: `1px solid ${notice.tone === "success" ? "rgba(16, 185, 129, 0.45)" : notice.tone === "error" ? "rgba(239, 68, 68, 0.45)" : "rgba(20, 184, 166, 0.45)"}`,
            background: notice.tone === "success" ? "rgba(16, 185, 129, 0.15)" : notice.tone === "error" ? "rgba(239, 68, 68, 0.15)" : "rgba(20, 184, 166, 0.15)",
            color: COLORS.textPrimary,
          }}
        >
          {notice.message}
        </div>
      ) : null}
    </div>
  );
}
