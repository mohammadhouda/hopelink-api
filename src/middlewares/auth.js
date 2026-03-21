import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { failure } from "../utils/response.js";

const TOKEN_COOKIE_NAME = "access_token";

const ERROR_MESSAGES = {
  NO_TOKEN: "Authentication required",
  INVALID_TOKEN: "Invalid authentication token",
  EXPIRED_TOKEN: "Authentication token has expired",
  USER_NOT_FOUND: "User not found",
  ACCOUNT_DISABLED: "Account is disabled",
  MALFORMED_TOKEN: "Malformed authentication token",
  SESSION_REVOKED: "Session has been revoked",
};

function extractToken(req) {
  if (req.cookies?.[TOKEN_COOKIE_NAME]) {
    return req.cookies[TOKEN_COOKIE_NAME];
  }
  return null;
}

function decodeToken(token) {
  const jwtSecret = process.env.JWT_SECRET_KEY;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET_KEY is not configured");
  }

  const decoded = jwt.verify(token, jwtSecret);

  if (!decoded.id) {
    throw new Error("Invalid token payload: missing user id");
  }

  return decoded;
}

async function authMiddleware(req, res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      return failure(res, ERROR_MESSAGES.NO_TOKEN, 401);
    }

    let decoded;
    try {
      decoded = decodeToken(token);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return failure(res, ERROR_MESSAGES.EXPIRED_TOKEN, 401);
      }
      if (error instanceof jwt.JsonWebTokenError) {
        return failure(res, ERROR_MESSAGES.INVALID_TOKEN, 401);
      }
      if (error.message.includes("Invalid token payload")) {
        return failure(res, ERROR_MESSAGES.MALFORMED_TOKEN, 401);
      }
      throw error;
    }

    // Verify session (RefreshToken) is still valid
    if (decoded.sessionId) {
      const session = await prisma.refreshToken.findUnique({
        where: { id: decoded.sessionId },
      });

      if (!session || session.isRevoked) {
        return failure(res, ERROR_MESSAGES.SESSION_REVOKED, 401);
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return failure(res, ERROR_MESSAGES.USER_NOT_FOUND, 401);
    }

    if (!user.isActive) {
      return failure(res, ERROR_MESSAGES.ACCOUNT_DISABLED, 403);
    }

    req.user = {
      id: user.id,
      role: user.role,
      sessionId: decoded.sessionId,
    };

    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    return failure(res, "Authentication failed", 500);
  }
}

export default authMiddleware;
