const express = require("express");
const { httpError } = require("../errors");
const { adminCreateUser, adminDeleteUser, restInsert, restSelect, restUpdate } = require("../services/supabaseRest");
const { createAuthMiddleware } = require("../middleware/auth");
const { generateNextInternId, checkInternIdUsage } = require("../services/internId");
const { generateNextPmCode, checkPmCodeUsage } = require("../services/pmCode");

const ALLOWED_ROLES = new Set(["admin", "hr", "pm", "intern"]);
const USER_STATUS = new Set(["active", "inactive", "completed", "archived"]);

function isIsoDateString(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "").trim());
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function validateInternDateRange({ startDate, endDate, required = false }) {
  const normalizedStart = startDate ? String(startDate).trim() : "";
  const normalizedEnd = endDate ? String(endDate).trim() : "";
  if (!normalizedStart && !normalizedEnd) {
    if (required) throw httpError(400, "startDate and endDate are required", true);
    return { startDate: null, endDate: null };
  }
  if (!normalizedStart || !normalizedEnd) {
    throw httpError(400, "Both startDate and endDate must be provided together", true);
  }
  if (!isIsoDateString(normalizedStart) || !isIsoDateString(normalizedEnd)) {
    throw httpError(400, "Dates must be in YYYY-MM-DD format", true);
  }

  const today = todayIsoDate();
  if (normalizedStart < today) throw httpError(400, "Start date cannot be in the past", true);
  if (normalizedEnd < today) throw httpError(400, "End date cannot be in the past", true);
  if (normalizedEnd < normalizedStart) throw httpError(400, "End date must be on or after start date", true);

  return { startDate: normalizedStart, endDate: normalizedEnd };
}

function isDuplicateAuthUserError(err) {
  const message = `${String(err?.message || "")} ${String(err?.supabase?.message || "")}`.toLowerCase();
  return (
    message.includes("already been registered") ||
    message.includes("already registered") ||
    message.includes("user already registered") ||
    message.includes("duplicate key value")
  );
}

function isDuplicateInternIdError(err) {
  const message = `${String(err?.message || "")} ${String(err?.supabase?.message || "")}`.toLowerCase();
  return (
    message.includes("intern_id") &&
    (message.includes("duplicate") || message.includes("already exists") || message.includes("unique"))
  );
}

function isDuplicatePmCodeError(err) {
  const message = `${String(err?.message || "")} ${String(err?.supabase?.message || "")}`.toLowerCase();
  return (
    message.includes("pm_code") &&
    (message.includes("duplicate") || message.includes("already exists") || message.includes("unique"))
  );
}

