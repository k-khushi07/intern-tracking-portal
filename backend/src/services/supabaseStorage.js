const path = require("path");
const { httpError } = require("../errors");
const { getSupabaseConfig, requireEnv } = require("./supabaseConfig");

const DEFAULT_TIMEOUT_MS = Number(process.env.SUPABASE_REQUEST_TIMEOUT_MS || 15000);

function ensureBucket() {
  return requireEnv("SUPABASE_STORAGE_BUCKET");
}

function encodePathSegments(objectPath) {
  return objectPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function parseDataUrl(dataUrl) {
  if (!dataUrl) return null;
  const commaIndex = dataUrl.indexOf(",");
  if (commaIndex === -1) {
    return { buffer: Buffer.from(dataUrl, "base64"), contentType: null };
  }
  const header = dataUrl.slice(5, commaIndex);
  const buffer = Buffer.from(dataUrl.slice(commaIndex + 1), "base64");
  const [mediaType] = header.split(";");
  return { buffer, contentType: mediaType || null };
}

async function uploadStorageObject({ bucket, objectPath, buffer, contentType }) {
  const { url, serviceRoleKey } = getSupabaseConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  try {
    const endpoint = new URL(`${url}/storage/v1/object/${bucket}/${encodePathSegments(objectPath)}`);
    endpoint.searchParams.set("upsert", "true");
    const res = await fetch(endpoint.toString(), {
      method: "PUT",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": contentType || "application/octet-stream",
        "Content-Length": Buffer.byteLength(buffer).toString(),
      },
      body: buffer,
      signal: controller.signal,
    });

    if (!res.ok) {
      const message = `Supabase storage upload failed (${res.status})`;
      throw httpError(res.status, message, true);
    }
  } finally {
    clearTimeout(timeout);
  }
}

function buildPublicUrl(bucket, objectPath) {
  const { url } = getSupabaseConfig();
  return `${url}/storage/v1/object/public/${bucket}/${encodePathSegments(objectPath)}`;
}

async function uploadProfileFile({ profileId, field, filePayload }) {
  if (!filePayload) return null;
  const { buffer, contentType: inferredType } = parseDataUrl(filePayload.dataUrl || filePayload.base64 || filePayload.data || "");
  if (!buffer || !buffer.length) return null;

  const bucket = ensureBucket();
  const timestamp = Date.now();
  const ext = path.extname(filePayload.name || "");
  const baseName = path.basename(filePayload.name || field, ext);
  const normalizedBase = baseName.replace(/[^a-zA-Z0-9_-]/g, "_") || field;
  const suffix = ext || "";
  const objectPath = `profiles/${profileId}/${field}-${timestamp}-${normalizedBase}${suffix}`;

  await uploadStorageObject({
    bucket,
    objectPath,
    buffer,
    contentType: filePayload.type || inferredType || "application/octet-stream",
  });

  return buildPublicUrl(bucket, objectPath);
}

module.exports = {
  uploadProfileFile,
};
