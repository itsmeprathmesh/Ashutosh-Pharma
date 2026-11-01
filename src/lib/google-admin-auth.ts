import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { createRemoteJWKSet, jwtVerify, SignJWT } from "jose";
import { adminEmails } from "@/lib/auth-session";

const issuer = ["https://accounts.google.com", "accounts.google.com"];
const googleKeys = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export const GOOGLE_OAUTH_TTL_SECONDS = 10 * 60;
export const GOOGLE_HANDOFF_TTL_SECONDS = 90;

export function googleHandoffCookieName() {
  return "ashutosh-google-handoff";
}

export function googleOAuthCookieName() {
  return process.env.NODE_ENV === "production" ? "__Host-ashutosh-google-oauth" : "ashutosh-google-oauth";
}

export type GoogleOAuthTransaction = {
  state: string;
  nonce: string;
  verifier: string;
  next: string;
};

function sessionKey() {
  const secret = process.env.SESSION_SECRET ?? "";
  if (new TextEncoder().encode(secret).length < 32) throw new Error("Admin session signing is unavailable");
  return new TextEncoder().encode(secret);
}

export function googleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (!clientId || !clientSecret || !redirectUri) return null;
  const callback = new URL(redirectUri);
  if (process.env.NODE_ENV === "production" && callback.protocol !== "https:") return null;
  if (callback.pathname !== "/api/admin/auth/google/callback") return null;
  return { clientId, clientSecret, redirectUri: callback.toString() };
}

export function safeAdminNext(value?: string) {
  if (value && (value === "/admin" || (value.startsWith("/admin/") && !value.startsWith("/admin/login"))) && !value.startsWith("//") && !/[\\\r\n]/.test(value)) return value;
  return "/admin";
}

export function newGoogleOAuthTransaction(next?: string): GoogleOAuthTransaction {
  return {
    state: randomBytes(32).toString("base64url"),
    nonce: randomBytes(32).toString("base64url"),
    verifier: randomBytes(32).toString("base64url"),
    next: safeAdminNext(next),
  };
}

export function googlePkceChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

export async function sealGoogleOAuthTransaction(transaction: GoogleOAuthTransaction) {
  return new SignJWT(transaction)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime(`${GOOGLE_OAUTH_TTL_SECONDS}s`)
    .sign(sessionKey());
}

export async function openGoogleOAuthTransaction(token: string) {
  const { payload, protectedHeader } = await jwtVerify(token, sessionKey(), { algorithms: ["HS256"] });
  if (protectedHeader.typ !== "JWT" || typeof payload.state !== "string" || typeof payload.nonce !== "string" || typeof payload.verifier !== "string" || typeof payload.next !== "string") throw new Error("Invalid Google sign-in transaction");
  return payload as typeof payload & GoogleOAuthTransaction;
}

export async function sealGoogleSessionHandoff(email: string, next: string) {
  return new SignJWT({ kind: "google-session-handoff", next: safeAdminNext(next) })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuer("ashutosh-pharma-admin")
    .setAudience("ashutosh-admin-google-complete")
    .setSubject(email.toLowerCase())
    .setIssuedAt()
    .setExpirationTime(`${GOOGLE_HANDOFF_TTL_SECONDS}s`)
    .setJti(randomBytes(24).toString("base64url"))
    .sign(sessionKey());
}

export async function openGoogleSessionHandoff(token: string) {
  const { payload, protectedHeader } = await jwtVerify(token, sessionKey(), {
    algorithms: ["HS256"],
    issuer: "ashutosh-pharma-admin",
    audience: "ashutosh-admin-google-complete",
  });
  const email = typeof payload.sub === "string" ? payload.sub.toLowerCase() : "";
  if (protectedHeader.typ !== "JWT" || payload.kind !== "google-session-handoff" || !email || typeof payload.next !== "string" || !adminEmails().has(email)) {
    throw new Error("Invalid Google session handoff");
  }
  return { email, next: safeAdminNext(payload.next) };
}

export function secureStringEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function verifyGoogleIdentity(idToken: string, clientId: string, nonce: string) {
  const { payload } = await jwtVerify(idToken, googleKeys, { issuer, audience: clientId });
  if (typeof payload.nonce !== "string" || !secureStringEqual(payload.nonce, nonce)) throw new Error("Invalid Google sign-in nonce");
  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const verified = payload.email_verified === true || payload.email_verified === "true";
  if (!verified || !email || !adminEmails().has(email)) throw new Error("Unauthorized Google account");
  return email;
}
