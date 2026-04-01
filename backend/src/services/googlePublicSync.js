const { httpError } = require("../errors");

function extractDocOrSheetId(url, kind) {
  const raw = String(url || "").trim();
  if (!raw) return null;
  if (/^[a-zA-Z0-9_-]{20,}$/.test(raw)) return { id: raw, published: false };

  const patterns =
    kind === "sheet"
      ? [
        { re: /spreadsheets\/(?:u\/\d+\/)?d\/e\/([a-zA-Z0-9_-]+)/i, published: true },
        { re: /spreadsheets\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/i, published: false },
      ]
      : kind === "doc"
        ? [
          { re: /document\/(?:u\/\d+\/)?d\/e\/([a-zA-Z0-9_-]+)/i, published: true },
          { re: /document\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)/i, published: false },
        ]
        : [];

  for (const p of patterns) {
    const m = raw.match(p.re);
    if (m?.[1]) return { id: m[1], published: p.published };
  }
  return null;
}

function extractSheetGid(url) {
  const raw = String(url || "").trim();
  if (!raw) return "0";
  try {
    const u = new URL(raw);
    if (u.searchParams.get("gid")) return u.searchParams.get("gid");
    const hash = String(u.hash || "");
    const m = hash.match(/gid=([0-9]+)/i);
    if (m?.[1]) return m[1];
  } catch {
    // ignore
  }
  const m2 = raw.match(/gid=([0-9]+)/i);
  return m2?.[1] || "0";
}

async function fetchText(url, { timeoutMs = 20000 } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      headers: {
        "User-Agent": "intern-tracking-portal-api",
        Accept: "text/plain,text/csv,text/html,application/octet-stream,*/*",
      },
      signal: controller.signal,
    });
    const contentType = res.headers.get("content-type") || "";
    const body = await res.text();
    return { ok: res.ok, status: res.status, contentType, body };
  } finally {
    clearTimeout(timeout);
  }
}

function looksLikeGoogleLoginPage(text) {
  const t = String(text || "").toLowerCase();
  return (
    t.includes("accounts.google.com") ||
    t.includes("servicelogin") ||
    t.includes("to continue to google") ||
    t.includes("sign in") ||
    t.includes("signin")
  );
}

function decodeHtmlEntities(input) {
  return String(input || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)));
}

function htmlToText(html) {
  const raw = String(html || "");
  const noScripts = raw
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
  const withBreaks = noScripts
    .replace(/<(br|br\/)\s*>/gi, "\n")
    .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|li)>/gi, "\n");
  const stripped = withBreaks.replace(/<[^>]+>/g, "");
  const decoded = decodeHtmlEntities(stripped);
  return decoded
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseCsv(text) {
  const s = String(text || "").replace(/\r\n/g, "\n");
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < s.length; i += 1) {
    const ch = s[i];
    const next = s[i + 1];
    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i += 1;
        continue;
      }
      if (ch === '"') {
        inQuotes = false;
        continue;
      }
      cell += ch;
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      row.push(cell);
      cell = "";
      continue;
    }
    if (ch === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      continue;
    }
    cell += ch;
  }
  row.push(cell);
  rows.push(row);
  return rows.filter((r) => r.some((c) => String(c || "").trim() !== ""));
}

