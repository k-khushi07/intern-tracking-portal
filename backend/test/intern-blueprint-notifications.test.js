const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const http = require("node:http");

const express = require("express");

const INTERN_ID = "11111111-1111-1111-1111-111111111111";
const PM_ID = "22222222-2222-2222-2222-222222222222";
const HR_ID = "33333333-3333-3333-3333-333333333333";

function installMockModule(moduleFile, exports) {
  const resolved = require.resolve(moduleFile);
  const prev = require.cache[resolved];
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports };
  return () => {
    if (prev) require.cache[resolved] = prev;
    else delete require.cache[resolved];
  };
}

async function startServer(app) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return { server, baseUrl: `http://127.0.0.1:${address.port}` };
}

function createIoSpy() {
  const emitted = [];
  return {
    emitted,
    to(room) {
      return {
        emit(event, payload) {
          emitted.push({ room, event, payload });
        },
      };
    },
  };
}

describe("Intern API – blueprint update triggers notifications", () => {
  const restorers = [];
  let instance = null;
  let createdNotificationRows = null;

  before(async () => {
    const supabaseRestPath = path.join(__dirname, "../src/services/supabaseRest.js");
    const authPath = path.join(__dirname, "../src/middleware/auth.js");
    const notificationsPath = path.join(__dirname, "../src/services/notifications.js");

    let hasExistingBlueprint = true;

    restorers.push(
      installMockModule(supabaseRestPath, {
        restSelect: async ({ table }) => {
          if (table === "intern_blueprints") return hasExistingBlueprint ? [{ id: "bp_1" }] : [];
          return [];
        },
        restUpdate: async () => [{ id: "bp_1" }],
        restInsert: async () => [{ id: "bp_1" }],
        restDelete: async () => [],
        adminCreateUser: async () => ({ id: "stub" }),
      })
    );

    restorers.push(
      installMockModule(authPath, {
        createAuthMiddleware: () => ({
          requireRole: () => (req, _res, next) => {
            req.auth = {
              profile: {
                id: INTERN_ID,
                role: "intern",
                pm_id: PM_ID,
                full_name: "Test Intern",
                email: "intern@example.com",
              },
            };
            next();
          },
        }),
      })
    );

    restorers.push(
      installMockModule(notificationsPath, {
        isMissingTableError: () => false,
        listProfilesByRole: async (role) => (String(role).toLowerCase() === "hr" ? [HR_ID] : []),
        createNotifications: async ({ rows }) => {
          createdNotificationRows = rows;
          // Echo back in the same shape the router expects for socket emission.
          return (rows || []).map((r, idx) => ({
            id: `notif_${idx + 1}`,
            recipient_profile_id: r.recipient_profile_id,
            title: r.title,
            message: r.message,
            type: r.type,
            category: r.category,
            metadata: r.metadata,
            read_at: null,
            created_at: "2026-03-10T00:00:00.000Z",
          }));
        },
        toClientNotification: (row) => ({
          id: row.id,
          title: row.title,
          message: row.message,
          category: row.category,
          createdAt: row.created_at,
          read: false,
        }),
      })
    );

    // Ensure the router picks up mocked modules.
    const internRoutePath = require.resolve("../src/routes/intern");
    delete require.cache[internRoutePath];
    const { createInternRouter } = require("../src/routes/intern");

    const io = createIoSpy();
    const app = express();
    app.use(express.json());
    app.set("io", io);
    app.use("/intern", createInternRouter());
    app.use((err, _req, res, _next) => {
      const status = Number(err?.status) || 500;
      res.status(status).json({ error: err?.expose ? String(err?.message || "Error") : "Internal Server Error" });
    });

    instance = await startServer(app);
    instance.io = io;
    instance.setHasExisting = (v) => { hasExistingBlueprint = v; };
  });

  after(async () => {
    if (instance?.server) await new Promise((resolve) => instance.server.close(resolve));
    restorers.reverse().forEach((r) => r());
  });

  it("creates notifications to PM + HR when blueprint is updated", async () => {
    createdNotificationRows = null;
    instance.setHasExisting(true);

    const res = await fetch(`${instance.baseUrl}/intern/blueprint`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: { objective: "Ship feature" } }),
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);

    const recipients = (createdNotificationRows || []).map((r) => r.recipient_profile_id).sort();
    assert.deepEqual(recipients, [HR_ID, PM_ID].sort());
    assert.equal(createdNotificationRows[0].title, "Blueprint updated");

    const notifEvents = instance.io.emitted.filter((e) => e.event === "itp:notification");
    assert.ok(notifEvents.some((e) => e.room === `user:${PM_ID}`));
    assert.ok(notifEvents.some((e) => e.room === `user:${HR_ID}`));
  });

  it("returns 400 when blueprint data is not an object", async () => {
    const res = await fetch(`${instance.baseUrl}/intern/blueprint`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: "not-an-object" }),
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, "data must be an object");
  });
});

