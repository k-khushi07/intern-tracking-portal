async function test() {
  const path = require("path");
  const dns = require("node:dns").promises;

  // Ensure backend/.env is loaded even when running this script from repo root.
  require("dotenv").config({ path: path.join(__dirname, ".env") });

  function decodeJwtPayload(token) {
    try {
      const payload = String(token || "").split(".")[1];
      if (!payload) return null;
      return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    } catch {
      return null;
    }
  }

  function withTimeout(promise, ms, label) {
    let timer = null;
    const timeoutPromise = new Promise((_, reject) => {
      const err = new Error(`${label} timed out after ${ms}ms`);
      err.code = "ETIMEDOUT";
      timer = setTimeout(() => reject(err), ms);
      if (timer && typeof timer.unref === "function") timer.unref();
    });

    const wrapped = Promise.resolve(promise).finally(() => {
      if (timer) clearTimeout(timer);
    });

    return Promise.race([wrapped, timeoutPromise]).finally(() => {
      if (timer) clearTimeout(timer);
    });
  }

  const supabaseUrl = String(process.env.SUPABASE_URL || "").trim();
  const anonKey = String(process.env.SUPABASE_ANON_KEY || "").trim();
  const anonRef = decodeJwtPayload(anonKey)?.ref || null;

  if (!supabaseUrl) {
    console.error("Missing SUPABASE_URL in backend/.env");
    if (anonRef) console.error("Anon key ref:", anonRef, `(expected URL: https://${anonRef}.supabase.co)`);
    process.exitCode = 1;
    return;
  }
  if (!anonKey) {
    console.error("Missing SUPABASE_ANON_KEY in backend/.env");
    process.exitCode = 1;
    return;
  }

  let host = null;
  try {
    host = new URL(supabaseUrl).host;
  } catch (err) {
    console.error("Invalid SUPABASE_URL (not a valid URL):", supabaseUrl);
    process.exitCode = 1;
    return;
  }

  console.log("SUPABASE_URL:", supabaseUrl);
  console.log("Host:", host);

  try {
    const records = await withTimeout(dns.resolveAny(host), 4000, "DNS lookup");
    const first = records?.[0];
    console.log("DNS: OK", first ? `(${first.type})` : "");
  } catch (err) {
    console.error("DNS: FAILED", err?.code || err?.name || "", err?.message || "");
    if (anonRef) console.error("Anon key ref:", anonRef, `(expected host: ${anonRef}.supabase.co)`);
    console.error(
      "Hint: This usually means SUPABASE_URL is wrong (project deleted / typo) or your network DNS is blocking *.supabase.co."
    );
    console.error(
      "If your environment blocks outbound internet, you can also run Supabase locally and set SUPABASE_URL to http://127.0.0.1:54321 (plus the local anon/service keys from `supabase start`)."
    );
    process.exitCode = 2;
    return;
  }

  try {
    const endpoint = supabaseUrl.replace(/\/$/, "") + "/rest/v1/";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(endpoint, { headers: { apikey: anonKey }, signal: controller.signal }).finally(() =>
      clearTimeout(timeout)
    );
    console.log("Fetch:", res.status, res.statusText);
    const text = await res.text();
    const preview = text.length > 800 ? text.slice(0, 800) + "...(truncated)" : text;
    console.log("Body:", preview);
    if (!res.ok) process.exitCode = 3;
  } catch (err) {
    console.error("Fetch: FAILED", err?.code || err?.name || "", err?.message || "");
    console.error("Cause:", err?.cause?.code || err?.cause?.name || "", err?.cause?.message || "");
    process.exitCode = 4;
  }
}

test()
  .catch(() => {
    process.exitCode = process.exitCode || 1;
  })
  .finally(() => {
    process.exit(process.exitCode || 0);
  });
