async function parseResponse(res) {
  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json().catch(() => null) : await res.text();
  if (!res.ok) {
    const message =
      (body && body.message) ||
      (body && body.error) ||
      (typeof body === "string" ? body : "Request failed");
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
}

export async function apiFetch(path, options = {}) {
  const url = path.startsWith("/api") ? path : `/api${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  return parseResponse(res);
}

export const authApi = {
  login({ email, password, expectedRole, rememberMe }) {
    return apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, expectedRole, rememberMe }),
    });
  },
  me() {
    return apiFetch("/auth/me", { method: "GET" });
  },
  logout() {
    return apiFetch("/auth/logout", { method: "POST" });
  },
};

export const applicationsApi = {
  create({ formData, applicationPDF }) {
    return apiFetch("/applications", {
      method: "POST",
      body: JSON.stringify({ formData, applicationPDF }),
    });
  },
};

export const hrApi = {
  users() {
    return apiFetch("/hr/users", { method: "GET" });
  },
  stats() {
    return apiFetch("/hr/stats", { method: "GET" });
  },
  reports() {
    return apiFetch("/hr/reports", { method: "GET" });
  },
  internTna(internId) {
    return apiFetch(`/hr/interns/${internId}/tna`, { method: "GET" });
  },
  internBlueprint(internId) {
    return apiFetch(`/hr/interns/${internId}/blueprint`, { method: "GET" });
  },
  internReportLinks(internId) {
    return apiFetch(`/hr/interns/${internId}/report-links`, { method: "GET" });
  },
  createAnnouncement({ title, content, priority, audienceRoles, pinned }) {
    return apiFetch("/hr/announcements", {
      method: "POST",
      body: JSON.stringify({ title, content, priority, audienceRoles, pinned }),
    });
  },
  updateAnnouncement(announcementId, patch) {
    return apiFetch(`/hr/announcements/${announcementId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },
  deleteAnnouncement(announcementId) {
    return apiFetch(`/hr/announcements/${announcementId}`, { method: "DELETE" });
  },
  setApplicationStatus(applicationId, status) {
    return apiFetch(`/hr/applications/${applicationId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },
  approveApplication(applicationId, { internId, password, email }) {
    return apiFetch(`/hr/applications/${applicationId}/approve`, {
      method: "POST",
      body: JSON.stringify({ internId, password, email }),
    });
  },
  rejectApplication(applicationId, { reason }) {
    return apiFetch(`/hr/applications/${applicationId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },
  assignPm(internProfileId, pmCode) {
    return apiFetch(`/hr/interns/${internProfileId}/assign-pm`, {
      method: "PATCH",
      body: JSON.stringify({ pmCode }),
    });
  },
};

export const adminApi = {
  createUser({ email, password, role, fullName, pmCode }) {
    return apiFetch("/admin/users", {
      method: "POST",
      body: JSON.stringify({ email, password, role, fullName, pmCode }),
    });
  },
};

export const pmApi = {
  me() {
    return apiFetch("/pm/me", { method: "GET" });
  },
  interns() {
    return apiFetch("/pm/interns", { method: "GET" });
  },
  internTna(internId) {
    return apiFetch(`/pm/interns/${internId}/tna`, { method: "GET" });
  },
  internBlueprint(internId) {
    return apiFetch(`/pm/interns/${internId}/blueprint`, { method: "GET" });
  },
  internReportLinks(internId) {
    return apiFetch(`/pm/interns/${internId}/report-links`, { method: "GET" });
  },
  stats() {
    return apiFetch("/pm/stats", { method: "GET" });
  },
  reports() {
    return apiFetch("/pm/reports", { method: "GET" });
  },
  reviewReport(reportId, { status, reason }) {
    return apiFetch(`/pm/reports/${reportId}/review`, {
      method: "PATCH",
      body: JSON.stringify({ status, reason }),
    });
  },
};

export const internApi = {
  me() {
    return apiFetch("/intern/me", { method: "GET" });
  },
  stats() {
    return apiFetch("/intern/stats", { method: "GET" });
  },
  updateMe({ profileData, profileCompleted }) {
    return apiFetch("/intern/me", {
      method: "PATCH",
      body: JSON.stringify({ profileData, profileCompleted }),
    });
  },
  dailyLogs() {
    return apiFetch("/intern/daily-logs", { method: "GET" });
  },
  createDailyLog({ logDate, date, hoursWorked, tasks, learnings, blockers }) {
    return apiFetch("/intern/daily-logs", {
      method: "POST",
      body: JSON.stringify({ logDate, date, hoursWorked, tasks, learnings, blockers }),
    });
  },
  reports() {
    return apiFetch("/intern/reports", { method: "GET" });
  },
  createReport(payload) {
    return apiFetch("/intern/reports", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  tna() {
    return apiFetch("/intern/tna", { method: "GET" });
  },
  createTnaItem(payload) {
    return apiFetch("/intern/tna", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  updateTnaItem(itemId, patch) {
    return apiFetch(`/intern/tna/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    });
  },
  deleteTnaItem(itemId) {
    return apiFetch(`/intern/tna/${itemId}`, { method: "DELETE" });
  },
  blueprint() {
    return apiFetch("/intern/blueprint", { method: "GET" });
  },
  updateBlueprint(data) {
    return apiFetch("/intern/blueprint", {
      method: "PATCH",
      body: JSON.stringify({ data }),
    });
  },
  reportLinks() {
    return apiFetch("/intern/report-links", { method: "GET" });
  },
  updateReportLinks({ tnaSheetUrl, blueprintDocUrl }) {
    return apiFetch("/intern/report-links", {
      method: "PATCH",
      body: JSON.stringify({ tnaSheetUrl, blueprintDocUrl }),
    });
  },
  syncTnaFromGoogle() {
    return apiFetch("/intern/tna/sync/from-google", { method: "POST" });
  },
  syncBlueprintFromGoogle() {
    return apiFetch("/intern/blueprint/sync/from-google", { method: "POST" });
  },
};

export const announcementsApi = {
  list() {
    return apiFetch("/announcements", { method: "GET" });
  },
};

export const messagesApi = {
  contacts() {
    return apiFetch("/messages/contacts", { method: "GET" });
  },
  conversations() {
    return apiFetch("/messages/conversations", { method: "GET" });
  },
  createDirect(targetProfileId) {
    return apiFetch("/messages/conversations/direct", {
      method: "POST",
      body: JSON.stringify({ targetProfileId }),
    });
  },
  createGroup({ name, memberProfileIds }) {
    return apiFetch("/messages/conversations/group", {
      method: "POST",
      body: JSON.stringify({ name, memberProfileIds }),
    });
  },
  updateMembers(conversationId, { add, remove }) {
    return apiFetch(`/messages/conversations/${conversationId}/members`, {
      method: "PATCH",
      body: JSON.stringify({ add, remove }),
    });
  },
  listMessages(conversationId, { cursor, limit } = {}) {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (limit) params.set("limit", String(limit));
    const qs = params.toString();
    return apiFetch(`/messages/conversations/${conversationId}/messages${qs ? `?${qs}` : ""}`, { method: "GET" });
  },
  sendMessage(conversationId, body) {
    return apiFetch(`/messages/conversations/${conversationId}/messages`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
  },
  markRead(conversationId) {
    return apiFetch(`/messages/conversations/${conversationId}/read`, { method: "POST" });
  },
  reportMessage(messageId, { reason }) {
    return apiFetch(`/messages/messages/${messageId}/report`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },
  deleteMessage(messageId) {
    return apiFetch(`/messages/messages/${messageId}`, { method: "DELETE" });
  },
};
