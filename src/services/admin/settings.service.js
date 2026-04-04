import crypto from "crypto";
import * as auditService from "../audit.service.js";
import prisma from "../../config/prisma.js";

export async function getPlatformSettings() {
  const rows = await prisma.platformSetting.findMany();
  const settings = {};
  for (const row of rows) {
    if (row.value === "true" || row.value === "false") {
      settings[row.key] = row.value === "true";
    } else if (!isNaN(row.value) && row.value.trim() !== "") {
      settings[row.key] = Number(row.value);
    } else {
      settings[row.key] = row.value;
    }
  }
  return settings;
}

export async function updatePlatformSettings(data, { userId, ip }) {
  const updates = [];
  for (const [key, value] of Object.entries(data)) {
    updates.push(
      prisma.platformSetting.upsert({
        where: { key },
        update: { value: String(value) },
        create: { key, value: String(value) },
      }),
    );
  }
  await prisma.$transaction(updates);

  await auditService.log({
    userId,
    action: "updated",
    target: "Platform Settings",
    targetType: "settings",
    details: `Updated keys: ${Object.keys(data).join(", ")}`,
    ipAddress: ip,
  });

  return getPlatformSettings();
}

export async function getRoles() {
  const roles = await prisma.dynamicRole.findMany({
    include: { DynamicRolePermission: true },
    orderBy: { createdAt: "asc" },
  });
  return roles.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    isSystem: r.isSystem,
    permissions: r.DynamicRolePermission.map((p) => p.permission),
    createdAt: r.createdAt,
  }));
}

export async function createRole(data, { userId, ip }) {
  const { name, description, permissions = [] } = data;

  const role = await prisma.dynamicRole.create({
    data: {
      name,
      description: description || "",
      DynamicRolePermission: {
        create: permissions.map((p) => ({ permission: p })),
      },
    },
    include: { DynamicRolePermission: true },
  });

  await auditService.log({
    userId,
    action: "created",
    target: name,
    targetType: "role",
    details: `Created with ${permissions.length} permissions`,
    ipAddress: ip,
  });

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissions: role.DynamicRolePermission.map((p) => p.permission),
  };
}

export async function updateRole(id, data, { userId, ip }) {
  const { name, description, permissions = [] } = data;

  const role = await prisma.$transaction(async (tx) => {
    await tx.dynamicRolePermission.deleteMany({ where: { roleId: id } });

    return tx.dynamicRole.update({
      where: { id },
      data: {
        name,
        description: description || "",
        DynamicRolePermission: {
          create: permissions.map((p) => ({ permission: p })),
        },
      },
      include: { DynamicRolePermission: true },
    });
  });

  await auditService.log({
    userId,
    action: "updated",
    target: name,
    targetType: "role",
    details: `Updated with ${permissions.length} permissions`,
    ipAddress: ip,
  });

  return {
    id: role.id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissions: role.DynamicRolePermission.map((p) => p.permission),
  };
}

export async function deleteRole(id, { userId, ip }) {
  const role = await prisma.dynamicRole.findUnique({ where: { id } });
  if (!role) throw new Error("Role not found");
  if (role.isSystem) throw new Error("Cannot delete system role");

  await prisma.dynamicRole.delete({ where: { id } });

  await auditService.log({
    userId,
    action: "deleted",
    target: role.name,
    targetType: "role",
    details: "Role deleted",
    ipAddress: ip,
  });
}

export async function getEmailTemplates() {
  return prisma.emailTemplate.findMany({ orderBy: { id: "asc" } });
}

export async function updateEmailTemplate(id, data, { userId, ip }) {
  const template = await prisma.emailTemplate.update({
    where: { id },
    data: {
      subject: data.subject,
      body: data.body,
    },
  });

  await auditService.log({
    userId,
    action: "updated",
    target: `${template.name} Template`,
    targetType: "settings",
    details: "Email template body updated",
    ipAddress: ip,
  });

  return template;
}

