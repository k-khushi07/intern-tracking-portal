import React, { useEffect, useMemo, useState } from "react";
import { announcementsApi, pmApi } from "../../lib/apiClient";
import { Bell, Plus, Trash2, Edit3, Pin, Users, Clock, CheckCircle2, FileText } from "lucide-react";

const COLORS = {
  bg: "#071e22",
  panel: "rgba(255,255,255,0.06)",
  border: "rgba(255,255,255,0.14)",
  text: "#ffe5d9",
  muted: "rgba(255,229,217,0.65)",
  accent: "#679289",
  accent2: "#1d7874",
  success: "#4ade80",
  warning: "#f59e0b",
  danger: "#ef4444",
};

function Stat({ icon, label, value }) {
  return (
    <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: COLORS.muted, fontSize: 12 }}>{label}</div>
        <div style={{ color: COLORS.accent }}>{icon}</div>
      </div>
      <div style={{ marginTop: 8, fontSize: 26, fontWeight: 800, color: COLORS.text }}>{value}</div>
    </div>
  );
}

function priorityColor(priority) {
  if (priority === "high") return COLORS.danger;
  if (priority === "medium") return COLORS.warning;
  return COLORS.accent;
}

function normalizeDepartmentLabel(value) {
  const raw = String(value || "").trim();
  if (!raw) return "All";
  const lowered = raw.toLowerCase();
  if (lowered === "sap") return "SAP";
  if (lowered === "oracle") return "Oracle";
  if (lowered === "accounts") return "Accounts";
  if (lowered === "hr") return "HR";
  if (lowered === "pm") return "PM";
  if (["all", "*", "any"].includes(lowered)) return "All";
  return raw;
}

