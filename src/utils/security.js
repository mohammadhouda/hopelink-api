import crypto from "crypto";

// Extract client IP
export function getClientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || "unknown";
}

// Parse user agent for device info
export function parseUserAgent(userAgent) {
  if (!userAgent) return { browser: "unknown", os: "unknown", device: "unknown" };

  const browser = userAgent.match(/(chrome|safari|firefox|opera|edge|msie|trident)/i)?.[0] || "unknown";
  const os = userAgent.match(/(windows|mac|linux|android|ios|iphone|ipad)/i)?.[0] || "unknown";
  const isMobile = /mobile|android|iphone|ipad/i.test(userAgent);

  return {
    browser: browser.toLowerCase(),
    os: os.toLowerCase(),
    device: isMobile ? "mobile" : "desktop",
    raw: userAgent.substring(0, 500) // Limit length
  };
}

// Hash token for storage
export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Generate secure random token
export function generateSecureToken(length = 64) {
  return crypto.randomBytes(length).toString("hex");
}

// Generate token family ID for rotation detection
export function generateTokenFamily() {
  return crypto.randomUUID();
}