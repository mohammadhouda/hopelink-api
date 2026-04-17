import jwt from "jsonwebtoken";
import { prismaMock } from "./db.helper.js";

export function makeAccessCookie(userId = 1, role = "USER", sessionId = "session-1") {
  const token = jwt.sign(
    { id: userId, role, sessionId },
    process.env.JWT_SECRET_KEY,
    { expiresIn: "1h" },
  );
  return `access_token=${token}`;
}

export function mockAuthMiddleware({ id = 1, role = "USER", isActive = true } = {}) {
  // 1. Session validity check
  prismaMock.refreshToken.findUnique.mockResolvedValueOnce({
    id: "session-1",
    isRevoked: false,
  });
  // 2. User lookup
  prismaMock.user.findUnique.mockResolvedValueOnce({ id, role, isActive });
}
