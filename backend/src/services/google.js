const { google } = require("googleapis");
const { httpError } = require("../errors");

function getServiceAccountJson() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch (e) {
      throw httpError(500, "Invalid GOOGLE_SERVICE_ACCOUNT_JSON (must be valid JSON)", true);
    }
  }
  return null;
}

function requireGoogleAuth() {
  const sa = getServiceAccountJson();
  const scopes = [
    "https://www.googleapis.com/auth/drive",
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/documents",
  ];

  if (sa?.client_email && sa?.private_key) {
    return new google.auth.JWT({
      email: sa.client_email,
      key: sa.private_key,
      scopes,
    });
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return new google.auth.GoogleAuth({ scopes });
  }

  throw httpError(
    500,
    "Google sync is not configured. Set GOOGLE_SERVICE_ACCOUNT_JSON (recommended) or GOOGLE_APPLICATION_CREDENTIALS.",
    true
  );
}

function extractGoogleId(url, type) {
  const raw = String(url || "").trim();
  if (!raw) return null;

  if (type === "sheets") {
    const m = raw.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (m) return m[1];
    const q = raw.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (q) return q[1];
  }

  if (type === "docs") {
    const m = raw.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
    if (m) return m[1];
    const q = raw.match(/[?&]id=([a-zA-Z0-9-_]+)/);
    if (q) return q[1];
  }

  return null;
}

function normalizeHeader(h) {
  return String(h || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^\w]/g, "");
}

function pick(obj, keys) {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
}

