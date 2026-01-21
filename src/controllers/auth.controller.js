import {
  registerService,
  loginService,
  refreshTokenService,
  logoutService,
  logoutAllService,
  getActiveSessionsService,
  revokeSessionService
} from "../services/auth.service.js";
import { success, failure } from "../utils/response.js";
import { getClientIp, parseUserAgent } from "../utils/security.js";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
};

function getClientInfo(req) {
  const userAgent = req.headers["user-agent"] || "";
  return {
    ipAddress: getClientIp(req),
    userAgent: userAgent.substring(0, 500),
    deviceInfo: parseUserAgent(userAgent)
  };
}

export async function registerController(req, res) {
  try {
    const clientInfo = getClientInfo(req);
    const { user, accessToken, refreshToken } = await registerService(req.body, clientInfo);

    res.cookie("access_token", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 20 * 60 * 1000
    });

    res.cookie("refresh_token", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth"
    });

    return success(res, user, "User registered successfully.", 201);
  } catch (err) {
    return failure(res, err.message, 400);
  }
}

export async function loginController(req, res) {
  try {
    const clientInfo = getClientInfo(req);
    const { user, accessToken, refreshToken, warning } = await loginService(req.body, clientInfo);

    res.cookie("access_token", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 20 * 60 * 1000
    });

    res.cookie("refresh_token", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth"
    });

    const response = { user };
    if (warning) response.warning = warning;

    return success(res, response, "User logged in successfully.", 200);
  } catch (err) {
    const status = err.message.includes("locked") ? 429 : 400;
    return failure(res, err.message, status);
  }
}

export async function refreshController(req, res) {
  try {
    const refreshToken = req.cookies?.refresh_token;

    if (!refreshToken) {
      throw new Error("Refresh token is required");
    }

    const clientInfo = getClientInfo(req);
    const { accessToken, refreshToken: newRefreshToken } = await refreshTokenService(refreshToken, clientInfo);

    res.cookie("access_token", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 20 * 60 * 1000
    });

    res.cookie("refresh_token", newRefreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth"
    });

    return success(res, null, "Token refreshed successfully.", 200);
  } catch (err) {
    res.clearCookie("access_token");
    res.clearCookie("refresh_token", { path: "/api/auth" });

    const status = err.message.includes("reuse") ? 403 : 401;
    return failure(res, err.message, status);
  }
}

export async function logoutController(req, res) {
  try {
    const refreshToken = req.cookies?.refresh_token;
    await logoutService(refreshToken);

    res.clearCookie("access_token");
    res.clearCookie("refresh_token", { path: "/api/auth" });

    return success(res, null, "Logged out successfully.", 200);
  } catch (err) {
    // Clear cookies anyway on logout
    res.clearCookie("access_token");
    res.clearCookie("refresh_token", { path: "/api/auth" });
    return failure(res, err.message, 400);
  }
}

export async function logoutAllController(req, res) {
  try {
    await logoutAllService(req.user.id);

    res.clearCookie("access_token");
    res.clearCookie("refresh_token", { path: "/api/auth" });

    return success(res, null, "Logged out from all devices.", 200);
  } catch (err) {
    return failure(res, err.message, 400);
  }
}

export async function getSessionsController(req, res) {
  try {
    const sessions = await getActiveSessionsService(req.user.id, req.user.sessionId);
    return success(res, sessions, "Sessions retrieved.", 200);
  } catch (err) {
    return failure(res, err.message, 400);
  }
}

export async function revokeSessionController(req, res) {
  try {
    const { sessionId } = req.params;

    // Prevent revoking current session
    if (sessionId === req.user.sessionId) {
      return failure(res, "Cannot revoke current session. Use logout instead.", 400);
    }

    await revokeSessionService(req.user.id, sessionId);
    return success(res, null, "Session revoked.", 200);
  } catch (err) {
    return failure(res, err.message, 400);
  }
}