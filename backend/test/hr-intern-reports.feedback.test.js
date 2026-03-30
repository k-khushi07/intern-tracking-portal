const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const http = require("node:http");

const express = require("express");

const VALID_INTERN_ID = "11111111-1111-1111-1111-111111111111";
const HR_ID = "22222222-2222-2222-2222-222222222222";

function installMockModule(moduleFile, exports) {
  const resolved = require.resolve(moduleFile);
  const prev = require.cache[resolved];
  require.cache[resolved] = {
    id: resolved,
    filename: resolved,
    loaded: true,
    exports,
  };
  return () => {
    if (prev) require.cache[resolved] = prev;
    else delete require.cache[resolved];
  };
}

async function startServer(app) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  const baseUrl = `http://127.0.0.1:${address.port}`;
  return { server, baseUrl };
}

describe("HR API – intern reports (feedback fields)", () => {
  /** @type {(() => void)[]} */
  const restorers = [];

  /** @type {{ server: import('http').Server, baseUrl: string } | null} */
  let instance = null;

  before(async () => {
    const supabaseRestPath = path.join(__dirname, "../src/services/supabaseRest.js");
    const authPath = path.join(__dirname, "../src/middleware/auth.js");

    const restSelectCalls = [];
    const restSelect = async (args) => {
      restSelectCalls.push(args);

      if (args.table === "profiles") {
        const idFilter = String(args?.filters?.id || "");
        if (idFilter === `eq.${VALID_INTERN_ID}`) {
          return [
            {
              id: VALID_INTERN_ID,
              role: "intern",
              email: "intern@example.com",
              full_name: "Test Intern",
              intern_id: "INT-001",
              pm_id: null,
            },
          ];
        }
        return [];
      }

      if (args.table === "reports") {
        return [
          {
            id: "rep_1",
            intern_profile_id: VALID_INTERN_ID,
            report_type: "weekly",
            week_number: 1,
            status: "approved",
            submitted_at: "2026-03-01T10:00:00.000Z",
            reviewed_at: "2026-03-02T10:00:00.000Z",
            review_reason: "Looks good.",
            review_score: 8,
            created_at: "2026-03-01T10:00:00.000Z",
          },
        ];
      }

      return [];
    };

    restorers.push(
      installMockModule(supabaseRestPath, {
        adminCreateUser: async () => ({ id: "stub" }),
        restSelect,
        restInsert: async () => [],
        restUpdate: async () => [],
        restDelete: async () => [],
      })
    );

    restorers.push(
      installMockModule(authPath, {
        createAuthMiddleware: () => ({
          requireRole: () => (req, _res, next) => {
            req.auth = { profile: { id: HR_ID, role: "hr" } };
            next();
          },
        }),
      })
    );

    // Ensure the router picks up our mocked modules.
    const hrRoutePath = require.resolve(path.join(__dirname, "../src/routes/hr.js"));
    delete require.cache[hrRoutePath];

    const { createHrRouter } = require("../src/routes/hr");

    const app = express();
    app.use(express.json());
    app.use(
      "/hr",
      createHrRouter({
        emailService: {
          sendEmail: async () => ({ ok: true }),
        },
      })
    );
    app.use((err, _req, res, _next) => {
      const status = Number(err?.status) || 500;
      const expose = !!err?.expose;
      res.status(status).json({ error: expose ? String(err?.message || "Error") : "Internal Server Error" });
    });

    instance = await startServer(app);
    // Attach for assertions if needed in future.
    app.set("restSelectCalls", restSelectCalls);
  });

  after(async () => {
    if (instance?.server) {
      await new Promise((resolve) => instance.server.close(resolve));
    }
    restorers.reverse().forEach((r) => r());
  });

  it("returns reports (including review_reason and review_score) for a valid intern_id", async () => {
    const res = await fetch(`${instance.baseUrl}/hr/interns/${VALID_INTERN_ID}/reports`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(Array.isArray(body.reports), true);
    assert.equal(body.reports.length, 1);
    assert.equal(body.reports[0].review_reason, "Looks good.");
    assert.equal(body.reports[0].review_score, 8);
  });

  it("returns 400 for invalid intern_id format", async () => {
    const res = await fetch(`${instance.baseUrl}/hr/interns/not-a-uuid/reports`);
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, "Invalid ID format");
  });

  it("returns 404 when intern_id does not exist", async () => {
    const missingId = "33333333-3333-3333-3333-333333333333";
    const res = await fetch(`${instance.baseUrl}/hr/interns/${missingId}/reports`);
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error, "Intern not found");
  });
});