export async function getActiveSessions(userId) {
  const sessions = await prisma.refreshToken.findMany({
    where: {
      userId,
      isRevoked: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  return sessions.map((s) => ({
    id: s.id,
    device: parseDevice(s.userAgent),
    browser: parseBrowser(s.userAgent),
    ip: s.ipAddress || "Unknown",
    lastActive: s.createdAt,
    deviceInfo: s.deviceInfo,
  }));
}

export async function revokeSession(sessionId, userId) {
  await prisma.refreshToken.updateMany({
    where: { id: sessionId, userId },
    data: { isRevoked: true },
  });
}

export async function revokeAllOtherSessions(userId, currentTokenId) {
  await prisma.refreshToken.updateMany({
    where: {
      userId,
      isRevoked: false,
      NOT: { id: currentTokenId },
    },
    data: { isRevoked: true },
  });
}

export async function getLoginHistory(email, { page = 1, limit = 20 } = {}) {
  const [entries, total] = await Promise.all([
    prisma.loginAttempt.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.loginAttempt.count({ where: { email } }),
  ]);

  return {
    entries: entries.map((e) => ({
      id: e.id,
      ip: e.ipAddress,
      status: e.success ? "success" : "failed",
      reason: e.reason,
      timestamp: e.createdAt,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

function parseDevice(ua) {
  if (!ua) return "Unknown";
  if (/mobile|android|iphone/i.test(ua)) return "Mobile";
  if (/tablet|ipad/i.test(ua)) return "Tablet";
  return "Desktop";
}

function parseBrowser(ua) {
  if (!ua) return "Unknown";
  if (/firefox/i.test(ua)) return "Firefox";
  if (/edg/i.test(ua)) return "Edge";
  if (/chrome/i.test(ua)) return "Chrome";
  if (/safari/i.test(ua)) return "Safari";
  return "Other";
}

export async function getApiKeys(userId) {
  const keys = await prisma.apiKey.findMany({
    where: { createdById: userId, isRevoked: false },
    orderBy: { createdAt: "desc" },
  });

  return keys.map((k) => ({
    id: k.id,
    name: k.name,
    prefix: k.prefix,
    permissions: k.permissions,
    createdAt: k.createdAt,
    lastUsedAt: k.lastUsedAt,
    expiresAt: k.expiresAt,
  }));
}

export async function createApiKey(data, { userId, ip }) {
  const { name, permissions = [], expiresInDays } = data;

  const rawKey = `hlk_live_${crypto.randomBytes(24).toString("hex")}`;
  const prefix = rawKey.slice(0, 13);
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 86400000)
    : null;

  const apiKey = await prisma.apiKey.create({
    data: {
      name,
      keyHash,
      prefix,
      permissions,
      expiresAt,
      createdById: userId,
    },
  });

  await auditService.log({
    userId,
    action: "created",
    target: name,
    targetType: "settings",
    details: "API key generated",
    ipAddress: ip,
  });

  return {
    id: apiKey.id,
    name: apiKey.name,
    key: rawKey,
    prefix,
    permissions: apiKey.permissions,
    createdAt: apiKey.createdAt,
    expiresAt: apiKey.expiresAt,
  };
}

export async function revokeApiKey(id, { userId, ip }) {
  const key = await prisma.apiKey.update({
    where: { id },
    data: { isRevoked: true },
  });

  await auditService.log({
    userId,
    action: "deleted",
    target: key.name,
    targetType: "settings",
    details: "API key revoked",
    ipAddress: ip,
  });
}

export async function getIntegrations() {
  return prisma.integration.findMany({ orderBy: { id: "asc" } });
}

export async function toggleIntegration(id, { userId, ip }) {
  const current = await prisma.integration.findUnique({ where: { id } });
  if (!current) throw new Error("Integration not found");

  const newStatus =
    current.status === "connected" ? "disconnected" : "connected";

  const integration = await prisma.integration.update({
    where: { id },
    data: {
      status: newStatus,
      connectedAt: newStatus === "connected" ? new Date() : null,
    },
  });

  await auditService.log({
    userId,
    action: "updated",
    target: current.name,
    targetType: "settings",
    details: `Integration ${newStatus}`,
    ipAddress: ip,
  });

  return integration;
}
