import jwt from "jsonwebtoken";
import crypto from "crypto";

// Generate JWT access token
export function generateToken(userId, role, sessionId) {
  return jwt.sign(
    { id: userId, role, sessionId },
    process.env.JWT_SECRET,
    { expiresIn: "20m" }
  );
}


// Generate a secure random refresh token
export function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

