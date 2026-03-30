import React, { useEffect, useMemo, useState } from "react";
import { Eye, FileDown, FileText, RefreshCw } from "lucide-react";
import { internApi } from "../../lib/apiClient";

const TYPES = [
  { key: "offer_letter", label: "Offer Letter" },
  { key: "certificate", label: "Certificates" },
  { key: "submission", label: "Submissions" },
];

function formatDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString();
}

export default function DocumentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");
  const [documents, setDocuments] = useState([]);
  const [selected, setSelected] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await internApi.documents();
      setDocuments(res?.documents || []);
      setWarning(res?.warning || "");
    } catch (err) {
      setDocuments([]);
      setWarning("");
      setError(err?.message || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const byType = useMemo(() => {
    const map = new Map();
    (TYPES || []).forEach((t) => map.set(t.key, []));
    (documents || []).forEach((doc) => {
      const key = String(doc.documentType || "other");
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(doc);
    });
    return map;
  }, [documents]);

  const cardStyle = {
    background: "rgba(255, 255, 255, 0.06)",
    border: "1px solid rgba(255, 255, 255, 0.12)",
    borderRadius: 16,
    padding: 16,
  };

  const buttonStyle = (variant) => ({
    border: "1px solid rgba(255, 255, 255, 0.14)",
    background: variant === "primary" ? "rgba(20, 184, 166, 0.18)" : "rgba(255,255,255,0.06)",
    color: "white",
    padding: "10px 12px",
    borderRadius: 12,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    fontWeight: 800,
    fontSize: 13,
  });

  const openDownload = (doc) => {
    const url = doc?.downloadUrl || "";
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 900, display: "flex", gap: 10, alignItems: "center" }}>
            <FileText size={22} /> Documents
          </div>
          <div style={{ marginTop: 6, color: "rgba(248, 250, 252, 0.65)", fontSize: 13 }}>
            Offer letters, certificates, and any uploaded files for your internship.
          </div>
          {warning ? (
            <div style={{ marginTop: 8, color: "rgba(251, 191, 36, 0.9)", fontSize: 12 }}>
              {warning}
            </div>
          ) : null}
        </div>
        <button type="button" onClick={load} disabled={loading} style={{ ...buttonStyle(), opacity: loading ? 0.7 : 1 }}>
          <RefreshCw size={16} /> {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {error ? (
        <div style={{ ...cardStyle, borderColor: "rgba(239, 68, 68, 0.55)", background: "rgba(239, 68, 68, 0.12)" }}>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Error</div>
          <div style={{ color: "rgba(254, 202, 202, 0.95)", fontSize: 13 }}>{error}</div>
        </div>
      ) : null}

      {(TYPES || []).map((type) => {
        const rows = byType.get(type.key) || [];
        return (
          <div key={type.key} style={cardStyle}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ fontSize: 16, fontWeight: 900 }}>{type.label}</div>
              <div style={{ color: "rgba(248, 250, 252, 0.6)", fontSize: 12 }}>{rows.length} file(s)</div>
            </div>

            {rows.length === 0 ? (
              <div style={{ marginTop: 10, color: "rgba(248, 250, 252, 0.6)", fontSize: 13 }}>
                No documents available yet.
              </div>
            ) : (
              <div style={{ marginTop: 12, overflowX: "auto" }}>
                <div style={{ minWidth: 720, display: "grid", gridTemplateColumns: "2fr 1fr 220px", gap: 10, fontSize: 12, color: "rgba(248, 250, 252, 0.6)", fontWeight: 800 }}>
                  <div>Document</div>
                  <div>Updated</div>
                  <div>Actions</div>
                </div>
                <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                  {rows.map((doc) => {
                    const title = String(doc.title || doc.filename || type.label || "Document").trim();
                    return (
                      <div
                        key={doc.id}
                        style={{
                          display: "grid",
                          gridTemplateColumns: "2fr 1fr 220px",
                          gap: 10,
                          alignItems: "center",
                          padding: "10px 12px",
                          borderRadius: 12,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.04)",
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 900, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {title}
                          </div>
                          <div style={{ marginTop: 2, color: "rgba(248, 250, 252, 0.6)", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {doc.filename || doc.mimeType || "—"}
                          </div>
                        </div>
                        <div style={{ color: "rgba(248, 250, 252, 0.75)", fontSize: 12 }}>
                          {formatDateTime(doc.updatedAt || doc.createdAt)}
                        </div>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-start", flexWrap: "wrap" }}>
                          <button type="button" onClick={() => setSelected(doc)} style={buttonStyle()}>
                            <Eye size={16} /> View
                          </button>
                          <button type="button" onClick={() => openDownload(doc)} disabled={!doc.downloadUrl} style={{ ...buttonStyle("primary"), opacity: doc.downloadUrl ? 1 : 0.5 }}>
                            <FileDown size={16} /> Download
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {selected ? (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(2, 6, 23, 0.78)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
            zIndex: 2000,
            padding: 18,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 620,
              background: "#0b1a24",
              border: "1px solid rgba(255,255,255,0.14)",
              borderRadius: 16,
              padding: 18,
              display: "grid",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 900 }}>Document Details</div>
                <div style={{ marginTop: 6, color: "rgba(248, 250, 252, 0.65)", fontSize: 12 }}>
                  {String(selected.title || selected.filename || selected.id)}
                </div>
              </div>
              <button type="button" onClick={() => setSelected(null)} style={buttonStyle()}>
                Close
              </button>
            </div>

            <div style={{ display: "grid", gap: 8, fontSize: 13, color: "rgba(248, 250, 252, 0.85)" }}>
              <div><span style={{ color: "rgba(248, 250, 252, 0.6)" }}>Type:</span> {selected.documentType || "—"}</div>
              <div><span style={{ color: "rgba(248, 250, 252, 0.6)" }}>Filename:</span> {selected.filename || "—"}</div>
              <div><span style={{ color: "rgba(248, 250, 252, 0.6)" }}>MIME:</span> {selected.mimeType || "—"}</div>
              <div><span style={{ color: "rgba(248, 250, 252, 0.6)" }}>Updated:</span> {formatDateTime(selected.updatedAt || selected.createdAt)}</div>
            </div>

            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => openDownload(selected)} disabled={!selected.downloadUrl} style={{ ...buttonStyle("primary"), opacity: selected.downloadUrl ? 1 : 0.5 }}>
                <FileDown size={16} /> Download
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