export default function OverviewPage({ pm, interns = [], stats = null }) {
  const [announcements, setAnnouncements] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: "", content: "", priority: "medium", pinned: false, department: "all" });

  const pmAnnouncementIds = useMemo(() => {
    const myId = pm?.id ? String(pm.id) : "";
    const ids = new Set();
    (announcements || []).forEach((a) => {
      const creatorId = String(a?.created_by?.id || "");
      const creatorRole = String(a?.created_by?.role || "").toLowerCase();
      if (creatorRole === "pm" && myId && creatorId === myId) ids.add(String(a.id));
    });
    return ids;
  }, [announcements, pm?.id]);

  const myAnnouncements = useMemo(
    () => (announcements || []).filter((a) => pmAnnouncementIds.has(String(a.id))),
    [announcements, pmAnnouncementIds]
  );

  const hrAnnouncements = useMemo(
    () =>
      (announcements || []).filter((a) => {
        const role = String(a?.created_by?.role || "").toLowerCase();
        return role === "hr" || role === "admin";
      }),
    [announcements]
  );

  async function loadAnnouncements() {
    const res = await announcementsApi.list();
    setAnnouncements(res?.announcements || []);
  }

  useEffect(() => {
    loadAnnouncements().catch((err) => {
      setError(err?.message || "Failed to load announcements");
    });
  }, []);

  async function saveAnnouncement(event) {
    event.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError("Title and content are required.");
      return;
    }
    try {
      setSaving(true);
      setError("");
      if (editing?.id) {
        await pmApi.updateAnnouncement(editing.id, {
          title: form.title.trim(),
          content: form.content.trim(),
          priority: form.priority,
          pinned: !!form.pinned,
          audienceRoles: ["intern"],
          department: form.department === "all" ? null : form.department,
        });
      } else {
        await pmApi.createAnnouncement({
          title: form.title.trim(),
          content: form.content.trim(),
          priority: form.priority,
          pinned: !!form.pinned,
          audienceRoles: ["intern"],
          department: form.department === "all" ? null : form.department,
        });
      }
      await loadAnnouncements();
      setShowForm(false);
      setEditing(null);
      setForm({ title: "", content: "", priority: "medium", pinned: false, department: "all" });
    } catch (err) {
      setError(err?.message || "Failed to save announcement");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(announcement) {
    setEditing(announcement);
    setForm({
      title: announcement.title || "",
      content: announcement.content || "",
      priority: announcement.priority || "medium",
      pinned: !!announcement.pinned,
      department: announcement.department ? normalizeDepartmentLabel(announcement.department) : "all",
    });
    setShowForm(true);
  }

  async function removeAnnouncement(id) {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      setSaving(true);
      setError("");
      await pmApi.deleteAnnouncement(id);
      await loadAnnouncements();
    } catch (err) {
      setError(err?.message || "Failed to delete announcement");
    } finally {
      setSaving(false);
    }
  }

  async function togglePin(announcement) {
    try {
      setSaving(true);
      setError("");
      await pmApi.updateAnnouncement(announcement.id, {
        pinned: !announcement.pinned,
      });
      await loadAnnouncements();
    } catch (err) {
      setError(err?.message || "Failed to update announcement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div style={{ background: `linear-gradient(135deg, ${COLORS.accent2}, ${COLORS.accent})`, borderRadius: 16, padding: 20 }}>
        <div style={{ fontSize: 28, fontWeight: 900, color: "white" }}>Welcome, {pm?.fullName?.split(" ")[0] || "PM"}</div>
        <div style={{ marginTop: 6, color: "rgba(255,255,255,0.85)", fontSize: 14 }}>
          Manage announcements and monitor your interns from one place.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
        <Stat icon={<Users size={18} />} label="Active Interns" value={stats?.activeInterns ?? interns.filter((i) => i.status === "active").length} />
        <Stat icon={<Clock size={18} />} label="Total Hours" value={`${stats?.totalHours ?? 0}h`} />
        <Stat icon={<CheckCircle2 size={18} />} label="Tasks Completed" value={stats?.totalTasks ?? 0} />
        <Stat icon={<FileText size={18} />} label="Pending Reports" value={stats?.pendingReports ?? 0} />
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.45)", padding: 10, borderRadius: 10, color: "#fecaca", fontSize: 13 }}>
          {error}
        </div>
      )}

      <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text, display: "flex", gap: 8, alignItems: "center" }}>
            <Bell size={18} />
            PM Announcements (visible to assigned interns)
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setForm({ title: "", content: "", priority: "medium", pinned: false, department: "all" });
              setShowForm(true);
            }}
            style={btnStyle("primary")}
          >
            <Plus size={16} /> New
          </button>
        </div>

        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          {myAnnouncements.length === 0 && <div style={{ color: COLORS.muted, fontSize: 13 }}>No PM announcements yet.</div>}
          {myAnnouncements.map((a) => (
            <div key={a.id} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.text }}>{a.title}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: priorityColor(a.priority), fontWeight: 700, textTransform: "uppercase" }}>
                    {a.priority || "medium"} • {normalizeDepartmentLabel(a.department)} {a.pinned ? "• PINNED" : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button onClick={() => togglePin(a)} disabled={saving} style={btnStyle("ghost")} title="Pin/Unpin">
                    <Pin size={14} />
                  </button>
                  <button onClick={() => openEdit(a)} disabled={saving} style={btnStyle("ghost")} title="Edit">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => removeAnnouncement(a.id)} disabled={saving} style={btnStyle("danger")} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <div style={{ marginTop: 8, color: "rgba(255,229,217,0.85)", fontSize: 13, lineHeight: 1.5 }}>{a.content}</div>
              <div style={{ marginTop: 8, color: COLORS.muted, fontSize: 11 }}>{new Date(a.created_at || a.updated_at || Date.now()).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 16 }}>
        <div style={{ fontSize: 17, fontWeight: 800, color: COLORS.text }}>HR/Admin Announcements to PM</div>
        <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
          {hrAnnouncements.length === 0 && <div style={{ color: COLORS.muted, fontSize: 13 }}>No HR/Admin announcements.</div>}
          {hrAnnouncements.map((a) => (
            <div key={a.id} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.text }}>{a.title}</div>
              <div style={{ marginTop: 6, color: "rgba(255,229,217,0.85)", fontSize: 13 }}>{a.content}</div>
              <div style={{ marginTop: 8, color: COLORS.muted, fontSize: 11 }}>
                By {a?.created_by?.full_name || a?.created_by?.email || "HR"} • {new Date(a.created_at || Date.now()).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showForm && (
        <div
          onClick={() => !saving && setShowForm(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16 }}
        >
          <form
            onSubmit={saveAnnouncement}
            onClick={(e) => e.stopPropagation()}
            style={{ width: "min(560px,100%)", background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 16, display: "grid", gap: 10 }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.text }}>{editing ? "Edit Announcement" : "New Announcement"}</div>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Title" style={inputStyle} />
            <textarea value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} placeholder="Message" rows={5} style={{ ...inputStyle, resize: "vertical" }} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} style={inputStyle}>
                <option value="low" style={{ color: "black" }}>low</option>
                <option value="medium" style={{ color: "black" }}>medium</option>
                <option value="high" style={{ color: "black" }}>high</option>
              </select>
              <select value={form.department} onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))} style={inputStyle}>
                <option value="all" style={{ color: "black" }}>All</option>
                <option value="SAP" style={{ color: "black" }}>SAP</option>
                <option value="Oracle" style={{ color: "black" }}>Oracle</option>
                <option value="Accounts" style={{ color: "black" }}>Accounts</option>
              </select>
            </div>
            <div style={{ color: COLORS.muted, fontSize: 12 }}>
              Department is an optional filter for which of your assigned interns can see this.
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, color: COLORS.text, fontSize: 13 }}>
              <input type="checkbox" checked={form.pinned} onChange={(e) => setForm((f) => ({ ...f, pinned: e.target.checked }))} />
              Pin this announcement
            </label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button type="button" onClick={() => setShowForm(false)} disabled={saving} style={btnStyle("ghost")}>
                Cancel
              </button>
              <button type="submit" disabled={saving} style={btnStyle("primary")}>
                {saving ? "Saving..." : editing ? "Update" : "Create"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function btnStyle(type) {
  if (type === "primary") {
    return {
      border: "none",
      background: `linear-gradient(135deg, ${COLORS.accent2}, ${COLORS.accent})`,
      color: "white",
      padding: "9px 12px",
      borderRadius: 10,
      fontWeight: 700,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
    };
  }
  if (type === "danger") {
    return {
      border: "1px solid rgba(239,68,68,0.45)",
      background: "rgba(239,68,68,0.15)",
      color: "#fecaca",
      padding: "8px 10px",
      borderRadius: 10,
      cursor: "pointer",
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
    };
  }
  return {
    border: `1px solid ${COLORS.border}`,
    background: "rgba(255,255,255,0.05)",
    color: COLORS.text,
    padding: "8px 10px",
    borderRadius: 10,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
  };
}

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 10,
  border: `1px solid ${COLORS.border}`,
  background: "rgba(255,255,255,0.05)",
  color: "white",
  boxSizing: "border-box",
  outline: "none",
};
