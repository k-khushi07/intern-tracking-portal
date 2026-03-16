const express = require("express");
const { httpError } = require("../errors");
const { restSelect, restInsert, restUpdate, restRpc } = require("../services/supabaseRest");
const { createNotifications, toClientNotification, isMissingTableError } = require("../services/notifications");

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function initials(nameOrEmail) {
  const s = String(nameOrEmail || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function isoNow() {
  return new Date().toISOString();
}

async function getProfile(profileId) {
  const rows = await restSelect({
    table: "profiles",
    select: "id,email,full_name,role,status,pm_id,pm_code",
    filters: { id: `eq.${profileId}`, limit: 1 },
    accessToken: null,
    useServiceRole: true,
  });
  return rows?.[0] || null;
}

async function listProfilesByRole(role) {
  const rows = await restSelect({
    table: "profiles",
    select: "id,email,full_name,role,status,pm_id,pm_code",
    filters: { role: `eq.${role}`, status: "eq.active" },
    accessToken: null,
    useServiceRole: true,
  });
  return rows || [];
}

async function listInternsByPm(pmId) {
  const rows = await restSelect({
    table: "profiles",
    select: "id,email,full_name,role,status,pm_id,intern_id",
    filters: { role: "eq.intern", pm_id: `eq.${pmId}`, status: "eq.active" },
    accessToken: null,
    useServiceRole: true,
  });
  return rows || [];
}

async function getAllowedContacts({ requester }) {
  const role = normalizeRole(requester.role);
  if (!role) return [];

  const hrs = await listProfilesByRole("hr");
  if (role === "intern") {
    const contacts = [];
    // HRs
    contacts.push(...hrs);
    // Assigned PM
    if (requester.pm_id) {
      const pm = await getProfile(requester.pm_id);
      if (pm && normalizeRole(pm.role) === "pm") contacts.push(pm);
      // Same-team interns
      const team = await listInternsByPm(requester.pm_id);
      contacts.push(...team.filter((p) => p.id !== requester.id));
    }
    // Deduplicate
    const seen = new Set();
    return contacts.filter((c) => {
      if (!c?.id) return false;
      if (c.id === requester.id) return false;
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }

  if (role === "pm") {
    const contacts = [];
    contacts.push(...hrs);
    const interns = await listInternsByPm(requester.id);
    contacts.push(...interns);
    const pms = await listProfilesByRole("pm");
    contacts.push(...pms.filter((p) => p.id !== requester.id));
    const seen = new Set();
    return contacts.filter((c) => {
      if (!c?.id) return false;
      if (c.id === requester.id) return false;
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }

  if (role === "hr" || role === "admin") {
    const interns = await restSelect({
      table: "profiles",
      select: "id,email,full_name,role,status,pm_id,pm_code,intern_id",
      filters: { role: "eq.intern", status: "eq.active" },
      accessToken: null,
      useServiceRole: true,
    });
    const pms = await restSelect({
      table: "profiles",
      select: "id,email,full_name,role,status,pm_id,pm_code",
      filters: { role: "eq.pm", status: "eq.active" },
      accessToken: null,
      useServiceRole: true,
    });
    const othersHr = await listProfilesByRole("hr");
    const contacts = [...(interns || []), ...(pms || []), ...(othersHr || [])];
    const seen = new Set();
    return contacts.filter((c) => {
      if (!c?.id) return false;
      if (c.id === requester.id) return false;
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  }

  return [];
}

function sortPair(a, b) {
  const as = String(a);
  const bs = String(b);
  return as < bs ? [a, b] : [b, a];
}

async function getConversationMemberRow({ conversationId, profileId }) {
  const rows = await restSelect({
    table: "conversation_members",
    select: "id,conversation_id,profile_id,can_send,unread_count,last_read_at,is_active",
    filters: { conversation_id: `eq.${conversationId}`, profile_id: `eq.${profileId}`, limit: 1 },
    accessToken: null,
    useServiceRole: true,
  });
  return rows?.[0] || null;
}

async function assertActiveMember({ conversationId, profileId }) {
  const m = await getConversationMemberRow({ conversationId, profileId });
  if (!m || !m.is_active) throw httpError(403, "Forbidden", true);
  return m;
}

async function getConversation(conversationId) {
  const rows = await restSelect({
    table: "conversations",
    select:
      "id,type,name,status,read_only_reason,owner_profile_id,created_by_profile_id,direct_a,direct_b,last_message_at,last_message_body,last_message_sender_profile_id,created_at,updated_at",
    filters: { id: `eq.${conversationId}`, limit: 1 },
    accessToken: null,
    useServiceRole: true,
  });
  return rows?.[0] || null;
}

async function ensureConversationMember({ conversationId, profileId, role = null }) {
  const existing = await restSelect({
    table: "conversation_members",
    select: "id",
    filters: { conversation_id: `eq.${conversationId}`, profile_id: `eq.${profileId}`, limit: 1 },
    accessToken: null,
    useServiceRole: true,
  });

  const now = isoNow();
  if (existing?.[0]?.id) {
    await restUpdate({
      table: "conversation_members",
      patch: { is_active: true, left_at: null, joined_at: now, can_send: true, role: role || null },
      matchQuery: { id: `eq.${existing[0].id}` },
      accessToken: null,
      useServiceRole: true,
    });
    return;
  }

  await restInsert({
    table: "conversation_members",
    rows: { conversation_id: conversationId, profile_id: profileId, role: role || null, joined_at: now, is_active: true, can_send: true, unread_count: 0 },
    accessToken: null,
    useServiceRole: true,
  });
}

async function listConversationMembers(conversationId) {
  const rows = await restSelect({
    table: "conversation_members",
    select: "profile_id,role,can_send,unread_count,is_active,joined_at",
    filters: { conversation_id: `eq.${conversationId}`, is_active: "eq.true" },
    accessToken: null,
    useServiceRole: true,
  });
  return rows || [];
}

function mapContact(profile) {
  const displayName = profile.full_name || profile.email;
  return {
    id: profile.id,
    name: displayName,
    role: normalizeRole(profile.role),
    avatar: initials(displayName),
    email: profile.email,
    pmId: profile.pm_id || null,
    pmCode: profile.pm_code || null,
    internId: profile.intern_id || null,
  };
}

function createMessagesRouter() {
  const router = express.Router();

  router.get("/contacts", async (req, res, next) => {
    try {
      const requester = req.auth.profile;
      const contacts = await getAllowedContacts({ requester });
      res.status(200).json({ success: true, contacts: contacts.map(mapContact) });
    } catch (err) {
      next(err);
    }
  });

  router.get("/conversations", async (req, res, next) => {
    try {
      const requester = req.auth.profile;
      const membershipRows = await restSelect({
        table: "conversation_members",
        select: "conversation_id,can_send,unread_count,last_read_at,is_active",
        filters: { profile_id: `eq.${requester.id}`, is_active: "eq.true" },
        accessToken: null,
        useServiceRole: true,
      });

      const ids = (membershipRows || []).map((m) => m.conversation_id).filter(Boolean);
      if (!ids.length) {
        res.status(200).json({ success: true, conversations: [] });
        return;
      }

      const convRows = await restSelect({
        table: "conversations",
        select:
          "id,type,name,status,read_only_reason,owner_profile_id,direct_a,direct_b,last_message_at,last_message_body,last_message_sender_profile_id,updated_at,created_at",
        filters: { id: `in.(${ids.join(",")})`, order: "last_message_at.desc.nullslast,created_at.desc" },
        accessToken: null,
        useServiceRole: true,
      });

      const members = await restSelect({
        table: "conversation_members",
        select: "conversation_id,profile_id,role,is_active,last_read_at,profile:profile_id(id,email,full_name,role,pm_id,pm_code,intern_id)",
        filters: { conversation_id: `in.(${ids.join(",")})`, is_active: "eq.true" },
        accessToken: null,
        useServiceRole: true,
      });

      const memberByConv = new Map();
      (members || []).forEach((m) => {
        const key = m.conversation_id;
        if (!memberByConv.has(key)) memberByConv.set(key, []);
        memberByConv.get(key).push({
          profileId: m.profile_id,
          role: normalizeRole(m.role || m.profile?.role),
          profile: m.profile ? mapContact(m.profile) : null,
          lastReadAt: m.last_read_at || null,
        });
      });

      const membershipByConv = new Map();
      (membershipRows || []).forEach((m) => membershipByConv.set(m.conversation_id, m));

      const conversations = (convRows || []).map((c) => {
        const mem = membershipByConv.get(c.id);
        const convMembers = memberByConv.get(c.id) || [];

        let title = c.name || "Conversation";
        let peer = null;
        let peerLastReadAt = null;
        if (c.type === "direct") {
          const peerMember = convMembers.find((m) => m.profileId !== requester.id) || null;
          peer = peerMember?.profile || null;
          peerLastReadAt = peerMember?.lastReadAt || null;
          if (peer) title = peer.name;
        }

        return {
          id: c.id,
          type: c.type,
          status: c.status,
          readOnlyReason: c.read_only_reason || null,
          title,
          peer,
          peerLastReadAt,
          members: convMembers.map((m) => m.profile).filter(Boolean),
          canSend: !!mem?.can_send && c.status === "active",
          unreadCount: Number(mem?.unread_count) || 0,
          lastReadAt: mem?.last_read_at || null,
          lastMessage: c.last_message_at
            ? {
                at: c.last_message_at,
                body: c.last_message_body || "",
                senderProfileId: c.last_message_sender_profile_id || null,
              }
            : null,
        };
      });

      res.status(200).json({ success: true, conversations });
    } catch (err) {
      next(err);
    }
  });

  router.post("/conversations/direct", async (req, res, next) => {
    try {
      const requester = req.auth.profile;
      const { targetProfileId } = req.body || {};
      if (!targetProfileId) throw httpError(400, "targetProfileId is required", true);

      const contacts = await getAllowedContacts({ requester });
      const allowedIds = new Set(contacts.map((c) => c.id));
      if (!allowedIds.has(targetProfileId)) throw httpError(403, "Forbidden", true);

      const [a, b] = sortPair(requester.id, targetProfileId);
      const existing = await restSelect({
        table: "conversations",
        select: "id,status,type",
        filters: { type: "eq.direct", direct_a: `eq.${a}`, direct_b: `eq.${b}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });
      const row = existing?.[0] || null;
      const now = isoNow();
      if (row?.id) {
        if (row.status !== "active") {
          await restUpdate({
            table: "conversations",
            patch: { status: "active", read_only_reason: null, updated_at: now },
            matchQuery: { id: `eq.${row.id}` },
            accessToken: null,
            useServiceRole: true,
          });
        }
        // Defensive: ensure both members exist and are active.
        await ensureConversationMember({ conversationId: row.id, profileId: requester.id, role: requester.role });
        await ensureConversationMember({ conversationId: row.id, profileId: targetProfileId, role: null });
        res.status(200).json({ success: true, conversationId: row.id });
        return;
      }

      let convId = null;
      try {
        const inserted = await restInsert({
          table: "conversations",
          rows: {
            type: "direct",
            direct_a: a,
            direct_b: b,
            status: "active",
            created_by_profile_id: requester.id,
            owner_profile_id: null,
            created_at: now,
            updated_at: now,
          },
          accessToken: null,
          useServiceRole: true,
        });
        convId = inserted?.[0]?.id || inserted?.id || null;
      } catch (err) {
        const msg = String(err?.message || "");
        const status = Number(err?.status || 0);
        // Race condition: two clients create same DM at once.
        if (status === 409 || msg.toLowerCase().includes("conversations_direct_unique") || msg.toLowerCase().includes("duplicate key")) {
          const retry = await restSelect({
            table: "conversations",
            select: "id,status,type",
            filters: { type: "eq.direct", direct_a: `eq.${a}`, direct_b: `eq.${b}`, limit: 1 },
            accessToken: null,
            useServiceRole: true,
          });
          const found = retry?.[0] || null;
          if (found?.id) {
            convId = found.id;
            if (found.status !== "active") {
              await restUpdate({
                table: "conversations",
                patch: { status: "active", read_only_reason: null, updated_at: isoNow() },
                matchQuery: { id: `eq.${convId}` },
                accessToken: null,
                useServiceRole: true,
              });
            }
          } else {
            throw err;
          }
        } else {
          throw err;
        }
      }

      if (!convId) throw httpError(502, "Failed to create conversation", true);
      await ensureConversationMember({ conversationId: convId, profileId: requester.id, role: requester.role });
      await ensureConversationMember({ conversationId: convId, profileId: targetProfileId, role: null });

      res.status(201).json({ success: true, conversationId: convId });
    } catch (err) {
      next(err);
    }
  });

  router.post("/conversations/group", async (req, res, next) => {
    try {
      const requester = req.auth.profile;
      const role = normalizeRole(requester.role);
      const { name, memberProfileIds } = req.body || {};
      if (!name) throw httpError(400, "name is required", true);
      const members = Array.isArray(memberProfileIds) ? memberProfileIds.filter(Boolean) : [];

      if (role === "intern") throw httpError(403, "Interns cannot create groups", true);

      const now = isoNow();
      const inserted = await restInsert({
        table: "conversations",
        rows: {
          type: "group",
          name: String(name).trim().slice(0, 80),
          status: "active",
          created_by_profile_id: requester.id,
          owner_profile_id: requester.id,
          created_at: now,
          updated_at: now,
        },
        accessToken: null,
        useServiceRole: true,
      });
      const convId = inserted?.[0]?.id || inserted?.id;
      if (!convId) throw httpError(502, "Failed to create group", true);

      const contacts = await getAllowedContacts({ requester });
      const allowedIds = new Set(contacts.map((c) => c.id));
      const hrIds = new Set((await listProfilesByRole("hr")).map((h) => h.id));

      let finalMembers = [...new Set(members)];
      if (role === "pm") {
        // PM can group with assigned interns, HR, and other PMs allowed by policy.
        finalMembers = finalMembers.filter((id) => allowedIds.has(id) || hrIds.has(id));
        finalMembers.push(requester.id);
      } else if (role === "hr" || role === "admin") {
        // HR can create groups with any interns/PMs; HR is not auto-added unless included.
        finalMembers = finalMembers.filter((id) => allowedIds.has(id) || hrIds.has(id));
      }

      // Always keep unique and active members.
      finalMembers = [...new Set(finalMembers)];
      if (!finalMembers.length) throw httpError(400, "memberProfileIds must include at least 1 member", true);

      await restInsert({
        table: "conversation_members",
        rows: finalMembers.map((pid) => ({
          conversation_id: convId,
          profile_id: pid,
          role: null,
          joined_at: now,
          is_active: true,
          can_send: true,
          unread_count: 0,
        })),
        accessToken: null,
        useServiceRole: true,
      });

      res.status(201).json({ success: true, conversationId: convId });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/conversations/:id/members", async (req, res, next) => {
    try {
      const requester = req.auth.profile;
      const role = normalizeRole(requester.role);
      const convId = req.params.id;
      const { add, remove } = req.body || {};

      const conv = await getConversation(convId);
      if (!conv || conv.type !== "group") throw httpError(404, "Group not found", true);

      if (role === "intern") throw httpError(403, "Forbidden", true);

      const addIds = Array.isArray(add) ? add.filter(Boolean) : [];
      const removeIds = Array.isArray(remove) ? remove.filter(Boolean) : [];

      if (role === "pm") {
        // PM can manage members in their own groups (except removing self).
        if (String(conv.owner_profile_id) !== String(requester.id)) throw httpError(403, "Forbidden", true);
        const allowed = new Set((await getAllowedContacts({ requester })).map((p) => p.id));
        const toAdd = addIds.filter((id) => allowed.has(id));
        const toRemove = removeIds.filter((id) => String(id) !== String(requester.id));

        if (!toAdd.length && !toRemove.length) {
          throw httpError(400, "No valid members to add/remove", true);
        }

        const now = isoNow();
        for (const pid of toAdd) {
          const existing = await restSelect({
            table: "conversation_members",
            select: "id",
            filters: { conversation_id: `eq.${convId}`, profile_id: `eq.${pid}`, limit: 1 },
            accessToken: null,
            useServiceRole: true,
          });
          if (existing?.[0]?.id) {
            await restUpdate({
              table: "conversation_members",
              patch: { is_active: true, left_at: null, joined_at: now },
              matchQuery: { id: `eq.${existing[0].id}` },
              accessToken: null,
              useServiceRole: true,
            });
          } else {
            await restInsert({
              table: "conversation_members",
              rows: { conversation_id: convId, profile_id: pid, joined_at: now, is_active: true, can_send: true, unread_count: 0 },
              accessToken: null,
              useServiceRole: true,
            });
          }
        }

        for (const pid of toRemove) {
          await restUpdate({
            table: "conversation_members",
            patch: { is_active: false, left_at: now, can_send: false },
            matchQuery: { conversation_id: `eq.${convId}`, profile_id: `eq.${pid}` },
            accessToken: null,
            useServiceRole: true,
          });
        }

        res.status(200).json({ success: true });
        return;
      }

      if (role !== "hr" && role !== "admin") throw httpError(403, "Forbidden", true);

      const now = isoNow();
      // Add members
      for (const pid of addIds) {
        const existing = await restSelect({
          table: "conversation_members",
          select: "id",
          filters: { conversation_id: `eq.${convId}`, profile_id: `eq.${pid}`, limit: 1 },
          accessToken: null,
          useServiceRole: true,
        });
        if (existing?.[0]?.id) {
          await restUpdate({
            table: "conversation_members",
            patch: { is_active: true, left_at: null, joined_at: now },
            matchQuery: { id: `eq.${existing[0].id}` },
            accessToken: null,
            useServiceRole: true,
          });
        } else {
          await restInsert({
            table: "conversation_members",
            rows: { conversation_id: convId, profile_id: pid, joined_at: now, is_active: true, can_send: true, unread_count: 0 },
            accessToken: null,
            useServiceRole: true,
          });
        }
      }
      // Remove members
      for (const pid of removeIds) {
        await restUpdate({
          table: "conversation_members",
          patch: { is_active: false, left_at: now, can_send: false },
          matchQuery: { conversation_id: `eq.${convId}`, profile_id: `eq.${pid}` },
          accessToken: null,
          useServiceRole: true,
        });
      }

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.get("/conversations/:id/messages", async (req, res, next) => {
    try {
      const requester = req.auth.profile;
      const convId = req.params.id;
      await assertActiveMember({ conversationId: convId, profileId: requester.id });

      const limit = Math.min(100, Math.max(1, Number(req.query.limit || 50)));
      const cursor = req.query.cursor ? String(req.query.cursor) : null;

      const filters = { conversation_id: `eq.${convId}`, order: "created_at.desc", limit };
      if (cursor) filters.created_at = `lt.${cursor}`;

      const rows = await restSelect({
        table: "messages",
        select: "id,conversation_id,sender_profile_id,body,created_at,deleted_at,deleted_by_profile_id,delete_reason",
        filters,
        accessToken: null,
        useServiceRole: true,
      });

      const msg = (rows || []).slice().reverse().map((m) => ({
        id: m.id,
        conversationId: m.conversation_id,
        senderProfileId: m.sender_profile_id,
        body: m.deleted_at ? "" : m.body,
        deleted: !!m.deleted_at,
        deletedByProfileId: m.deleted_by_profile_id || null,
        deleteReason: m.delete_reason || null,
        createdAt: m.created_at,
      }));

      const nextCursor = rows?.length ? rows[rows.length - 1].created_at : null;
      res.status(200).json({ success: true, messages: msg, nextCursor });
    } catch (err) {
      next(err);
    }
  });

  router.post("/conversations/:id/messages", async (req, res, next) => {
    try {
      const requester = req.auth.profile;
      const convId = req.params.id;
      const { body } = req.body || {};
      const trimmedBody = String(body || "").trim();
      if (!trimmedBody) throw httpError(400, "body is required", true);
      if (trimmedBody.length > 5000) throw httpError(400, "body exceeds 5000 characters", true);

      const member = await assertActiveMember({ conversationId: convId, profileId: requester.id });
      const conv = await getConversation(convId);
      if (!conv) throw httpError(404, "Conversation not found", true);
      if (conv.status !== "active") throw httpError(400, "Conversation is archived (read-only)", true);
      if (!member.can_send) throw httpError(403, "You are muted in this chat", true);

      const now = isoNow();
      const inserted = await restInsert({
        table: "messages",
        rows: { conversation_id: convId, sender_profile_id: requester.id, body: trimmedBody, created_at: now },
        accessToken: null,
        useServiceRole: true,
      });
      const msgRow = inserted?.[0] || inserted;
      if (!msgRow?.id) throw httpError(502, "Failed to send message", true);

      await restUpdate({
        table: "conversations",
        patch: {
          last_message_at: now,
          last_message_body: trimmedBody.slice(0, 500),
          last_message_sender_profile_id: requester.id,
          updated_at: now,
        },
        matchQuery: { id: `eq.${convId}` },
        accessToken: null,
        useServiceRole: true,
      });

      // Atomic increment unread for other members.
      try {
        await restRpc({
          fn: "msg_increment_unread",
          body: { p_conversation_id: convId, p_sender_id: requester.id },
          accessToken: null,
          useServiceRole: true,
        });
      } catch {
        // Back-compat if RPC not installed yet.
      }

      const members = await listConversationMembers(convId);
      const io = req.app.get("io");
      if (io) {
        const payload = {
          id: msgRow.id,
          conversationId: convId,
          senderProfileId: requester.id,
          body: msgRow.body,
          createdAt: msgRow.created_at || now,
        };
        io.to(`conv:${convId}`).emit("chat:message", payload);
        (members || []).forEach((m) => {
          io.to(`user:${m.profile_id}`).emit("chat:conversation", { conversationId: convId });
        });

        // Lightweight notification for other members (for bell dropdowns).
        try {
          const senderLabel = requester.full_name || requester.email || "Someone";
          const title = conv.type === "group" ? `New message in ${conv.name || "Group"}` : `New message from ${senderLabel}`;
          const preview = String(msgRow.body || "").trim().slice(0, 140);
          const notifRows = (members || [])
            .filter((m) => String(m.profile_id) !== String(requester.id))
            .map((m) => ({
              recipient_profile_id: m.profile_id,
              title,
              message: preview,
              type: "message",
              category: "message",
              link: null,
              metadata: { conversationId: convId, senderProfileId: requester.id },
              created_at: now,
            }));

          const insertedNotifs = await createNotifications({ rows: notifRows });
          const rows = Array.isArray(insertedNotifs) ? insertedNotifs : [insertedNotifs];
          rows.filter(Boolean).forEach((row) => {
            io.to(`user:${row.recipient_profile_id}`).emit("itp:notification", { notification: toClientNotification(row) });
          });
        } catch (err) {
          if (!isMissingTableError(err, "notifications")) console.error("Failed to create message notifications:", err);
        }
      }

      res.status(201).json({ success: true, message: { id: msgRow.id, createdAt: msgRow.created_at || now } });
    } catch (err) {
      next(err);
    }
  });

  router.post("/conversations/:id/read", async (req, res, next) => {
    try {
      const requester = req.auth.profile;
      const convId = req.params.id;
      await assertActiveMember({ conversationId: convId, profileId: requester.id });
      const readAt = isoNow();

      try {
        await restRpc({
          fn: "msg_mark_read",
          body: { p_conversation_id: convId, p_profile_id: requester.id, p_read_at: readAt },
          accessToken: null,
          useServiceRole: true,
        });
      } catch {
        await restUpdate({
          table: "conversation_members",
          patch: { unread_count: 0, last_read_at: readAt },
          matchQuery: { conversation_id: `eq.${convId}`, profile_id: `eq.${requester.id}` },
          accessToken: null,
          useServiceRole: true,
        });
      }

      const io = req.app.get("io");
      if (io) io.to(`user:${requester.id}`).emit("chat:conversation", { conversationId: convId });
      if (io) io.to(`conv:${convId}`).emit("chat:read", { conversationId: convId, profileId: requester.id, readAt });

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.post("/messages/:id/report", async (req, res, next) => {
    try {
      const requester = req.auth.profile;
      const messageId = req.params.id;
      const { reason } = req.body || {};

      const msgRows = await restSelect({
        table: "messages",
        select: "id,conversation_id",
        filters: { id: `eq.${messageId}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });
      const msg = msgRows?.[0];
      if (!msg) throw httpError(404, "Message not found", true);
      await assertActiveMember({ conversationId: msg.conversation_id, profileId: requester.id });

      const now = isoNow();
      const inserted = await restInsert({
        table: "message_reports",
        rows: {
          conversation_id: msg.conversation_id,
          message_id: messageId,
          reported_by_profile_id: requester.id,
          reason: reason ? String(reason).slice(0, 500) : null,
          status: "pending",
          created_at: now,
        },
        accessToken: null,
        useServiceRole: true,
      });
      const reportId = inserted?.[0]?.id || inserted?.id;

      const io = req.app.get("io");
      if (io) io.to("role:hr").emit("chat:report", { reportId, conversationId: msg.conversation_id });

      res.status(201).json({ success: true, reportId });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/messages/:id", async (req, res, next) => {
    try {
      const requester = req.auth.profile;
      const messageId = req.params.id;

      const msgRows = await restSelect({
        table: "messages",
        select: "id,conversation_id,sender_profile_id,created_at,deleted_at",
        filters: { id: `eq.${messageId}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });
      const msg = msgRows?.[0];
      if (!msg) throw httpError(404, "Message not found", true);
      if (msg.deleted_at) {
        res.status(200).json({ success: true });
        return;
      }

      await assertActiveMember({ conversationId: msg.conversation_id, profileId: requester.id });
      if (String(msg.sender_profile_id) !== String(requester.id)) throw httpError(403, "Forbidden", true);

      const createdAt = new Date(msg.created_at);
      const ageMs = Date.now() - createdAt.getTime();
      if (Number.isNaN(ageMs) || ageMs > 10 * 60 * 1000) {
        throw httpError(400, "You can only delete your message within 10 minutes", true);
      }

      const now = isoNow();
      await restUpdate({
        table: "messages",
        patch: { deleted_at: now, deleted_by_profile_id: requester.id, delete_reason: "self" },
        matchQuery: { id: `eq.${messageId}` },
        accessToken: null,
        useServiceRole: true,
      });

      const io = req.app.get("io");
      if (io) io.to(`conv:${msg.conversation_id}`).emit("chat:message_deleted", { messageId, conversationId: msg.conversation_id });

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createMessagesRouter };