function toIsoDate(value) {
  if (!value) return null;
  const s = String(value).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function parseTnaSheetValues(values) {
  const rows = Array.isArray(values) ? values : [];
  if (rows.length < 2) return [];

  const header = rows[0].map(normalizeHeader);
  const dataRows = rows.slice(1);

  const mapped = [];
  for (let i = 0; i < dataRows.length; i += 1) {
    const cells = dataRows[i] || [];
    const obj = {};
    header.forEach((h, idx) => {
      obj[h] = cells[idx];
    });

    const weekNumberRaw = pick(obj, ["week", "week_number", "weekno", "w"]);
    const task = String(pick(obj, ["task", "tasks"]) || "").trim();
    const plannedDate = toIsoDate(pick(obj, ["planned_date", "planned", "plan_date"]));
    const planOfAction = String(pick(obj, ["plan_of_action", "plan", "planaction"]) || "").trim();
    const executedDate = toIsoDate(pick(obj, ["executed_date", "executed", "done_date"]));
    const statusRaw = String(pick(obj, ["status"]) || "").trim().toLowerCase();
    const reason = String(pick(obj, ["reason", "blocker_reason"]) || "").trim();
    const deliverable = String(pick(obj, ["deliverable", "deliverables", "link"]) || "").trim();

    if (!task) continue;
    const status = ["pending", "in_progress", "completed", "blocked"].includes(statusRaw) ? statusRaw : "pending";
    const weekNumber = Number.isFinite(Number(weekNumberRaw)) ? Number(weekNumberRaw) : null;

    mapped.push({
      weekNumber,
      task,
      plannedDate,
      planOfAction,
      executedDate,
      status,
      reason: reason || null,
      deliverable: deliverable || null,
      sortOrder: i + 1,
    });
  }
  return mapped;
}

function tnaItemsToSheetValues(items) {
  const header = ["Week", "Task", "Planned Date", "Plan of Action", "Executed Date", "Status", "Reason", "Deliverable"];
  const rows = (items || []).map((it) => [
    it.week_number ?? "",
    it.task ?? "",
    it.planned_date ?? "",
    it.plan_of_action ?? "",
    it.executed_date ?? "",
    it.status ?? "pending",
    it.reason ?? "",
    it.deliverable ?? "",
  ]);
  return [header, ...rows];
}

function docToPlainText(doc) {
  const parts = [];
  const content = doc?.body?.content || [];
  for (const el of content) {
    const para = el.paragraph;
    if (!para?.elements) continue;
    for (const pe of para.elements) {
      const textRun = pe.textRun;
      if (textRun?.content) parts.push(textRun.content);
    }
  }
  return parts.join("");
}

function parseBlueprintFromText(text) {
  const t = String(text || "").replace(/\r\n/g, "\n");
  const headings = ["Objective", "Scope", "Tech Stack", "Milestones", "Notes"];

  const lines = t.split("\n");
  const sections = {};
  let current = null;
  for (const line of lines) {
    const m = line.match(/^\s*([A-Za-z ]+)\s*:\s*$/);
    if (m) {
      const name = String(m[1] || "").trim();
      const normalized = headings.find((h) => h.toLowerCase() === name.toLowerCase());
      if (normalized) {
        current = normalized;
        if (!sections[current]) sections[current] = [];
        continue;
      }
    }
    if (!current) continue;
    sections[current].push(line);
  }

  const objective = (sections["Objective"] || []).join("\n").trim();
  const scope = (sections["Scope"] || []).join("\n").trim();
  const techStackRaw = (sections["Tech Stack"] || []).join("\n").trim();
  const notes = (sections["Notes"] || []).join("\n").trim();
  const milestonesRaw = (sections["Milestones"] || []).join("\n").trim();

  const techStack = techStackRaw
    ? techStackRaw
        .split(/,|\n/)
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  const milestones = milestonesRaw
    ? milestonesRaw
        .split("\n")
        .map((s) => s.trim().replace(/^[-*•]\s+/, ""))
        .filter(Boolean)
        .map((name) => ({ name, status: "Pending" }))
    : [];

  return { objective, scope, techStack, milestones, notes };
}

function blueprintToDocText(data) {
  const d = data || {};
  const objective = String(d.objective || "").trim();
  const scope = String(d.scope || "").trim();
  const techStack = Array.isArray(d.techStack) ? d.techStack.join(", ") : String(d.techStack || "").trim();
  const milestones = Array.isArray(d.milestones)
    ? d.milestones
        .map((m) => (typeof m === "string" ? m : m?.name))
        .filter(Boolean)
        .map((n) => `- ${n}`)
        .join("\n")
    : String(d.milestones || "").trim();
  const notes = String(d.notes || "").trim();

  return [
    "Objective:",
    objective || "",
    "",
    "Scope:",
    scope || "",
    "",
    "Tech Stack:",
    techStack || "",
    "",
    "Milestones:",
    milestones || "",
    "",
    "Notes:",
    notes || "",
    "",
  ].join("\n");
}

async function getSheetsClient() {
  const auth = requireGoogleAuth();
  return google.sheets({ version: "v4", auth });
}

async function getDocsClient() {
  const auth = requireGoogleAuth();
  return google.docs({ version: "v1", auth });
}

async function sheetsReadTna({ spreadsheetId, range = "A1:Z1000" }) {
  const sheets = await getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
    majorDimension: "ROWS",
    valueRenderOption: "FORMATTED_VALUE",
  });
  const values = res?.data?.values || [];
  return parseTnaSheetValues(values);
}

async function sheetsWriteTna({ spreadsheetId, values, range = "A1" }) {
  const sheets = await getSheetsClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

async function docsReadBlueprint({ documentId }) {
  const docs = await getDocsClient();
  const res = await docs.documents.get({ documentId });
  const text = docToPlainText(res?.data);
  return parseBlueprintFromText(text);
}

async function docsWriteBlueprint({ documentId, data }) {
  const docs = await getDocsClient();
  const res = await docs.documents.get({ documentId });
  const doc = res?.data;
  const endIndex = doc?.body?.content?.[doc.body.content.length - 1]?.endIndex || 1;
  const text = blueprintToDocText(data);

  await docs.documents.batchUpdate({
    documentId,
    requestBody: {
      requests: [
        {
          deleteContentRange: {
            range: { startIndex: 1, endIndex: Math.max(1, endIndex - 1) },
          },
        },
        {
          insertText: {
            location: { index: 1 },
            text,
          },
        },
      ],
    },
  });
}

module.exports = {
  extractGoogleId,
  tnaItemsToSheetValues,
  sheetsReadTna,
  sheetsWriteTna,
  docsReadBlueprint,
  docsWriteBlueprint,
  parseBlueprintFromText,
};

