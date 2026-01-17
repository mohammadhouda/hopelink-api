import prisma from "../config/prisma.js";
import authConfig from "../config/auth.config.js";

const MAX_FAILED_ATTEMPTS = authConfig.lockout.maxFailedAttempts;
const LOCKOUT_DURATION_MINUTES = authConfig.lockout.durationMinutes;
const ATTEMPT_WINDOW_MINUTES = authConfig.lockout.attemptWindowMinutes;
const SUSPICIOUS_IP_THRESHOLD = authConfig.sessions.maxPerUser;

export async function recordLoginAttempt({ email, ipAddress, userAgent, success, reason }) {
  await prisma.loginAttempt.create({
    data: {
      email,
      ipAddress,
      userAgent: userAgent?.substring(0, 500),
      success,
      reason
    }
  });

  // Clean old attempts (keep last 30 days)
  await prisma.loginAttempt.deleteMany({
    where: {
      createdAt: {
        lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      }
    }
  });
}

export async function checkAccountLockout(userId) {
  const lockout = await prisma.accountLockout.findUnique({
    where: { userId }
  });

  if (lockout && lockout.lockoutUntil > new Date()) {
    const remainingMinutes = Math.ceil((lockout.lockoutUntil - new Date()) / 60000);
    return { locked: true, remainingMinutes };
  }

  return { locked: false };
}

export async function handleFailedLogin(userId, email, ipAddress) {
  // Count recent failed attempts
  const recentAttempts = await prisma.loginAttempt.count({
    where: {
      email,
      success: false,
      createdAt: {
        gte: new Date(Date.now() - ATTEMPT_WINDOW_MINUTES * 60 * 1000)
      }
    }
  });

  if (recentAttempts >= MAX_FAILED_ATTEMPTS && userId) {
    // Lock the account
    await prisma.accountLockout.upsert({
      where: { userId },
      update: {
        lockoutUntil: new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000),
        attempts: recentAttempts
      },
      create: {
        userId,
        lockoutUntil: new Date(Date.now() + LOCKOUT_DURATION_MINUTES * 60 * 1000),
        attempts: recentAttempts
      }
    });

    return { locked: true, duration: LOCKOUT_DURATION_MINUTES };
  }

  return { locked: false, attemptsRemaining: MAX_FAILED_ATTEMPTS - recentAttempts };
}

export async function clearLockout(userId) {
  await prisma.accountLockout.delete({
    where: { userId }
  }).catch(() => {}); // Ignore if doesn't exist
}

// Check for suspicious activity
export async function detectSuspiciousActivity(userId, currentIp) {
  const recentSessions = await prisma.refreshToken.findMany({
    where: {
      userId,
      isRevoked: false,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    },
    select: { ipAddress: true }
  });

  const uniqueIps = new Set(recentSessions.map(s => s.ipAddress).filter(Boolean));
  
  // Flag if more than 3 different IPs in 24 hours
  if (uniqueIps.size > SUSPICIOUS_IP_THRESHOLD && !uniqueIps.has(currentIp)) {
    return { suspicious: true, reason: "multiple_ips" };
  }

  return { suspicious: false };
}