import React, { useState } from "react";
import {
  Users,
  Search,
  X,
  ChevronRight,
  Mail,
  Phone,
  User,
} from "lucide-react";

const COLORS = {
  jungleTeal: "#679289",
  deepOcean: "#1d7874",
  success: "#4ade80",
  warning: "#f59e0b",
};

export default function MyInternsPage({ interns, isMobile }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedIntern, setSelectedIntern] = useState(null);

  const [showChat, setShowChat] = useState(false);
  const [activeChatIntern, setActiveChatIntern] = useState(null);

  const filteredInterns = interns.filter((intern) => {
    const matchesSearch =
      intern.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      intern.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === "all" || intern.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>
      <h2 style={{ color: "white", fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
        My Interns ({filteredInterns.length})
      </h2>

      <div className="glass" style={{ padding: 16, borderRadius: 14, marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            gap: 12,
          }}
        >
          <div style={{ position: "relative", flex: 1 }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                opacity: 0.5,
              }}
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email"
              style={{
                width: "100%",
                padding: "12px 16px 12px 44px",
                borderRadius: 10,
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "white",
                outline: "none",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "white",
              outline: "none",
            }}
          >
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {filteredInterns.length === 0 ? (
        <div className="glass" style={{ padding: 40, borderRadius: 16, textAlign: "center" }}>
          <Users size={40} opacity={0.5} />
          <p style={{ marginTop: 12, color: "rgba(255,255,255,0.6)" }}>
            No interns found
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredInterns.map((intern) => (
            <InternRow
              key={intern.id}
              intern={intern}
              onClick={() => setSelectedIntern(intern)}
            />
          ))}
        </div>
      )}

      {selectedIntern && (
        <InternDetailModal
          intern={selectedIntern}
          onClose={() => setSelectedIntern(null)}
          onSendMessage={(intern) => {
            setActiveChatIntern(intern);
            setShowChat(true);
          }}
        />
      )}

      {showChat && activeChatIntern && (
        <ChatSidebar
          intern={activeChatIntern}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
}

function InternRow({ intern, onClick }) {
  return (
    <div
      className="glass"
      onClick={onClick}
      style={{
        padding: 16,
        borderRadius: 14,
        display: "flex",
        alignItems: "center",
        gap: 16,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontWeight: 700,
          fontSize: 18,
        }}
      >
        {intern.fullName.charAt(0)}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ color: "white", fontWeight: 600 }}>{intern.fullName}</div>
        <div style={{ fontSize: 13, opacity: 0.6 }}>{intern.email}</div>
      </div>

      <div
        style={{
          fontSize: 12,
          padding: "6px 12px",
          borderRadius: 20,
          textTransform: "capitalize",
          background:
            intern.status === "active"
              ? "rgba(74,222,128,0.15)"
              : "rgba(245,158,11,0.15)",
          color:
            intern.status === "active" ? COLORS.success : COLORS.warning,
        }}
      >
        {intern.status}
      </div>

      <ChevronRight size={18} opacity={0.4} />
    </div>
  );
}

function InternDetailModal({ intern, onClose, onSendMessage }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass"
        style={{
          width: "100%",
          maxWidth: 560,
          borderRadius: 20,
          padding: 28,
        }}
      >
        <h2 style={{ color: "white", marginBottom: 16 }}>{intern.fullName}</h2>

        <ProfileRow label="Status" value={intern.status} />
        <ProfileRow label="Email" value={intern.email} icon={<Mail size={16} />} />
        <ProfileRow label="Phone" value={intern.phone || "N/A"} icon={<Phone size={16} />} />
        <ProfileRow label="Degree" value={intern.degree || "N/A"} icon={<User size={16} />} />
        <ProfileRow label="Hours Logged" value={`${intern.hoursLogged || 0}h`} />
        <ProfileRow label="Tasks Completed" value={intern.tasksCompleted || 0} />
        <ProfileRow label="PM Code" value={intern.pmCode || "N/A"} />

        <button
          onClick={() => onSendMessage(intern)}
          style={{
            width: "100%",
            marginTop: 24,
            padding: 14,
            borderRadius: 12,
            border: "none",
            background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
            color: "white",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Send Message
        </button>

        <button
          onClick={onClose}
          style={{
            width: "100%",
            marginTop: 10,
            padding: 12,
            borderRadius: 12,
            background: "rgba(255,255,255,0.05)",
            border: "none",
            color: "white",
            cursor: "pointer",
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

function ProfileRow({ label, value, icon }) {
  return (
    <div
      style={{
        padding: 14,
        borderRadius: 12,
        background: "rgba(255,255,255,0.04)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        marginBottom: 10,
      }}
    >
      {icon}
      <div>
        <div style={{ fontSize: 12, opacity: 0.6 }}>{label}</div>
        <div style={{ color: "white", fontWeight: 500 }}>{value}</div>
      </div>
    </div>
  );
}

function ChatSidebar({ intern, onClose }) {
  const [messages, setMessages] = useState([
    { from: "intern", text: "Hello" },
    { from: "pm", text: "Hi, how is the work going" },
  ]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { from: "pm", text: input }]);
    setInput("");
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        width: 380,
        background: "#071e22",
        borderLeft: "1px solid rgba(255,255,255,0.1)",
        zIndex: 3000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: 16,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ color: "white", fontWeight: 600 }}>
          {intern.fullName}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "white",
            cursor: "pointer",
          }}
        >
          <X size={18} />
        </button>
      </div>

      <div
        style={{
          flex: 1,
          padding: 16,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: msg.from === "pm" ? "flex-end" : "flex-start",
              background:
                msg.from === "pm"
                  ? COLORS.deepOcean
                  : "rgba(255,255,255,0.08)",
              color: "white",
              padding: "10px 14px",
              borderRadius: 14,
              maxWidth: "80%",
            }}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div
        style={{
          padding: 14,
          borderTop: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          gap: 8,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message"
          style={{
            flex: 1,
            padding: 10,
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "rgba(255,255,255,0.05)",
            color: "white",
            outline: "none",
          }}
        />
        <button
          onClick={sendMessage}
          style={{
            padding: "10px 16px",
            borderRadius: 10,
            background: COLORS.deepOcean,
            color: "white",
            border: "none",
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
