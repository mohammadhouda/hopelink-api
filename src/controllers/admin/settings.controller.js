import { success, failure } from "../../utils/response.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import * as settingsService from "../../services/admin/settings.service.js";
import * as auditService from "../../services/audit.service.js";

function getIp(req) {
  return req.ip || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || null;
}

function audit(req) {
  return { userId: req.user.id, ip: getIp(req) };
}

export const getPlatform = asyncHandler(async (req, res) => {
  const settings = await settingsService.getPlatformSettings();
  return success(res, settings);
});

export const updatePlatform = asyncHandler(async (req, res) => {
  const settings = await settingsService.updatePlatformSettings(req.body, audit(req));
  return success(res, settings);
});

export const getRoles = asyncHandler(async (req, res) => {
  const roles = await settingsService.getRoles();
  return success(res, roles);
});

export const createRole = asyncHandler(async (req, res) => {
  const { name, description, permissions } = req.body;
  if (!name?.trim()) return failure(res, "Role name is required", 400);
  try {
    const role = await settingsService.createRole({ name, description, permissions }, audit(req));
    return success(res, role, "Role created", 201);
  } catch (err) {
    if (err.code === "P2002") return failure(res, "Role name already exists", 409);
    throw err;
  }
});

export const updateRole = asyncHandler(async (req, res) => {
  const { name, description, permissions } = req.body;
  if (!name?.trim()) return failure(res, "Role name is required", 400);
  try {
    const role = await settingsService.updateRole(
      parseInt(req.params.id),
      { name, description, permissions },
      audit(req),
    );
    return success(res, role);
  } catch (err) {
    if (err.code === "P2002") return failure(res, "Role name already exists", 409);
    throw err;
  }
});

export const deleteRole = asyncHandler(async (req, res) => {
  await settingsService.deleteRole(parseInt(req.params.id), audit(req));
  return success(res, null, "Role deleted");
});

export const getEmailTemplates = asyncHandler(async (req, res) => {
  const templates = await settingsService.getEmailTemplates();
  return success(res, templates);
});

export const updateEmailTemplate = asyncHandler(async (req, res) => {
  const { subject, body } = req.body;
  if (!subject?.trim() || !body?.trim()) {
    return failure(res, "Subject and body are required", 400);
  }
  const template = await settingsService.updateEmailTemplate(
    parseInt(req.params.id),
    { subject, body },
    audit(req),
  );
  return success(res, template);
});

export const getSessions = asyncHandler(async (req, res) => {
  const sessions = await settingsService.getActiveSessions(req.user.id);
  return success(res, sessions);
});

export const revokeSession = asyncHandler(async (req, res) => {
  await settingsService.revokeSession(req.params.sessionId, req.user.id);
  return success(res, null, "Session revoked");
});

export const revokeAllSessions = asyncHandler(async (req, res) => {
  await settingsService.revokeAllOtherSessions(req.user.id, req.tokenId);
  return success(res, null, "All other sessions revoked");
});

export const getLoginHistory = asyncHandler(async (req, res) => {
  const history = await settingsService.getLoginHistory(req.user.email, {
    page:  parseInt(req.query.page)  || 1,
    limit: parseInt(req.query.limit) || 20,
  });
  return success(res, history);
});

export const getAuditLog = asyncHandler(async (req, res) => {
  const { userId, action, page, limit } = req.query;
  const result = await auditService.getEntries({
    userId: userId ? parseInt(userId) : undefined,
    action: action || undefined,
    page:   parseInt(page)  || 1,
    limit:  parseInt(limit) || 50,
  });
  return success(res, result);
});

export const getApiKeys = asyncHandler(async (req, res) => {
  const keys = await settingsService.getApiKeys(req.user.id);
  return success(res, keys);
});

export const createApiKey = asyncHandler(async (req, res) => {
  const { name, permissions, expiresInDays } = req.body;
  if (!name?.trim()) return failure(res, "Key name is required", 400);
  const key = await settingsService.createApiKey(
    { name, permissions, expiresInDays },
    audit(req),
  );
  return success(res, key, "API key created", 201);
});

export const revokeApiKey = asyncHandler(async (req, res) => {
  await settingsService.revokeApiKey(parseInt(req.params.id), audit(req));
  return success(res, null, "API key revoked");
});

export const getIntegrations = asyncHandler(async (req, res) => {
  const integrations = await settingsService.getIntegrations();
  return success(res, integrations);
});

export const toggleIntegration = asyncHandler(async (req, res) => {
  const integration = await settingsService.toggleIntegration(
    parseInt(req.params.id),
    audit(req),
  );
  return success(res, integration);
});
