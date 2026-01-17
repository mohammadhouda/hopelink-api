import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import { generateToken, generateRefreshToken } from "../utils/generateToken.js";
import { hashToken, generateTokenFamily } from "../utils/security.js";
import {
  recordLoginAttempt,
  checkAccountLockout,
  handleFailedLogin,
  clearLockout,
  detectSuspiciousActivity
} from "./loginAttempt.service.js";

const REFRESH_TOKEN_EXPIRY_DAYS = 7;
const MIN_PASSWORD_LENGTH = 8;

function validatePassword(password) {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
}

export async function registerService({ name, email, password }, clientInfo) {
  validatePassword(password);

  const userExist = await prisma.user.findUnique({
    where: { email }
  });

  if (userExist) throw new Error("Email already exists");

  const hashedPassword = await bcrypt.hash(password, 12);
  const tokenFamily = generateTokenFamily();

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "USER", // Always default, never from input
      lastLoginAt: new Date(),
      lastLoginIp: clientInfo.ipAddress
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  });

  const refreshToken = generateRefreshToken();

  const session = await prisma.refreshToken.create({
    data: {
      token: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      deviceInfo: JSON.stringify(clientInfo.deviceInfo),
      family: tokenFamily
    }
  });

  const accessToken = generateToken(user.id, user.role, session.id);

  await recordLoginAttempt({
    email,
    ipAddress: clientInfo.ipAddress,
    userAgent: clientInfo.userAgent,
    success: true,
    reason: null
  });

  return { user, accessToken, refreshToken };
}

export async function loginService({ email, password }, clientInfo) {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  // Check if account is locked
  if (user) {
    const lockoutStatus = await checkAccountLockout(user.id);
    if (lockoutStatus.locked) {
      await recordLoginAttempt({
        email,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        success: false,
        reason: "account_locked"
      });
      throw new Error(`Account locked. Try again in ${lockoutStatus.remainingMinutes} minutes`);
    }
  }

  // Validate credentials
  if (!user) {
    await recordLoginAttempt({
      email,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      success: false,
      reason: "user_not_found"
    });
    throw new Error("Invalid credentials");
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    await recordLoginAttempt({
      email,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      success: false,
      reason: "invalid_password"
    });

    const lockResult = await handleFailedLogin(user.id, email, clientInfo.ipAddress);
    if (lockResult.locked) {
      throw new Error(`Too many failed attempts. Account locked for ${lockResult.duration} minutes`);
    }

    throw new Error("Invalid credentials");
  }

  // Check for inactive account
  if (!user.isActive) {
    await recordLoginAttempt({
      email,
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      success: false,
      reason: "account_inactive"
    });
    throw new Error("Account is deactivated");
  }

  // Clear any existing lockout on successful login
  await clearLockout(user.id);

  // Check for suspicious activity
  const suspiciousCheck = await detectSuspiciousActivity(user.id, clientInfo.ipAddress);

  // Generate tokens
  const refreshToken = generateRefreshToken();
  const tokenFamily = generateTokenFamily();

  const session = await prisma.refreshToken.create({
    data: {
      token: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
      ipAddress: clientInfo.ipAddress,
      userAgent: clientInfo.userAgent,
      deviceInfo: JSON.stringify(clientInfo.deviceInfo),
      family: tokenFamily
    }
  });

  const accessToken = generateToken(user.id, user.role, session.id);

  // Update user's last login info
  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      lastLoginIp: clientInfo.ipAddress
    }
  });

  await recordLoginAttempt({
    email,
    ipAddress: clientInfo.ipAddress,
    userAgent: clientInfo.userAgent,
    success: true,
    reason: null
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    accessToken,
    refreshToken,
    warning: suspiciousCheck.suspicious ? "New login location detected" : null
  };
}

export async function refreshTokenService(oldRefreshToken, clientInfo) {
  return await prisma.$transaction(async (tx) => {
    const storedToken = await tx.refreshToken.findUnique({
      where: { token: hashToken(oldRefreshToken) },
      include: { user: true }
    });

    // Token doesn't exist
    if (!storedToken) {
      throw new Error("Invalid refresh token");
    }

    // Token was revoked (possible theft detected)
    if (storedToken.isRevoked) {
      // Revoke all tokens in this family (security breach)
      await tx.refreshToken.updateMany({
        where: { family: storedToken.family },
        data: { isRevoked: true }
      });
      throw new Error("Token reuse detected. All sessions revoked for security.");
    }

    // Token expired
    if (storedToken.expiresAt < new Date()) {
      await tx.refreshToken.delete({
        where: { id: storedToken.id }
      });
      throw new Error("Refresh token expired");
    }

    // Mark old token as revoked (not deleted, for reuse detection)
    await tx.refreshToken.update({
      where: { id: storedToken.id },
      data: { isRevoked: true }
    });

    // Generate new tokens with same family
    const newRefreshToken = generateRefreshToken();

    const newSession = await tx.refreshToken.create({
      data: {
        token: hashToken(newRefreshToken),
        userId: storedToken.user.id,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000),
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent,
        deviceInfo: JSON.stringify(clientInfo.deviceInfo),
        family: storedToken.family // Keep same family for rotation detection
      }
    });

    const newAccessToken = generateToken(storedToken.user.id, storedToken.user.role, newSession.id);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  });
}

export async function logoutService(refreshToken) {
  if (!refreshToken) throw new Error("Refresh token is required");

  const result = await prisma.refreshToken.updateMany({
    where: { token: hashToken(refreshToken) },
    data: { isRevoked: true }
  });

  if (result.count === 0) {
    throw new Error("Invalid refresh token");
  }
}

export async function logoutAllService(userId) {
  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { isRevoked: true }
  });
}

// Get active sessions for a user
export async function getActiveSessionsService(userId, currentSessionId) {
  const sessions = await prisma.refreshToken.findMany({
    where: {
      userId,
      isRevoked: false,
      expiresAt: { gt: new Date() }
    },
    select: {
      id: true,
      ipAddress: true,
      userAgent: true,
      deviceInfo: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" }
  });

  return sessions.map(s => ({
    id: s.id,
    ipAddress: s.ipAddress,
    device: s.deviceInfo ? JSON.parse(s.deviceInfo) : null,
    createdAt: s.createdAt,
    isCurrent: s.id === currentSessionId
  }));
}

// Revoke specific session
export async function revokeSessionService(userId, sessionId) {
  const result = await prisma.refreshToken.updateMany({
    where: {
      id: sessionId,
      userId
    },
    data: { isRevoked: true }
  });

  if (result.count === 0) {
    throw new Error("Session not found");
  }
}