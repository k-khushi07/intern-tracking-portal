const express = require("express");
const { httpError } = require("../errors");
const {
  isMissingTableError,
  listNotifications,
  countUnread,
  markRead,
  markAllRead,
  toClientNotification,
} = require("../services/notifications");

function createNotificationsRouter() {
  const router = express.Router();

  router.get("/", async (req, res, next) => {
    try {
      const profileId = req.auth?.profile?.id;
      if (!profileId) throw httpError(401, "Not authenticated", true);
      const limit = Number(req.query.limit || 50);
      const rows = await listNotifications({ profileId, limit });
      const notifications = (rows || []).map(toClientNotification).filter(Boolean);
      const unreadCount = notifications.reduce((sum, n) => sum + (n.read ? 0 : 1), 0);
      res.status(200).json({ success: true, notifications, unreadCount });
    } catch (err) {
      if (isMissingTableError(err, "notifications")) {
        res.status(200).json({ success: true, notifications: [], unreadCount: 0, hint: "Missing notifications table. Run Supabase migration 011_add_notifications.sql." });
        return;
      }
      next(err);
    }
  });

  router.get("/unread-count", async (req, res, next) => {
    try {
      const profileId = req.auth?.profile?.id;
      if (!profileId) throw httpError(401, "Not authenticated", true);
      const unreadCount = await countUnread({ profileId });
      res.status(200).json({ success: true, unreadCount });
    } catch (err) {
      if (isMissingTableError(err, "notifications")) {
        res.status(200).json({ success: true, unreadCount: 0, hint: "Missing notifications table. Run Supabase migration 011_add_notifications.sql." });
        return;
      }
      next(err);
    }
  });

  router.post("/:id/read", async (req, res, next) => {
    try {
      const profileId = req.auth?.profile?.id;
      if (!profileId) throw httpError(401, "Not authenticated", true);
      const row = await markRead({ profileId, notificationId: req.params.id });
      const io = req.app.get("io");
      if (io) {
        io.to(`user:${profileId}`).emit("itp:changed", { entity: "notifications", action: "read", id: req.params.id });
      }
      res.status(200).json({ success: true, notification: toClientNotification(row) });
    } catch (err) {
      if (isMissingTableError(err, "notifications")) {
        res.status(200).json({ success: true, notification: null });
        return;
      }
      next(err);
    }
  });

  router.post("/read-all", async (req, res, next) => {
    try {
      const profileId = req.auth?.profile?.id;
      if (!profileId) throw httpError(401, "Not authenticated", true);
      await markAllRead({ profileId });
      const io = req.app.get("io");
      if (io) {
        io.to(`user:${profileId}`).emit("itp:changed", { entity: "notifications", action: "read_all" });
      }
      res.status(200).json({ success: true });
    } catch (err) {
      if (isMissingTableError(err, "notifications")) {
        res.status(200).json({ success: true });
        return;
      }
      next(err);
    }
  });

  return router;
}

module.exports = { createNotificationsRouter };

