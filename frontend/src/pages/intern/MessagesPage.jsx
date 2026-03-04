//frontend/src/pages/intern/MessagesPage.jsx
import React, { useState, useEffect, useRef, useCallback } from "react";
import { authApi, messagesApi } from "../../lib/apiClient";
import { getRealtimeSocket } from "../../lib/realtime";
import {
  MessageCircle, Send, Search, Phone, Video, MoreVertical,
  Paperclip, Smile, Image, File, X, Check, CheckCheck,
  Circle, Users, User, Briefcase, Clock, ChevronLeft,
  Star, Pin, Archive, Trash2, Reply, Forward, Copy,
  Bell, BellOff, AtSign, Hash, Plus, Settings,
  Mic, StopCircle, Play, Pause, Download, Eye,
  Heart, ThumbsUp, Laugh, AlertCircle, Filter, ArrowDown
} from "lucide-react";

// ==================== CONSTANTS ====================
const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
  success: "#4ade80",
  warning: "#f59e0b",
  purple: "#a78bfa",
  online: "#22c55e",
  offline: "#6b7280",
  away: "#f59e0b",
};

// ==================== SAMPLE DATA ====================
const _sampleContacts = [
  {
    id: "pm",
    type: "individual",
    name: "Priya Sharma",
    role: "Project Manager",
    avatar: "PS",
    status: "online",
    lastSeen: null,
    unread: 2,
    pinned: true,
    lastMessage: {
      text: "Great progress on the dashboard!",
      time: "10:30 AM",
      fromMe: false,
    },
    email: "priya.sharma@company.com",
    phone: "+91 98765 33333",
  },
  {
    id: "hr",
    type: "individual",
    name: "Rahul Verma",
    role: "HR Manager",
    avatar: "RV",
    status: "away",
    lastSeen: "30 min ago",
    unread: 0,
    pinned: true,
    lastMessage: {
      text: "Your documents have been verified.",
      time: "Yesterday",
      fromMe: false,
    },
    email: "rahul.verma@company.com",
    phone: "+91 98765 44444",
  },
  {
    id: "team",
    type: "group",
    name: "Project Alpha Team",
    avatar: "PA",
    members: ["Priya Sharma", "Alex Johnson", "You", "Ravi Kumar", "Sneha Patel"],
    memberCount: 5,
    unread: 5,
    pinned: false,
    lastMessage: {
      text: "Ravi: Let's sync up at 3 PM",
      time: "11:45 AM",
      fromMe: false,
    },
  },
  {
    id: "intern-group",
    type: "group",
    name: "Interns 2024",
    avatar: "I24",
    members: ["Alex Johnson", "You", "Sneha Patel", "Amit Singh", "Neha Gupta"],
    memberCount: 12,
    unread: 0,
    pinned: false,
    lastMessage: {
      text: "Neha: Anyone up for lunch?",
      time: "12:30 PM",
      fromMe: false,
    },
  },
  {
    id: "ravi",
    type: "individual",
    name: "Ravi Kumar",
    role: "Senior Developer",
    avatar: "RK",
    status: "online",
    lastSeen: null,
    unread: 0,
    pinned: false,
    lastMessage: {
      text: "Thanks for the code review!",
      time: "Yesterday",
      fromMe: true,
    },
    email: "ravi.kumar@company.com",
  },
  {
    id: "sneha",
    type: "individual",
    name: "Sneha Patel",
    role: "Fellow Intern",
    avatar: "SP",
    status: "offline",
    lastSeen: "2 hours ago",
    unread: 0,
    pinned: false,
    lastMessage: {
      text: "See you tomorrow!",
      time: "Mon",
      fromMe: false,
    },
    email: "sneha.patel@company.com",
  },
];

