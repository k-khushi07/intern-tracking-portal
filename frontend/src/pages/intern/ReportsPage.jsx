import React, { useEffect, useMemo, useState } from "react";
import { ExternalLink, FileSpreadsheet, FileText, Loader, Plus, RefreshCw, Save, Trash2 } from "lucide-react";
import { internApi } from "../../lib/apiClient";
import { getRealtimeSocket } from "../../lib/realtime";

const COLORS = {
  bg: "#020617",
  glass: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.12)",
  accent: "#14b8a6",
  accent2: "#0f766e",
  text: "#f8fafc",
  muted: "rgba(248, 250, 252, 0.6)",
  orange: "#f59e0b",
  red: "#ef4444",
};

const cardStyle = {
  background: COLORS.glass,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 16,
  padding: 16,
  backdropFilter: "blur(14px)",
};

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 12,
  border: `1px solid ${COLORS.border}`,
  background: "rgba(255,255,255,0.05)",
  color: "white",
  outline: "none",
  fontSize: 13,
};

function normalizeUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  return `https://${raw}`;
}

function tempId() {
  return `tmp_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "blocked", label: "Blocked" },
];

export default function ReportsPage({ isMobile = false }) {
  const [tab, setTab] = useState("tna");
  const [reportTab, setReportTab] = useState("weekly");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [links, setLinks] = useState({ tnaSheetUrl: "", blueprintDocUrl: "" });
  const [linksDirty, setLinksDirty] = useState(false);
  const [meta, setMeta] = useState({
    lastSyncedFromGoogleAt: null,
    lastSyncedToGoogleAt: null,
    lastSyncError: null,
  });
  const [syncing, setSyncing] = useState({
    tnaFrom: false,
    blueprintFrom: false,
  });

  const [items, setItems] = useState([]);
  const [tnaDirty, setTnaDirty] = useState(false);

  const [blueprint, setBlueprint] = useState({
    objective: "",
    scope: "",
    techStack: "",
    milestones: "",
    notes: "",
  });
  const [blueprintDirty, setBlueprintDirty] = useState(false);

  const hasUnsaved = linksDirty || tnaDirty || blueprintDirty;

  const stats = useMemo(() => {
    const completed = items.filter((i) => i.status === "completed").length;
    const blocked = items.filter((i) => i.status === "blocked").length;
    return { total: items.length, completed, blocked };
  }, [items]);

  const loadAll = async () => {
    setLoading(true);
    setError("");
    try {
      const [tnaRes, blueprintRes, linksRes] = await Promise.all([
        internApi.tna(),
        internApi.blueprint(),
        internApi.reportLinks(),
      ]);

      setItems(
        (tnaRes?.items || []).map((r) => ({
          id: r.id,
          weekNumber: r.week_number ?? "",
          task: r.task ?? "",
          plannedDate: r.planned_date ?? "",
          executedDate: r.executed_date ?? "",
          status: r.status ?? "pending",
          deliverable: r.deliverable ?? "",
          sortOrder: r.sort_order ?? 0,
          __dirty: false,
          __isNew: false,
        }))
      );

      const bp = blueprintRes?.blueprint?.data || {};
      setBlueprint({
        objective: bp.objective || "",
        scope: bp.scope || "",
        techStack: Array.isArray(bp.techStack) ? bp.techStack.join(", ") : bp.techStack || "",
        milestones: Array.isArray(bp.milestones)
          ? bp.milestones.map((m) => m?.name || "").filter(Boolean).join("\n")
          : bp.milestones || "",
        notes: bp.notes || "",
      });

      setLinks({
        tnaSheetUrl: linksRes?.links?.tnaSheetUrl || "",
        blueprintDocUrl: linksRes?.links?.blueprintDocUrl || "",
      });
      setMeta({
        lastSyncedFromGoogleAt: linksRes?.meta?.lastSyncedFromGoogleAt || null,
        lastSyncedToGoogleAt: linksRes?.meta?.lastSyncedToGoogleAt || null,
        lastSyncError: linksRes?.meta?.lastSyncError || null,
      });

      setLinksDirty(false);
      setTnaDirty(false);
      setBlueprintDirty(false);
    } catch (e) {
      if (e?.status === 403 || String(e?.message || "").includes("Forbidden")) {
        setError("Session error — please log out and log back in as intern.");
      } else {
        setError(e?.message || "Failed to load reports");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    const socket = getRealtimeSocket();
    const onChanged = (payload) => {
      const entity = payload?.entity;
      if (!entity) return;
      if (!["tna", "blueprint", "report_links"].includes(entity)) return;
      if (hasUnsaved) return;
      loadAll();
    };
    socket.on("itp:changed", onChanged);
    return () => socket.off("itp:changed", onChanged);
  }, [hasUnsaved]);

  const buttonStyle = (enabled) => ({
    padding: "10px 12px",
    borderRadius: 12,
    border: enabled ? "none" : `1px solid ${COLORS.border}`,
    background: enabled ? `linear-gradient(135deg, ${COLORS.accent2}, ${COLORS.accent})` : "rgba(255,255,255,0.06)",
    color: "white",
    cursor: enabled && !saving ? "pointer" : "default",
    fontWeight: 800,
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 8,
    opacity: saving ? 0.75 : 1,
  });

  const formatTs = (ts) => {
    if (!ts) return "Never";
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return String(ts);
    return d.toLocaleString();
  };

  const syncTnaFromGoogle = async () => {
    if (hasUnsaved) {
      alert("Save or discard your changes before syncing from Google.");
      return;
    }
    if (!String(links.tnaSheetUrl || "").trim()) {
      alert("Paste and save a TNA Google Sheet URL first.");
      return;
    }
    setSyncing((s) => ({ ...s, tnaFrom: true }));
    try {
      await internApi.syncTnaFromGoogle();
      await loadAll();
    } catch (e) {
      alert(e?.message || "Failed to sync from Google");
      await loadAll().catch(() => { });
    } finally {
      setSyncing((s) => ({ ...s, tnaFrom: false }));
    }
  };


  const syncBlueprintFromGoogle = async () => {
    if (hasUnsaved) {
      alert("Save or discard your changes before syncing from Google.");
      return;
    }
    if (!String(links.blueprintDocUrl || "").trim()) {
      alert("Paste and save a Blueprint Google Doc URL first.");
      return;
    }
    setSyncing((s) => ({ ...s, blueprintFrom: true }));
    try {
      await internApi.syncBlueprintFromGoogle();
      await loadAll();
    } catch (e) {
      alert(e?.message || "Failed to sync from Google");
      await loadAll().catch(() => { });
    } finally {
      setSyncing((s) => ({ ...s, blueprintFrom: false }));
    }
  };


  const addRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: tempId(),
        weekNumber: "",
        task: "",
        plannedDate: "",
        executedDate: "",
        status: "pending",
        deliverable: "",
        sortOrder: (prev.reduce((m, r) => Math.max(m, Number(r.sortOrder) || 0), 0) || 0) + 1,
        __dirty: true,
        __isNew: true,
      },
    ]);
    setTnaDirty(true);
  };

  const updateRow = (id, field, value) => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value, __dirty: true } : r)));
    setTnaDirty(true);
  };

  const deleteRow = async (row) => {
    if (row.__isNew) {
      setItems((prev) => prev.filter((r) => r.id !== row.id));
      return;
    }
    if (!window.confirm("Delete this row?")) return;
    setSaving(true);
    try {
      await internApi.deleteTnaItem(row.id);
      setItems((prev) => prev.filter((r) => r.id !== row.id));
    } catch (e) {
      alert(e?.message || "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  const saveTna = async () => {
    const invalid = items.some((r) => (r.__dirty || r.__isNew) && !String(r.task || "").trim());
    if (invalid) {
      alert("Fill Task for all changed/new rows before saving.");
      return;
    }
    setSaving(true);
    try {
      const next = [];
      for (const r of items) {
        if (!r.__dirty && !r.__isNew) {
          next.push(r);
          continue;
        }
        const payload = {
          weekNumber: r.weekNumber === "" ? null : r.weekNumber,
          task: r.task,
          plannedDate: r.plannedDate || null,
          executedDate: r.executedDate || null,
          status: r.status,
          deliverable: r.deliverable || null,
          sortOrder: Number.isFinite(Number(r.sortOrder)) ? Number(r.sortOrder) : 0,
        };
        if (r.__isNew) {
          const created = await internApi.createTnaItem(payload);
          const saved = created?.item || created;
          next.push({ ...r, id: saved.id, __dirty: false, __isNew: false });
        } else {
          await internApi.updateTnaItem(r.id, payload);
          next.push({ ...r, __dirty: false });
        }
      }
      setItems(next);
      setTnaDirty(false);
    } catch (e) {
      alert(e?.message || "Failed to save TNA");
    } finally {
      setSaving(false);
    }
  };

  const saveLinks = async () => {
    setSaving(true);
    try {
      await internApi.updateReportLinks({
        tnaSheetUrl: normalizeUrl(links.tnaSheetUrl),
        blueprintDocUrl: normalizeUrl(links.blueprintDocUrl),
      });
      setLinksDirty(false);
    } catch (e) {
      alert(e?.message || "Failed to save links");
    } finally {
      setSaving(false);
    }
  };

  const saveBlueprint = async () => {
    setSaving(true);
    try {
      const techStack = String(blueprint.techStack || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const milestones = String(blueprint.milestones || "")
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((name) => ({ name, status: "Pending" }));
      await internApi.updateBlueprint({
        objective: blueprint.objective || "",
        scope: blueprint.scope || "",
        techStack,
        milestones,
        notes: blueprint.notes || "",
      });
      setBlueprintDirty(false);
    } catch (e) {
      alert(e?.message || "Failed to save blueprint");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, padding: 24, fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", color: "white" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 28, fontWeight: 900 }}>Reports</div>
            <div style={{ marginTop: 8, color: COLORS.muted, fontSize: 13 }}>
              Structured TNA + Blueprint saved to the portal. PM & HR can view in real-time.
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {hasUnsaved && <div style={{ color: COLORS.orange, fontWeight: 900, fontSize: 12 }}>Unsaved changes</div>}
            <button
              onClick={loadAll}
              disabled={loading || saving}
              style={{
                padding: "10px 12px",
                borderRadius: 12,
                border: `1px solid ${COLORS.border}`,
                background: "rgba(255,255,255,0.06)",
                color: "white",
                cursor: loading || saving ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontWeight: 800,
                fontSize: 13,
                opacity: loading || saving ? 0.7 : 1,
              }}
              title="Refresh"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>

        <div style={{ marginTop: 18, ...cardStyle }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 10 }}>
              <ExternalLink size={18} color={COLORS.accent} /> Optional external links
            </div>
            <button onClick={saveLinks} disabled={!linksDirty || saving} style={buttonStyle(linksDirty)}>
              {saving ? <Loader size={16} /> : <Save size={16} />}
              Save links
            </button>
          </div>
          <div style={{ marginTop: 10, color: COLORS.muted, fontSize: 12, display: "flex", flexWrap: "wrap", gap: 14 }}>
            <div>Last sync from Google: {formatTs(meta.lastSyncedFromGoogleAt)}</div>
            <div>Last sync to Google: {formatTs(meta.lastSyncedToGoogleAt)}</div>
          </div>
          {meta.lastSyncError && (
            <div style={{ marginTop: 10, padding: 10, borderRadius: 12, border: `1px solid ${COLORS.orange}40`, background: `${COLORS.orange}10`, color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
              <div style={{ fontWeight: 900, marginBottom: 4 }}>Last sync error</div>
              <div style={{ color: "rgba(255,255,255,0.75)" }}>{meta.lastSyncError}</div>
            </div>
          )}

          <div style={{ marginTop: 12, padding: 12, borderRadius: 14, border: `1px dashed ${COLORS.border}`, background: "rgba(255,255,255,0.03)" }}>
            <div style={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 10 }}>
              <FileSpreadsheet size={16} color={COLORS.accent} /> Templates (recommended)
            </div>
            <div style={{ marginTop: 6, color: COLORS.muted, fontSize: 12, lineHeight: 1.5 }}>
              Use these templates to create your Google Sheet / Google Doc. Keep the header row and headings exactly the same so “Sync from Google” works.
            </div>
            <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a
                href="/templates/tna_tracker_template.csv"
                download
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  textDecoration: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 900,
                  fontSize: 12,
                }}
                title="Download the TNA Google Sheet template (CSV)"
              >
                <FileSpreadsheet size={16} />
                Download TNA sheet template
              </a>
              <a
                href="/templates/project_blueprint_template.txt"
                download
                style={{
                  padding: "10px 12px",
                  borderRadius: 12,
                  border: `1px solid ${COLORS.border}`,
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  textDecoration: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontWeight: 900,
                  fontSize: 12,
                }}
                title="Download the Blueprint Google Doc template (text)"
              >
                <FileText size={16} />
                Download Blueprint doc template
              </a>
            </div>
            <div style={{ marginTop: 8, color: COLORS.muted, fontSize: 12, lineHeight: 1.5 }}>
              Tip: Make sure your Google Sheet/Doc is public (Share → “Anyone with the link” → Viewer) or File → Share → Publish to web.
            </div>
          </div>
          <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ color: COLORS.muted, fontSize: 12, marginBottom: 6 }}>TNA Google Sheet URL</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={links.tnaSheetUrl}
                  onChange={(e) => {
                    setLinks((l) => ({ ...l, tnaSheetUrl: e.target.value }));
                    setLinksDirty(true);
                  }}
                  placeholder="https://docs.google.com/spreadsheets/..."
                  style={inputStyle}
                />
                <button
                  onClick={() => {
                    const url = normalizeUrl(links.tnaSheetUrl);
                    if (url) window.open(url, "_blank", "noopener,noreferrer");
                  }}
                  disabled={!String(links.tnaSheetUrl || "").trim()}
                  style={{ padding: "10px 12px", borderRadius: 12, border: `1px solid ${COLORS.border}`, background: "rgba(255,255,255,0.06)", cursor: "pointer", color: "white" }}
                  title="Open"
                >
                  <FileSpreadsheet size={16} />
                </button>
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={syncTnaFromGoogle}
                  disabled={syncing.tnaFrom || saving || loading || hasUnsaved || !String(links.tnaSheetUrl || "").trim()}
                  style={{ ...buttonStyle(true), background: "rgba(255,255,255,0.06)", border: `1px solid ${COLORS.border}` }}
                  title="Pull rows from Google Sheets into the portal"
                >
                  {syncing.tnaFrom ? <Loader size={16} /> : <RefreshCw size={16} />}
                  Sync from Google
                </button>
                <div style={{ alignSelf: "center", color: COLORS.muted, fontSize: 12 }}>
                  Sync to Google requires credentials (service account). This portal supports read-only sync from public links.
                </div>
              </div>
            </div>
            <div>
              <div style={{ color: COLORS.muted, fontSize: 12, marginBottom: 6 }}>Blueprint Google Doc URL</div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  value={links.blueprintDocUrl}
                  onChange={(e) => {
                    setLinks((l) => ({ ...l, blueprintDocUrl: e.target.value }));
                    setLinksDirty(true);
                  }}
                  placeholder="https://docs.google.com/document/..."
                  style={inputStyle}
                />
                <button
                  onClick={() => {
                    const url = normalizeUrl(links.blueprintDocUrl);
                    if (url) window.open(url, "_blank", "noopener,noreferrer");
                  }}
                  disabled={!String(links.blueprintDocUrl || "").trim()}
                  style={{ padding: "10px 12px", borderRadius: 12, border: `1px solid ${COLORS.border}`, background: "rgba(255,255,255,0.06)", cursor: "pointer", color: "white" }}
                  title="Open"
                >
                  <FileText size={16} />
                </button>
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={syncBlueprintFromGoogle}
                  disabled={syncing.blueprintFrom || saving || loading || hasUnsaved || !String(links.blueprintDocUrl || "").trim()}
                  style={{ ...buttonStyle(true), background: "rgba(255,255,255,0.06)", border: `1px solid ${COLORS.border}` }}
                  title="Pull blueprint from Google Docs into the portal"
                >
                  {syncing.blueprintFrom ? <Loader size={16} /> : <RefreshCw size={16} />}
                  Sync from Google
                </button>
                <div style={{ alignSelf: "center", color: COLORS.muted, fontSize: 12 }}>
                  Sync to Google requires credentials (service account). This portal supports read-only sync from public links.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
          {["tna", "blueprint"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                border: `1px solid ${COLORS.border}`,
                background: tab === t ? `linear-gradient(135deg, ${COLORS.accent2}, ${COLORS.accent})` : "rgba(255,255,255,0.06)",
                color: "white",
                cursor: "pointer",
                fontWeight: 900,
                fontSize: 13,
              }}
            >
              {t === "tna" ? "TNA Tracker" : "Blueprint"}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ marginTop: 16, ...cardStyle, color: COLORS.muted, display: "flex", alignItems: "center", gap: 10 }}>
            <Loader size={18} /> Loading...
          </div>
        )}
        {!loading && error && (
          <div style={{ marginTop: 16, ...cardStyle, borderLeft: `4px solid ${COLORS.red}` }}>
            <div style={{ fontWeight: 900 }}>Could not load reports</div>
            <div style={{ marginTop: 8, color: COLORS.muted, fontSize: 13 }}>{error}</div>
            <div style={{ marginTop: 10, color: COLORS.muted, fontSize: 12 }}>
              If this says tables not found, run Supabase migration <code>006_add_tna_blueprint_links.sql</code>.
            </div>
          </div>
        )}

        {!loading && !error && tab === "tna" && (
          <div style={{ marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {[
                  { label: "Total", value: stats.total },
                  { label: "Completed", value: stats.completed },
                  { label: "Blocked", value: stats.blocked },
                ].map((s) => (
                  <div key={s.label} style={{ ...cardStyle, padding: 12, minWidth: 110 }}>
                    <div style={{ color: "white", fontWeight: 900, fontSize: 18 }}>{s.value}</div>
                    <div style={{ color: COLORS.muted, fontSize: 11, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  onClick={addRow}
                  style={{ ...buttonStyle(true), background: "rgba(255,255,255,0.06)", border: `1px solid ${COLORS.border}` }}
                >
                  <Plus size={16} /> Add row
                </button>
                <button onClick={saveTna} disabled={!tnaDirty || saving} style={buttonStyle(tnaDirty)}>
                  {saving ? <Loader size={16} /> : <Save size={16} />}
                  Save TNA
                </button>
              </div>
            </div>

            <div style={{ marginTop: 14, ...cardStyle, padding: 0, overflow: "hidden" }}>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead style={{ background: "rgba(255,255,255,0.04)" }}>
                    <tr>
                      {["Week", "Task", "Planned", "Executed", "Status", "Deliverable", ""].map((h) => (
                        <th
                          key={h}
                          style={{ textAlign: "left", padding: 12, color: COLORS.muted, fontWeight: 900, borderBottom: `1px solid ${COLORS.border}`, whiteSpace: "nowrap" }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ padding: 16, color: COLORS.muted }}>
                          No rows yet. Click Add row.
                        </td>
                      </tr>
                    )}
                    {items.map((row) => (
                      <tr key={row.id}>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          <input value={row.weekNumber} onChange={(e) => updateRow(row.id, "weekNumber", e.target.value)} style={{ ...inputStyle, width: 80 }} />
                        </td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,0.06)", minWidth: 220 }}>
                          <input value={row.task} onChange={(e) => updateRow(row.id, "task", e.target.value)} style={{ ...inputStyle, minWidth: 220 }} />
                        </td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          <input type="date" value={row.plannedDate} onChange={(e) => updateRow(row.id, "plannedDate", e.target.value)} style={{ ...inputStyle, width: 150 }} />
                        </td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          <input type="date" value={row.executedDate} onChange={(e) => updateRow(row.id, "executedDate", e.target.value)} style={{ ...inputStyle, width: 150 }} />
                        </td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          <select value={row.status} onChange={(e) => updateRow(row.id, "status", e.target.value)} style={{ ...inputStyle, width: 150 }}>
                            {STATUS_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value} style={{ color: "black" }}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,0.06)", minWidth: 220 }}>
                          <input value={row.deliverable} onChange={(e) => updateRow(row.id, "deliverable", e.target.value)} placeholder="Link or text" style={{ ...inputStyle, minWidth: 220 }} />
                        </td>
                        <td style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                          <button
                            onClick={() => deleteRow(row)}
                            disabled={saving}
                            style={{ padding: "10px 10px", borderRadius: 12, border: `1px solid ${COLORS.border}`, background: "rgba(255,255,255,0.06)", cursor: "pointer" }}
                            title="Delete"
                          >
                            <Trash2 size={16} color={COLORS.red} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && tab === "blueprint" && (
          <div style={{ marginTop: 16, ...cardStyle }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ fontWeight: 900 }}>Project Blueprint</div>
              <button onClick={saveBlueprint} disabled={!blueprintDirty || saving} style={buttonStyle(blueprintDirty)}>
                {saving ? <Loader size={16} /> : <Save size={16} />}
                Save blueprint
              </button>
            </div>

            <div style={{ marginTop: 12, display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
              <div>
                <div style={{ color: COLORS.muted, fontSize: 12, marginBottom: 6 }}>Objective</div>
                <textarea
                  value={blueprint.objective}
                  onChange={(e) => {
                    setBlueprint((b) => ({ ...b, objective: e.target.value }));
                    setBlueprintDirty(true);
                  }}
                  style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
                />
              </div>
              <div>
                <div style={{ color: COLORS.muted, fontSize: 12, marginBottom: 6 }}>Scope</div>
                <textarea
                  value={blueprint.scope}
                  onChange={(e) => {
                    setBlueprint((b) => ({ ...b, scope: e.target.value }));
                    setBlueprintDirty(true);
                  }}
                  style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
                />
              </div>
              <div style={{ gridColumn: isMobile ? "auto" : "1 / span 2" }}>
                <div style={{ color: COLORS.muted, fontSize: 12, marginBottom: 6 }}>Tech stack (comma-separated)</div>
                <input
                  value={blueprint.techStack}
                  onChange={(e) => {
                    setBlueprint((b) => ({ ...b, techStack: e.target.value }));
                    setBlueprintDirty(true);
                  }}
                  style={inputStyle}
                />
              </div>
              <div style={{ gridColumn: isMobile ? "auto" : "1 / span 2" }}>
                <div style={{ color: COLORS.muted, fontSize: 12, marginBottom: 6 }}>Milestones (one per line)</div>
                <textarea
                  value={blueprint.milestones}
                  onChange={(e) => {
                    setBlueprint((b) => ({ ...b, milestones: e.target.value }));
                    setBlueprintDirty(true);
                  }}
                  style={{ ...inputStyle, minHeight: 110, resize: "vertical" }}
                />
              </div>
              <div style={{ gridColumn: isMobile ? "auto" : "1 / span 2" }}>
                <div style={{ color: COLORS.muted, fontSize: 12, marginBottom: 6 }}>Notes</div>
                <textarea
                  value={blueprint.notes}
                  onChange={(e) => {
                    setBlueprint((b) => ({ ...b, notes: e.target.value }));
                    setBlueprintDirty(true);
                  }}
                  style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
