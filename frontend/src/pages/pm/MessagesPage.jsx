import React, { useState, useEffect, useRef } from "react";
import {
  MessageCircle, Send, Search, Phone, Video, MoreVertical,
  Paperclip, Smile, Image, File, X, Check, CheckCheck,
  Users, ChevronLeft, Download, FileText, Film, Music
} from "lucide-react";

const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
  success: "#4ade80",
  online: "#22c55e",
  offline: "#6b7280",
  away: "#f59e0b",
};

// User roles
const USER_ROLES = {
  HR: "hr",
  PM: "pm",
  INTERN: "intern"
};

// Initial users data
const initialUsers = [
  { id: "hr1", role: USER_ROLES.HR, name: "Sarah Williams", avatar: "SW", status: "online" },
  { id: "hr2", role: USER_ROLES.HR, name: "Michael Chen", avatar: "MC", status: "away" },
  { id: "pm1", role: USER_ROLES.PM, name: "John Smith", avatar: "JS", status: "online" },
  { id: "pm2", role: USER_ROLES.PM, name: "Emily Davis", avatar: "ED", status: "online" },
  { id: "intern1", role: USER_ROLES.INTERN, name: "Alex Johnson", avatar: "AJ", status: "online" },
  { id: "intern2", role: USER_ROLES.INTERN, name: "Sneha Patel", avatar: "SP", status: "away" },
  { id: "intern3", role: USER_ROLES.INTERN, name: "Ravi Kumar", avatar: "RK", status: "online" },
  { id: "intern4", role: USER_ROLES.INTERN, name: "Lisa Wong", avatar: "LW", status: "online" },
];

// Storage keys
const STORAGE_KEYS = {
  MESSAGES: "messages_storage",
  CONTACTS: "contacts_storage",
  CURRENT_USER: "current_user"
};

const Avatar = ({ avatar, size = 48, status }) => (
  <div style={{ position: "relative", flexShrink: 0 }}>
    <div style={{ 
      width: size, 
      height: size, 
      borderRadius: "50%", 
      background: `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)`, 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center", 
      fontWeight: 700, 
      fontSize: size * 0.35, 
      color: "white" 
    }}>
      {avatar}
    </div>
    {status && (
      <div style={{ 
        position: "absolute", 
        bottom: 0, 
        right: 0, 
        width: size * 0.28, 
        height: size * 0.28, 
        borderRadius: "50%", 
        background: status === "online" ? COLORS.online : status === "away" ? COLORS.away : COLORS.offline, 
        border: `2px solid ${COLORS.inkBlack}` 
      }} />
    )}
  </div>
);

const ContactItem = ({ contact, isActive, onClick, lastMessage, unreadCount }) => (
  <div 
    onClick={onClick} 
    style={{ 
      padding: "14px 16px", 
      borderRadius: 14, 
      background: isActive ? `${COLORS.jungleTeal}20` : "transparent", 
      cursor: "pointer", 
      display: "flex", 
      alignItems: "center", 
      gap: 14, 
      transition: "all 0.2s", 
      borderLeft: isActive ? `3px solid ${COLORS.jungleTeal}` : "3px solid transparent", 
      marginBottom: 4 
    }}
    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)"; }}
    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
  >
    <Avatar avatar={contact.avatar} size={50} status={contact.status} />
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontWeight: 600, color: "white", fontSize: 15 }}>{contact.name}</span>
        {lastMessage && (
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
            {lastMessage.time}
          </span>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ 
          fontSize: 13, 
          color: "rgba(255,255,255,0.5)", 
          overflow: "hidden", 
          textOverflow: "ellipsis", 
          whiteSpace: "nowrap",
          flex: 1
        }}>
          {lastMessage ? (lastMessage.file ? `📎 ${lastMessage.file.name}` : lastMessage.text) : "No messages yet"}
        </div>
        {unreadCount > 0 && (
          <div style={{ 
            minWidth: 20, 
            height: 20, 
            borderRadius: 10, 
            background: COLORS.racingRed, 
            color: "white", 
            fontSize: 11, 
            fontWeight: 700, 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            padding: "0 6px",
            marginLeft: 8
          }}>
            {unreadCount}
          </div>
        )}
      </div>
    </div>
  </div>
);

