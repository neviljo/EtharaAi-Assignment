import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Missing required environment variable: JWT_SECRET");
  }
  console.warn(
    "Warning: JWT_SECRET is not set. Using insecure development fallback. Do NOT use in production."
  );
}
const _JWT_SECRET = JWT_SECRET || "dev_jwt_secret_change_me";

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    _JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, _JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Extracts and verifies the JWT user from the request cookies or Authorization header.
 * Works inside Next.js App Router Route Handlers.
 */
export function getSessionUser(request) {
  let token = null;

  // 1. Try cookies
  if (request.cookies && typeof request.cookies.get === "function") {
    token = request.cookies.get("token")?.value;
  }

  // 2. Try Authorization header
  if (!token && request.headers && typeof request.headers.get === "function") {
    const authHeader = request.headers.get("Authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  if (!token) return null;

  return verifyToken(token);
}
