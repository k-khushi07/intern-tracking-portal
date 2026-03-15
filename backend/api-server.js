// backend/api-server.js - Intern Tracking Portal API (Supabase-backed)
const http = require("http");
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const { Server } = require("socket.io");

const { createEmailService } = require("./src/services/email");
const { createAuthMiddleware } = require("./src/middleware/auth");
const { restSelect } = require("./src/services/supabaseRest");
const { createAuthRouter } = require("./src/routes/auth");
const { createAdminRouter } = require("./src/routes/admin");
const { createHrRouter } = require("./src/routes/hr");
const { createApplicationsRouter } = require("./src/routes/applications");
const { createEmailRouter } = require("./src/routes/email");
const { createPmRouter } = require("./src/routes/pm");
const { createInternRouter } = require("./src/routes/intern");
const { createAnnouncementsRouter } = require("./src/routes/announcements");
const { createAttendanceRouter } = require("./src/routes/attendance");
const { createMessagesRouter } = require("./src/routes/messages");
const { createNotificationsRouter } = require("./src/routes/notifications");
const { createSocketAuthMiddleware } = require("./src/realtime/socketAuth");

const app = express();
const PORT = process.env.PORT || 5000;
const httpServer = http.createServer(app);

const probeExistingApi = (port) =>
  new Promise((resolve) => {
    const req = http.get(
      {
        host: "127.0.0.1",
        port,
        path: "/api/health",
        timeout: 1500,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => {
          body += chunk;
        });
        res.on("end", () => {
          const okStatus = res.statusCode >= 200 && res.statusCode < 300;
          const looksLikePortalApi =
            body.includes("Intern Tracking Portal API") || body.includes("\"status\":\"OK\"");
          resolve(okStatus && looksLikePortalApi);
        });
      }
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
  });

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
    credentials: true,
  })
);
app.use(express.json({ limit: "50mb" }));

const emailService = createEmailService();
const auth = createAuthMiddleware();

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Intern Tracking Portal API is running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health/supabase", async (req, res) => {
  try {
    await restSelect({
      table: "profiles",
      select: "id",
      filters: { limit: 1 },
      accessToken: null,
      useServiceRole: true,
    });
    res.status(200).json({ success: true, ok: true });
  } catch (err) {
    const cloudflare525 = Number(err?.upstreamStatus || 0) === 525;
    res.status(200).json({
      success: true,
      ok: false,
      message: err?.message || "Supabase check failed",
      hint: cloudflare525
        ? "Supabase edge returned Cloudflare 525 (SSL handshake). Confirm SUPABASE_URL is your active project API URL and check Supabase project status in the dashboard."
        : "If this mentions missing tables/columns, run `supabase/schema.sql` (or migrations) in the Supabase SQL editor.",
    });
  }
});

app.use("/api/auth", auth.requireAuthOptional, createAuthRouter());
app.use("/api/applications", createApplicationsRouter());
app.use("/api/admin", auth.requireAuth, createAdminRouter());
app.use("/api/hr", auth.requireAuth, createHrRouter({ emailService }));
app.use("/api/pm", auth.requireAuth, createPmRouter());
app.use("/api/intern", auth.requireAuth, createInternRouter());
app.use("/api/announcements", createAnnouncementsRouter());
app.use("/api/attendance", auth.requireAuth, createAttendanceRouter());
app.use("/api/messages", auth.requireAuth, createMessagesRouter());
app.use("/api/notifications", auth.requireAuth, createNotificationsRouter());
app.use("/api", auth.requireAuthOptional, createEmailRouter({ emailService }));

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true,
    credentials: true,
  },
});
app.set("io", io);

const onlineUserIds = new Set();

io.use(createSocketAuthMiddleware());
io.on("connection", (socket) => {
  const profile = socket.data?.auth?.profile;
  if (!profile) return;
  socket.join(`role:${profile.role}`);
  socket.join(`user:${profile.id}`);

  onlineUserIds.add(profile.id);
  io.to("role:intern").emit("chat:presence", { profileId: profile.id, online: true });
  io.to("role:pm").emit("chat:presence", { profileId: profile.id, online: true });
  io.to("role:hr").emit("chat:presence", { profileId: profile.id, online: true });

  socket.on("chat:presence:list", () => {
    try {
      socket.emit("chat:presence:list", { onlineProfileIds: Array.from(onlineUserIds) });
    } catch {
      // ignore
    }
  });

  socket.on("chat:subscribe", async (payload) => {
    try {
      const conversationId = payload?.conversationId;
      if (!conversationId) return;
      // Verify membership (service-role query).
      const rows = await restSelect({
        table: "conversation_members",
        select: "id",
        filters: { conversation_id: `eq.${conversationId}`, profile_id: `eq.${profile.id}`, is_active: "eq.true", limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });
      if (!rows?.[0]?.id) return;
      socket.join(`conv:${conversationId}`);
    } catch {
      // ignore
    }
  });

  socket.on("chat:unsubscribe", (payload) => {
    const conversationId = payload?.conversationId;
    if (!conversationId) return;
    try {
      socket.leave(`conv:${conversationId}`);
    } catch {
      // ignore
    }
  });

  socket.on("disconnect", () => {
    onlineUserIds.delete(profile.id);
    io.to("role:intern").emit("chat:presence", { profileId: profile.id, online: false });
    io.to("role:pm").emit("chat:presence", { profileId: profile.id, online: false });
    io.to("role:hr").emit("chat:presence", { profileId: profile.id, online: false });
  });
});

if (process.env.SERVE_FRONTEND === "true") {
  const distDir = path.resolve(__dirname, "..", "frontend", "dist");
  app.use(express.static(distDir));
  app.get("*", (req, res) => res.sendFile(path.join(distDir, "index.html")));
}

app.use((err, req, res, next) => {
  let status = err.status || 500;
  if (status >= 520 && status <= 529) status = 502;
  const message = err.expose ? err.message : "Internal server error";
  if (status >= 500) console.error("API error:", err);
  res.status(status).json({ success: false, message });
});

httpServer.on("error", async (err) => {
  if (err?.code !== "EADDRINUSE") {
    throw err;
  }

  const existingApiHealthy = await probeExistingApi(PORT);
  if (existingApiHealthy) {
    console.warn(
      `[startup] Port ${PORT} is already in use by an active Intern Tracking Portal API instance. Reusing that instance.`
    );
    process.exit(0);
    return;
  }

  console.error(
    `[startup] Port ${PORT} is already in use by another process. Stop it or set a different PORT in backend/.env.`
  );
  console.error(
    "[startup] If you change backend PORT, update frontend proxy target in frontend/vite.config.js to match."
  );
  process.exit(1);
});

httpServer.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});

module.exports = app;
