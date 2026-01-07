import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { failure } from "../utils/response.js";

// Constants
const TOKEN_COOKIE_NAME = "access_token";
const BEARER_PREFIX = "Bearer ";

// Error messages
const ERROR_MESSAGES = {
  NO_TOKEN: "Authentication required",
  INVALID_TOKEN: "Invalid authentication token",
  EXPIRED_TOKEN: "Authentication token has expired",
  USER_NOT_FOUND: "User not found",
  ACCOUNT_DISABLED: "Account is disabled",
  MALFORMED_TOKEN: "Malformed authentication token",
};

/**
 * Extracts JWT token from request cookies or Authorization header
 * @param {Object} req - Express request object
 * @returns {string|null} - Extracted token or null
 */
function extractToken(req) {
  // Check cookies first
  if (req.cookies?.[TOKEN_COOKIE_NAME]) {
    return req.cookies[TOKEN_COOKIE_NAME];
  }

  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith(BEARER_PREFIX)) {
    return authHeader.substring(BEARER_PREFIX.length);
  }

  return null;
}

/**
 * Verifies JWT token and validates payload structure
 * @param {string} token - JWT token to verify
 * @returns {Object} - Decoded token payload
 * @throws {Error} - If token is invalid or malformed
 */
function verifyToken(token) {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET is not configured");
  }

  const decoded = jwt.verify(token, jwtSecret);

  // Validate required payload fields
  if (!decoded.id) {
    throw new Error("Invalid token payload: missing user id");
  }

  return decoded;
}

/**
 * Authentication middleware
 * Validates JWT token and attaches user information to request object
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void}
 */
async function authMiddleware(req, res, next) {
  try {
    // Extract token from request
    const token = extractToken(req);

    if (!token) {
      return failure(res, ERROR_MESSAGES.NO_TOKEN, 401);
    }

    // Verify and decode token
    let decoded;
    try {
      decoded = verifyToken(token);
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
      // Re-throw unexpected errors
      throw error;
    }

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    // Validate user exists
    if (!user) {
      return failure(res, ERROR_MESSAGES.USER_NOT_FOUND, 401);
    }

    // Validate user is active
    if (!user.isActive) {
      return failure(res, ERROR_MESSAGES.ACCOUNT_DISABLED, 403);
    }

    // Attach sanitized user info to request object
    req.user = {
      id: user.id,
      role: user.role,
    };

    // Proceed to next middleware or route handler
    next();
  } catch (error) {
    console.error("Authentication middleware error:", error);
    // Return generic error to clients
    return failure(res, "Authentication failed", 500);
  }
}

export default authMiddleware;