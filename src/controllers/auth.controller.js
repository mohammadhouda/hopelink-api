import {
  registerService,
  loginService,
  refreshTokenService,
  logoutService,
  logoutAllService
} from "../services/auth.service.js";
import { success, failure } from "../utils/response.js";

// Cookie options
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax"
};

export async function registerController(req, res) {
  try {
    const { user, accessToken, refreshToken } = await registerService(req.body);

    res.cookie("access_token", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 20 * 60 * 1000 // 20 minutes
    });

    res.cookie("refresh_token", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: "/api/auth" // Only sent to auth routes
    });

    return success(res, user, "User registered successfully.", 201);
  } catch (err) {
    return failure(res, err.message, 400);
  }
}

export async function loginController(req, res) {
  try {

    // Authenticate user and generate tokens
    const { user, accessToken, refreshToken } = await loginService(req.body);

    res.cookie("access_token", accessToken, {
      ...COOKIE_OPTIONS,
      maxAge: 20 * 60 * 1000
    });

    res.cookie("refresh_token", refreshToken, {
      ...COOKIE_OPTIONS,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: "/api/auth"
    });

    return success(res, user, "User logged in successfully.", 200);
  } catch (err) {
    return failure(res, err.message, 400);
  }
}

// Refresh token controller
export async function refreshController(req, res) {
  try {
    const refreshToken = req.cookies?.refresh_token || req.body.refreshToken;

    if (!refreshToken) {
      throw new Error("Refresh token is required");
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = await refreshTokenService(refreshToken);

    // Set new tokens in cookies
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
    // Clear cookies on refresh failure
    res.clearCookie("access_token");
    res.clearCookie("refresh_token", { path: "/api/auth" });
    return failure(res, err.message, 401);
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