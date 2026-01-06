import jwt from "jsonwebtoken";
import crypto from "crypto";

// Generate JWT access token
export function generateToken(user_id, role="USER") {
  return jwt.sign(
    { id: user_id, role: role },
    process.env.JWT_SECRET,
    { expiresIn: "20m" }
  );
}

// Generate a secure random refresh token
export function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

