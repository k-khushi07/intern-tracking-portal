const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const SHEETS_SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
const DOCS_SCOPES = ["https://www.googleapis.com/auth/documents"];
const DRIVE_SCOPES = ["https://www.googleapis.com/auth/drive"];

let cachedAuth = null;

function isEnabled() {
  return String(process.env.GOOGLE_SYNC_ENABLED || "").toLowerCase() === "true";
}

function parseServiceAccountJson(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }
  const filePath = path.isAbsolute(trimmed) ? trimmed : path.resolve(process.cwd(), trimmed);
  const content = fs.readFileSync(filePath, "utf8");
  return JSON.parse(content);
}

function getAuth() {
  if (!isEnabled()) {
    const err = new Error(
      "Google sync is disabled. Set GOOGLE_SYNC_ENABLED=true and provide GOOGLE_SERVICE_ACCOUNT_JSON (or GOOGLE_APPLICATION_CREDENTIALS)."
    );
    err.status = 400;
    err.expose = true;
    throw err;
  }

  if (cachedAuth) return cachedAuth;

  const scopes = [...new Set([...SHEETS_SCOPES, ...DOCS_SCOPES, ...DRIVE_SCOPES])];
  const inline = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (inline) {
    const creds = parseServiceAccountJson(inline);
    if (!creds?.client_email || !creds?.private_key) {
      const err = new Error("Invalid GOOGLE_SERVICE_ACCOUNT_JSON (missing client_email/private_key).");
      err.status = 500;
      err.expose = true;
      throw err;
    }
    cachedAuth = new google.auth.JWT(creds.client_email, undefined, creds.private_key, scopes);
    return cachedAuth;
  }

  const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (keyFile) {
    cachedAuth = new google.auth.GoogleAuth({ keyFile, scopes });
    return cachedAuth;
  }

  const err = new Error("Missing Google credentials. Set GOOGLE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.");
  err.status = 500;
  err.expose = true;
  throw err;
}

function extractGoogleId(url, kind) {
  const raw = String(url || "").trim();
  if (!raw) return null;
  if (/^[a-zA-Z0-9_-]{20,}$/.test(raw)) return raw;

  const patterns =
    kind === "sheet"
      ? [/spreadsheets\/d\/([a-zA-Z0-9_-]+)/i]
      : kind === "doc"
        ? [/document\/d\/([a-zA-Z0-9_-]+)/i]
        : [];

  for (const p of patterns) {
    const m = raw.match(p);
    if (m?.[1]) return m[1];
  }
  return null;
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function coerceDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return null;
  return dt.toISOString().split("T")[0];
}

function normalizeStatus(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "pending";
  if (raw === "inprogress" || raw === "in progress") return "in_progress";
  if (raw === "in_progress") return "in_progress";
  if (raw === "completed" || raw === "done") return "completed";
  if (raw === "blocked") return "blocked";
  return "pending";
}

