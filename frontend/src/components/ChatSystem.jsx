import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, User, Award, UserCheck, Clock } from "lucide-react";

const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
};

export default function ChatSystem({ userRole, currentUser }) {
  const [activeChatType, setActiveChatType] = useState(null); // 'pm' | 'hr'
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [recipient, setRecipient] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (activeChatType) {
      loadMessages();
      loadRecipient();
    }
  }, [activeChatType, currentUser]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getChatId = () => {
    if (!currentUser || !activeChatType) return null;

    if (userRole === "intern") {
      if (activeChatType === "pm") {
        return `intern-pm-${currentUser.email}-${currentUser.pmCode}`;
      } else if (activeChatType === "hr") {
        return `intern-hr-${currentUser.email}`;
      }
    } else if (userRole === "pm") {
      // For PM, we need the intern's email from recipient
      if (recipient) {
        return `intern-pm-${recipient.email}-${currentUser.pmCode}`;
      }
    } else if (userRole === "hr") {
      // For HR, we need the intern's email from recipient
      if (recipient) {
        return `intern-hr-${recipient.email}`;
      }
    }
    return null;
  };

  const loadMessages = () => {
    const chatId = getChatId();
    if (!chatId) return;

    try {
      const allChats = JSON.parse(localStorage.getItem("chats") || "{}");
      const chatMessages = allChats[chatId] || [];
      setMessages(chatMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
      setMessages([]);
    }
  };

  const loadRecipient = () => {
    if (userRole === "intern") {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      
      if (activeChatType === "pm") {
        const pm = users.find((u) => u.role === "pm" && u.pmCode === currentUser?.pmCode);
        setRecipient(pm);
      } else if (activeChatType === "hr") {
        const hr = users.find((u) => u.role === "hr");
        setRecipient(hr || { fullName: "HR Team", email: "hr@company.com" });
      }
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;

    const chatId = getChatId();
    if (!chatId) return;

    const message = {
      id: Date.now(),
      text: newMessage.trim(),
      sender: currentUser.email,
      senderName: currentUser.fullName,
      senderRole: userRole,
      timestamp: new Date().toISOString(),
    };

    try {
      const allChats = JSON.parse(localStorage.getItem("chats") || "{}");
      const chatMessages = allChats[chatId] || [];
      chatMessages.push(message);
      allChats[chatId] = chatMessages;
      localStorage.setItem("chats", JSON.stringify(allChats));

      setMessages(chatMessages);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  // For Intern
  if (userRole === "intern") {
    if (!activeChatType) {
      return (
        <InternChatSelector
          onSelectPM={() => setActiveChatType("pm")}
          onSelectHR={() => setActiveChatType("hr")}
          pmCode={currentUser?.pmCode}
          isMobile={isMobile}
        />
      );
    }

    return (
      <ChatWindow
        messages={messages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        recipient={recipient}
        currentUser={currentUser}
        onBack={() => setActiveChatType(null)}
        chatType={activeChatType}
        isMobile={isMobile}
        messagesEndRef={messagesEndRef}
      />
    );
  }

  // For PM - shows list of assigned interns
  if (userRole === "pm") {
    if (!activeChatType) {
      return (
        <PMInternList
          currentUser={currentUser}
          onSelectIntern={(intern) => {
            setRecipient(intern);
            setActiveChatType("pm");
          }}
          isMobile={isMobile}
        />
      );
    }

    return (
      <ChatWindow
        messages={messages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        recipient={recipient}
        currentUser={currentUser}
        onBack={() => {
          setActiveChatType(null);
          setRecipient(null);
        }}
        chatType="pm"
        isMobile={isMobile}
        messagesEndRef={messagesEndRef}
      />
    );
  }

  // For HR - shows list of all interns
  if (userRole === "hr") {
    if (!activeChatType) {
      return (
        <HRInternList
          onSelectIntern={(intern) => {
            setRecipient(intern);
            setActiveChatType("hr");
          }}
          isMobile={isMobile}
        />
      );
    }

    return (
      <ChatWindow
        messages={messages}
        newMessage={newMessage}
        setNewMessage={setNewMessage}
        handleSendMessage={handleSendMessage}
        recipient={recipient}
        currentUser={currentUser}
        onBack={() => {
          setActiveChatType(null);
          setRecipient(null);
        }}
        chatType="hr"
        isMobile={isMobile}
        messagesEndRef={messagesEndRef}
      />
    );
  }

  return null;
}

// Intern Chat Selector
function InternChatSelector({ onSelectPM, onSelectHR, pmCode, isMobile }) {
  return (
    <div>
      <h2 style={{ fontSize: isMobile ? 20 : 26, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
        <MessageCircle size={28} /> Select Chat
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {pmCode && (
          <ChatOptionCard
            icon={<Award size={28} />}
            title="Chat with Your PM"
            subtitle="Private conversation with your Project Manager"
            color="#a78bfa"
            onClick={onSelectPM}
          />
        )}

        <ChatOptionCard
          icon={<UserCheck size={28} />}
          title="Chat with HR"
          subtitle="Private conversation with Human Resources"
          color={COLORS.peachGlow}
          onClick={onSelectHR}
        />
      </div>
    </div>
  );
}

function ChatOptionCard({ icon, title, subtitle, color, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.04)",
        padding: 24,
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        alignItems: "center",
        gap: 20,
        cursor: "pointer",
        transition: "all 0.3s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
        e.currentTarget.style.transform = "translateX(8px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
        e.currentTarget.style.transform = "translateX(0)";
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 16,
          background: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: COLORS.inkBlack,
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)" }}>{subtitle}</div>
      </div>
    </div>
  );
}

// PM Intern List
function PMInternList({ currentUser, onSelectIntern, isMobile }) {
  const [interns, setInterns] = useState([]);

  useEffect(() => {
    loadInterns();
  }, [currentUser]);

  const loadInterns = () => {
    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const assignedInterns = users.filter(
        (u) => u.role === "intern" && u.pmCode === currentUser?.pmCode && u.status === "active"
      );
      setInterns(assignedInterns);
    } catch (error) {
      console.error("Error loading interns:", error);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: isMobile ? 20 : 26, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
        <MessageCircle size={28} /> Select Intern to Chat
      </h2>

      {interns.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <User size={48} color="rgba(255,255,255,0.3)" style={{ marginBottom: 16 }} />
          <p style={{ color: "rgba(255,255,255,0.6)" }}>No active interns assigned to you yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {interns.map((intern, idx) => (
            <InternCard key={idx} intern={intern} onClick={() => onSelectIntern(intern)} />
          ))}
        </div>
      )}
    </div>
  );
}

// HR Intern List
function HRInternList({ onSelectIntern, isMobile }) {
  const [interns, setInterns] = useState([]);

  useEffect(() => {
    loadInterns();
  }, []);

  const loadInterns = () => {
    try {
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const allInterns = users.filter((u) => u.role === "intern" && u.status === "active");
      setInterns(allInterns);
    } catch (error) {
      console.error("Error loading interns:", error);
    }
  };

  return (
    <div>
      <h2 style={{ fontSize: isMobile ? 20 : 26, marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
        <MessageCircle size={28} /> Select Intern to Chat
      </h2>

      {interns.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40 }}>
          <User size={48} color="rgba(255,255,255,0.3)" style={{ marginBottom: 16 }} />
          <p style={{ color: "rgba(255,255,255,0.6)" }}>No active interns yet.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {interns.map((intern, idx) => (
            <InternCard key={idx} intern={intern} onClick={() => onSelectIntern(intern)} />
          ))}
        </div>
      )}
    </div>
  );
}

function InternCard({ intern, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "rgba(255,255,255,0.04)",
        padding: 16,
        borderRadius: 12,
        display: "flex",
        alignItems: "center",
        gap: 12,
        cursor: "pointer",
        transition: "all 0.2s",
        border: "1px solid rgba(255,255,255,0.08)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.08)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(255,255,255,0.04)";
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: 18,
        }}
      >
        {intern.fullName?.charAt(0) || "I"}
      </div>
      <div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{intern.fullName}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>{intern.email}</div>
      </div>
    </div>
  );
}

// Chat Window
function ChatWindow({
  messages,
  newMessage,
  setNewMessage,
  handleSendMessage,
  recipient,
  currentUser,
  onBack,
  chatType,
  isMobile,
  messagesEndRef,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: isMobile ? "70vh" : "600px" }}>
      {/* Chat Header */}
      <div
        style={{
          background: "rgba(255,255,255,0.08)",
          padding: 16,
          borderRadius: "12px 12px 0 0",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "white",
            padding: "8px 16px",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          ← Back
        </button>

        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: chatType === "pm" ? "#a78bfa" : COLORS.peachGlow,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            color: COLORS.inkBlack,
          }}
        >
          {recipient?.fullName?.charAt(0) || "?"}
        </div>

        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{recipient?.fullName || "Unknown"}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
            {chatType === "pm" ? "Project Manager" : "HR Team"}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          background: "rgba(0,0,0,0.2)",
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.5)" }}>
            <MessageCircle size={48} color="rgba(255,255,255,0.3)" style={{ marginBottom: 12 }} />
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={msg.sender === currentUser?.email}
              isMobile={isMobile}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          background: "rgba(255,255,255,0.08)",
          padding: 16,
          borderRadius: "0 0 12px 12px",
          display: "flex",
          gap: 8,
          borderTop: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage(e);
            }
          }}
          placeholder="Type your message..."
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: 999,
            border: "1px solid rgba(255,255,255,0.2)",
            background: "rgba(255,255,255,0.05)",
            color: "white",
            outline: "none",
            fontSize: 14,
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!newMessage.trim()}
          style={{
            padding: "12px 24px",
            borderRadius: 999,
            border: "none",
            background: newMessage.trim() ? "white" : "rgba(255,255,255,0.3)",
            color: COLORS.inkBlack,
            fontWeight: 700,
            cursor: newMessage.trim() ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
          }}
        >
          <Send size={16} /> Send
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ message, isOwn, isMobile }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isOwn ? "flex-end" : "flex-start",
        alignItems: "flex-end",
        gap: 8,
      }}
    >
      {!isOwn && (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {message.senderName?.charAt(0) || "?"}
        </div>
      )}

      <div
        style={{
          maxWidth: isMobile ? "75%" : "60%",
          background: isOwn ? "white" : "rgba(255,255,255,0.1)",
          color: isOwn ? COLORS.inkBlack : "white",
          padding: "10px 14px",
          borderRadius: isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          wordWrap: "break-word",
        }}
      >
        {!isOwn && (
          <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 4, opacity: 0.7 }}>
            {message.senderName}
          </div>
        )}
        <div style={{ fontSize: 14, lineHeight: 1.4 }}>{message.text}</div>
        <div
          style={{
            fontSize: 10,
            marginTop: 4,
            opacity: 0.6,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Clock size={10} />
          {new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>

      {isOwn && (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.peachGlow}, white)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 14,
            fontWeight: 700,
            color: COLORS.inkBlack,
            flexShrink: 0,
          }}
        >
          {message.senderName?.charAt(0) || "?"}
        </div>
      )}
    </div>
  );
}