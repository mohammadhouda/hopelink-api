import prisma from "../config/prisma.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {generateToken, generateRefreshToken} from "../utils/generateToken.js";

const REFRESH_TOKEN_EXPIRY_DAYS = 7;

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

// Register a new user
export async function registerService({ name, email, password, role}) {
  const userExist = await prisma.user.findUnique({
    where: { email }
  });

  if (userExist) throw new Error("Email already exists");

  const hashedPassword = await bcrypt.hash(password, 12);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role
    }
  });

  const accessToken = generateToken(user.id, user.role);
  const refreshToken = generateRefreshToken();

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      token: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    }
  });

  return { user, accessToken, refreshToken };
}

export async function loginService({ email, password }) {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) throw new Error("Invalid credentials");

  // Verify password
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) throw new Error("Invalid credentials");

  // Generate tokens
  const accessToken = generateToken(user.id , user.role);
  const refreshToken = generateRefreshToken();

  // Store refresh token
  await prisma.refreshToken.create({
    data: {
      token: hashToken(refreshToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    }
  });

  user.password = undefined; // Hide password
  user.createdAt = undefined; // Hide createdAt
  user.isActive  = undefined; // Hide isActive

  return { user, accessToken, refreshToken };
}

export async function refreshTokenService(oldRefreshToken) {
  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: hashToken(oldRefreshToken) },
    include: { user: true }
  });

  // Validate refresh token
  if (!storedToken || storedToken.expiresAt < new Date()) {
    if (storedToken?.userId){
      await prisma.refreshToken.deleteMany({
        where: { userId: storedToken.userId }
      });
    }
    throw new Error("Invalid or expired refresh token");
  }

  // Generate new tokens
  const newToken = generateToken(storedToken.user.id, storedToken.user.role);
  const newRefreshToken = generateRefreshToken();

  // Replace old refresh token with new one
  await prisma.refreshToken.delete({
    where: { token: hashToken(oldRefreshToken) }
  });

  await prisma.refreshToken.create({
    data: {
      token: hashToken(newRefreshToken),
      userId: storedToken.user.id,
      expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
    }
  });

  return { accessToken: newToken, refreshToken: newRefreshToken };
}

export async function logoutService(refreshToken) {
  if (!refreshToken) throw new Error("Refresh token is required");

  await prisma.refreshToken.deleteMany({
    where: { token: hashToken(refreshToken) }
  });
}

// Logout from all devices
export async function logoutAllService(userId) {
  await prisma.refreshToken.deleteMany({
    where: { userId }
  });
}