function parseTnaSheet(values) {
  const rows = Array.isArray(values) ? values : [];
  if (rows.length < 2) return [];

  const headerRow = rows[0] || [];
  const headerMap = {};
  headerRow.forEach((h, idx) => {
    const key = normalizeHeader(h);
    if (key) headerMap[key] = idx;
  });

  // Common aliases (lets users paste typical headers while still enforcing template intent).
  if (headerMap.week === undefined) headerMap.week = headerMap.weeknumber ?? headerMap.weekno;
  if (headerMap.planneddate === undefined) headerMap.planneddate = headerMap.plandate ?? headerMap.planned;
  if (headerMap.executeddate === undefined) headerMap.executeddate = headerMap.executiondate ?? headerMap.executed;
  if (headerMap.planofaction === undefined) headerMap.planofaction = headerMap.actionplan ?? headerMap.plan;
  if (headerMap.deliverable === undefined) headerMap.deliverable = headerMap.deliverables ?? headerMap.output;
  if (headerMap.reason === undefined) headerMap.reason = headerMap.blocker ?? headerMap.blockers;
  if (headerMap.status === undefined) headerMap.status = headerMap.state;

  const required = ["week", "task", "planneddate", "executeddate", "status", "deliverable"];
  const optional = ["planofaction", "reason"];
  const missing = required.filter((k) => headerMap[k] === undefined);
  if (missing.length) {
    const err = new Error(
      `TNA sheet template mismatch. Missing columns: ${missing
        .map((k) => k.replace(/([a-z])([a-z]+)/, "$1$2"))
        .join(", ")}. Required: Week, Task, Planned Date, Executed Date, Status, Deliverable. Optional: ${optional
        .map((k) => k.replace(/([a-z])([a-z]+)/, "$1$2"))
        .join(", ")}`
    );
    err.status = 400;
    err.expose = true;
    throw err;
  }

  const items = [];
  for (let i = 1; i < rows.length; i += 1) {
    const r = rows[i] || [];
    const task = String(r[headerMap.task] || "").trim();
    const allEmpty = r.every((c) => !String(c || "").trim());
    if (allEmpty) continue;
    if (!task) continue;

    const weekNumber = Number.parseInt(String(r[headerMap.week] || "").trim(), 10);
    items.push({
      week_number: Number.isFinite(weekNumber) ? weekNumber : null,
      task,
      planned_date: coerceDate(r[headerMap.planneddate]),
      plan_of_action: String(r[headerMap.planofaction] || "").trim(),
      executed_date: coerceDate(r[headerMap.executeddate]),
      status: normalizeStatus(r[headerMap.status]),
      reason: String(r[headerMap.reason] || "").trim() || null,
      deliverable: String(r[headerMap.deliverable] || "").trim() || null,
      sort_order: items.length + 1,
    });
  }

  return items;
}

function buildTnaSheetValues(items) {
  const header = ["Week", "Task", "Planned Date", "Plan of Action", "Executed Date", "Status", "Reason", "Deliverable"];
  const rows = (items || []).map((i) => [
    i.week_number ?? "",
    i.task ?? "",
    i.planned_date ?? "",
    i.plan_of_action ?? "",
    i.executed_date ?? "",
    i.status ?? "pending",
    i.reason ?? "",
    i.deliverable ?? "",
  ]);
  return [header, ...rows];
}

const BLUEPRINT_HEADINGS = ["Objective", "Scope", "Tech Stack", "Milestones", "Notes"];

function parseBlueprintText(text) {
  const lines = String(text || "")
    .replace(/\r\n/g, "\n")
    .split("\n");

  const byKey = {};
  let current = null;
  let buffer = [];

  const flush = () => {
    if (!current) return;
    byKey[current] = buffer.join("\n").trim();
    buffer = [];
  };

  const normalizeHeading = (v) => String(v || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
  for (const line of lines) {
    const t = String(line || "").trim();
    const heading = BLUEPRINT_HEADINGS.find((h) => normalizeHeading(h) === normalizeHeading(t));
    if (heading) {
      flush();
      current = heading;
      continue;
    }
    if (current) buffer.push(line);
  }
  flush();

  const missing = BLUEPRINT_HEADINGS.filter((h) => byKey[h] === undefined);
  if (missing.length) {
    const err = new Error(`Blueprint doc template mismatch. Missing headings: ${missing.join(", ")}`);
    err.status = 400;
    err.expose = true;
    throw err;
  }

  return {
    objective: byKey.Objective || "",
    scope: byKey.Scope || "",
    techStack: byKey["Tech Stack"] || "",
    milestones: byKey.Milestones || "",
    notes: byKey.Notes || "",
  };
}

function buildBlueprintText(data) {
  const d = data || {};
  const techStack = Array.isArray(d.techStack) ? d.techStack.filter(Boolean).join(", ") : d.techStack;
  const milestones = Array.isArray(d.milestones)
    ? d.milestones
        .map((m) => (typeof m === "string" ? m : m?.name))
        .filter(Boolean)
        .join("\n")
    : d.milestones;
  const sections = [
    ["Objective", d.objective],
    ["Scope", d.scope],
    ["Tech Stack", techStack],
    ["Milestones", milestones],
    ["Notes", d.notes],
  ];
  return sections
    .map(([h, v]) => `${h}\n${String(v || "").trim()}\n`)
    .join("\n")
    .trimEnd();
}

async function getSheetValues({ sheetId }) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: "A1:Z2000",
  });
  return res?.data?.values || [];
}

