const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const http = require("node:http");

const express = require("express");

const INTERN_ID = "11111111-1111-1111-1111-111111111111";

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

describe("Intern API – report feedback endpoint", () => {
  const restorers = [];
  let instance = null;

  before(async () => {
    const supabaseRestPath = path.join(__dirname, "../src/services/supabaseRest.js");
    const authPath = path.join(__dirname, "../src/middleware/auth.js");
    const notificationsPath = path.join(__dirname, "../src/services/notifications.js");
    const storagePath = path.join(__dirname, "../src/services/supabaseStorage.js");

    restorers.push(
      installMockModule(storagePath, {
        uploadProfileFile: async () => ({}),
        publicUrlForObjectPath: (p) => p,
      })
    );

    restorers.push(
      installMockModule(supabaseRestPath, {
        restSelect: async ({ table }) => {
          if (table !== "reports") return [];
          return [
            {
              id: "rep_1",
              reviewed_by: "reviewer_1",
              reviewed_at: "2026-03-10T00:00:00.000Z",
              review_reason: "Good work.",
              review_score: 10,
              reviewer: { id: "reviewer_1", email: "pm@example.com", full_name: "PM", role: "pm" },
            },
            {
              id: "rep_2",
              reviewed_by: null,
              reviewed_at: "2026-03-09T00:00:00.000Z",
              review_reason: null,
              review_score: null,
              reviewer: null,
            },
          ];
        },
        restInsert: async () => [],
        restUpdate: async () => [],
        restDelete: async () => [],
        adminCreateUser: async () => ({ id: "stub" }),
      })
    );

    restorers.push(
      installMockModule(authPath, {
        createAuthMiddleware: () => ({
          requireRole: () => (req, _res, next) => {
            req.auth = { profile: { id: INTERN_ID, role: "intern", pm_id: null, email: "intern@example.com" } };
            next();
          },
        }),
      })
    );

    restorers.push(
      installMockModule(notificationsPath, {
        isMissingTableError: () => false,
        listProfilesByRole: async () => [],
        createNotifications: async () => [],
        toClientNotification: () => null,
      })
    );

    const internRoutePath = require.resolve("../src/routes/intern");
    delete require.cache[internRoutePath];
    const { createInternRouter } = require("../src/routes/intern");

    const app = express();
    app.use(express.json());
    app.use("/intern", createInternRouter());
    app.use((err, _req, res, _next) => {
      const status = Number(err?.status) || 500;
      res.status(status).json({ error: err?.expose ? String(err?.message || "Error") : "Internal Server Error" });
    });

    instance = await startServer(app);
  });

  after(async () => {
    if (instance?.server) await new Promise((resolve) => instance.server.close(resolve));
    restorers.reverse().forEach((r) => r());
  });

  it("returns mapped feedback items for reviewed reports", async () => {
    const res = await fetch(`${instance.baseUrl}/intern/report-feedback`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(Array.isArray(body.feedback), true);
    assert.equal(body.feedback.length, 2);
    assert.deepEqual(body.feedback[0], {
      reportId: "rep_1",
      reviewedBy: "reviewer_1",
      reviewedAt: "2026-03-10T00:00:00.000Z",
      comment: "Good work.",
      score: 10,
      reviewer: { id: "reviewer_1", email: "pm@example.com", full_name: "PM", role: "pm" },
    });
  });
});