const FilePreview = ({ file, onRemove }) => {
  const getFileIcon = () => {
    if (file.type.startsWith('image/')) return <Image size={20} />;
    if (file.type.startsWith('video/')) return <Film size={20} />;
    if (file.type.startsWith('audio/')) return <Music size={20} />;
    return <FileText size={20} />;
  };

  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "8px 12px",
      background: "rgba(255,255,255,0.1)",
      borderRadius: 8,
      marginTop: 8
    }}>
      {getFileIcon()}
      <span style={{ fontSize: 13, color: "white" }}>{file.name}</span>
      <button
        onClick={onRemove}
        style={{
          background: "none",
          border: "none",
          color: "white",
          cursor: "pointer",
          padding: 4
        }}
      >
        <X size={16} />
      </button>
    </div>
  );
};

const MessageBubble = ({ message, isMe }) => {
  const renderFileContent = () => {
    if (!message.file) return null;

    if (message.file.type.startsWith('image/')) {
      return (
        <img 
          src={message.file.url} 
          alt={message.file.name}
          style={{ 
            maxWidth: "100%", 
            borderRadius: 8, 
            marginBottom: 8,
            display: "block"
          }} 
        />
      );
    }

    return (
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        background: "rgba(0,0,0,0.2)",
        borderRadius: 8,
        marginBottom: 8
      }}>
        <FileText size={24} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{message.file.name}</div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>{message.file.size}</div>
        </div>
        <Download size={18} style={{ cursor: "pointer" }} />
      </div>
    );
  };

  return (
    <div style={{ 
      display: "flex", 
      justifyContent: isMe ? "flex-end" : "flex-start", 
      marginBottom: 12 
    }}>
      <div style={{ 
        maxWidth: "70%", 
        padding: "12px 16px", 
        borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px", 
        background: isMe 
          ? `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)` 
          : "rgba(255,255,255,0.08)", 
        color: "white", 
        fontSize: 14, 
        lineHeight: 1.5 
      }}>
        {renderFileContent()}
        {message.text && <div>{message.text}</div>}
        <div style={{ 
          fontSize: 11, 
          color: "rgba(255,255,255,0.5)", 
          marginTop: 6, 
          textAlign: "right",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 4
        }}>
          {message.time}
          {isMe && (message.read ? <CheckCheck size={14} color={COLORS.success} /> : <Check size={14} />)}
        </div>
      </div>
    </div>
  );
};

const DateSeparator = ({ date }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", margin: "20px 0" }}>
    <div style={{ 
      padding: "6px 16px", 
      background: "rgba(255,255,255,0.08)", 
      borderRadius: 20, 
      fontSize: 12, 
      color: "rgba(255,255,255,0.5)" 
    }}>
      {date}
    </div>
  </div>
);