async function writeSheetValues({ sheetId, values }) {
  const auth = getAuth();
  const sheets = google.sheets({ version: "v4", auth });

  await sheets.spreadsheets.values.clear({
    spreadsheetId: sheetId,
    range: "A1:Z2000",
  });

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: "A1",
    valueInputOption: "USER_ENTERED",
    requestBody: { values },
  });
}

async function exportDocText({ docId }) {
  const auth = getAuth();
  const drive = google.drive({ version: "v3", auth });
  const res = await drive.files.export(
    { fileId: docId, mimeType: "text/plain" },
    { responseType: "text" }
  );
  return String(res?.data || "");
}

async function overwriteDocText({ docId, text }) {
  const auth = getAuth();
  const docs = google.docs({ version: "v1", auth });
  const doc = await docs.documents.get({ documentId: docId });
  const content = doc?.data?.body?.content || [];
  const endIndex = content.length ? content[content.length - 1].endIndex : 1;

  const requests = [];
  if (endIndex > 2) {
    requests.push({
      deleteContentRange: {
        range: { startIndex: 1, endIndex: endIndex - 1 },
      },
    });
  }
  requests.push({
    insertText: {
      location: { index: 1 },
      text: String(text || ""),
    },
  });

  await docs.documents.batchUpdate({
    documentId: docId,
    requestBody: { requests },
  });
}

async function syncTnaFromGoogle({ tnaSheetUrl }) {
  const sheetId = extractGoogleId(tnaSheetUrl, "sheet");
  if (!sheetId) {
    const err = new Error("Invalid TNA Sheet URL. Paste a Google Sheets link like https://docs.google.com/spreadsheets/d/<id>/...");
    err.status = 400;
    err.expose = true;
    throw err;
  }

  const values = await getSheetValues({ sheetId });
  const items = parseTnaSheet(values);
  return { sheetId, items };
}

async function syncTnaToGoogle({ tnaSheetUrl, items }) {
  const sheetId = extractGoogleId(tnaSheetUrl, "sheet");
  if (!sheetId) {
    const err = new Error("Invalid TNA Sheet URL. Paste a Google Sheets link like https://docs.google.com/spreadsheets/d/<id>/...");
    err.status = 400;
    err.expose = true;
    throw err;
  }
  const values = buildTnaSheetValues(items);
  await writeSheetValues({ sheetId, values });
  return { sheetId };
}

async function syncBlueprintFromGoogle({ blueprintDocUrl }) {
  const docId = extractGoogleId(blueprintDocUrl, "doc");
  if (!docId) {
    const err = new Error("Invalid Blueprint Doc URL. Paste a Google Doc link like https://docs.google.com/document/d/<id>/...");
    err.status = 400;
    err.expose = true;
    throw err;
  }
  const text = await exportDocText({ docId });
  const data = parseBlueprintText(text);
  return { docId, data };
}

async function syncBlueprintToGoogle({ blueprintDocUrl, data }) {
  const docId = extractGoogleId(blueprintDocUrl, "doc");
  if (!docId) {
    const err = new Error("Invalid Blueprint Doc URL. Paste a Google Doc link like https://docs.google.com/document/d/<id>/...");
    err.status = 400;
    err.expose = true;
    throw err;
  }
  const text = buildBlueprintText(data);
  await overwriteDocText({ docId, text });
  return { docId };
}

module.exports = {
  syncTnaFromGoogle,
  syncTnaToGoogle,
  syncBlueprintFromGoogle,
  syncBlueprintToGoogle,
  buildBlueprintText,
  parseBlueprintText,
};
