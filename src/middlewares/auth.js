import jwt from "jsonwebtoken";
import prisma from "../config/prisma.js";
import { failure } from "../utils/response.js";

async function authMiddleware(req, res, next) {
  // Extract token from cookies or Authorization header
  const token =
    req.cookies?.access_token ||
    (req.headers.authorization?.startsWith("Bearer ")
      ? req.headers.authorization.split(" ")[1]
      : null);

  if (!token) {
    return failure(res, "Not authenticated", 401);
  }

  try {
    // Verify token and fetch user details
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, role: true, isActive: true },
    });

    // Check if user exists and is active
    if (!user || !user.isActive) {
      return failure(res, "Account disabled", 403);
    }

    // Attach user info to request object
    req.user = {
      id: user.id,
      role: user.role,
    };

    // Proceed to next middleware or route handler
    next();
  } catch (error) {
    return failure(res, "Invalid or expired token", 401);
  }
}

export default authMiddleware;