export default function MessagesPage({ isMobile = false }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [activeContactId, setActiveContactId] = useState(null);
  const [messages, setMessages] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Initialize from storage or set defaults
  useEffect(() => {
    const savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    const savedMessages = localStorage.getItem(STORAGE_KEYS.MESSAGES);
    
    if (savedUserId) {
      const user = initialUsers.find(u => u.id === savedUserId);
      if (user) setCurrentUser(user);
    } else {
      setCurrentUser(initialUsers[0]); // Default to first user
    }

    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error("Failed to load messages:", e);
      }
    }
  }, []);

  // Update contacts when current user changes
  useEffect(() => {
    if (currentUser) {
      const otherUsers = initialUsers.filter(u => u.id !== currentUser.id);
      setContacts(otherUsers);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, currentUser.id);
    }
  }, [currentUser]);

  // Save messages to storage
  useEffect(() => {
    if (Object.keys(messages).length > 0) {
      localStorage.setItem(STORAGE_KEYS.MESSAGES, JSON.stringify(messages));
    }
  }, [messages]);

  const handleUserChange = (userId) => {
    const user = initialUsers.find(u => u.id === userId);
    if (user) {
      setCurrentUser(user);
      setActiveContactId(null);
    }
  };

  const getConversationKey = (user1Id, user2Id) => {
    return [user1Id, user2Id].sort().join("_");
  };

  const getConversationMessages = (contactId) => {
    if (!currentUser) return [];
    const key = getConversationKey(currentUser.id, contactId);
    return messages[key] || [];
  };

  const getLastMessage = (contactId) => {
    const msgs = getConversationMessages(contactId);
    return msgs.length > 0 ? msgs[msgs.length - 1] : null;
  };

  const getUnreadCount = (contactId) => {
    const msgs = getConversationMessages(contactId);
    return msgs.filter(m => m.from !== currentUser.id && !m.read).length;
  };

  const filteredContacts = contacts.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeContactId]);

  useEffect(() => {
    if (activeContactId && currentUser) {
      // Mark messages as read
      const key = getConversationKey(currentUser.id, activeContactId);
      const conversationMessages = messages[key] || [];
      const hasUnread = conversationMessages.some(m => m.from !== currentUser.id && !m.read);
      
      if (hasUnread) {
        setMessages(prev => ({
          ...prev,
          [key]: conversationMessages.map(m => 
            m.from !== currentUser.id ? { ...m, read: true } : m
          )
        }));
      }
      scrollToBottom();
    }
  }, [activeContactId, currentUser]);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Create preview URL for images
      const fileData = {
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        type: file.type,
        url: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
      };
      setSelectedFile(fileData);
    }
  };

  const handleSendMessage = () => {
    if (!currentUser || !activeContactId || (!newMessage.trim() && !selectedFile)) return;

    const key = getConversationKey(currentUser.id, activeContactId);
    const now = new Date();
    const msg = {
      id: Date.now(),
      from: currentUser.id,
      to: activeContactId,
      text: newMessage.trim(),
      file: selectedFile,
      time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      date: now.toDateString() === new Date().toDateString() ? "Today" : now.toLocaleDateString(),
      read: false,
      timestamp: now.getTime()
    };

    setMessages(prev => ({
      ...prev,
      [key]: [...(prev[key] || []), msg]
    }));

    setNewMessage("");
    setSelectedFile(null);
    scrollToBottom();
  };

  const activeContact = contacts.find(c => c.id === activeContactId);
  const activeMessages = activeContactId ? getConversationMessages(activeContactId) : [];

  const groupedMessages = activeMessages.reduce((groups, message) => {
    if (!groups[message.date]) groups[message.date] = [];
    groups[message.date].push(message);
    return groups;
  }, {});

  if (!currentUser) {
    return (
      <div style={{ 
        height: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        background: COLORS.inkBlack
      }}>
        <div style={{ color: "white", fontSize: 18 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ 
        flex: 1,
        display: "flex", 
        background: "rgba(7, 30, 34, 0.5)", 
        overflow: "hidden",
        border: "1px solid rgba(255,255,255,0.08)",
        margin: "0 20px 20px"
      }}>
        {(!isMobile || !activeContactId) && (
          <div style={{ 
            width: isMobile ? "100%" : 340, 
            borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.08)", 
            display: "flex", 
            flexDirection: "column", 
            background: "rgba(7, 30, 34, 0.8)" 
          }}>
            <div style={{ padding: 20 }}>
              <h2 style={{ color: "white", fontSize: 20, fontWeight: 700, marginBottom: 16 }}>
                Messages
              </h2>
              <div style={{ position: "relative" }}>
                <Search 
                  size={18} 
                  style={{ 
                    position: "absolute", 
                    left: 14, 
                    top: "50%", 
                    transform: "translateY(-50%)", 
                    color: "rgba(255,255,255,0.4)" 
                  }} 
                />
                <input 
                  type="text" 
                  placeholder="Search contacts..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  style={{ 
                    width: "100%", 
                    padding: "12px 16px 12px 44px", 
                    borderRadius: 12, 
                    border: "1px solid rgba(255,255,255,0.1)", 
                    background: "rgba(255,255,255,0.05)", 
                    color: "white", 
                    fontSize: 14, 
                    outline: "none" 
                  }} 
                />
              </div>
            </div>
            
            <div style={{ flex: 1, overflowY: "auto", padding: "0 12px 12px" }}>
              {filteredContacts.map(contact => (
                <ContactItem 
                  key={contact.id} 
                  contact={contact} 
                  isActive={activeContactId === contact.id} 
                  onClick={() => setActiveContactId(contact.id)}
                  lastMessage={getLastMessage(contact.id)}
                  unreadCount={getUnreadCount(contact.id)}
                />
              ))}
            </div>
          </div>
        )}
        
        {(!isMobile || activeContactId) && (
          <div style={{ 
            flex: 1, 
            display: "flex", 
            flexDirection: "column", 
            background: "rgba(7, 30, 34, 0.9)" 
          }}>
            {activeContact ? (
              <>
                <div style={{ 
                  padding: "16px 24px", 
                  borderBottom: "1px solid rgba(255,255,255,0.08)", 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center" 
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    {isMobile && (
                      <button 
                        onClick={() => setActiveContactId(null)} 
                        style={{ 
                          background: "none", 
                          border: "none", 
                          color: "white", 
                          cursor: "pointer", 
                          padding: 8, 
                          marginLeft: -8 
                        }}
                      >
                        <ChevronLeft size={24} />
                      </button>
                    )}
                    <Avatar avatar={activeContact.avatar} size={44} status={activeContact.status} />
                    <div>
                      <div style={{ fontWeight: 600, color: "white", fontSize: 16 }}>
                        {activeContact.name}
                      </div>
                      <div style={{ 
                        fontSize: 12, 
                        color: activeContact.status === "online" ? COLORS.online : "rgba(255,255,255,0.5)", 
                        marginTop: 2 
                      }}>
                        {activeContact.status === "online" ? "Online" : activeContact.status === "away" ? "Away" : "Offline"} • {activeContact.role.toUpperCase()}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: 10, 
                      background: "rgba(255,255,255,0.05)", 
                      border: "none", 
                      color: "white", 
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <Phone size={18} />
                    </button>
                    <button style={{ 
                      width: 40, 
                      height: 40, 
                      borderRadius: 10, 
                      background: "rgba(255,255,255,0.05)", 
                      border: "none", 
                      color: "white", 
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <Video size={18} />
                    </button>
                  </div>
                </div>
                
                <div style={{ 
                  flex: 1, 
                  overflowY: "auto", 
                  padding: "20px 24px" 
                }}>
                  {Object.entries(groupedMessages).map(([date, msgs]) => (
                    <div key={date}>
                      <DateSeparator date={date} />
                      {msgs.map(msg => (
                        <MessageBubble 
                          key={msg.id} 
                          message={msg} 
                          isMe={msg.from === currentUser.id}
                        />
                      ))}
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>
                
                <div style={{ 
                  padding: "16px 24px", 
                  borderTop: "1px solid rgba(255,255,255,0.08)" 
                }}>
                  {selectedFile && (
                    <FilePreview 
                      file={selectedFile} 
                      onRemove={() => setSelectedFile(null)} 
                    />
                  )}
                  <div style={{ display: "flex", gap: 12, marginTop: selectedFile ? 12 : 0 }}>
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.05)",
                        border: "none",
                        color: "white",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Paperclip size={20} />
                    </button>
                    <input 
                      type="text" 
                      placeholder="Type a message..." 
                      value={newMessage} 
                      onChange={(e) => setNewMessage(e.target.value)} 
                      onKeyPress={(e) => e.key === "Enter" && handleSendMessage()} 
                      style={{ 
                        flex: 1, 
                        padding: "12px 16px", 
                        borderRadius: 12, 
                        border: "1px solid rgba(255,255,255,0.1)", 
                        background: "rgba(255,255,255,0.05)", 
                        color: "white", 
                        fontSize: 14, 
                        outline: "none" 
                      }} 
                    />
                    <button 
                      onClick={handleSendMessage} 
                      disabled={!newMessage.trim() && !selectedFile} 
                      style={{ 
                        width: 44, 
                        height: 44, 
                        borderRadius: 12, 
                        background: (newMessage.trim() || selectedFile) 
                          ? `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)` 
                          : "rgba(255,255,255,0.05)", 
                        border: "none", 
                        color: "white", 
                        cursor: (newMessage.trim() || selectedFile) ? "pointer" : "not-allowed", 
                        display: "flex", 
                        alignItems: "center", 
                        justifyContent: "center" 
                      }}
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center", 
                height: "100%", 
                flexDirection: "column", 
                gap: 16 
              }}>
                <MessageCircle size={64} color={COLORS.jungleTeal} style={{ opacity: 0.5 }} />
                <h3 style={{ color: "white", fontSize: 20 }}>Select a conversation</h3>
                <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>
                  Choose a contact to start messaging
                </p>
              </div>
            )}
          </div>
        )}
      </div>    
  );
}