function toRole(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function toMaybeDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isMissingSchemaError(err, key) {
  const message = `${String(err?.message || "")} ${String(err?.supabase?.message || "")}`.toLowerCase();
  const lookup = String(key || "").toLowerCase();
  return (
    message.includes(`could not find the table 'public.${lookup}'`) ||
    message.includes(`relation "public.${lookup}" does not exist`) ||
    message.includes(`column ${lookup} does not exist`) ||
    message.includes(`"${lookup}"`) ||
    (String(err?.supabase?.code || "") === "PGRST205" && message.includes(lookup))
  );
}

function safeNumeric(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function progressFromDates(startDateInput, endDateInput) {
  const startDate = toMaybeDate(startDateInput);
  const endDate = toMaybeDate(endDateInput);
  if (!startDate || !endDate || endDate <= startDate) return null;

  const now = new Date();
  const totalMs = endDate.getTime() - startDate.getTime();
  const elapsedMs = Math.max(0, Math.min(now.getTime() - startDate.getTime(), totalMs));
  return Math.round((elapsedMs / totalMs) * 100);
}

async function loadProfiles(filters = {}) {
  const baseSelect = "id,email,full_name,role,status,pm_code,intern_id,pm_id,profile_completed,profile_data,created_at,updated_at,pm:pm_id(id,email,full_name,pm_code)";
  try {
    return await restSelect({
      table: "profiles",
      select: baseSelect,
      filters,
      accessToken: null,
      useServiceRole: true,
    });
  } catch (err) {
    if (!isMissingSchemaError(err, "profile_data")) throw err;
    return restSelect({
      table: "profiles",
      select: "id,email,full_name,role,status,pm_code,intern_id,pm_id,profile_completed,created_at,updated_at,pm:pm_id(id,email,full_name,pm_code)",
      filters,
      accessToken: null,
      useServiceRole: true,
    });
  }
}

async function resolvePmId({ pmId, pmCode }) {
  if (!pmId && !pmCode) return null;

  const filters = { role: "eq.pm", limit: 1 };
  if (pmId) filters.id = `eq.${pmId}`;
  if (pmCode) filters.pm_code = `eq.${pmCode}`;

  const rows = await restSelect({
    table: "profiles",
    select: "id,role,pm_code",
    filters,
    accessToken: null,
    useServiceRole: true,
  });

  const pm = rows?.[0] || null;
  if (!pm) throw httpError(400, "PM not found for provided pmId/pmCode", true);
  return pm.id;
}

async function assertInternIdAvailable(internId, { excludeProfileId = null } = {}) {
  const check = await checkInternIdUsage(internId, { excludeProfileId });
  if (check.exists) {
    throw httpError(409, "Intern ID already exists", true);
  }
}

async function assertPmCodeAvailable(pmCode, { excludeProfileId = null } = {}) {
  const check = await checkPmCodeUsage(pmCode, { excludeProfileId });
  if (check.exists) {
    throw httpError(409, "PM code already exists", true);
  }
}

function mergeDepartmentIntoProfileData(profileData, department) {
  const base = profileData && typeof profileData === "object" ? { ...profileData } : {};
  base.department = department || null;
  return base;
}

function mergeInternProfileData(profileData, { department, startDate, endDate, mentorName, stipend }) {
  const base = profileData && typeof profileData === "object" ? { ...profileData } : {};
  if (department !== undefined) base.department = department || null;
  if (startDate !== undefined) base.startDate = startDate || null;
  if (endDate !== undefined) base.endDate = endDate || null;
  if (mentorName !== undefined) {
    base.mentorName = mentorName || null;
    base.mentor = mentorName || null;
  }
  if (stipend !== undefined) base.stipend = stipend || null;
  return base;
}

function mapUserRow(row) {
  const role = toRole(row.role);
  const profileData = row.profile_data && typeof row.profile_data === "object" ? row.profile_data : {};
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name || "",
    role,
    status: row.status || "active",
    pmCode: row.pm_code || null,
    internId: row.intern_id || null,
    pmId: row.pm_id || null,
    profileCompleted: !!row.profile_completed,
    profileData,
    department: profileData.department || null,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
    pm: row.pm
      ? {
          id: row.pm.id,
          email: row.pm.email || "",
          fullName: row.pm.full_name || "",
          pmCode: row.pm.pm_code || null,
        }
      : null,
  };
}

function withInternProgress({ intern, approvedIntern, logStats, reportStats }) {
  const profileData = intern.profileData || {};
  const startDate =
    approvedIntern?.start_date || profileData.startDate || profileData.start_date || profileData.internshipStartDate || null;
  const endDate =
    approvedIntern?.end_date || profileData.endDate || profileData.end_date || profileData.internshipEndDate || null;

  const dateProgress = progressFromDates(startDate, endDate);
  const approvedWorkScore = Math.min(
    100,
    Math.round((safeNumeric(logStats?.approvedTasks) * 1.8) + (safeNumeric(logStats?.approvedHours) * 0.35) + (safeNumeric(reportStats?.approved) * 12))
  );
  const blendedProgress = Number.isFinite(dateProgress)
    ? Math.round((dateProgress * 0.35) + (approvedWorkScore * 0.65))
    : approvedWorkScore;

  return {
    ...intern,
    startDate,
    endDate,
    internshipStatus: approvedIntern?.status || intern.status || "active",
    department: approvedIntern?.department || profileData.department || null,
    mentor: approvedIntern?.mentor || profileData.mentor || profileData.mentorName || null,
    stipend: approvedIntern?.stipend || profileData.stipend || null,
    progressPercent: Math.max(0, Math.min(100, blendedProgress)),
    totalHours: safeNumeric(logStats?.approvedHours),
    tasksCompleted: safeNumeric(logStats?.approvedTasks),
    approvedWork: {
      logs: safeNumeric(logStats?.approvedLogs),
      hours: safeNumeric(logStats?.approvedHours),
      tasks: safeNumeric(logStats?.approvedTasks),
      reports: safeNumeric(reportStats?.approved),
    },
    lastLogDate: logStats?.lastApprovedLogDate || null,
    reports: {
      total: safeNumeric(reportStats?.total),
      pending: safeNumeric(reportStats?.pending),
      approved: safeNumeric(reportStats?.approved),
      rejected: safeNumeric(reportStats?.rejected),
    },
  };
}

async function buildInternProgress(users) {
  const internUsers = (users || []).filter((user) => user.role === "intern");
  const internIds = internUsers.map((user) => user.id);
  if (!internIds.length) return [];

  const inFilter = `in.(${internIds.join(",")})`;

  let approvedInterns = [];
  try {
    approvedInterns = await restSelect({
      table: "approved_interns",
      select: "profile_id,start_date,end_date,department,mentor,stipend,status",
      filters: { profile_id: inFilter },
      accessToken: null,
      useServiceRole: true,
    });
  } catch (err) {
    if (!isMissingSchemaError(err, "approved_interns")) throw err;
  }

  let logs = [];
  try {
    logs = await restSelect({
      table: "daily_logs",
      select: "intern_profile_id,hours_worked,tasks_completed,status,log_date",
      filters: { intern_profile_id: inFilter },
      accessToken: null,
      useServiceRole: true,
    });
  } catch (err) {
    if (!isMissingSchemaError(err, "daily_logs")) throw err;
  }

  let reports = [];
  try {
    reports = await restSelect({
      table: "reports",
      select: "intern_profile_id,status",
      filters: { intern_profile_id: inFilter },
      accessToken: null,
      useServiceRole: true,
    });
  } catch (err) {
    if (!isMissingSchemaError(err, "reports")) throw err;
  }

  const approvedByProfileId = new Map((approvedInterns || []).map((row) => [row.profile_id, row]));
  const logStatsByIntern = new Map();
  const reportStatsByIntern = new Map();

  (logs || []).forEach((log) => {
    const key = log.intern_profile_id;
    if (!key) return;
    const entry = logStatsByIntern.get(key) || {
      approvedHours: 0,
      approvedTasks: 0,
      approvedLogs: 0,
      lastApprovedLogDate: null,
    };
    const status = String(log.status || "").toLowerCase();
    if (status === "approved") {
      entry.approvedHours += safeNumeric(log.hours_worked);
      entry.approvedTasks += safeNumeric(log.tasks_completed);
      entry.approvedLogs += 1;
      if (log.log_date && (!entry.lastApprovedLogDate || log.log_date > entry.lastApprovedLogDate)) {
        entry.lastApprovedLogDate = log.log_date;
      }
    }
    logStatsByIntern.set(key, entry);
  });

  (reports || []).forEach((report) => {
    const key = report.intern_profile_id;
    if (!key) return;
    const entry = reportStatsByIntern.get(key) || { total: 0, pending: 0, approved: 0, rejected: 0 };
    const status = String(report.status || "").toLowerCase();
    entry.total += 1;
    if (status === "pending") entry.pending += 1;
    if (status === "approved") entry.approved += 1;
    if (status === "rejected") entry.rejected += 1;
    reportStatsByIntern.set(key, entry);
  });

  return internUsers
    .map((intern) =>
      withInternProgress({
        intern,
        approvedIntern: approvedByProfileId.get(intern.id) || null,
        logStats: logStatsByIntern.get(intern.id) || null,
        reportStats: reportStatsByIntern.get(intern.id) || null,
      })
    )
    .sort((a, b) => b.progressPercent - a.progressPercent || a.fullName.localeCompare(b.fullName));
}

function createAdminRouter() {
  const router = express.Router();
  const auth = createAuthMiddleware();

  router.use(auth.requireRole("admin"));

  router.get("/users", async (req, res, next) => {
    try {
      const requestedRole = req.query.role ? toRole(req.query.role) : "";
      if (requestedRole && !ALLOWED_ROLES.has(requestedRole)) throw httpError(400, "Invalid role filter", true);

      const filters = { order: "created_at.desc" };
      if (requestedRole) {
        filters.role = `eq.${requestedRole}`;
      } else {
        filters.role = "in.(admin,hr,pm,intern)";
      }

      const rows = await loadProfiles(filters);
      const users = (rows || []).map(mapUserRow);

      res.status(200).json({ success: true, users });
    } catch (err) {
      next(err);
    }
  });

  router.post("/users", async (req, res, next) => {
    try {
      const { email, password, role, fullName, pmCode, pmId, internId, status, profileData } = req.body || {};
      if (!email || !password || !role) throw httpError(400, "email, password, role are required", true);

      const normalizedRole = toRole(role);
      if (!ALLOWED_ROLES.has(normalizedRole)) throw httpError(400, "Invalid role", true);

      const safeProfileData = profileData && typeof profileData === "object" ? { ...profileData } : null;
      const resolvedDepartment = String(safeProfileData?.department || "").trim();
      if (safeProfileData && (normalizedRole === "intern" || normalizedRole === "pm")) {
        safeProfileData.department = resolvedDepartment || null;
      }
      if (normalizedRole === "intern") {
        const validatedDates = validateInternDateRange({
          startDate: safeProfileData?.startDate || safeProfileData?.start_date || null,
          endDate: safeProfileData?.endDate || safeProfileData?.end_date || null,
          required: false,
        });
        if (safeProfileData) {
          safeProfileData.startDate = validatedDates.startDate;
          safeProfileData.endDate = validatedDates.endDate;
          delete safeProfileData.start_date;
          delete safeProfileData.end_date;
        }
      }

      const resolvedPmId = normalizedRole === "intern" ? await resolvePmId({ pmId, pmCode }) : null;
      const resolvedInternId =
        normalizedRole === "intern" ? String(internId || "").trim() || (await generateNextInternId({ prefix: "EDCS" })) : null;
      const resolvedPmCode =
        normalizedRole === "pm" ? String(pmCode || "").trim() || (await generateNextPmCode({ width: 3 })) : null;
      if (normalizedRole === "intern") {
        await assertInternIdAvailable(resolvedInternId);
      }
      if (normalizedRole === "pm") {
        await assertPmCodeAvailable(resolvedPmCode);
      }
      const normalizedStatus = String(status || "active").trim().toLowerCase();

      let created;
      try {
        created = await adminCreateUser({
          email: String(email).trim().toLowerCase(),
          password: String(password),
          userMetadata: { full_name: fullName || "" },
          appMetadata: { role: normalizedRole },
        });
      } catch (err) {
        if (isDuplicateAuthUserError(err)) {
          throw httpError(409, "A user with this email address has already been registered", true);
        }
        throw err;
      }
      const createdId = created?.id || created?.user?.id;
      if (!createdId) throw httpError(502, "Unexpected Supabase response (missing user id)", true);

      const now = new Date().toISOString();
      const row = {
        id: createdId,
        email: String(email).trim().toLowerCase(),
        full_name: fullName || "",
        role: normalizedRole,
        status: USER_STATUS.has(normalizedStatus) ? normalizedStatus : "active",
        pm_code: normalizedRole === "pm" ? resolvedPmCode : null,
        intern_id: normalizedRole === "intern" ? resolvedInternId : null,
        pm_id: normalizedRole === "intern" ? resolvedPmId : null,
        profile_completed: normalizedRole === "intern" ? false : true,
        created_at: now,
        updated_at: now,
      };

      if ((normalizedRole === "intern" || normalizedRole === "pm") && safeProfileData && typeof safeProfileData === "object") {
        row.profile_data = safeProfileData;
      }

      try {
        await restInsert({
          table: "profiles",
          rows: row,
          accessToken: null,
          useServiceRole: true,
        });
      } catch (err) {
        if (normalizedRole === "intern" && isDuplicateInternIdError(err)) {
          throw httpError(409, "Intern ID already exists", true);
        }
        if (normalizedRole === "pm" && isDuplicatePmCodeError(err)) {
          throw httpError(409, "PM code already exists", true);
        }
        if (row.profile_data !== undefined && isMissingSchemaError(err, "profile_data")) {
          const fallbackRow = { ...row };
          delete fallbackRow.profile_data;
          await restInsert({
            table: "profiles",
            rows: fallbackRow,
            accessToken: null,
            useServiceRole: true,
          });
        } else {
          throw err;
        }
      }

      res.status(201).json({
        success: true,
        user: {
          id: createdId,
          email: row.email,
          fullName: row.full_name,
          role: row.role,
          status: row.status,
          pmCode: row.pm_code,
          internId: row.intern_id,
          pmId: row.pm_id,
        },
      });
    } catch (err) {
      next(err);
    }
  });

  router.get("/intern-id/next", async (req, res, next) => {
    try {
      const internId = await generateNextInternId({ prefix: "EDCS" });
      res.status(200).json({ success: true, internId });
    } catch (err) {
      next(err);
    }
  });

  router.get("/pm-code/next", async (req, res, next) => {
    try {
      const pmCode = await generateNextPmCode({ width: 3 });
      res.status(200).json({ success: true, pmCode });
    } catch (err) {
      next(err);
    }
  });

  router.delete("/users/:userId", async (req, res, next) => {
    try {
      const userId = String(req.params.userId || "").trim();
      if (!userId) throw httpError(400, "userId is required", true);

      const rows = await restSelect({
        table: "profiles",
        select: "id,role,email",
        filters: { id: `eq.${userId}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });
      const target = rows?.[0] || null;
      if (!target) throw httpError(404, "User not found", true);
      if (target.id === req.auth.profile.id) throw httpError(400, "You cannot delete your own admin account", true);
      if (toRole(target.role) === "admin") throw httpError(400, "Admin deletion is blocked for safety", true);

      await adminDeleteUser({ userId: target.id, softDelete: false });
      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/users/:userId", async (req, res, next) => {
    try {
      const userId = String(req.params.userId || "").trim();
      if (!userId) throw httpError(400, "userId is required", true);

      const rows = await loadProfiles({ id: `eq.${userId}`, limit: 1 });
      const target = rows?.[0] || null;
      if (!target) throw httpError(404, "User not found", true);

      const targetRole = toRole(target.role);
      const { internId, department, fullName, pmCode, pmId, status, startDate, endDate, mentorName, stipend } = req.body || {};
      const patch = { updated_at: new Date().toISOString() };
      let hasPatch = false;
      let syncApprovedIntern = false;
      let approvedInternPatch = {};
      let approvedIntern = null;

      if (targetRole === "intern") {
        approvedIntern = (
          await restSelect({
            table: "approved_interns",
            select: "id,profile_id,start_date,end_date,department,mentor,stipend,status",
            filters: { profile_id: `eq.${userId}`, limit: 1 },
            accessToken: null,
            useServiceRole: true,
          }).catch(() => [])
        )?.[0] || null;
      }

      if (fullName !== undefined) {
        patch.full_name = String(fullName || "").trim();
        hasPatch = true;
      }

      if (status !== undefined) {
        const normalizedStatus = String(status || "").trim().toLowerCase();
        if (!USER_STATUS.has(normalizedStatus)) throw httpError(400, "Invalid status", true);
        patch.status = normalizedStatus;
        hasPatch = true;
        if (targetRole === "intern" && ["active", "completed"].includes(normalizedStatus)) {
          syncApprovedIntern = true;
          approvedInternPatch.status = normalizedStatus;
        }
      }

      if (targetRole === "pm" && pmCode !== undefined) {
        const nextPmCode = String(pmCode || "").trim();
        if (!nextPmCode) throw httpError(400, "pmCode cannot be empty for PM user", true);
        await assertPmCodeAvailable(nextPmCode, { excludeProfileId: userId });
        patch.pm_code = nextPmCode;
        hasPatch = true;
      }

      if (targetRole === "intern" && internId !== undefined) {
        const nextInternId = String(internId || "").trim();
        if (!nextInternId) throw httpError(400, "internId cannot be empty for intern user", true);
        await assertInternIdAvailable(nextInternId, { excludeProfileId: userId });
        patch.intern_id = nextInternId;
        hasPatch = true;
        syncApprovedIntern = true;
        approvedInternPatch.intern_id = nextInternId;
      }

      if (targetRole === "intern" && (pmId !== undefined || pmCode !== undefined)) {
        const pmIdInput = pmId === undefined || pmId === null ? "" : String(pmId).trim();
        const pmCodeInput = pmCode === undefined || pmCode === null ? "" : String(pmCode).trim();
        const resolvedPmId = !pmIdInput && !pmCodeInput ? null : await resolvePmId({ pmId: pmIdInput || null, pmCode: pmCodeInput || null });
        patch.pm_id = resolvedPmId;
        hasPatch = true;
      }

      if ((targetRole === "intern" || targetRole === "pm") && department !== undefined) {
        const nextDepartment = String(department || "").trim();
        patch.profile_data = mergeDepartmentIntoProfileData(target.profile_data, nextDepartment);
        hasPatch = true;
        if (targetRole === "intern") {
          syncApprovedIntern = true;
          approvedInternPatch.department = nextDepartment || null;
        }
      }

      if (targetRole === "intern" && (startDate !== undefined || endDate !== undefined || mentorName !== undefined || stipend !== undefined)) {
        const profileData = target.profile_data && typeof target.profile_data === "object" ? target.profile_data : {};

        const baseStart =
          startDate !== undefined
            ? String(startDate || "").trim()
            : String(approvedIntern?.start_date || profileData.startDate || profileData.start_date || "");
        const baseEnd =
          endDate !== undefined
            ? String(endDate || "").trim()
            : String(approvedIntern?.end_date || profileData.endDate || profileData.end_date || "");

        const validatedDates = validateInternDateRange({
          startDate: baseStart || null,
          endDate: baseEnd || null,
          required: true,
        });

        const nextMentor = mentorName !== undefined ? String(mentorName || "").trim() : undefined;
        const nextStipend = stipend !== undefined ? String(stipend || "").trim() : undefined;

        patch.profile_data = mergeInternProfileData(target.profile_data, {
          department: department !== undefined ? String(department || "").trim() : undefined,
          startDate: validatedDates.startDate,
          endDate: validatedDates.endDate,
          mentorName: nextMentor,
          stipend: nextStipend,
        });
        hasPatch = true;
        syncApprovedIntern = true;
        approvedInternPatch.start_date = validatedDates.startDate;
        approvedInternPatch.end_date = validatedDates.endDate;
        if (mentorName !== undefined) approvedInternPatch.mentor = nextMentor || null;
        if (stipend !== undefined) approvedInternPatch.stipend = nextStipend || null;
      }

      if (!hasPatch) {
        throw httpError(400, "No editable fields provided", true);
      }

      try {
        await restUpdate({
          table: "profiles",
          patch,
          matchQuery: { id: `eq.${userId}` },
          accessToken: null,
          useServiceRole: true,
        });
      } catch (err) {
        if (patch.intern_id && isDuplicateInternIdError(err)) {
          throw httpError(409, "Intern ID already exists", true);
        }
        if (patch.pm_code && isDuplicatePmCodeError(err)) {
          throw httpError(409, "PM code already exists", true);
        }
        if (patch.profile_data !== undefined && isMissingSchemaError(err, "profile_data")) {
          const fallbackPatch = { ...patch };
          delete fallbackPatch.profile_data;
          await restUpdate({
            table: "profiles",
            patch: fallbackPatch,
            matchQuery: { id: `eq.${userId}` },
            accessToken: null,
            useServiceRole: true,
          });
        } else {
          throw err;
        }
      }

      if (syncApprovedIntern && Object.keys(approvedInternPatch).length) {
        await restUpdate({
          table: "approved_interns",
          patch: { ...approvedInternPatch, updated_at: new Date().toISOString() },
          matchQuery: { profile_id: `eq.${userId}` },
          accessToken: null,
          useServiceRole: true,
        }).catch(() => {});
      }

      const updatedRows = await loadProfiles({ id: `eq.${userId}`, limit: 1 });
      const updated = updatedRows?.[0] || null;
      res.status(200).json({ success: true, user: updated ? mapUserRow(updated) : null });
    } catch (err) {
      next(err);
    }
  });

  router.patch("/interns/:internId/status", async (req, res, next) => {
    try {
      const internId = String(req.params.internId || "").trim();
      const nextStatus = String(req.body?.status || "").trim().toLowerCase();
      if (!internId) throw httpError(400, "internId is required", true);
      if (!USER_STATUS.has(nextStatus)) throw httpError(400, "Invalid status", true);

      const rows = await restSelect({
        table: "profiles",
        select: "id,role",
        filters: { id: `eq.${internId}`, limit: 1 },
        accessToken: null,
        useServiceRole: true,
      });
      const intern = rows?.[0] || null;
      if (!intern || toRole(intern.role) !== "intern") throw httpError(404, "Intern not found", true);

      await restUpdate({
        table: "profiles",
        patch: {
          status: nextStatus,
          updated_at: new Date().toISOString(),
        },
        matchQuery: { id: `eq.${internId}` },
        accessToken: null,
        useServiceRole: true,
      });

      res.status(200).json({ success: true });
    } catch (err) {
      next(err);
    }
  });

  router.get("/intern-progress", async (req, res, next) => {
    try {
      const users = (await loadProfiles({ role: "eq.intern", order: "created_at.desc" }))?.map(mapUserRow) || [];
      const interns = await buildInternProgress(users);
      res.status(200).json({ success: true, interns });
    } catch (err) {
      next(err);
    }
  });

  router.get("/stats", async (req, res, next) => {
    try {
      const users = (await loadProfiles({ role: "in.(admin,hr,pm,intern)" }))?.map(mapUserRow) || [];
      const internProgress = await buildInternProgress(users);

      let logs = [];
      try {
        logs = await restSelect({
          table: "daily_logs",
          select: "id,hours_worked,status",
          filters: {},
          accessToken: null,
          useServiceRole: true,
        });
      } catch (err) {
        if (!isMissingSchemaError(err, "daily_logs")) throw err;
      }

      let reports = [];
      try {
        reports = await restSelect({
          table: "reports",
          select: "id,status",
          filters: {},
          accessToken: null,
          useServiceRole: true,
        });
      } catch (err) {
        if (!isMissingSchemaError(err, "reports")) throw err;
      }

      const byRole = {
        admin: users.filter((u) => u.role === "admin").length,
        hr: users.filter((u) => u.role === "hr").length,
        pm: users.filter((u) => u.role === "pm").length,
        intern: users.filter((u) => u.role === "intern").length,
      };
      const activeUsers = users.filter((u) => String(u.status || "").toLowerCase() === "active").length;
      const inactiveUsers = users.length - activeUsers;
      const withPm = internProgress.filter((intern) => !!intern.pmId).length;
      const profileCompleted = internProgress.filter((intern) => intern.profileCompleted).length;
      const averageProgress = internProgress.length
        ? Number(
            (
              internProgress.reduce((sum, intern) => sum + safeNumeric(intern.progressPercent), 0) /
              internProgress.length
            ).toFixed(1)
          )
        : 0;

      const createdLast30Days = users.filter((user) => {
        const createdAt = toMaybeDate(user.createdAt);
        if (!createdAt) return false;
        const ageMs = Date.now() - createdAt.getTime();
        return ageMs >= 0 && ageMs <= 30 * 24 * 60 * 60 * 1000;
      }).length;

      const approvedLogs = (logs || []).filter((log) => String(log.status || "").toLowerCase() === "approved");
      const reportStatus = {
        pending: (reports || []).filter((report) => String(report.status || "").toLowerCase() === "pending").length,
        approved: (reports || []).filter((report) => String(report.status || "").toLowerCase() === "approved").length,
        rejected: (reports || []).filter((report) => String(report.status || "").toLowerCase() === "rejected").length,
      };

      res.status(200).json({
        success: true,
        stats: {
          users: {
            total: users.length,
            ...byRole,
            active: activeUsers,
            inactive: inactiveUsers,
            createdLast30Days,
          },
          interns: {
            total: byRole.intern,
            assignedToPm: withPm,
            unassignedToPm: Math.max(0, byRole.intern - withPm),
            profileCompleted,
            profileIncomplete: Math.max(0, byRole.intern - profileCompleted),
            averageProgress,
            completed: internProgress.filter((intern) => intern.progressPercent >= 100 || intern.status === "completed").length,
          },
          activity: {
            dailyLogs: (logs || []).length,
            approvedDailyLogs: approvedLogs.length,
            totalHours: Number(
              approvedLogs.reduce((sum, log) => sum + safeNumeric(log.hours_worked), 0).toFixed(2)
            ),
            reportsTotal: (reports || []).length,
            reportsPending: reportStatus.pending,
            reportsApproved: reportStatus.approved,
            reportsRejected: reportStatus.rejected,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  });

  return router;
}

module.exports = { createAdminRouter };
