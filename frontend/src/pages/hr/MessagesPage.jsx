// MessagesPage.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Send, Search, MoreVertical, Paperclip, Smile, Check, CheckCheck, Plus, X } from "lucide-react";
import { authApi, messagesApi } from "../../lib/apiClient";
import { getRealtimeSocket } from "../../lib/realtime";

const COLORS = {
  inkBlack: "#071e22",
  deepOcean: "#1d7874",
  jungleTeal: "#679289",
  peachGlow: "#ffe5d9",
  racingRed: "#d90429",
};

function initials(nameOrEmail) {
  const s = String(nameOrEmail || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function formatListTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return d.toLocaleDateString();
}

const MessagesPage = ({ selectedIntern }) => {
  const [me, setMe] = useState(null);
  const [interns, setInterns] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [onlineProfileIds, setOnlineProfileIds] = useState(() => new Set());
  const [showNewChat, setShowNewChat] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsQuery, setContactsQuery] = useState("");
  const [uiNotice, setUiNotice] = useState({ open: false, message: "", tone: "info" });
  const chatBodyRef = useRef(null);
  const socketRef = useRef(null);
  const activeChatRef = useRef(null);
  const meRef = useRef(null);

  const showNotice = useCallback((message, tone = "info") => {
    setUiNotice({ open: true, message, tone });
  }, []);

  useEffect(() => {
    activeChatRef.current = activeChat;
  }, [activeChat]);

  useEffect(() => {
    meRef.current = me;
  }, [me]);

  const refreshConversations = useCallback(async () => {
    const res = await messagesApi.conversations();
    const list = Array.isArray(res?.conversations) ? res.conversations : [];

    const mapped = list.map((c) => {
      const title = c.title || c.name || "Conversation";
      const peerId = c.peer?.id ? String(c.peer.id) : null;
      return {
        id: c.id,
        type: c.type,
        name: title,
        avatar: initials(title),
        lastMessage: c.lastMessage?.body || "Start a conversation",
        lastMessageTime: c.lastMessage?.at ? formatListTime(c.lastMessage.at) : "",
        unreadCount: Number(c.unreadCount) || 0,
        online: false,
        typing: false,
        canSend: !!c.canSend && c.status === "active",
        status: c.status || "active",
        peerProfileId: peerId,
        peerLastReadAt: c.peerLastReadAt || null,
      };
    });

    setInterns(mapped);
    setLoadError("");
  }, []);

  // Socket wiring + initial load
  useEffect(() => {
    let cancelled = false;
    const socket = getRealtimeSocket();
    socketRef.current = socket;

    const onPresence = (payload) => {
      const pid = payload?.profileId ? String(payload.profileId) : null;
      const online = !!payload?.online;
      if (!pid) return;
      setOnlineProfileIds((prev) => {
        const next = new Set(prev);
        if (online) next.add(pid);
        else next.delete(pid);
        return next;
      });
    };

    const onPresenceList = (payload) => {
      const ids = Array.isArray(payload?.onlineProfileIds) ? payload.onlineProfileIds.map(String) : [];
      setOnlineProfileIds(new Set(ids));
    };

    const onConversation = () => {
      refreshConversations().catch(() => {});
    };

    const onRead = (payload) => {
      const convId = payload?.conversationId;
      const readerId = payload?.profileId ? String(payload.profileId) : null;
      const readAt = payload?.readAt || null;
      if (!convId || !readerId || !readAt) return;
      const meProfile = meRef.current;
      if (meProfile?.id && String(meProfile.id) === readerId) return;

      setInterns((prev) =>
        prev.map((c) =>
          String(c.id) === String(convId) && c.type === "direct" && String(c.peerProfileId || "") === readerId
            ? { ...c, peerLastReadAt: readAt }
            : c
        )
      );

      const currentChat = activeChatRef.current;
      if (!currentChat || String(currentChat.id) !== String(convId)) return;
      if (currentChat.type !== "direct" || String(currentChat.peerProfileId || "") !== readerId) return;

      setMessages((prev) =>
        prev.map((m) => {
          if (m.type !== "sent" || m.read || !m.createdAt) return m;
          return new Date(m.createdAt).getTime() <= new Date(readAt).getTime() ? { ...m, read: true } : m;
        })
      );
    };

    const onMessage = (payload) => {
      const convId = payload?.conversationId;
      if (!convId) return;
      const currentChat = activeChatRef.current;
      if (!currentChat || String(currentChat.id) !== String(convId)) {
        refreshConversations().catch(() => {});
        return;
      }

      setMessages((prev) => {
        if (prev.some((m) => String(m.id) === String(payload.id))) return prev;
        const meProfile = meRef.current;
        const fromMe = meProfile?.id && String(payload.senderProfileId) === String(meProfile.id);
        const createdAt = payload.createdAt || new Date().toISOString();
        const isReadByPeer =
          fromMe &&
          currentChat?.type === "direct" &&
          currentChat?.peerLastReadAt &&
          new Date(createdAt).getTime() <= new Date(currentChat.peerLastReadAt).getTime();

        if (fromMe) {
          const pendingIdx = prev.findIndex((m) => {
            if (!m?.pending) return false;
            if (m.type !== "sent") return false;
            if (String(m.senderId || "") !== String(meProfile?.id || "")) return false;
            if (m.text !== (payload.body || "")) return false;
            if (!m.createdAt) return true;
            return Date.now() - new Date(m.createdAt).getTime() < 60_000;
          });
          if (pendingIdx !== -1) {
            const next = prev.slice();
            next[pendingIdx] = {
              ...next[pendingIdx],
              id: payload.id,
              createdAt,
              timestamp: formatTime(createdAt),
              pending: false,
              read: !!isReadByPeer,
            };
            return next;
          }
        }
        return [
          ...prev,
          {
            id: payload.id,
            senderId: payload.senderProfileId,
            senderName: fromMe ? "You" : currentChat.name,
            text: payload.body || "",
            timestamp: formatTime(createdAt),
            createdAt,
            pending: false,
            read: !!isReadByPeer,
            type: fromMe ? "sent" : "received",
            deleted: false,
          },
        ];
      });

      const meProfile = meRef.current;
      const fromMe = meProfile?.id && String(payload.senderProfileId) === String(meProfile.id);
      if (!fromMe) messagesApi.markRead(convId).catch(() => {});
      refreshConversations().catch(() => {});
    };

    const onMessageDeleted = (payload) => {
      const convId = payload?.conversationId;
      const messageId = payload?.messageId;
      if (!convId || !messageId) return;
      const currentChat = activeChatRef.current;
      if (!currentChat || String(currentChat.id) !== String(convId)) {
        refreshConversations().catch(() => {});
        return;
      }
      setMessages((prev) =>
        prev.map((m) => (String(m.id) === String(messageId) ? { ...m, text: "", deleted: true } : m))
      );
    };

    socket.on("chat:presence", onPresence);
    socket.on("chat:presence:list", onPresenceList);
    socket.on("chat:conversation", onConversation);
    socket.on("chat:read", onRead);
    socket.on("chat:message", onMessage);
    socket.on("chat:message_deleted", onMessageDeleted);

    const load = async () => {
      setLoadError("");
      try {
        const meRes = await authApi.me();
        if (!cancelled) setMe(meRes?.profile || null);
        await refreshConversations();
      } catch (err) {
        if (!cancelled) setLoadError(err?.message || "Failed to load conversations");
      }
    };
    load();
    socket.emit("chat:presence:list");

    return () => {
      cancelled = true;
      socket.off("chat:presence", onPresence);
      socket.off("chat:presence:list", onPresenceList);
      socket.off("chat:conversation", onConversation);
      socket.off("chat:read", onRead);
      socket.off("chat:message", onMessage);
      socket.off("chat:message_deleted", onMessageDeleted);
    };
  }, [refreshConversations]);

  // Keep online status updated in the sidebar when presence changes.
  useEffect(() => {
    setInterns((prev) =>
      prev.map((c) => ({
        ...c,
        online: c.peerProfileId ? onlineProfileIds.has(String(c.peerProfileId)) : false,
      }))
    );
  }, [onlineProfileIds]);

  // Auto-open DM when coming from user selection (intern/pm/hr).
  useEffect(() => {
    if (!selectedIntern) return;
    const targetProfileId = selectedIntern?.id || selectedIntern?.profileId || selectedIntern?.profile_id;
    if (!targetProfileId) return;

    let cancelled = false;
    const open = async () => {
      try {
        const created = await messagesApi.createDirect(targetProfileId);
        if (cancelled) return;
        await refreshConversations();
        const convId = created?.conversationId;
        const label = selectedIntern.fullName || selectedIntern.name || selectedIntern.email || "Conversation";
        setActiveChat({ id: convId, name: label, avatar: initials(label) });
      } catch (err) {
        if (!cancelled) setLoadError(err?.message || "Unable to open chat");
      }
    };
    open();
    return () => {
      cancelled = true;
    };
  }, [selectedIntern, refreshConversations]);

  // Default active chat.
  useEffect(() => {
    if (!activeChat && interns.length > 0) setActiveChat(interns[0]);
  }, [activeChat, interns]);

  // Keep active chat object in sync with refreshed sidebar data.
  useEffect(() => {
    setActiveChat((prev) => {
      if (!prev?.id) return prev;
      const match = interns.find((c) => String(c.id) === String(prev.id));
      if (!match || match === prev) return prev;
      return match;
    });
  }, [interns]);

  // Load messages + subscribe whenever active chat changes.
  useEffect(() => {
    const convId = activeChat?.id;
    const socket = socketRef.current;
    if (!convId || !socket) return () => {};

    socket.emit("chat:subscribe", { conversationId: convId });
    let cancelled = false;
    const load = async () => {
      try {
        const res = await messagesApi.listMessages(convId, { limit: 100 });
        if (cancelled) return;
        const mapped = (res?.messages || []).map((m) => {
          const fromMe = me?.id && String(m.senderProfileId) === String(me.id);
          const createdAt = m.createdAt || new Date().toISOString();
          const isReadByPeer =
            fromMe &&
            activeChat?.type === "direct" &&
            activeChat?.peerLastReadAt &&
            new Date(createdAt).getTime() <= new Date(activeChat.peerLastReadAt).getTime();
          return {
            id: m.id,
            senderId: m.senderProfileId,
            senderName: fromMe ? "You" : activeChat?.name || "User",
            text: m.deleted ? "" : m.body,
            timestamp: formatTime(createdAt),
            createdAt,
            pending: false,
            read: !!isReadByPeer,
            type: fromMe ? "sent" : "received",
            deleted: !!m.deleted,
          };
        });
        setMessages(mapped);
        messagesApi.markRead(convId).catch(() => {});
        refreshConversations().catch(() => {});
      } catch (err) {
        if (!cancelled) setLoadError(err?.message || "Failed to load messages");
      }
    };
    load();

    return () => {
      cancelled = true;
      socket.emit("chat:unsubscribe", { conversationId: convId });
    };
  }, [activeChat?.id, activeChat?.name, activeChat?.type, activeChat?.peerLastReadAt, me?.id, refreshConversations]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages]);

  // Typing indicator placeholder (no typing events wired yet)
  useEffect(() => {
    if (messageInput.length > 0) {
      const timeout = setTimeout(() => {
        setIsTyping(false);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [messageInput]);

  useEffect(() => {
    if (!uiNotice.open) return undefined;
    const timeout = setTimeout(() => {
      setUiNotice((prev) => ({ ...prev, open: false }));
    }, 3000);
    return () => clearTimeout(timeout);
  }, [uiNotice.open]);

  const handleSendMessage = useCallback(async () => {
    const convId = activeChat?.id;
    const text = messageInput.trim();
    if (!convId || !text) return;

    if (activeChat.status !== "active" || !activeChat.canSend) {
      showNotice("This conversation is read-only.", "error");
      return;
    }

    const tempId = `tmp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      senderId: me?.id || "me",
      senderName: "You",
      text,
      timestamp: formatTime(new Date().toISOString()),
      createdAt: new Date().toISOString(),
      pending: true,
      read: false,
      type: "sent",
      deleted: false,
    };

    setMessages((prev) => [...prev, optimistic]);
    setMessageInput("");

    try {
      const res = await messagesApi.sendMessage(convId, text);
      const realId = res?.message?.id;
      const createdAt = res?.message?.createdAt;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId
            ? {
                ...m,
                id: realId || m.id,
                createdAt: createdAt || m.createdAt,
                timestamp: createdAt ? formatTime(createdAt) : m.timestamp,
                pending: false,
              }
            : m
        )
      );
      refreshConversations().catch(() => {});
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      showNotice(err?.message || "Failed to send message", "error");
    }
  }, [activeChat?.canSend, activeChat?.id, activeChat?.status, me?.id, messageInput, refreshConversations, showNotice]);

  const openNewChat = useCallback(async () => {
    setShowNewChat(true);
    setContactsQuery("");
    setContactsLoading(true);
    try {
      const res = await messagesApi.contacts();
      setContacts(Array.isArray(res?.contacts) ? res.contacts : []);
    } catch (err) {
      setContacts([]);
      showNotice(err?.message || "Failed to load contacts", "error");
    } finally {
      setContactsLoading(false);
    }
  }, [showNotice]);

  const filteredContacts = contacts.filter((c) => {
    const q = contactsQuery.trim().toLowerCase();
    if (!q) return true;
    return String(c.name || "").toLowerCase().includes(q) || String(c.email || "").toLowerCase().includes(q);
  });

  const startDirectWith = useCallback(
    async (profileId, label) => {
      try {
        const created = await messagesApi.createDirect(profileId);
        await refreshConversations();
        const convId = created?.conversationId;
        setActiveChat({ id: convId, name: label || "Conversation", avatar: initials(label || "Conversation") });
        setShowNewChat(false);
      } catch (err) {
        showNotice(err?.message || "Failed to start chat", "error");
      }
    },
    [refreshConversations, showNotice]
  );

  const filteredInterns = interns.filter((intern) => intern.name.toLowerCase().includes(searchQuery.toLowerCase()));

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
          <div style={{ position: "relative", display: "flex", gap: 10 }}>
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
            <button
              onClick={openNewChat}
              style={{
                width: 42,
                height: 42,
                flexShrink: 0,
                borderRadius: 10,
                border: `1px solid rgba(103, 146, 137, 0.3)`,
                background: "rgba(103, 146, 137, 0.1)",
                color: COLORS.peachGlow,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              title="New chat"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>




        {/* Interns List - SCROLLABLE */}
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {loadError && (
            <div style={{ padding: "12px 20px", color: COLORS.racingRed, fontSize: "12px" }}>
              {loadError}
            </div>
          )}
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
                    {activeChat.status !== "active" || !activeChat.canSend
                      ? "Read-only"
                      : activeChat.online
                        ? "Active now"
                        : "Offline"}
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
                        opacity: message.deleted ? 0.7 : 1,
                        fontStyle: message.deleted ? "italic" : "normal",
                      }}
                    >
                      {message.deleted ? "Message deleted" : message.text}
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
                            <Check
                              size={14}
                              color={message.pending ? "rgba(255, 229, 217, 0.35)" : "rgba(255, 229, 217, 0.6)"}
                            />
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
                disabled={messageInput.trim() === "" || !activeChat?.canSend || activeChat?.status !== "active"}
                style={{
                  padding: "10px 20px",
                  background:
                    messageInput.trim() === "" || !activeChat?.canSend || activeChat?.status !== "active"
                      ? "rgba(103, 146, 137, 0.3)"
                      : `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`,
                  border: "none",
                  borderRadius: "8px",
                  color: COLORS.peachGlow,
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor:
                    messageInput.trim() === "" || !activeChat?.canSend || activeChat?.status !== "active"
                      ? "not-allowed"
                      : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "all 0.3s ease",
                  opacity: messageInput.trim() === "" || !activeChat?.canSend || activeChat?.status !== "active" ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (messageInput.trim() !== "" && activeChat?.canSend && activeChat?.status === "active") {
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

      {showNewChat && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000,
            padding: 16,
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setShowNewChat(false);
          }}
        >
          <div
            style={{
              width: "min(720px, 96vw)",
              maxHeight: "min(640px, 90vh)",
              overflow: "hidden",
              borderRadius: 16,
              border: `1px solid rgba(103, 146, 137, 0.25)`,
              background: COLORS.inkBlack,
              boxShadow: "0 20px 70px rgba(0,0,0,0.5)",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ padding: 16, borderBottom: `1px solid rgba(103, 146, 137, 0.2)`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontWeight: 800, color: COLORS.peachGlow }}>Start a new chat</div>
              <button
                onClick={() => setShowNewChat(false)}
                style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid rgba(103, 146, 137, 0.25)`, background: "rgba(255,255,255,0.06)", color: COLORS.peachGlow, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: 16, borderBottom: `1px solid rgba(103, 146, 137, 0.15)` }}>
              <input
                value={contactsQuery}
                onChange={(e) => setContactsQuery(e.target.value)}
                placeholder="Search people..."
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  background: "rgba(103, 146, 137, 0.1)",
                  border: `1px solid rgba(103, 146, 137, 0.3)`,
                  borderRadius: "10px",
                  color: COLORS.peachGlow,
                  fontSize: "13px",
                  outline: "none",
                }}
              />
              <div style={{ marginTop: 8, fontSize: 12, color: "rgba(255, 229, 217, 0.65)" }}>
                HR can message any intern, PM, or HR.
              </div>
            </div>

            <div style={{ padding: 10, overflowY: "auto" }}>
              {contactsLoading && (
                <div style={{ padding: 12, color: "rgba(255, 229, 217, 0.7)", fontSize: 13 }}>Loading...</div>
              )}
              {!contactsLoading && filteredContacts.length === 0 && (
                <div style={{ padding: 12, color: "rgba(255, 229, 217, 0.7)", fontSize: 13 }}>No contacts found.</div>
              )}
              {!contactsLoading &&
                filteredContacts.map((c) => {
                  const label = c.name || c.email || "User";
                  return (
                    <button
                      key={c.id}
                      onClick={() => startDirectWith(c.id, label)}
                      style={{
                        width: "100%",
                        textAlign: "left",
                        padding: 12,
                        borderRadius: 12,
                        border: `1px solid rgba(103, 146, 137, 0.15)`,
                        background: "rgba(255,255,255,0.03)",
                        color: COLORS.peachGlow,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                        <div style={{ width: 40, height: 40, borderRadius: "50%", background: `linear-gradient(135deg, ${COLORS.jungleTeal}, ${COLORS.deepOcean})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                          {initials(label)}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{label}</div>
                          <div style={{ fontSize: 12, color: "rgba(255, 229, 217, 0.65)" }}>
                            {String(c.role || "").toUpperCase()} {c.email ? `• ${c.email}` : ""}
                          </div>
                        </div>
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255, 229, 217, 0.65)" }}>Start</div>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {uiNotice.open && (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 20,
            zIndex: 2400,
            minWidth: 240,
            maxWidth: 420,
            padding: "12px 14px",
            borderRadius: 12,
            border: `1px solid ${
              uiNotice.tone === "error" ? "rgba(239,68,68,0.45)" : "rgba(20,184,166,0.45)"
            }`,
            background: uiNotice.tone === "error" ? "rgba(239,68,68,0.2)" : "rgba(20,184,166,0.2)",
            color: COLORS.peachGlow,
            backdropFilter: "blur(8px)",
            boxShadow: "0 12px 32px rgba(0,0,0,0.28)",
          }}
        >
          {uiNotice.message}
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
