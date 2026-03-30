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

describe("Announcements API – department filtering", () => {
  const restorers = [];
  let instance = null;

  before(async () => {
    const supabaseRestPath = path.join(__dirname, "../src/services/supabaseRest.js");
    const authPath = path.join(__dirname, "../src/middleware/auth.js");

    const announcementsRows = [
      {
        id: "ann_global",
        title: "Global notice",
        content: "Hello everyone",
        priority: "low",
        audience_roles: ["intern", "pm", "hr"],
        pinned: false,
        department: null,
        created_at: "2026-03-01T00:00:00.000Z",
        updated_at: "2026-03-01T00:00:00.000Z",
        created_by: { id: HR_ID, role: "hr", email: "hr@example.com", full_name: "HR" },
      },
      {
        id: "ann_sap",
        title: "SAP update",
        content: "Only SAP",
        priority: "high",
        audience_roles: ["intern"],
        pinned: false,
        department: "SAP",
        created_at: "2026-03-02T00:00:00.000Z",
        updated_at: "2026-03-02T00:00:00.000Z",
        created_by: { id: HR_ID, role: "hr", email: "hr@example.com", full_name: "HR" },
      },
      {
        id: "ann_oracle",
        title: "Oracle update",
        content: "Only Oracle",
        priority: "medium",
        audience_roles: ["intern"],
        pinned: false,
        department: "Oracle",
        created_at: "2026-03-03T00:00:00.000Z",
        updated_at: "2026-03-03T00:00:00.000Z",
        created_by: { id: HR_ID, role: "hr", email: "hr@example.com", full_name: "HR" },
      },
      {
        id: "ann_pm_oracle",
        title: "PM Oracle note",
        content: "PM-only test",
        priority: "low",
        audience_roles: ["intern"],
        pinned: false,
        department: "Oracle",
        created_at: "2026-03-04T00:00:00.000Z",
        updated_at: "2026-03-04T00:00:00.000Z",
        created_by: { id: PM_ID, role: "pm", email: "pm@example.com", full_name: "PM" },
      },
      {
        id: "ann_pm_sap",
        title: "PM SAP note",
        content: "For SAP interns from their PM",
        priority: "low",
        audience_roles: ["intern"],
        pinned: false,
        department: "SAP",
        created_at: "2026-03-05T00:00:00.000Z",
        updated_at: "2026-03-05T00:00:00.000Z",
        created_by: { id: PM_ID, role: "pm", email: "pm@example.com", full_name: "PM" },
      },
    ];

    restorers.push(
      installMockModule(supabaseRestPath, {
        restSelect: async ({ table }) => {
          if (table === "announcements") return announcementsRows;
          return [];
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
          requireAuth: (req, _res, next) => {
            const role = String(req.headers["x-test-role"] || "").toLowerCase();
            const department = String(req.headers["x-test-department"] || "").trim();
            const pmId = String(req.headers["x-test-pm-id"] || "").trim();
            const profileId = String(req.headers["x-test-profile-id"] || "").trim();

            const resolvedId =
              profileId ||
              (role === "intern" ? INTERN_ID : role === "pm" ? PM_ID : role === "hr" ? HR_ID : "44444444-4444-4444-4444-444444444444");

            req.auth = {
              profile: {
                id: resolvedId,
                role: role || "intern",
                pm_id: pmId || null,
                profile_data: department ? { department } : {},
              },
            };
            next();
          },
        }),
      })
    );

    const routerPath = require.resolve("../src/routes/announcements");
    delete require.cache[routerPath];
    const { createAnnouncementsRouter } = require("../src/routes/announcements");

    const app = express();
    app.use("/announcements", createAnnouncementsRouter());
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

  it("returns only department-relevant announcements for an intern (global + matching dept + assigned PM)", async () => {
    const res = await fetch(`${instance.baseUrl}/announcements`, {
      headers: {
        "x-test-role": "intern",
        "x-test-department": "SAP",
        "x-test-pm-id": PM_ID,
        "x-test-profile-id": INTERN_ID,
      },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    const ids = (body.announcements || []).map((a) => a.id).sort();
    assert.deepEqual(ids, ["ann_global", "ann_pm_sap", "ann_sap"].sort());
  });

  it("returns only global announcements when intern department is unknown", async () => {
    const res = await fetch(`${instance.baseUrl}/announcements`, {
      headers: { "x-test-role": "intern", "x-test-pm-id": PM_ID, "x-test-profile-id": INTERN_ID },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    const ids = (body.announcements || []).map((a) => a.id);
    assert.deepEqual(ids, ["ann_global"]);
  });

  it("allows HR to filter announcements by department via query param (excludes global)", async () => {
    const res = await fetch(`${instance.baseUrl}/announcements?department=SAP`, {
      headers: { "x-test-role": "hr", "x-test-profile-id": HR_ID },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    const ids = (body.announcements || []).map((a) => a.id).sort();
    // HR filter keeps global announcements (department=null) and includes matching department.
    assert.deepEqual(ids, ["ann_global", "ann_pm_sap", "ann_sap"].sort());
  });

  it("shows a PM their own announcements regardless of department targeting", async () => {
    const res = await fetch(`${instance.baseUrl}/announcements`, {
      headers: { "x-test-role": "pm", "x-test-profile-id": PM_ID, "x-test-department": "SAP" },
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    const ids = (body.announcements || []).map((a) => a.id).sort();
    // PM sees own announcements + HR/Admin announcements targeted to PM (global has audience pm).
    assert.deepEqual(ids, ["ann_global", "ann_pm_oracle", "ann_pm_sap"].sort());
  });
});