function normalizeHeader(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
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

function parseTnaGrid(values) {
  const rows = Array.isArray(values) ? values : [];
  if (rows.length < 2) return [];

  const required = ["week", "task", "planneddate", "executeddate", "status", "deliverable"];
  const optional = ["planofaction", "reason"];
  const canonicalLabels = {
    week: "Week",
    task: "Task",
    planneddate: "Planned Date",
    planofaction: "Plan of Action",
    executeddate: "Executed Date",
    status: "Status",
    reason: "Reason",
    deliverable: "Deliverable",
  };

  const pickFirst = (headerMap, keys) => {
    for (const k of keys) {
      if (headerMap[k] !== undefined) return headerMap[k];
    }
    return undefined;
  };

  const applyAliases = (headerMap) => {
    const keys = Object.keys(headerMap);
    const findKey = (predicate) => keys.find((k) => predicate(k));

    const resolved = { ...headerMap };

    const resolve = (name, candidates, fuzzy) => {
      if (resolved[name] !== undefined) return;
      const direct = pickFirst(resolved, candidates.filter(Boolean));
      if (direct !== undefined) {
        resolved[name] = direct;
        return;
      }
      const fuzzyKey = fuzzy ? findKey(fuzzy) : null;
      if (fuzzyKey && resolved[fuzzyKey] !== undefined) resolved[name] = resolved[fuzzyKey];
    };

    resolve("week", ["week", "weeknumber", "weekno", "wk"], (k) => k.startsWith("week"));
    resolve("task", ["task", "tasks"], (k) => k.includes("task"));
    resolve("planneddate", ["planneddate", "plandate", "planned"], (k) => k.startsWith("planneddate") || (k.includes("planned") && k.includes("date")));
    resolve("planofaction", ["planofaction", "actionplan", "planaction", "plan"], (k) => k.includes("planofaction") || k.includes("actionplan"));
    resolve(
      "executeddate",
      ["executeddate", "executiondate", "executed"],
      (k) => k.startsWith("executeddate") || k.includes("executiondate") || (k.includes("executed") && k.includes("date"))
    );
    resolve("status", ["status", "state"], (k) => k.includes("status") || k.includes("state"));
    resolve("reason", ["reason", "blocker", "blockers"], (k) => k.includes("reason") || k.includes("blocker"));
    resolve("deliverable", ["deliverable", "deliverables", "output", "outputs"], (k) => k.includes("deliverable") || k.includes("output"));

    return resolved;
  };

  const scoreRow = (row) => {
    const headerMap = {};
    (row || []).forEach((h, idx) => {
      const key = normalizeHeader(h);
      if (key) headerMap[key] = idx;
    });
    const resolved = applyAliases(headerMap);
    const score = [...required, ...optional].reduce((sum, k) => sum + (resolved[k] !== undefined ? 1 : 0), 0);
    const hasTask = resolved.task !== undefined;
    const hasStatus = resolved.status !== undefined;
    return { headerMap: resolved, score, hasTask, hasStatus, rawHeaders: Object.keys(headerMap) };
  };

  // Find header row: some sheets have title/blank rows above the actual header.
  let best = { idx: 0, score: -1, headerMap: null, rawHeaders: [] };
  const scanLimit = Math.min(rows.length, 20);
  for (let i = 0; i < scanLimit; i += 1) {
    const scored = scoreRow(rows[i]);
    if (scored.score > best.score || (scored.score === best.score && scored.hasTask && scored.hasStatus)) {
      best = { idx: i, score: scored.score, headerMap: scored.headerMap, rawHeaders: scored.rawHeaders };
    }
  }

  const headerIndex = best.idx;
  const headerMap = best.headerMap || applyAliases({});

  const missing = required.filter((k) => headerMap[k] === undefined);
  if (missing.length) {
    const foundList = best.rawHeaders.length ? best.rawHeaders.join(", ") : "(none)";
    const missingLabels = missing.map((k) => canonicalLabels[k] || k).join(", ");
    const optionalLabels = optional.map((k) => canonicalLabels[k] || k).join(", ");
    throw httpError(
      400,
      `TNA sheet template mismatch. Missing columns: ${missingLabels}. Required: Week, Task, Planned Date, Executed Date, Status, Deliverable. Optional: ${optionalLabels}. (Detected header row at CSV line ${headerIndex + 1}; found headers: ${foundList})`,
      true
    );
  }

  const items = [];
  for (let i = headerIndex + 1; i < rows.length; i += 1) {
    const r = rows[i] || [];
    const allEmpty = r.every((c) => !String(c || "").trim());
    if (allEmpty) continue;
    const task = String(r[headerMap.task] || "").trim();
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
  const headingKeys = BLUEPRINT_HEADINGS.map((h) => ({ raw: h, key: normalizeHeading(h) }));
  const splitInlineHeading = (line) => {
    const raw = String(line || "").trim();
    if (!raw) return null;
    const normalized = normalizeHeading(raw);
    const direct = headingKeys.find((h) => h.key === normalized);
    if (direct) return { heading: direct.raw, rest: "" };

    // Accept inline heading forms like:
    // "Objective: ....", "Tech Stack - ....", "Milestones — ...."
    for (const h of headingKeys) {
      const re = new RegExp(`^${h.key}[:\\-–—]\\s*`, "i");
      // We test against a normalized prefix by normalizing only the prefix region.
      // Simpler: test raw with case-insensitive heading name and separators.
      const rawRe = new RegExp(`^\\s*${h.raw.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*[:\\-–—]\\s*`, "i");
      if (rawRe.test(raw)) {
        const rest = raw.replace(rawRe, "");
        return { heading: h.raw, rest };
      }
      if (re.test(normalized)) {
        // Fallback if the doc text lost spaces/punctuation.
        const rest2 = raw.split(/[:\-–—]/).slice(1).join("-").trim();
        return { heading: h.raw, rest: rest2 };
      }
    }
    return null;
  };

  for (const line of lines) {
    const match = splitInlineHeading(line);
    if (match?.heading) {
      flush();
      current = match.heading;
      if (String(match.rest || "").trim()) buffer.push(String(match.rest || "").trim());
      continue;
    }
    if (current) buffer.push(line);
  }
  flush();

  const missing = BLUEPRINT_HEADINGS.filter((h) => byKey[h] === undefined);
  if (missing.length) {
    throw httpError(
      400,
      `Blueprint doc template mismatch. Missing headings: ${missing.join(", ")}. Required headings: Objective, Scope, Tech Stack, Milestones, Notes.`,
      true
    );
  }

  return {
    objective: byKey.Objective || "",
    scope: byKey.Scope || "",
    techStack: byKey["Tech Stack"] || "",
    milestones: byKey.Milestones || "",
    notes: byKey.Notes || "",
  };
}

function buildSheetCsvUrl(sheetUrl) {
  const parsed = extractDocOrSheetId(sheetUrl, "sheet");
  if (!parsed) return null;
  const gid = extractSheetGid(sheetUrl);

  if (parsed.published) {
    return `https://docs.google.com/spreadsheets/d/e/${parsed.id}/pub?output=csv&gid=${encodeURIComponent(gid)}`;
  }
  return `https://docs.google.com/spreadsheets/d/${parsed.id}/export?format=csv&gid=${encodeURIComponent(gid)}`;
}

function buildDocTextUrl(docUrl) {
  const parsed = extractDocOrSheetId(docUrl, "doc");
  if (!parsed) return null;
  if (parsed.published) {
    return `https://docs.google.com/document/d/e/${parsed.id}/pub?output=txt`;
  }
  return `https://docs.google.com/document/d/${parsed.id}/export?format=txt`;
}

function buildSheetCandidateUrls(sheetUrl) {
  const parsed = extractDocOrSheetId(sheetUrl, "sheet");
  if (!parsed) return null;
  const gid = extractSheetGid(sheetUrl);
  const raw = String(sheetUrl || "");
  const hasGid = /[?#&]gid=\d+/i.test(raw) || /#gid=\d+/i.test(raw);
  if (parsed.published) {
    return hasGid
      ? [
        `https://docs.google.com/spreadsheets/d/e/${parsed.id}/pub?output=csv&gid=${encodeURIComponent(gid)}`,
        `https://docs.google.com/spreadsheets/d/e/${parsed.id}/pub?output=csv`,
      ]
      : [
        `https://docs.google.com/spreadsheets/d/e/${parsed.id}/pub?output=csv`,
        `https://docs.google.com/spreadsheets/d/e/${parsed.id}/pub?output=csv&gid=${encodeURIComponent(gid)}`,
      ];
  }
  return hasGid
    ? [
      `https://docs.google.com/spreadsheets/d/${parsed.id}/export?format=csv&gid=${encodeURIComponent(gid)}`,
      `https://docs.google.com/spreadsheets/d/${parsed.id}/gviz/tq?tqx=out:csv&gid=${encodeURIComponent(gid)}`,
      `https://docs.google.com/spreadsheets/d/${parsed.id}/export?format=csv`,
      `https://docs.google.com/spreadsheets/d/${parsed.id}/pub?output=csv&gid=${encodeURIComponent(gid)}`,
    ]
    : [
      `https://docs.google.com/spreadsheets/d/${parsed.id}/export?format=csv`,
      `https://docs.google.com/spreadsheets/d/${parsed.id}/export?format=csv&gid=${encodeURIComponent(gid)}`,
      `https://docs.google.com/spreadsheets/d/${parsed.id}/gviz/tq?tqx=out:csv&gid=${encodeURIComponent(gid)}`,
      `https://docs.google.com/spreadsheets/d/${parsed.id}/pub?output=csv`,
    ];
}

function buildDocCandidateUrls(docUrl) {
  const parsed = extractDocOrSheetId(docUrl, "doc");
  if (!parsed) return null;
  if (parsed.published) {
    return [
      `https://docs.google.com/document/d/e/${parsed.id}/pub?embedded=true`,
      `https://docs.google.com/document/d/e/${parsed.id}/pub`,
    ];
  }
  return [
    `https://docs.google.com/document/d/${parsed.id}/export?format=txt`,
    `https://docs.google.com/document/d/${parsed.id}/export?format=html`,
    `https://docs.google.com/document/d/${parsed.id}/pub?output=txt`,
  ];
}

async function fetchFirstOk(candidates) {
  const attempts = [];
  let last = null;
  for (const url of candidates) {
    const res = await fetchText(url);
    attempts.push({ url, status: res?.status || 0, ok: !!res?.ok });
    last = { url, res, attempts };
    if (!res.ok) continue;
    if (looksLikeGoogleLoginPage(res.body)) continue;
    return { url, res, attempts };
  }
  return last;
}

async function syncTnaFromPublicGoogle({ tnaSheetUrl }) {
  const candidates = buildSheetCandidateUrls(tnaSheetUrl);
  if (!candidates) {
    throw httpError(
      400,
      "Invalid TNA Sheet URL. Paste a Google Sheets link like https://docs.google.com/spreadsheets/d/<id>/...",
      true
    );
  }

  const attempt = await fetchFirstOk(candidates);
  const exportUrl = attempt?.url || candidates[0];
  const res = attempt?.res;
  if (!res || !res.ok || looksLikeGoogleLoginPage(res.body)) {
    const status = res?.status || 0;
    const statusLabel = status ? `status ${status}` : "no response";
    const tried = (attempt?.attempts || [])
      .map((a) => `${a.status || "?"} ${a.url}`)
      .slice(0, 3)
      .join("\n");
    throw httpError(
      400,
      `Cannot fetch the Google Sheet (${statusLabel}).\n\nMake sure it is public:\n- Share: “Anyone with the link” → Viewer, OR\n- File → Share → Publish to web (recommended)\n\nTried:\n${tried || exportUrl}\n\nTip: open the export link in an Incognito window. If it asks you to sign in, the sheet is not public.`,
      true
    );
  }

  const grid = parseCsv(res.body);
  const items = parseTnaGrid(grid);
  return { items, exportUrl };
}

async function syncBlueprintFromPublicGoogle({ blueprintDocUrl }) {
  const candidates = buildDocCandidateUrls(blueprintDocUrl);
  if (!candidates) {
    throw httpError(
      400,
      "Invalid Blueprint Doc URL. Paste a Google Doc link like https://docs.google.com/document/d/<id>/...",
      true
    );
  }

  const attempt = await fetchFirstOk(candidates);
  const exportUrl = attempt?.url || candidates[0];
  const res = attempt?.res;

  if (!res || !res.ok || looksLikeGoogleLoginPage(res.body)) {
    const status = res?.status || 0;
    const statusLabel = status ? `status ${status}` : "no response";
    const tried = (attempt?.attempts || [])
      .map((a) => `${a.status || "?"} ${a.url}`)
      .slice(0, 3)
      .join("\n");
    throw httpError(
      400,
      `Cannot fetch the Google Doc (${statusLabel}).\n\nMake sure it is public:\n- Share: “Anyone with the link” → Viewer, OR\n- File → Share → Publish to web (recommended)\n\nTried:\n${tried || exportUrl}\n\nTip: open the export link in an Incognito window. If it asks you to sign in, the doc is not public.`,
      true
    );
  }

  const contentType = String(res.contentType || "");
  const body = String(res.body || "");
  const isHtml = contentType.includes("text/html") || body.trim().startsWith("<");
  const text = isHtml ? htmlToText(body) : body;
  if (/does not exist|not found|access denied|permission/i.test(text)) {
    throw httpError(
      400,
      "Cannot read this Doc with a public request. Make sure it is shared publicly or published to the web, then retry Sync.",
      true
    );
  }
  const data = parseBlueprintText(text);
  return { data, exportUrl };
}

module.exports = {
  syncTnaFromPublicGoogle,
  syncBlueprintFromPublicGoogle,
};
