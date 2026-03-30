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

describe("Intern API – documents endpoints", () => {
  const restorers = [];
  let instance = null;
  let scenario = "ok";

  before(async () => {
    const supabaseRestPath = path.join(__dirname, "../src/services/supabaseRest.js");
    const storagePath = path.join(__dirname, "../src/services/supabaseStorage.js");
    const authPath = path.join(__dirname, "../src/middleware/auth.js");
    const notificationsPath = path.join(__dirname, "../src/services/notifications.js");

    restorers.push(
      installMockModule(storagePath, {
        uploadProfileFile: async () => ({}),
        publicUrlForObjectPath: (p) => `https://storage.example.com/public/${String(p).replace(/^\/+/, "")}`,
      })
    );

    restorers.push(
      installMockModule(supabaseRestPath, {
        restSelect: async ({ table, filters }) => {
          if (table !== "intern_documents") return [];
          if (scenario === "missing_table") {
            const err = new Error("relation \"public.intern_documents\" does not exist");
            err.supabase = { code: "PGRST205", message: "Could not find the table 'public.intern_documents'" };
            throw err;
          }
          const id = String(filters?.id || "");
          const wantsSingle = id.startsWith("eq.");
          if (wantsSingle) {
            if (scenario === "not_found") return [];
            if (scenario === "no_file") {
              return [
                {
                  id: id.slice(3),
                  intern_profile_id: INTERN_ID,
                  document_type: "offer_letter",
                  title: "Offer",
                  filename: "offer.pdf",
                  mime_type: "application/pdf",
                  file_path: null,
                  file_url: null,
                  metadata: {},
                  created_at: "2026-03-01T00:00:00.000Z",
                  updated_at: "2026-03-01T00:00:00.000Z",
                },
              ];
            }
            return [
              {
                id: id.slice(3),
                intern_profile_id: INTERN_ID,
                document_type: "offer_letter",
                title: "Offer",
                filename: "offer.pdf",
                mime_type: "application/pdf",
                file_path: "intern_documents/offer.pdf",
                file_url: "",
                metadata: {},
                created_at: "2026-03-01T00:00:00.000Z",
                updated_at: "2026-03-01T00:00:00.000Z",
              },
            ];
          }
          return [
            {
              id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              intern_profile_id: INTERN_ID,
              document_type: "offer_letter",
              title: "Offer Letter",
              filename: "offer.pdf",
              mime_type: "application/pdf",
              file_path: "intern_documents/offer.pdf",
              file_url: "",
              metadata: {},
              created_at: "2026-03-01T00:00:00.000Z",
              updated_at: "2026-03-02T00:00:00.000Z",
            },
          ];
        },
        restInsert: async () => [],
        restUpdate: async () => [],
        restDelete: async () => [],
        adminCreateUser: async () => ({ id: "stub" }),
      })
    );

    // auth + notifications (used for isMissingTableError)
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
        isMissingTableError: (err, tableName) => {
          const msg = String(err?.message || "").toLowerCase();
          return msg.includes(String(tableName).toLowerCase());
        },
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

  it("fetches documents for the logged-in intern and returns downloadUrl", async () => {
    scenario = "ok";
    const res = await fetch(`${instance.baseUrl}/intern/documents`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(Array.isArray(body.documents), true);
    assert.equal(body.documents[0].documentType, "offer_letter");
    assert.equal(body.documents[0].downloadUrl, `/api/intern/documents/${body.documents[0].id}/download`);
  });

  it("returns warning when intern_documents table is missing", async () => {
    scenario = "missing_table";
    const res = await fetch(`${instance.baseUrl}/intern/documents`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.deepEqual(body.documents, []);
    assert.ok(String(body.warning || "").toLowerCase().includes("migration"));
  });

  it("redirects to a public URL when downloading by file_path", async () => {
    scenario = "ok";
    const docId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const res = await fetch(`${instance.baseUrl}/intern/documents/${docId}/download`, { redirect: "manual" });
    assert.equal(res.status, 302);
    assert.equal(res.headers.get("location"), "https://storage.example.com/public/intern_documents/offer.pdf");
  });

  it("returns 404 when a document exists but has no file_url or file_path", async () => {
    scenario = "no_file";
    const docId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
    const res = await fetch(`${instance.baseUrl}/intern/documents/${docId}/download`, { redirect: "manual" });
    assert.equal(res.status, 404);
    const body = await res.json();
    assert.equal(body.error, "Document file not available");
  });

  it("returns 400 for invalid documentId format", async () => {
    scenario = "ok";
    const res = await fetch(`${instance.baseUrl}/intern/documents/not-a-uuid/download`, { redirect: "manual" });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.error, "Invalid documentId");
  });
});

