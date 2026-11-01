import { SignJWT } from "jose/jwt/sign";
import { jwtVerify } from "jose/jwt/verify";

export const ADMIN_SESSION_COOKIE = "ashutosh_admin_session";
export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;

export function adminEmails() {
  return new Set((process.env.ADMIN_EMAILS ?? "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean));
}

function key() {
  const secret = process.env.SESSION_SECRET ?? "";
  if (new TextEncoder().encode(secret).length < 32) throw new Error("SESSION_SECRET must contain at least 32 characters");
  return new TextEncoder().encode(secret);
}

export async function createAdminSession(email: string) {
  return new SignJWT({ email }).setProtectedHeader({ alg: "HS256" }).setSubject(email).setIssuedAt().setExpirationTime("8h").sign(key());
}

export async function verifyAdminSession(token?: string | null) {
  if (!token) return null;
  try {
    const { payload, protectedHeader } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    const email = typeof payload.sub === "string" ? payload.sub.toLowerCase() : "";
    if (protectedHeader.alg !== "HS256" || !email || !adminEmails().has(email) || payload.email !== email) return null;
    return email;
  } catch { return null; }
}

export const adminCookieOptions = { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" as const, path: "/", maxAge: ADMIN_SESSION_SECONDS };
