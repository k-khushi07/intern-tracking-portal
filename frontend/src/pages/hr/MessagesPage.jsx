// MessagesPage.jsx
import React, { useState, useRef, useEffect } from "react";
import { Send, Search, MoreVertical, Paperclip, Smile, Check, CheckCheck } from "lucide-react";

const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
};

const MessagesPage = ({ selectedIntern }) => {
  const [activeChat, setActiveChat] = useState(selectedIntern || null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatBodyRef = useRef(null);

  // Mock interns list for chat sidebar
  const interns = [
    {
      id: 1,
      name: "John Doe",
      avatar: "JD",
      lastMessage: "Thanks for the feedback!",
      lastMessageTime: "2m ago",
      unreadCount: 2,
      online: true,
      typing: false,
    },
    {
      id: 2,
      name: "Jane Smith",
      avatar: "JS",
      lastMessage: "I've updated the TNA tracker",
      lastMessageTime: "15m ago",
      unreadCount: 0,
      online: true,
      typing: false,
    },
    {
      id: 3,
      name: "Mike Johnson",
      avatar: "MJ",
      lastMessage: "Project submitted successfully",
      lastMessageTime: "1h ago",
      unreadCount: 1,
      online: false,
      typing: false,
    },
    {
      id: 4,
      name: "Emily Davis",
      avatar: "ED",
      lastMessage: "Weekly report is ready",
      lastMessageTime: "3h ago",
      unreadCount: 0,
      online: false,
      typing: false,
    },
  ];




  // Mock messages for active chat
  const [messages, setMessages] = useState([
    {
      id: 1,
      senderId: 1,
      senderName: "John Doe",
      text: "Hi Sarah, I have a question about the project requirements.",
      timestamp: "10:30 AM",
      read: true,
      type: "received",
    },
    {
      id: 2,
      senderId: "pm",
      senderName: "You",
      text: "Sure! What do you need help with?",
      timestamp: "10:32 AM",
      read: true,
      type: "sent",
    },
    {
      id: 3,
      senderId: 1,
      senderName: "John Doe",
      text: "I'm working on the dashboard component. Should I use the existing design system or create custom components?",
      timestamp: "10:35 AM",
      read: true,
      type: "received",
    },
    {
      id: 4,
      senderId: "pm",
      senderName: "You",
      text: "Please use the existing design system. It will ensure consistency across the application.",
      timestamp: "10:37 AM",
      read: true,
      type: "sent",
    },
    {
      id: 5,
      senderId: 1,
      senderName: "John Doe",
      text: "Got it! Thanks for the clarification. I'll proceed with that approach.",
      timestamp: "10:40 AM",
      read: true,
      type: "received",
    },
    {
      id: 6,
      senderId: "pm",
      senderName: "You",
      text: "Great! Let me know if you need anything else. Also, don't forget to submit your weekly report by Friday.",
      timestamp: "10:42 AM",
      read: false,
      type: "sent",
    },
  ]);




  // Set active chat to selected intern if provided
  // Set active chat to selected intern if provided
useEffect(() => {
  if (selectedIntern) {
    const intern = interns.find(i => i.id === selectedIntern.id) || {
      id: selectedIntern.id,
      name: selectedIntern.name,
      avatar: selectedIntern.avatar,
      lastMessage: "Start a conversation",
      lastMessageTime: "now",
      unreadCount: 0,
      online: true,
      typing: false,
    };
    setActiveChat(intern);
  }
  // Only run when selectedIntern changes - ignore other dependencies
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedIntern]);


// Separate effect for setting default active chat
// Set active chat to selected intern if provided
useEffect(() => {
  if (selectedIntern) {
    const intern = interns.find(i => i.id === selectedIntern.id) || {
      id: selectedIntern.id,
      name: selectedIntern.fullName || selectedIntern.name, // Use fullName if available
      avatar: selectedIntern.fullName?.substring(0, 2).toUpperCase() || selectedIntern.avatar,
      lastMessage: "Start a conversation",
      lastMessageTime: "now",
      unreadCount: 0,
      online: true,
      typing: false,
    };
    setActiveChat(intern);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [selectedIntern]);


// Set default active chat on mount only
useEffect(() => {
  if (!selectedIntern && interns.length > 0) {
    setActiveChat(interns[0]);
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);


  const handleSendMessage = () => {
    if (messageInput.trim() === "") return;

    const newMessage = {
      id: messages.length + 1,
      senderId: "pm",
      senderName: "You",
      text: messageInput,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      read: false,
      type: "sent",
    };


    setMessages([...messages, newMessage]);
    setMessageInput("");

    // Simulate typing indicator and response
    setTimeout(() => {
      setIsTyping(true);
    }, 1000);


    setTimeout(() => {
      setIsTyping(false);
      const response = {
        id: messages.length + 2,
        senderId: activeChat?.id,
        senderName: activeChat?.name,
        text: "Thanks! I'll get back to you shortly.",
        timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        read: true,
        type: "received",
      };
      setMessages(prev => [...prev, response]);
    }, 3000);
  };
  const filteredInterns = interns.filter((intern) =>
    intern.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div
      style={{
        display: "flex",
        height: "calc(100vh - 160px)", // Adjust based on your header height
        background: COLORS.inkBlack,
        borderRadius: "16px",
        overflow: "hidden",
        border: `1px solid rgba(103, 146, 137, 0.2)`,
      }}
    >
      {/* CHAT SIDEBAR - FIXED */}
      <aside
        style={{
          width: "320px",
          background: `linear-gradient(180deg, rgba(29, 120, 116, 0.1) 0%, rgba(7, 30, 34, 0.5) 100%)`,
          borderRight: `1px solid rgba(103, 146, 137, 0.2)`,
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Search Bar - FIXED */}
        <div style={{ padding: "20px", borderBottom: `1px solid rgba(103, 146, 137, 0.2)` }}>
          <div style={{ position: "relative" }}>
            <Search
              size={18}
              color="rgba(255, 229, 217, 0.5)"
              style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
            />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px 12px 44px",
                background: "rgba(103, 146, 137, 0.1)",
                border: `1px solid rgba(103, 146, 137, 0.3)`,
                borderRadius: "10px",
                color: COLORS.peachGlow,
                fontSize: "13px",
                transition: "all 0.3s ease",
              }}
            />
          </div>
        </div>




        {/* Interns List - SCROLLABLE */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {filteredInterns.map((intern) => (
            <div
              key={intern.id}
              onClick={() => setActiveChat(intern)}
              style={{
                padding: "16px 20px",
                cursor: "pointer",
                background: activeChat?.id === intern.id ? "rgba(103, 146, 137, 0.2)" : "transparent",
                borderBottom: `1px solid rgba(103, 146, 137, 0.1)`,
                transition: "all 0.2s ease",
                position: "relative",
              }}
              onMouseEnter={(e) => {
                if (activeChat?.id !== intern.id) {
                  e.currentTarget.style.background = "rgba(103, 146, 137, 0.1)";
                }
              }}
              onMouseLeave={(e) => {
                if (activeChat?.id !== intern.id) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      fontSize: "16px",
                      color: COLORS.peachGlow,
                      flexShrink: 0,
                    }}
                  >
                    {intern.avatar}
                  </div>
                  {/* Online Status Indicator */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "2px",
                      right: "2px",
                      width: "12px",
                      height: "12px",
                      background: intern.online ? "#22c55e" : "#6b7280",
                      borderRadius: "50%",
                      border: `2px solid ${COLORS.inkBlack}`,
                    }}
                  />
                </div>




                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <h4
                      style={{
                        fontSize: "14px",
                        fontWeight: "600",
                        color: COLORS.peachGlow,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {intern.name}
                    </h4>
                    <span style={{ fontSize: "11px", color: "rgba(255, 229, 217, 0.5)", flexShrink: 0 }}>
                      {intern.lastMessageTime}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p
                      style={{
                        fontSize: "12px",
                        color: "rgba(255, 229, 217, 0.6)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        flex: 1,
                      }}
                    >
                      {intern.typing ? (
                        <span style={{ color: COLORS.jungleTeal, fontStyle: "italic" }}>typing...</span>
                      ) : (
                        intern.lastMessage
                      )}
                    </p>
                    {intern.unreadCount > 0 && (
                      <span
                        style={{
                          minWidth: "20px",
                          height: "20px",
                          padding: "0 6px",
                          background: COLORS.racingRed,
                          borderRadius: "10px",
                          fontSize: "11px",
                          fontWeight: "700",
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: "8px",
                        }}
                      >
                        {intern.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </aside>




      {/* CHAT AREA */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
       
        {/* CHAT HEADER - FIXED */}
        <header
          style={{
            padding: "20px 24px",
            background: `linear-gradient(135deg, ${COLORS.deepOcean}, ${COLORS.jungleTeal})`,
            borderBottom: `1px solid rgba(103, 146, 137, 0.2)`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {activeChat ? (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "700",
                      fontSize: "16px",
                      color: COLORS.peachGlow,
                    }}
                  >
                    {activeChat.avatar}
                  </div>
                  {/* Online Status */}
                  <div
                    style={{
                      position: "absolute",
                      bottom: "0",
                      right: "0",
                      width: "12px",
                      height: "12px",
                      background: activeChat.online ? "#22c55e" : "#6b7280",
                      borderRadius: "50%",
                      border: `2px solid ${COLORS.deepOcean}`,
                    }}
                  />
                </div>
                <div>
                  <h3 style={{ fontSize: "16px", fontWeight: "700", color: COLORS.peachGlow }}>
                    {activeChat.name}
                  </h3>
                  <p style={{ fontSize: "12px", color: "rgba(255, 229, 217, 0.7)" }}>
                    {activeChat.online ? "Active now" : "Offline"}
                  </p>
                </div>
              </div>




              <button
                style={{
                  width: "36px",
                  height: "36px",
                  background: "rgba(255, 229, 217, 0.1)",
                  border: "none",
                  borderRadius: "8px",
                  color: COLORS.peachGlow,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 229, 217, 0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 229, 217, 0.1)";
                }}
              >
                <MoreVertical size={18} />
              </button>
            </>
          ) : (
            <div>
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: COLORS.peachGlow }}>
                Select a conversation
              </h3>
            </div>
          )}
        </header>

        {/* CHAT BODY - SCROLLABLE */}
        <div
          ref={chatBodyRef}
          style={{
            flex: 1,
            overflowY: "auto",
            overflowX: "hidden",
            padding: "24px",
            background: `linear-gradient(180deg, rgba(7, 30, 34, 0.3) 0%, rgba(7, 30, 34, 0.8) 100%)`,
          }}
        >
          {activeChat ? (
            <>
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    display: "flex",
                    justifyContent: message.type === "sent" ? "flex-end" : "flex-start",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "65%",
                      padding: "12px 16px",
                      background:
                        message.type === "sent"
                          ? `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`
                          : "rgba(103, 146, 137, 0.2)",
                      borderRadius:
                        message.type === "sent"
                          ? "16px 16px 4px 16px"
                          : "16px 16px 16px 4px",
                      border: `1px solid ${
                        message.type === "sent" ? COLORS.jungleTeal : "rgba(103, 146, 137, 0.3)"
                      }`,
                    }}
                  >
                    <p
                      style={{
                        fontSize: "14px",
                        color: COLORS.peachGlow,
                        lineHeight: "1.5",
                        marginBottom: "6px",
                      }}
                    >
                      {message.text}
                    </p>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span style={{ fontSize: "11px", color: "rgba(255, 229, 217, 0.6)" }}>
                        {message.timestamp}
                      </span>
                      {message.type === "sent" && (
                        <div>
                          {message.read ? (
                            <CheckCheck size={14} color={COLORS.peachGlow} />
                          ) : (
                            <Check size={14} color="rgba(255, 229, 217, 0.6)" />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}




              {/* Typing Indicator */}
              {isTyping && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-start",
                    marginBottom: "16px",
                  }}
                >
                  <div
                    style={{
                      padding: "12px 20px",
                      background: "rgba(103, 146, 137, 0.2)",
                      borderRadius: "16px 16px 16px 4px",
                      border: `1px solid rgba(103, 146, 137, 0.3)`,
                      display: "flex",
                      gap: "6px",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        background: COLORS.jungleTeal,
                        borderRadius: "50%",
                        animation: "pulse 1.4s ease-in-out infinite",
                      }}
                    />
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        background: COLORS.jungleTeal,
                        borderRadius: "50%",
                        animation: "pulse 1.4s ease-in-out 0.2s infinite",
                      }}
                    />
                    <div
                      style={{
                        width: "8px",
                        height: "8px",
                        background: COLORS.jungleTeal,
                        borderRadius: "50%",
                        animation: "pulse 1.4s ease-in-out 0.4s infinite",
                      }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Search size={36} color={COLORS.peachGlow} />
              </div>
              <p style={{ fontSize: "16px", color: "rgba(255, 229, 217, 0.6)" }}>
                Select a conversation to start messaging
              </p>
            </div>
          )}
        </div>




        {/* MESSAGE INPUT - FIXED */}
        {activeChat && (
          <div
            style={{
              padding: "20px 24px",
              background: "rgba(7, 30, 34, 0.9)",
              borderTop: `1px solid rgba(103, 146, 137, 0.2)`,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "12px 16px",
                background: "rgba(103, 146, 137, 0.1)",
                border: `1px solid rgba(103, 146, 137, 0.3)`,
                borderRadius: "12px",
              }}
            >
              <button
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255, 229, 217, 0.6)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "6px",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = COLORS.peachGlow;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255, 229, 217, 0.6)";
                }}
              >
                <Paperclip size={20} />
              </button>

              <input
                type="text"
                placeholder="Type a message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSendMessage();
                  }
                }}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  color: COLORS.peachGlow,
                  fontSize: "14px",
                  outline: "none",
                }}
              />

              <button
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255, 229, 217, 0.6)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  padding: "6px",
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = COLORS.peachGlow;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(255, 229, 217, 0.6)";
                }}
              >
                <Smile size={20} />
              </button>

              <button
                onClick={handleSendMessage}
                disabled={messageInput.trim() === ""}
                style={{
                  padding: "10px 20px",
                  background:
                    messageInput.trim() === ""
                      ? "rgba(103, 146, 137, 0.3)"
                      : `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                  border: "none",
                  borderRadius: "8px",
                  color: COLORS.peachGlow,
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: messageInput.trim() === "" ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.3s ease",
                  opacity: messageInput.trim() === "" ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (messageInput.trim() !== "") {
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 6px 20px rgba(103, 146, 137, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <Send size={16} />
                Send
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesPage;