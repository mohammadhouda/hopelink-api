import * as settingsService from "../../services/admin/settings.service.js";
import * as auditService from "../../services/audit.service.js";

function getIp(req) {
  return (
    req.ip || req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || null
  );
}

export async function getPlatform(req, res) {
  try {
    const settings = await settingsService.getPlatformSettings();
    res.json(settings);
  } catch (err) {
    console.error("getPlatform error:", err);
    res.status(500).json({ error: "Failed to fetch platform settings" });
  }
}

export async function updatePlatform(req, res) {
  try {
    const settings = await settingsService.updatePlatformSettings(req.body, {
      userId: req.user.id,
      ip: getIp(req),
    });
    res.json(settings);
  } catch (err) {
    console.error("updatePlatform error:", err);
    res.status(500).json({ error: "Failed to update platform settings" });
  }
}

export async function getRoles(req, res) {
  try {
    const roles = await settingsService.getRoles();
    res.json(roles);
  } catch (err) {
    console.error("getRoles error:", err);
    res.status(500).json({ error: "Failed to fetch roles" });
  }
}

export async function createRole(req, res) {
  try {
    const { name, description, permissions } = req.body;
    if (!name?.trim())
      return res.status(400).json({ error: "Role name is required" });

    const role = await settingsService.createRole(
      { name, description, permissions },
      { userId: req.user.id, ip: getIp(req) },
    );
    res.status(201).json(role);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Role name already exists" });
    }
    console.error("createRole error:", err);
    res.status(500).json({ error: "Failed to create role" });
  }
}

export async function updateRole(req, res) {
  try {
    const id = parseInt(req.params.id);
    const { name, description, permissions } = req.body;
    if (!name?.trim())
      return res.status(400).json({ error: "Role name is required" });

    const role = await settingsService.updateRole(
      id,
      { name, description, permissions },
      { userId: req.user.id, ip: getIp(req) },
    );
    res.json(role);
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({ error: "Role name already exists" });
    }
    console.error("updateRole error:", err);
    res.status(500).json({ error: "Failed to update role" });
  }
}

export async function deleteRole(req, res) {
  try {
    const id = parseInt(req.params.id);
    await settingsService.deleteRole(id, {
      userId: req.user.id,
      ip: getIp(req),
    });
    res.json({ message: "Role deleted" });
  } catch (err) {
    if (err.message === "Cannot delete system role") {
      return res.status(403).json({ error: err.message });
    }
    if (err.message === "Role not found") {
      return res.status(404).json({ error: err.message });
    }
    console.error("deleteRole error:", err);
    res.status(500).json({ error: "Failed to delete role" });
  }
}

export async function getEmailTemplates(req, res) {
  try {
    const templates = await settingsService.getEmailTemplates();
    res.json(templates);
  } catch (err) {
    console.error("getEmailTemplates error:", err);
    res.status(500).json({ error: "Failed to fetch email templates" });
  }
}

export async function updateEmailTemplate(req, res) {
  try {
    const id = parseInt(req.params.id);
    const { subject, body } = req.body;
    if (!subject?.trim() || !body?.trim()) {
      return res.status(400).json({ error: "Subject and body are required" });
    }

    const template = await settingsService.updateEmailTemplate(
      id,
      { subject, body },
      {
        userId: req.user.id,
        ip: getIp(req),
      },
    );
    res.json(template);
  } catch (err) {
    console.error("updateEmailTemplate error:", err);
    res.status(500).json({ error: "Failed to update email template" });
  }
}

export async function getSessions(req, res) {
  try {
    const sessions = await settingsService.getActiveSessions(req.user.id);
    res.json(sessions);
  } catch (err) {
    console.error("getSessions error:", err);
    res.status(500).json({ error: "Failed to fetch sessions" });
  }
}

export async function revokeSession(req, res) {
  try {
    const { sessionId } = req.params;
    await settingsService.revokeSession(sessionId, req.user.id);
    res.json({ message: "Session revoked" });
  } catch (err) {
    console.error("revokeSession error:", err);
    res.status(500).json({ error: "Failed to revoke session" });
  }
}

export async function revokeAllSessions(req, res) {
  try {
    const currentTokenId = req.tokenId;
    await settingsService.revokeAllOtherSessions(req.user.id, currentTokenId);
    res.json({ message: "All other sessions revoked" });
  } catch (err) {
    console.error("revokeAllSessions error:", err);
    res.status(500).json({ error: "Failed to revoke sessions" });
  }
}

export async function getLoginHistory(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const history = await settingsService.getLoginHistory(req.user.email, {
      page,
      limit,
    });
    res.json(history);
  } catch (err) {
    console.error("getLoginHistory error:", err);
    res.status(500).json({ error: "Failed to fetch login history" });
  }
}

export async function getAuditLog(req, res) {
  try {
    const { userId, action, page, limit } = req.query;
    const result = await auditService.getEntries({
      userId: userId ? parseInt(userId) : undefined,
      action: action || undefined,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
    });
    res.json(result);
  } catch (err) {
    console.error("getAuditLog error:", err);
    res.status(500).json({ error: "Failed to fetch audit log" });
  }
}

export async function getApiKeys(req, res) {
  try {
    const keys = await settingsService.getApiKeys(req.user.id);
    res.json(keys);
  } catch (err) {
    console.error("getApiKeys error:", err);
    res.status(500).json({ error: "Failed to fetch API keys" });
  }
}

export async function createApiKey(req, res) {
  try {
    const { name, permissions, expiresInDays } = req.body;
    if (!name?.trim())
      return res.status(400).json({ error: "Key name is required" });

    const key = await settingsService.createApiKey(
      { name, permissions, expiresInDays },
      { userId: req.user.id, ip: getIp(req) },
    );
    res.status(201).json(key);
  } catch (err) {
    console.error("createApiKey error:", err);
    res.status(500).json({ error: "Failed to create API key" });
  }
}

export async function revokeApiKey(req, res) {
  try {
    const id = parseInt(req.params.id);
    await settingsService.revokeApiKey(id, {
      userId: req.user.id,
      ip: getIp(req),
    });
    res.json({ message: "API key revoked" });
  } catch (err) {
    console.error("revokeApiKey error:", err);
    res.status(500).json({ error: "Failed to revoke API key" });
  }
}

export async function getIntegrations(req, res) {
  try {
    const integrations = await settingsService.getIntegrations();
    res.json(integrations);
  } catch (err) {
    console.error("getIntegrations error:", err);
    res.status(500).json({ error: "Failed to fetch integrations" });
  }
}

export async function toggleIntegration(req, res) {
  try {
    const id = parseInt(req.params.id);
    const integration = await settingsService.toggleIntegration(id, {
      userId: req.user.id,
      ip: getIp(req),
    });
    res.json(integration);
  } catch (err) {
    console.error("toggleIntegration error:", err);
    res.status(500).json({ error: "Failed to toggle integration" });
  }
}