const _sampleMessages = {
  pm: [
    { id: 1, from: "them", text: "Hi! How's the dashboard project going?", time: "10:15 AM", date: "Today", status: "read" },
    { id: 2, from: "me", text: "Hi Priya! It's going great. I've completed the API integration and working on the UI components now.", time: "10:20 AM", date: "Today", status: "read" },
    { id: 3, from: "them", text: "That's excellent progress! Can you show me a quick demo in our standup?", time: "10:25 AM", date: "Today", status: "read" },
    { id: 4, from: "me", text: "Sure! I'll prepare a short presentation. Should I include the database schema as well?", time: "10:28 AM", date: "Today", status: "read" },
    { id: 5, from: "them", text: "Great progress on the dashboard! Yes, please include the schema. Looking forward to it! 🎉", time: "10:30 AM", date: "Today", status: "delivered" },
  ],
  hr: [
    { id: 1, from: "them", text: "Hello! Welcome to the team. Please complete your profile setup when you get a chance.", time: "9:00 AM", date: "Mon", status: "read" },
    { id: 2, from: "me", text: "Thank you! I've completed most of it. Just need to upload my ID proof.", time: "9:30 AM", date: "Mon", status: "read" },
    { id: 3, from: "them", text: "Perfect. Also, remember to fill out the emergency contact form.", time: "10:00 AM", date: "Mon", status: "read" },
    { id: 4, from: "me", text: "Done! I've submitted all the required documents.", time: "2:00 PM", date: "Mon", status: "read" },
    { id: 5, from: "them", text: "Your documents have been verified. You're all set! 👍", time: "4:30 PM", date: "Yesterday", status: "read" },
  ],
  team: [
    { id: 1, from: "Priya Sharma", text: "Good morning team! Quick update on our sprint progress.", time: "9:00 AM", date: "Today", status: "read" },
    { id: 2, from: "Ravi Kumar", text: "Morning! I've pushed the authentication module. Ready for review.", time: "9:15 AM", date: "Today", status: "read" },
    { id: 3, from: "me", text: "Great work Ravi! I'll review it after lunch.", time: "9:20 AM", date: "Today", status: "read" },
    { id: 4, from: "Sneha Patel", text: "I'm working on the notification system. Should be done by EOD.", time: "10:30 AM", date: "Today", status: "read" },
    { id: 5, from: "Ravi Kumar", text: "Let's sync up at 3 PM to discuss the integration.", time: "11:45 AM", date: "Today", status: "delivered" },
  ],
  "intern-group": [
    { id: 1, from: "Amit Singh", text: "Hey everyone! How's your first week going?", time: "10:00 AM", date: "Today", status: "read" },
    { id: 2, from: "Neha Gupta", text: "Loving it so far! Learning so much.", time: "10:15 AM", date: "Today", status: "read" },
    { id: 3, from: "me", text: "Same here! The team is super helpful.", time: "10:30 AM", date: "Today", status: "read" },
    { id: 4, from: "Sneha Patel", text: "Agreed! Anyone wants to grab coffee?", time: "12:00 PM", date: "Today", status: "read" },
    { id: 5, from: "Neha Gupta", text: "Anyone up for lunch?", time: "12:30 PM", date: "Today", status: "delivered" },
  ],
  ravi: [
    { id: 1, from: "them", text: "Hey! Can you help me with the React state management?", time: "3:00 PM", date: "Yesterday", status: "read" },
    { id: 2, from: "me", text: "Sure! Are you using Context API or Redux?", time: "3:05 PM", date: "Yesterday", status: "read" },
    { id: 3, from: "them", text: "Context API. Having issues with re-renders.", time: "3:10 PM", date: "Yesterday", status: "read" },
    { id: 4, from: "me", text: "Ah, classic issue! Try useMemo for expensive calculations and useCallback for functions.", time: "3:15 PM", date: "Yesterday", status: "read" },
    { id: 5, from: "me", text: "Thanks for the code review!", time: "5:00 PM", date: "Yesterday", status: "read" },
  ],
  sneha: [
    { id: 1, from: "them", text: "Hey! Are you coming to the team lunch tomorrow?", time: "4:00 PM", date: "Mon", status: "read" },
    { id: 2, from: "me", text: "Yes! What time are we meeting?", time: "4:30 PM", date: "Mon", status: "read" },
    { id: 3, from: "them", text: "12:30 at the cafeteria. See you there!", time: "4:35 PM", date: "Mon", status: "read" },
    { id: 4, from: "them", text: "See you tomorrow!", time: "6:00 PM", date: "Mon", status: "read" },
  ],
};

// ==================== HELPER FUNCTIONS ====================
const getStatusColor = (status) => {
  switch (status) {
    case "online": return COLORS.online;
    case "away": return COLORS.warning;
    case "offline": return COLORS.offline;
    default: return COLORS.offline;
  }
};

const initials = (nameOrEmail) => {
  const s = String(nameOrEmail || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const _formatTime = (time) => time;

// ==================== UI COMPONENTS ====================
const Avatar = ({ avatar, size = 48, status, isGroup = false, color }) => {
  const bgColor = color || (isGroup 
    ? `linear-gradient(135deg, ${COLORS.purple} 0%, ${COLORS.deepOcean} 100%)`
    : `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)`);
  
  return (
    <div style={{ position: "relative", flexShrink: 0 }}>
      <div style={{
        width: size,
        height: size,
        borderRadius: isGroup ? 14 : "50%",
        background: bgColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.35,
        color: "white",
        border: `2px solid rgba(255,255,255,0.1)`,
      }}>
        {isGroup ? <Users size={size * 0.4} /> : avatar}
      </div>
      {status && !isGroup && (
        <div style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: size * 0.28,
          height: size * 0.28,
          borderRadius: "50%",
          background: getStatusColor(status),
          border: `2px solid ${COLORS.inkBlack}`,
        }} />
      )}
    </div>
  );
};

const MessageStatus = ({ status }) => {
  if (status === "sent") return <Check size={14} color="rgba(255,255,255,0.4)" />;
  if (status === "delivered") return <CheckCheck size={14} color="rgba(255,255,255,0.4)" />;
  if (status === "read") return <CheckCheck size={14} color={COLORS.jungleTeal} />;
  return null;
};

