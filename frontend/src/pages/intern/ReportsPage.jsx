<<<<<<< HEAD
=======
//frontend/src/pages/intern/ReportsPage.jsx
>>>>>>> 0459e1788ddb5f149b97ab4468a9511b362ae99f
import { useState } from "react";

const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
};

export default function ReportsPreview() {
  const [activeTab, setActiveTab] = useState("tna");

  // Sample Google Docs/Sheets URLs - Replace with real ones
  const tnaSheetUrl = "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit?usp=sharing";
<<<<<<< HEAD
  const blueprintDocUrl = "https://docs.google.com/document/d/1234567890/edit?usp=sharing";
=======
  const blueprintDocUrl = "https://docs.google.com/document/d/1quncr9_h6VrzMM6lfslOosPCqBqI-cuK_sHgSLZCpZE/edit?usp=sharing";
>>>>>>> 0459e1788ddb5f149b97ab4468a9511b362ae99f

  return (
    <div style={{
      minHeight: "100vh",
      background: COLORS.inkBlack,
      padding: 24,
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ color: "white", fontSize: 28, fontWeight: 700, margin: 0 }}>
            Reports
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", marginTop: 8 }}>
            📄 Using Google Docs/Sheets - PM and HR see your updates in real-time
          </p>
        </div>

        {/* Sync Status */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          background: "rgba(74, 222, 128, 0.15)",
          borderRadius: 25,
          marginBottom: 24,
          border: "1px solid rgba(74, 222, 128, 0.3)",
        }}>
          <div style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "#4ade80",
            animation: "pulse 2s infinite",
          }} />
          <span style={{ color: "#4ade80", fontSize: 14, fontWeight: 500 }}>
            Live Sync with PM & HR Dashboard
          </span>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
          <button
            onClick={() => setActiveTab("tna")}
            style={{
              padding: "14px 28px",
              borderRadius: 12,
              border: "none",
              background: activeTab === "tna" 
                ? `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`
                : "rgba(255,255,255,0.08)",
              color: "white",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              transition: "all 0.2s",
            }}
          >
            📊 TNA Tracker
          </button>
          <button
            onClick={() => setActiveTab("blueprint")}
            style={{
              padding: "14px 28px",
              borderRadius: 12,
              border: "none",
              background: activeTab === "blueprint" 
                ? `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`
                : "rgba(255,255,255,0.08)",
              color: "white",
              fontWeight: 600,
              fontSize: 15,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              transition: "all 0.2s",
            }}
          >
            📋 Blueprint
          </button>
        </div>

        {/* TNA Tab Content */}
        {activeTab === "tna" && (
          <div>
            {/* Card */}
            <div style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
            }}>
              {/* Card Header */}
              <div style={{
                padding: 20,
                background: "rgba(255,255,255,0.05)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "#0F9D58",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                  }}>
                    📊
                  </div>
                  <div>
                    <div style={{ color: "white", fontWeight: 600, fontSize: 17 }}>
                      TNA Tracker - Weekly Timeline & Analysis
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>
                      Google Sheets • Shared with PM, HR
                    </div>
                  </div>
                </div>

                <a
                  href={tnaSheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 20px",
                    background: "#0F9D58",
                    borderRadius: 10,
                    color: "white",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  ✏️ Edit in Google Sheets
                </a>
              </div>

              {/* Preview Table */}
              <div style={{ padding: 20 }}>
                <div style={{ 
                  background: "rgba(0,0,0,0.3)",
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}>
                  {/* Table Header */}
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr 100px 1fr 100px 100px 1fr 1fr",
                    background: "rgba(255,255,255,0.08)",
                    padding: "14px 16px",
                    gap: 12,
                    borderBottom: "1px solid rgba(255,255,255,0.1)",
                    fontSize: 11,
                    fontWeight: 700,
                    color: "rgba(255,255,255,0.6)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}>
                    <div>Week</div>
                    <div>Task</div>
                    <div>Planned</div>
                    <div>Plan of Action</div>
                    <div>Executed</div>
                    <div>Status</div>
                    <div>Reason</div>
                    <div>Deliverable</div>
                  </div>

                  {/* Sample Rows */}
                  {[
                    { week: 1, task: "Finalizing chatbot flow", planned: "Jan 8", action: "Research patterns, document flows", executed: "Jan 8", status: "Completed", reason: "-", deliverable: "Flow document" },
                    { week: 1, task: "Preparing Q&A + menu", planned: "Jan 9", action: "Compile FAQ, design menu", executed: "Jan 9", status: "Completed", reason: "-", deliverable: "Q&A database" },
                    { week: 1, task: "Designing chatbot UI", planned: "Jan 10", action: "Create wireframes", executed: "Jan 11", status: "Completed", reason: "Extra iterations", deliverable: "React components" },
                    { week: 2, task: "Backend API setup", planned: "Jan 16", action: "Setup Express server", executed: "Jan 17", status: "Completed", reason: "Auth delay", deliverable: "API docs" },
                    { week: 2, task: "Frontend-backend integration", planned: "Jan 18", action: "Connect React to APIs", executed: "-", status: "In Progress", reason: "-", deliverable: "Integrated app" },
                    { week: 2, task: "Firebase setup", planned: "Jan 19", action: "Configure Firebase", executed: "-", status: "Pending", reason: "-", deliverable: "Firebase integration" },
                  ].map((row, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "80px 1fr 100px 1fr 100px 100px 1fr 1fr",
                        padding: "14px 16px",
                        gap: 12,
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        fontSize: 13,
                        color: "rgba(255,255,255,0.85)",
                        alignItems: "center",
                      }}
                    >
                      <div style={{ 
                        background: COLORS.deepOcean, 
                        padding: "4px 10px", 
                        borderRadius: 6,
                        fontWeight: 600,
                        textAlign: "center",
                        fontSize: 12,
                      }}>
                        W{row.week}
                      </div>
                      <div style={{ fontWeight: 500 }}>{row.task}</div>
                      <div style={{ color: "rgba(255,255,255,0.6)" }}>{row.planned}</div>
                      <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12 }}>{row.action}</div>
                      <div style={{ color: "rgba(255,255,255,0.6)" }}>{row.executed}</div>
                      <div>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: 20,
                          fontSize: 11,
                          fontWeight: 600,
                          background: row.status === "Completed" ? "rgba(74, 222, 128, 0.2)" 
                            : row.status === "In Progress" ? "rgba(245, 158, 11, 0.2)" 
                            : "rgba(103, 146, 137, 0.2)",
                          color: row.status === "Completed" ? "#4ade80" 
                            : row.status === "In Progress" ? "#f59e0b" 
                            : COLORS.jungleTeal,
                        }}>
                          {row.status}
                        </span>
                      </div>
                      <div style={{ color: row.reason !== "-" ? COLORS.peachGlow : "rgba(255,255,255,0.3)", fontSize: 12 }}>
                        {row.reason}
                      </div>
                      <div style={{ fontSize: 12 }}>{row.deliverable}</div>
                    </div>
                  ))}
                </div>

                <p style={{ 
                  color: "rgba(255,255,255,0.5)", 
                  fontSize: 13, 
                  marginTop: 16,
                  textAlign: "center",
                  fontStyle: "italic",
                }}>
                  👆 This is a preview. Click "Edit in Google Sheets" to update your actual TNA.
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div style={{
              marginTop: 20,
              padding: 20,
              background: "rgba(103, 146, 137, 0.15)",
              borderRadius: 14,
              border: `1px solid ${COLORS.jungleTeal}40`,
            }}>
              <div style={{ fontSize: 16, fontWeight: 600, color: COLORS.peachGlow, marginBottom: 12 }}>
                💡 How it works
              </div>
              <div style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.8 }}>
                • You update the Google Sheet → PM & HR see it instantly in their dashboard<br/>
                • No need to submit or send anything - it's always synced<br/>
                • PM/HR can add comments directly in the sheet<br/>
                • All changes are tracked with version history
              </div>
            </div>
          </div>
        )}

        {/* Blueprint Tab Content */}
        {activeTab === "blueprint" && (
          <div>
            <div style={{
              background: "rgba(255,255,255,0.05)",
              borderRadius: 20,
              overflow: "hidden",
              border: "1px solid rgba(255,255,255,0.1)",
            }}>
              {/* Header */}
              <div style={{
                padding: 20,
                background: "rgba(255,255,255,0.05)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    background: "#4285F4",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                  }}>
                    📋
                  </div>
                  <div>
                    <div style={{ color: "white", fontWeight: 600, fontSize: 17 }}>
                      Project Blueprint
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>
                      Google Docs • Shared with PM, HR
                    </div>
                  </div>
                </div>

                <a
                  href={blueprintDocUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "12px 20px",
                    background: "#4285F4",
                    borderRadius: 10,
                    color: "white",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  ✏️ Edit in Google Docs
                </a>
              </div>

              {/* Blueprint Preview */}
              <div style={{ padding: 24 }}>
                <div style={{ color: COLORS.jungleTeal, fontSize: 13, marginBottom: 8 }}>PROJ-2024-001</div>
                <h2 style={{ color: "white", fontSize: 26, fontWeight: 700, margin: 0 }}>
                  AI-Powered Customer Support Chatbot
                </h2>
                <p style={{ color: "rgba(255,255,255,0.5)", marginTop: 8 }}>
                  Start: Jan 1, 2024 • End: Mar 31, 2024
                </p>

                <div style={{ marginTop: 28 }}>
                  <h3 style={{ color: COLORS.peachGlow, fontSize: 15, marginBottom: 10 }}>Objective</h3>
                  <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}>
                    Build an intelligent chatbot to automate customer support queries and improve response time.
                  </p>
                </div>

                <div style={{ marginTop: 24 }}>
                  <h3 style={{ color: COLORS.peachGlow, fontSize: 15, marginBottom: 10 }}>Scope</h3>
                  <p style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1.7 }}>
                    Full-stack chatbot with React frontend, Node.js backend, Firebase database, and CRM integration.
                  </p>
                </div>

                <div style={{ marginTop: 24 }}>
                  <h3 style={{ color: COLORS.peachGlow, fontSize: 15, marginBottom: 12 }}>Tech Stack</h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    {["React 18", "Node.js", "Express.js", "Firebase", "OpenAI GPT-4"].map((tech, i) => (
                      <span key={i} style={{
                        padding: "8px 16px",
                        background: "rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        color: "white",
                        fontSize: 14,
                      }}>
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{ marginTop: 24 }}>
                  <h3 style={{ color: COLORS.peachGlow, fontSize: 15, marginBottom: 12 }}>Milestones</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[
                      { name: "UI/UX Design", date: "Jan 15", status: "Completed" },
                      { name: "Core Chatbot Logic", date: "Feb 1", status: "In Progress" },
                      { name: "Backend Integration", date: "Feb 15", status: "Pending" },
                      { name: "Testing & QA", date: "Mar 1", status: "Pending" },
                      { name: "Deployment", date: "Mar 15", status: "Pending" },
                    ].map((m, i) => (
                      <div key={i} style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "14px 18px",
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: 10,
                        borderLeft: `4px solid ${
                          m.status === "Completed" ? "#4ade80" 
                          : m.status === "In Progress" ? "#f59e0b" 
                          : COLORS.jungleTeal
                        }`,
                      }}>
                        <div>
                          <div style={{ color: "white", fontWeight: 500 }}>{m.name}</div>
                          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4 }}>{m.date}</div>
                        </div>
                        <span style={{
                          padding: "5px 12px",
                          borderRadius: 20,
                          fontSize: 12,
                          fontWeight: 600,
                          background: m.status === "Completed" ? "rgba(74, 222, 128, 0.2)" 
                            : m.status === "In Progress" ? "rgba(245, 158, 11, 0.2)" 
                            : "rgba(103, 146, 137, 0.2)",
                          color: m.status === "Completed" ? "#4ade80" 
                            : m.status === "In Progress" ? "#f59e0b" 
                            : COLORS.jungleTeal,
                        }}>
                          {m.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Note */}
        <div style={{
          marginTop: 32,
          padding: 20,
          background: "rgba(255,255,255,0.03)",
          borderRadius: 12,
          textAlign: "center",
        }}>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
            🔗 <strong>Setup:</strong> Create Google Sheet/Doc → Share with intern, PM, HR → Embed URL in dashboard
          </p>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}