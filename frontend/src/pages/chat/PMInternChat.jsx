import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, Send, User, ArrowLeft, Search, Circle } from "lucide-react";

const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
};

export default function PMInternChat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 768);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    loadCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadContacts();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedContact) {
      loadMessages();
    }
  }, [selectedContact]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadCurrentUser = () => {
    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
      setCurrentUser(user);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const loadContacts = () => {
    try {
      const allUsers = JSON.parse(localStorage.getItem("users") || "[]");
      let contactList = [];

      if (currentUser.role === "pm") {
        // PM sees their assigned interns
        contactList = allUsers.filter(
          (u) => u.role === "intern" && u.pmCode === currentUser.pmCode && !u.disabled
        );
      } else if (currentUser.role === "intern") {
        // Intern sees their assigned PM
        contactList = allUsers.filter(
          (u) => u.role === "pm" && u.pmCode === currentUser.pmCode
        );
      }

      setContacts(contactList);
    } catch (error) {
      console.error("Error loading contacts:", error);
      setContacts([]);
    }
  };

  const loadMessages = () => {
    try {
      const chatId = getChatId(currentUser.email, selectedContact.email);
      const allChats = JSON.parse(localStorage.getItem("chats") || "{}");
      const chatMessages = allChats[chatId] || [];
      setMessages(chatMessages);
    } catch (error) {
      console.error("Error loading messages:", error);
      setMessages([]);
    }
  };

  const getChatId = (email1, email2) => {
    // Create consistent chat ID regardless of who initiates
    return [email1, email2].sort().join("_");
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedContact) return;

    const message = {
      id: Date.now(),
      sender: currentUser.email,
      receiver: selectedContact.email,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    try {
      const chatId = getChatId(currentUser.email, selectedContact.email);
      const allChats = JSON.parse(localStorage.getItem("chats") || "{}");
      
      if (!allChats[chatId]) {
        allChats[chatId] = [];
      }
      
      allChats[chatId].push(message);
      localStorage.setItem("chats", JSON.stringify(allChats));
      
      setMessages([...messages, message]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const filteredContacts = contacts.filter(
    (contact) =>
      contact.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUnreadCount = (contact) => {
    try {
      const chatId = getChatId(currentUser.email, contact.email);
      const allChats = JSON.parse(localStorage.getItem("chats") || "{}");
      const chatMessages = allChats[chatId] || [];
      return chatMessages.filter((m) => m.receiver === currentUser.email && !m.read).length;
    } catch {
      return 0;
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
      {/* Animated background */}
      <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
        <div
          style={{
            position: "absolute",
            top: "40%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 600,
            height: 600,
            borderRadius: "50%",
            background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
            opacity: 0.25,
            filter: "blur(100px)",
            animation: "pulse 4s ease-in-out infinite",
          }}
        />
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.25; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 0.4; transform: translate(-50%, -50%) scale(1.05); }
        }
        .message-input:focus {
          outline: none;
          border-color: ${COLORS.peachGlow};
        }
      `}</style>

      <div style={{ position: "relative", zIndex: 10, maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <MessageCircle size={isMobile ? 28 : 36} color={COLORS.peachGlow} />
            <h1 style={{ fontSize: isMobile ? 24 : 36, margin: 0, fontWeight: 800 }}>
              Messages
            </h1>
          </div>
          <p style={{ color: "rgba(255,255,255,0.75)", fontSize: isMobile ? 13 : 15 }}>
            Private conversations with your {currentUser?.role === "pm" ? "assigned interns" : "project manager"}
          </p>
        </div>

        {/* Chat Container */}
        <div
          style={{
            background: "rgba(255,255,255,0.06)",
            backdropFilter: "blur(20px)",
            borderRadius: 24,
            border: "1px solid rgba(255,255,255,0.12)",
            overflow: "hidden",
            height: isMobile ? "70vh" : "75vh",
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
          }}
        >
          {/* Contacts Sidebar */}
          {(!isMobile || !selectedContact) && (
            <div
              style={{
                width: isMobile ? "100%" : 320,
                borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.12)",
                borderBottom: isMobile ? "1px solid rgba(255,255,255,0.12)" : "none",
                display: "flex",
                flexDirection: "column",
                maxHeight: isMobile ? "40vh" : "100%",
              }}
            >
              {/* Search */}
              <div style={{ padding: 16, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ position: "relative" }}>
                  <Search
                    size={16}
                    style={{
                      position: "absolute",
                      left: 12,
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "rgba(255,255,255,0.5)",
                    }}
                  />
                  <input
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "10px 12px 10px 36px",
                      borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.04)",
                      color: "white",
                      outline: "none",
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>

              {/* Contacts List */}
              <div style={{ flex: 1, overflowY: "auto" }}>
                {filteredContacts.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "rgba(255,255,255,0.6)" }}>
                    {searchTerm ? "No contacts found" : "No contacts available"}
                  </div>
                ) : (
                  filteredContacts.map((contact, idx) => (
                    <ContactItem
                      key={idx}
                      contact={contact}
                      isSelected={selectedContact?.email === contact.email}
                      onClick={() => setSelectedContact(contact)}
                      unreadCount={getUnreadCount(contact)}
                      isMobile={isMobile}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* Chat Area */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div
                  style={{
                    padding: isMobile ? 12 : 16,
                    borderBottom: "1px solid rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  {isMobile && (
                    <button
                      onClick={() => setSelectedContact(null)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "white",
                        cursor: "pointer",
                        padding: 4,
                      }}
                    >
                      <ArrowLeft size={20} />
                    </button>
                  )}
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: 18,
                    }}
                  >
                    {selectedContact.fullName?.charAt(0) || "U"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: isMobile ? 14 : 16 }}>
                      {selectedContact.fullName}
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                      {selectedContact.role === "pm" ? "Project Manager" : "Intern"}
                    </div>
                  </div>
                  <Circle size={12} color="#4ade80" fill="#4ade80" />
                </div>

                {/* Messages */}
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    padding: isMobile ? 12 : 20,
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                  }}
                >
                  {messages.length === 0 ? (
                    <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.6)" }}>
                      <MessageCircle size={48} color="rgba(255,255,255,0.3)" style={{ marginBottom: 12 }} />
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isOwn={msg.sender === currentUser.email}
                        isMobile={isMobile}
                      />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div
                  style={{
                    padding: isMobile ? 12 : 16,
                    borderTop: "1px solid rgba(255,255,255,0.12)",
                    display: "flex",
                    gap: 12,
                    background: "rgba(255,255,255,0.04)",
                  }}
                >
                  <input
                    className="message-input"
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyPress}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      borderRadius: 999,
                      border: "1px solid rgba(255,255,255,0.12)",
                      background: "rgba(255,255,255,0.06)",
                      color: "white",
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
                      background: newMessage.trim() ? COLORS.peachGlow : "rgba(255,255,255,0.1)",
                      color: newMessage.trim() ? COLORS.inkBlack : "rgba(255,255,255,0.4)",
                      fontWeight: 700,
                      cursor: newMessage.trim() ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      transition: "all 0.2s",
                    }}
                  >
                    <Send size={16} />
                    {!isMobile && "Send"}
                  </button>
                </div>
              </>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  textAlign: "center",
                  padding: 40,
                }}
              >
                <div>
                  <MessageCircle size={64} color="rgba(255,255,255,0.3)" style={{ marginBottom: 16 }} />
                  <h3 style={{ fontSize: isMobile ? 18 : 22, marginBottom: 8 }}>Select a conversation</h3>
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
                    Choose a contact from the list to start messaging
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Contact Item Component
function ContactItem({ contact, isSelected, onClick, unreadCount, isMobile }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: isMobile ? 12 : 16,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        cursor: "pointer",
        background: isSelected ? "rgba(255,255,255,0.1)" : "transparent",
        transition: "background 0.2s",
        display: "flex",
        alignItems: "center",
        gap: 12,
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.06)";
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = "transparent";
      }}
    >
      <div
        style={{
          width: isMobile ? 40 : 48,
          height: isMobile ? 40 : 48,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 800,
          fontSize: isMobile ? 16 : 18,
          flexShrink: 0,
        }}
      >
        {contact.fullName?.charAt(0) || "U"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: isMobile ? 13 : 14,
            marginBottom: 2,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {contact.fullName}
        </div>
        <div
          style={{
            fontSize: isMobile ? 11 : 12,
            color: "rgba(255,255,255,0.6)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {contact.email}
        </div>
      </div>
      {unreadCount > 0 && (
        <div
          style={{
            background: COLORS.racingRed,
            color: "white",
            borderRadius: "50%",
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {unreadCount}
        </div>
      )}
    </div>
  );
}

// Message Bubble Component
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
          <User size={16} />
        </div>
      )}
      <div
        style={{
          maxWidth: isMobile ? "75%" : "60%",
          background: isOwn ? COLORS.peachGlow : "rgba(255,255,255,0.1)",
          color: isOwn ? COLORS.inkBlack : "white",
          padding: "10px 16px",
          borderRadius: isOwn ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
          wordBreak: "break-word",
        }}
      >
        <div style={{ fontSize: isMobile ? 13 : 14, marginBottom: 4 }}>{message.text}</div>
        <div
          style={{
            fontSize: 10,
            opacity: 0.7,
            textAlign: "right",
          }}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}