const TypingIndicator = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "8px 0" }}>
    <div style={{ display: "flex", gap: 3 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: COLORS.jungleTeal,
            animation: `typing 1.4s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
    </div>
    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginLeft: 8 }}>typing...</span>
  </div>
);

const EmptyState = ({ icon, title, subtitle }) => (
  <div style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    padding: 40,
    textAlign: "center",
  }}>
    <div style={{
      width: 80,
      height: 80,
      borderRadius: 20,
      background: `${COLORS.jungleTeal}15`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 20,
    }}>
      {icon}
    </div>
    <h3 style={{ color: "white", fontSize: 18, fontWeight: 600, margin: 0 }}>{title}</h3>
    <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14, marginTop: 8, maxWidth: 280 }}>{subtitle}</p>
  </div>
);

// ==================== CONTACT LIST ITEM ====================
const ContactItem = ({ contact, isActive, onClick, isMobile }) => {
  const isGroup = contact.type === "group";
  
  return (
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
        marginBottom: 4,
      }}
      onMouseEnter={(e) => {
        if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.05)";
      }}
      onMouseLeave={(e) => {
        if (!isActive) e.currentTarget.style.background = "transparent";
      }}
    >
      <Avatar
        name={contact.name}
        avatar={contact.avatar}
        size={50}
        status={contact.status}
        isGroup={isGroup}
      />
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ 
              fontWeight: 600, 
              color: isActive ? "white" : "rgba(255,255,255,0.9)",
              fontSize: 15,
            }}>
              {contact.name}
            </span>
            {contact.pinned && <Pin size={12} color={COLORS.peachGlow} />}
          </div>
          <span style={{ 
            fontSize: 11, 
            color: contact.unread > 0 ? COLORS.peachGlow : "rgba(255,255,255,0.4)",
            fontWeight: contact.unread > 0 ? 600 : 400,
          }}>
            {contact.lastMessage?.time}
          </span>
        </div>
        
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ 
            fontSize: 13, 
            color: "rgba(255,255,255,0.5)", 
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: isMobile ? 150 : 180,
          }}>
            {isGroup ? (
              <span>{contact.lastMessage?.text}</span>
            ) : (
              <>
                {contact.lastMessage?.fromMe && <span style={{ color: COLORS.jungleTeal }}>You: </span>}
                {contact.lastMessage?.text}
              </>
            )}
          </div>
          
          {contact.unread > 0 && (
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
            }}>
              {contact.unread}
            </div>
          )}
        </div>
        
        {!isGroup && (
          <div style={{ 
            fontSize: 11, 
            color: "rgba(255,255,255,0.4)", 
            marginTop: 2 
          }}>
            {contact.role}
          </div>
        )}
      </div>
    </div>
  );
};

// ==================== MESSAGE BUBBLE ====================
const MessageBubble = ({ message, isGroup, showAvatar = true, onReport, onDelete }) => {
  const isMe = message.from === "me";
  const [showActions, setShowActions] = useState(false);

  const canDeleteSelf = (() => {
    return isMe && !message.deleted;
  })();
  
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isMe ? "flex-end" : "flex-start",
        marginBottom: 12,
        paddingLeft: !isMe && isGroup && showAvatar ? 0 : 44,
      }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {!isMe && isGroup && showAvatar && (
        <Avatar
          name={message.from}
          avatar={message.from?.split(" ").map(n => n[0]).join("") || "?"}
          size={36}
          color={`linear-gradient(135deg, ${COLORS.jungleTeal} 0%, ${COLORS.deepOcean} 100%)`}
        />
      )}
      
      <div style={{ 
        maxWidth: "70%", 
        marginLeft: !isMe && isGroup && showAvatar ? 10 : 0,
        position: "relative",
      }}>
        {!isMe && isGroup && showAvatar && (
          <div style={{ 
            fontSize: 12, 
            color: COLORS.jungleTeal, 
            fontWeight: 600, 
            marginBottom: 4,
            marginLeft: 4,
          }}>
            {message.from}
          </div>
        )}
        
        <div style={{
          padding: "12px 16px",
          borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isMe 
            ? `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)`
            : "rgba(255,255,255,0.08)",
          color: "white",
          fontSize: 14,
          lineHeight: 1.5,
          position: "relative",
        }}>
          {message.replyTo && (
            <div style={{
              padding: "8px 12px",
              background: "rgba(0,0,0,0.2)",
              borderRadius: 8,
              marginBottom: 8,
              borderLeft: `3px solid ${COLORS.peachGlow}`,
              fontSize: 12,
              color: "rgba(255,255,255,0.6)",
            }}>
              <div style={{ fontWeight: 600, color: COLORS.peachGlow, marginBottom: 2 }}>
                {message.replyTo.from}
              </div>
              {message.replyTo.text}
            </div>
          )}
          
          {message.text}
          
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "flex-end",
            gap: 6,
            marginTop: 6,
          }}>
            <span style={{ 
              fontSize: 11, 
              color: isMe ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.4)",
            }}>
              {message.time}
            </span>
            {isMe && <MessageStatus status={message.status} />}
          </div>
        </div>
        
        {/* Quick Actions */}
        {showActions && (
          <div style={{
            position: "absolute",
            [isMe ? "left" : "right"]: -40,
            top: "50%",
            transform: "translateY(-50%)",
            display: "flex",
            flexDirection: "column",
            gap: 4,
            background: "rgba(7, 30, 34, 0.95)",
            borderRadius: 8,
            padding: 4,
            border: "1px solid rgba(255,255,255,0.1)",
          }}>
            <button style={quickActionStyle} title="Reply (coming soon)" disabled>
              <Reply size={14} />
            </button>
            {canDeleteSelf && (
              <button style={quickActionStyle} title="Delete (10 min window)" onClick={() => onDelete && onDelete(message)}>
                <Trash2 size={14} />
              </button>
            )}
            <button style={quickActionStyle} title="Report message" onClick={() => onReport && onReport(message)}>
              <AlertCircle size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const quickActionStyle = {
  background: "none",
  border: "none",
  color: "rgba(255,255,255,0.6)",
  cursor: "pointer",
  padding: 6,
  borderRadius: 6,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  transition: "all 0.2s",
};

// ==================== DATE SEPARATOR ====================
const DateSeparator = ({ date }) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "20px 0",
  }}>
    <div style={{
      padding: "6px 16px",
      background: "rgba(255,255,255,0.08)",
      borderRadius: 20,
      fontSize: 12,
      color: "rgba(255,255,255,0.5)",
      fontWeight: 500,
    }}>
      {date}
    </div>
  </div>
);

// ==================== CHAT HEADER ====================
const ChatHeader = ({ contact, onBack, isMobile }) => {
  const isGroup = contact.type === "group";
  
  return (
    <div style={{
      padding: "16px 24px",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      background: "rgba(7, 30, 34, 0.8)",
      backdropFilter: "blur(20px)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {isMobile && (
          <button
            onClick={onBack}
            style={{
              background: "none",
              border: "none",
              color: "white",
              cursor: "pointer",
              padding: 8,
              marginLeft: -8,
              display: "flex",
              alignItems: "center",
            }}
          >
            <ChevronLeft size={24} />
          </button>
        )}
        
        <Avatar
          name={contact.name}
          avatar={contact.avatar}
          size={44}
          status={contact.status}
          isGroup={isGroup}
        />
        
        <div>
          <div style={{ fontWeight: 600, color: "white", fontSize: 16 }}>
            {contact.name}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
            {isGroup ? (
              `${contact.memberCount} members`
            ) : contact.status === "online" ? (
              <span style={{ color: COLORS.online }}>Online</span>
            ) : (
              `Last seen ${contact.lastSeen || "recently"}`
            )}
          </div>
        </div>
      </div>
      
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {!isGroup && (
          <>
            <HeaderButton icon={<Phone size={18} />} />
            <HeaderButton icon={<Video size={18} />} />
          </>
        )}
        <HeaderButton icon={<Search size={18} />} />
        <HeaderButton icon={<MoreVertical size={18} />} />
      </div>
    </div>
  );
};

const HeaderButton = ({ icon, onClick, badge }) => (
  <button
    onClick={onClick}
    style={{
      position: "relative",
      width: 40,
      height: 40,
      borderRadius: 10,
      background: "rgba(255,255,255,0.05)",
      border: "1px solid rgba(255,255,255,0.08)",
      color: "rgba(255,255,255,0.7)",
      cursor: "pointer",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      transition: "all 0.2s",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = "rgba(255,255,255,0.1)";
      e.currentTarget.style.color = "white";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = "rgba(255,255,255,0.05)";
      e.currentTarget.style.color = "rgba(255,255,255,0.7)";
    }}
  >
    {icon}
    {badge && (
      <div style={{
        position: "absolute",
        top: -4,
        right: -4,
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: COLORS.racingRed,
        color: "white",
        fontSize: 10,
        fontWeight: 700,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {badge}
      </div>
    )}
  </button>
);

// ==================== MESSAGE INPUT ====================
const MessageInput = ({ onSend, disabled, readOnlyReason }) => {
  const [message, setMessage] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const inputRef = useRef(null);
  
  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage("");
    }
  };
  
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  return (
    <div style={{
      padding: "16px 24px",
      borderTop: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(7, 30, 34, 0.8)",
      backdropFilter: "blur(20px)",
    }}>
      {disabled && (
        <div style={{ marginBottom: 10, fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
          {readOnlyReason ? `Read-only: ${readOnlyReason}` : "Read-only conversation"}
        </div>
      )}
      {/* Attachment Menu */}
      {showAttachMenu && (
        <div style={{
          display: "flex",
          gap: 12,
          marginBottom: 16,
          padding: 12,
          background: "rgba(255,255,255,0.05)",
          borderRadius: 12,
        }}>
          <AttachOption icon={<Image size={20} />} label="Photo" color={COLORS.success} />
          <AttachOption icon={<File size={20} />} label="Document" color={COLORS.purple} />
          <AttachOption icon={<Mic size={20} />} label="Audio" color={COLORS.warning} />
        </div>
      )}
      
      <div style={{ display: "flex", alignItems: "flex-end", gap: 12 }}>
        <button
          onClick={() => setShowAttachMenu(!showAttachMenu)}
          disabled
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: showAttachMenu ? `${COLORS.jungleTeal}20` : "rgba(255,255,255,0.05)",
            border: `1px solid ${showAttachMenu ? COLORS.jungleTeal : "rgba(255,255,255,0.1)"}`,
            color: showAttachMenu ? COLORS.jungleTeal : "rgba(255,255,255,0.6)",
            cursor: "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            flexShrink: 0,
          }}
          title="File sharing is disabled (text-only chat)"
        >
          {showAttachMenu ? <X size={20} /> : <Paperclip size={20} />}
        </button>
        
        <div style={{ 
          flex: 1, 
          background: "rgba(255,255,255,0.05)",
          borderRadius: 14,
          border: "1px solid rgba(255,255,255,0.1)",
          display: "flex",
          alignItems: "flex-end",
          padding: "4px 4px 4px 16px",
        }}>
          <textarea
            ref={inputRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            disabled={disabled}
            rows={1}
            style={{
              flex: 1,
              background: "none",
              border: "none",
              color: "white",
              fontSize: 14,
              outline: "none",
              resize: "none",
              padding: "10px 0",
              maxHeight: 120,
              fontFamily: "'DM Sans', sans-serif",
            }}
          />
          <button
            style={{
              background: "none",
              border: "none",
              color: "rgba(255,255,255,0.5)",
              cursor: "not-allowed",
              padding: 10,
              display: "flex",
              alignItems: "center",
            }}
            disabled
            title="Reactions are not enabled yet"
          >
            <Smile size={20} />
          </button>
        </div>
        
        <button
          onClick={handleSend}
          disabled={disabled || !message.trim()}
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: message.trim() 
              ? `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)`
              : "rgba(255,255,255,0.05)",
            border: "none",
            color: message.trim() ? "white" : "rgba(255,255,255,0.3)",
            cursor: disabled ? "not-allowed" : message.trim() ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            flexShrink: 0,
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

const AttachOption = ({ icon, label, color }) => (
  <button
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      padding: 12,
      background: `${color}15`,
      border: `1px solid ${color}30`,
      borderRadius: 12,
      color: color,
      cursor: "pointer",
      transition: "all 0.2s",
      minWidth: 70,
    }}
  >
    {icon}
    <span style={{ fontSize: 11, fontWeight: 500 }}>{label}</span>
  </button>
);

// ==================== CONTACT INFO PANEL ====================
const ContactInfoPanel = ({ contact, onClose }) => {
  const isGroup = contact.type === "group";
  
  return (
    <div style={{
      width: 320,
      height: "100%",
      background: "rgba(7, 30, 34, 0.95)",
      backdropFilter: "blur(20px)",
      borderLeft: "1px solid rgba(255,255,255,0.08)",
      display: "flex",
      flexDirection: "column",
      animation: "slideInRight 0.3s ease-out",
    }}>
      <div style={{
        padding: "20px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ fontWeight: 600, color: "white" }}>
          {isGroup ? "Group Info" : "Contact Info"}
        </span>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            color: "rgba(255,255,255,0.6)",
            cursor: "pointer",
          }}
        >
          <X size={20} />
        </button>
      </div>
      
      <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
        {/* Avatar & Name */}
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Avatar
            name={contact.name}
            avatar={contact.avatar}
            size={100}
            status={contact.status}
            isGroup={isGroup}
          />
          <h3 style={{ color: "white", marginTop: 16, marginBottom: 4 }}>{contact.name}</h3>
          {!isGroup && (
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>{contact.role}</p>
          )}
        </div>
        
        {/* Contact Details */}
        {!isGroup && (
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
              Contact Details
            </h4>
            {contact.email && (
              <InfoRow icon={<AtSign size={16} />} label="Email" value={contact.email} />
            )}
            {contact.phone && (
              <InfoRow icon={<Phone size={16} />} label="Phone" value={contact.phone} />
            )}
          </div>
        )}
        
        {/* Group Members */}
        {isGroup && contact.members && (
          <div>
            <h4 style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 12, textTransform: "uppercase" }}>
              {contact.memberCount} Members
            </h4>
            {contact.members.map((member, idx) => (
              <div key={idx} style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "10px 0",
                borderBottom: "1px solid rgba(255,255,255,0.05)",
              }}>
                <Avatar
                  name={member}
                  avatar={member.split(" ").map(n => n[0]).join("")}
                  size={36}
                />
                <span style={{ color: "white", fontSize: 14 }}>{member}</span>
                {member === "You" && (
                  <span style={{
                    fontSize: 11,
                    color: COLORS.jungleTeal,
                    background: `${COLORS.jungleTeal}20`,
                    padding: "2px 8px",
                    borderRadius: 10,
                    marginLeft: "auto",
                  }}>
                    You
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Actions */}
        <div style={{ marginTop: 24 }}>
          <ActionButton icon={<BellOff size={18} />} label="Mute notifications" />
          <ActionButton icon={<Star size={18} />} label="Add to favorites" />
          <ActionButton icon={<Archive size={18} />} label="Archive chat" />
          <ActionButton icon={<Trash2 size={18} />} label="Delete chat" danger />
        </div>
      </div>
    </div>
  );
};

const InfoRow = ({ icon, label, value }) => (
  <div style={{
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 0",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  }}>
    <div style={{ color: COLORS.jungleTeal }}>{icon}</div>
    <div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{label}</div>
      <div style={{ fontSize: 14, color: "white", marginTop: 2 }}>{value}</div>
    </div>
  </div>
);

const ActionButton = ({ icon, label, danger }) => (
  <button
    style={{
      width: "100%",
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "14px 16px",
      background: "rgba(255,255,255,0.03)",
      border: "none",
      borderRadius: 10,
      color: danger ? COLORS.racingRed : "rgba(255,255,255,0.8)",
      cursor: "pointer",
      fontSize: 14,
      marginBottom: 8,
      transition: "all 0.2s",
    }}
    onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.06)"}
    onMouseLeave={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.03)"}
  >
    {icon}
    {label}
  </button>
);

// ==================== MAIN COMPONENT ====================
function MessagesPage({ isMobile = false }) {
  const [contacts, setContacts] = useState([]);
  const [activeContactId, setActiveContactId] = useState(null);
  const [messagesByConvId, setMessagesByConvId] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, unread, groups, direct
  const [showInfo, setShowInfo] = useState(false);
  const [isTyping] = useState(false);
  const [me, setMe] = useState(null);
  const [presence, setPresence] = useState({});
  const [_loadingChats, setLoadingChats] = useState(true);
  const [_loadingMessages, setLoadingMessages] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [newChatContacts, setNewChatContacts] = useState([]);
  const [newChatSearch, setNewChatSearch] = useState("");
  const socketRef = useRef(null);
  const subscribedConvRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  const activeContact = contacts.find(c => c.id === activeContactId);
  const activeMessages = messagesByConvId[activeContactId] || [];

  const formatDateLabel = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "Unknown";
    const today = new Date();
    const sameDay = (a, b) => a.toDateString() === b.toDateString();
    if (sameDay(d, today)) return "Today";
    const y = new Date(today);
    y.setDate(today.getDate() - 1);
    if (sameDay(d, y)) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const formatTimeLabel = (iso) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  const mapConversationToContact = useCallback(
    (c) => {
      const isGroup = c.type === "group";
      const peer = c.peer || null;
      const name = isGroup ? c.title : peer?.name || "User";
      const roleLabel = isGroup
        ? "Group"
        : peer?.role === "hr"
          ? "HR"
          : peer?.role === "pm"
            ? "Project Manager"
            : peer?.role === "intern"
              ? "Intern"
              : "User";

      const online = peer?.id ? !!presence[peer.id] : false;
      const status = isGroup ? null : online ? "online" : "offline";

      const last = c.lastMessage;
      const lastAt = last?.at || null;

      return {
        id: c.id,
        type: isGroup ? "group" : "individual",
        name,
        role: roleLabel,
        avatar: isGroup ? initials(name) : peer?.avatar || initials(name),
        status,
        lastSeen: null,
        unread: c.unreadCount || 0,
        pinned: false,
        canSend: !!c.canSend,
        readOnlyReason: c.readOnlyReason || null,
        peer,
        members: isGroup ? (c.members || []).map((m) => m?.name).filter(Boolean) : undefined,
        memberCount: isGroup ? (c.members || []).length : undefined,
        lastMessage: lastAt
          ? {
              text: last?.body || "",
              time: formatTimeLabel(lastAt),
              fromMe: String(last?.senderProfileId || "") === String(me?.id || ""),
            }
          : { text: "", time: "", fromMe: false },
      };
    },
    [me?.id, presence]
  );

  const toMessageVm = useCallback(
    (msg, contact) => {
      const isGroup = contact?.type === "group";
      const senderId = msg.senderProfileId;
      const fromMe = String(senderId) === String(me?.id || "");
      let from = fromMe ? "me" : "them";
      if (isGroup && !fromMe) {
        const member = (contact?.membersRaw || []).find((m) => String(m.id) === String(senderId));
        from = member?.name || "Member";
      }
      const createdAt = msg.createdAt || new Date().toISOString();
      return {
        id: msg.id,
        serverId: msg.id,
        senderProfileId: senderId,
        createdAt,
        from,
        text: msg.deleted ? "Message deleted" : msg.body,
        time: formatTimeLabel(createdAt),
        date: formatDateLabel(createdAt),
        status: fromMe ? "sent" : undefined,
        deleted: !!msg.deleted,
      };
    },
    [formatDateLabel, formatTimeLabel, me?.id]
  );

  const loadConversations = useCallback(async () => {
    setLoadingChats(true);
    try {
      const res = await messagesApi.conversations();
      const rows = res?.conversations || [];
      const mapped = rows.map((c) => {
        const contact = mapConversationToContact(c);
        // keep raw members for group sender name resolution
        if (contact.type === "group") contact.membersRaw = (c.members || []).map((m) => ({ id: m.id, name: m.name }));
        return contact;
      });
      setContacts(mapped);
      if (!activeContactId && mapped.length) setActiveContactId(mapped[0].id);
    } catch {
      setContacts([]);
    } finally {
      setLoadingChats(false);
    }
  }, [activeContactId, mapConversationToContact]);

  const loadMessages = useCallback(
    async (conversationId) => {
      if (!conversationId) return;
      setLoadingMessages(true);
      try {
        const res = await messagesApi.listMessages(conversationId, { limit: 100 });
        const msgs = res?.messages || [];
        const contact = contacts.find((c) => c.id === conversationId);
        const vm = msgs.map((m) => toMessageVm(m, contact));
        setMessagesByConvId((prev) => ({ ...prev, [conversationId]: vm }));
      } catch {
        setMessagesByConvId((prev) => ({ ...prev, [conversationId]: prev[conversationId] || [] }));
      } finally {
        setLoadingMessages(false);
      }
    },
    [contacts, toMessageVm]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await authApi.me();
        if (!cancelled) setMe(res?.profile || null);
      } catch {
        if (!cancelled) setMe(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!me?.id) return;
    loadConversations();
  }, [me?.id, loadConversations]);

  useEffect(() => {
    if (!me?.id) return;
    const socket = getRealtimeSocket();
    socketRef.current = socket;

    const onPresence = (p) => {
      const pid = p?.profileId;
      if (!pid) return;
      setPresence((prev) => ({ ...prev, [pid]: !!p?.online }));
    };
    const onPresenceList = (payload) => {
      const ids = payload?.onlineProfileIds || [];
      const next = {};
      ids.forEach((id) => {
        next[id] = true;
      });
      setPresence((prev) => ({ ...prev, ...next }));
    };
    const onConversationPing = () => {
      loadConversations();
    };
    const onMessage = (m) => {
      const convId = m?.conversationId;
      if (!convId) return;

      setContacts((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          const fromMe = String(m.senderProfileId || "") === String(me.id);
          const nextLast = {
            text: String(m.body || "").slice(0, 120),
            time: formatTimeLabel(m.createdAt),
            fromMe,
          };
          const bumpUnread = convId !== activeContactId && !fromMe;
          return { ...c, lastMessage: nextLast, unread: bumpUnread ? (Number(c.unread) || 0) + 1 : c.unread };
        })
      );

      setMessagesByConvId((prev) => {
        const list = prev[convId];
        if (!Array.isArray(list)) return prev;
        if (list.some((x) => String(x.serverId || x.id) === String(m.id))) return prev;
        const contact = contacts.find((c) => c.id === convId);
        const vm = toMessageVm(
          {
            id: m.id,
            senderProfileId: m.senderProfileId,
            body: m.body,
            createdAt: m.createdAt,
            deleted: false,
          },
          contact
        );
        return { ...prev, [convId]: [...list, vm] };
      });
    };
    const onMessageDeleted = (p) => {
      const convId = p?.conversationId;
      const msgId = p?.messageId;
      if (!convId || !msgId) return;
      setMessagesByConvId((prev) => {
        const list = prev[convId];
        if (!Array.isArray(list)) return prev;
        return {
          ...prev,
          [convId]: list.map((m) => (String(m.serverId || m.id) === String(msgId) ? { ...m, deleted: true, text: "Message deleted" } : m)),
        };
      });
    };

    socket.on("chat:presence", onPresence);
    socket.on("chat:presence:list", onPresenceList);
    socket.on("chat:conversation", onConversationPing);
    socket.on("chat:message", onMessage);
    socket.on("chat:message_deleted", onMessageDeleted);

    socket.emit("chat:presence:list");

    return () => {
      socket.off("chat:presence", onPresence);
      socket.off("chat:presence:list", onPresenceList);
      socket.off("chat:conversation", onConversationPing);
      socket.off("chat:message", onMessage);
      socket.off("chat:message_deleted", onMessageDeleted);
    };
  }, [activeContactId, contacts, formatTimeLabel, loadConversations, me?.id]);
  
  // Filter contacts
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = 
      filterType === "all" ||
      (filterType === "unread" && contact.unread > 0) ||
      (filterType === "groups" && contact.type === "group") ||
      (filterType === "direct" && contact.type === "individual");
    return matchesSearch && matchesFilter;
  });
  
  // Sort contacts: pinned first, then by last message time
  const sortedContacts = [...filteredContacts].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [activeMessages]);
  
  // Send message
  const handleSendMessage = useCallback(async (text) => {
    if (!activeContactId || !text.trim()) return;
    if (!activeContact?.canSend) {
      alert(activeContact?.readOnlyReason || "This conversation is read-only.");
      return;
    }
    
    const now = new Date().toISOString();
    const tempId = `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const optimistic = {
      id: tempId,
      serverId: null,
      senderProfileId: me?.id,
      createdAt: now,
      from: "me",
      text: text.trim(),
      time: formatTimeLabel(now),
      date: formatDateLabel(now),
      status: "sent",
      deleted: false,
    };
    
    setMessagesByConvId((prev) => ({
      ...prev,
      [activeContactId]: [...(prev[activeContactId] || []), optimistic],
    }));
    
    // Update last message in contact
    setContacts(prev => prev.map(c => 
      c.id === activeContactId 
        ? { ...c, lastMessage: { text: text.trim(), time: optimistic.time, fromMe: true }, unread: 0 }
        : c
    ));

    try {
      const res = await messagesApi.sendMessage(activeContactId, text.trim());
      const realId = res?.message?.id;
      const realCreatedAt = res?.message?.createdAt || now;
      if (realId) {
        setMessagesByConvId((prev) => ({
          ...prev,
          [activeContactId]: (prev[activeContactId] || []).map((m) =>
            m.id === tempId ? { ...m, id: realId, serverId: realId, createdAt: realCreatedAt } : m
          ),
        }));
      }
    } catch (e) {
      alert(e?.message || "Failed to send message");
      setMessagesByConvId((prev) => ({
        ...prev,
        [activeContactId]: (prev[activeContactId] || []).filter((m) => m.id !== tempId),
      }));
    }
  }, [activeContact?.canSend, activeContact?.readOnlyReason, activeContactId, formatDateLabel, formatTimeLabel, me?.id]);
  
  // Mark as read + subscribe when opening chat
  useEffect(() => {
    if (!activeContactId) return;
    setContacts((prev) => prev.map((c) => (c.id === activeContactId ? { ...c, unread: 0 } : c)));
    messagesApi.markRead(activeContactId).catch(() => {});

    const socket = socketRef.current;
    if (socket) {
      if (subscribedConvRef.current && subscribedConvRef.current !== activeContactId) {
        socket.emit("chat:unsubscribe", { conversationId: subscribedConvRef.current });
      }
      subscribedConvRef.current = activeContactId;
      socket.emit("chat:subscribe", { conversationId: activeContactId });
    }

    loadMessages(activeContactId);
  }, [activeContactId, loadMessages]);
  
  // Group messages by date
  const groupedMessages = activeMessages.reduce((groups, message) => {
    const date = message.date;
    if (!groups[date]) groups[date] = [];
    groups[date].push(message);
    return groups;
  }, {});
  
  return (
    <div style={{ 
      height: isMobile ? "calc(100vh - 140px)" : "calc(100vh - 180px)",
      display: "flex",
      background: "rgba(7, 30, 34, 0.5)",
      borderRadius: 20,
      overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.08)",
    }}>
      <style>{`
        @keyframes typing {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      
      {/* Contacts Sidebar */}
      {(!isMobile || !activeContactId) && (
        <div style={{
          width: isMobile ? "100%" : 340,
          borderRight: isMobile ? "none" : "1px solid rgba(255,255,255,0.08)",
          display: "flex",
          flexDirection: "column",
          background: "rgba(7, 30, 34, 0.8)",
        }}>
          {/* Search & Filters */}
          <div style={{ padding: 20 }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between",
              marginBottom: 16,
            }}>
              <h2 style={{ color: "white", fontSize: 20, fontWeight: 700, margin: 0 }}>
                Messages
              </h2>
              <button
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `${COLORS.jungleTeal}20`,
                  border: "none",
                  color: COLORS.jungleTeal,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onClick={async () => {
                  setShowNewChat(true);
                  setNewChatSearch("");
                  try {
                    const res = await messagesApi.contacts();
                    setNewChatContacts(res?.contacts || []);
                  } catch {
                    setNewChatContacts([]);
                  }
                }}
              >
                <Plus size={20} />
              </button>
            </div>
            
            {/* Search */}
            <div style={{ position: "relative", marginBottom: 12 }}>
              <Search 
                size={18} 
                style={{ 
                  position: "absolute", 
                  left: 14, 
                  top: "50%", 
                  transform: "translateY(-50%)",
                  color: "rgba(255,255,255,0.4)",
                }} 
              />
              <input
                type="text"
                placeholder="Search conversations..."
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
                  outline: "none",
                }}
              />
            </div>
            
            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { id: "all", label: "All" },
                { id: "unread", label: "Unread" },
                { id: "groups", label: "Groups" },
                { id: "direct", label: "Direct" },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 20,
                    border: "none",
                    background: filterType === tab.id ? COLORS.jungleTeal : "rgba(255,255,255,0.05)",
                    color: filterType === tab.id ? "white" : "rgba(255,255,255,0.6)",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Contacts List */}
          <div style={{ 
            flex: 1, 
            overflowY: "auto", 
            padding: "0 12px 12px",
          }}>
            {sortedContacts.length === 0 ? (
              <EmptyState
                icon={<MessageCircle size={32} color={COLORS.jungleTeal} />}
                title="No conversations"
                subtitle="Start a new conversation to connect with your team"
              />
            ) : (
              sortedContacts.map(contact => (
                <ContactItem
                  key={contact.id}
                  contact={contact}
                  isActive={activeContactId === contact.id}
                  onClick={() => setActiveContactId(contact.id)}
                  isMobile={isMobile}
                />
              ))
            )}
          </div>
        </div>
      )}
      
      {/* Chat Area */}
      {(!isMobile || activeContactId) && (
        <div style={{ 
          flex: 1, 
          display: "flex", 
          flexDirection: "column",
          background: `linear-gradient(180deg, rgba(7, 30, 34, 0.9) 0%, rgba(7, 30, 34, 0.95) 100%)`,
        }}>
          {activeContact ? (
            <>
              <ChatHeader
                contact={activeContact}
                onBack={() => setActiveContactId(null)}
                isMobile={isMobile}
              />
              
              {/* Messages Area */}
              <div style={{ 
                flex: 1, 
                overflowY: "auto", 
                padding: "20px 24px",
                display: "flex",
                flexDirection: "column",
              }}>
                {Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    <DateSeparator date={date} />
                    {msgs.map((message, idx) => (
                      <MessageBubble
                        key={message.id}
                        message={message}
                        isGroup={activeContact.type === "group"}
                        onReport={async (m) => {
                          const messageId = m?.serverId || m?.id;
                          if (!messageId || String(messageId).startsWith("tmp_")) return;
                          const reason = window.prompt("Why are you reporting this message? (optional)") || "";
                          try {
                            await messagesApi.reportMessage(messageId, { reason });
                            alert("Reported. HR has been notified.");
                          } catch (e) {
                            alert(e?.message || "Failed to report message");
                          }
                        }}
                        onDelete={async (m) => {
                          const messageId = m?.serverId || m?.id;
                          if (!messageId || String(messageId).startsWith("tmp_")) return;
                          if (!window.confirm("Delete this message?")) return;
                          try {
                            await messagesApi.deleteMessage(messageId);
                          } catch (e) {
                            alert(e?.message || "Failed to delete message");
                          }
                        }}
                        showAvatar={
                          activeContact.type === "group" &&
                          message.from !== "me" &&
                          (idx === 0 || msgs[idx - 1].from !== message.from)
                        }
                      />
                    ))}
                  </div>
                ))}
                
                {isTyping && (
                  <div style={{ paddingLeft: activeContact.type === "group" ? 44 : 0 }}>
                    <TypingIndicator />
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
              
              <MessageInput onSend={handleSendMessage} disabled={!activeContact?.canSend} readOnlyReason={activeContact?.readOnlyReason} />
            </>
          ) : (
            <EmptyState
              icon={<MessageCircle size={40} color={COLORS.jungleTeal} />}
              title="Select a conversation"
              subtitle="Choose a contact from the list to start messaging"
            />
          )}
        </div>
      )}

      {/* New chat modal */}
      {showNewChat && (
        <div
          onClick={() => setShowNewChat(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 3000,
            padding: 16,
          }}
        >
          <div
            className="glass"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "100%",
              maxWidth: 520,
              borderRadius: 18,
              padding: 16,
              background: "rgba(7, 30, 34, 0.95)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <div style={{ fontWeight: 900, color: "white", fontSize: 16 }}>Start a new chat</div>
              <button
                onClick={() => setShowNewChat(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: "rgba(255,255,255,0.08)",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ marginTop: 12, position: "relative" }}>
              <Search
                size={16}
                style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.4)" }}
              />
              <input
                value={newChatSearch}
                onChange={(e) => setNewChatSearch(e.target.value)}
                placeholder="Search people..."
                style={{
                  width: "100%",
                  padding: "10px 12px 10px 40px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.06)",
                  color: "white",
                  outline: "none",
                  fontSize: 13,
                }}
              />
            </div>

            <div style={{ marginTop: 12, maxHeight: 360, overflowY: "auto" }}>
              {(newChatContacts || [])
                .filter((c) => String(c.name || "").toLowerCase().includes(String(newChatSearch || "").toLowerCase()))
                .map((c) => (
                  <button
                    key={c.id}
                    onClick={async () => {
                      try {
                        const created = await messagesApi.createDirect(c.id);
                        const convId = created?.conversationId;
                        await loadConversations();
                        if (convId) setActiveContactId(convId);
                        setShowNewChat(false);
                      } catch (e) {
                        alert(e?.message || "Failed to start chat");
                      }
                    }}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "12px 12px",
                      background: "transparent",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 14,
                      color: "white",
                      cursor: "pointer",
                      marginBottom: 10,
                      display: "flex",
                      gap: 12,
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        background: `linear-gradient(135deg, ${COLORS.deepOcean} 0%, ${COLORS.jungleTeal} 100%)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                      }}
                    >
                      {c.avatar || initials(c.name || c.email)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {c.name}
                      </div>
                      <div style={{ marginTop: 2, fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{String(c.role || "").toUpperCase()}</div>
                    </div>
                  </button>
                ))}
              {(!newChatContacts || newChatContacts.length === 0) && (
                <div style={{ padding: 16, color: "rgba(255,255,255,0.6)", fontSize: 13 }}>
                  No available contacts yet. Ask HR to assign your PM to chat with teammates.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Contact Info Panel (Desktop only) */}
      {!isMobile && showInfo && activeContact && (
        <ContactInfoPanel
          contact={activeContact}
          onClose={() => setShowInfo(false)}
        />
      )}
    </div>
  );
}

export default MessagesPage;
