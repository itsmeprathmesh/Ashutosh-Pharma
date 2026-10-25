export const ADMIN_SESSION_COOKIE = "ashutosh_admin_session";
export const ADMIN_SESSION_SECONDS = 60 * 60 * 8;

const encoder = new TextEncoder();

function sessionSecret() {
  const signingSecret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASS || "";
  const password = process.env.ADMIN_PASS || "";
  return signingSecret && password ? `${signingSecret}\u0000${password}` : "";
}

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function fromBase64Url(value: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) throw new Error("Invalid token encoding");
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function hmacKey() {
  const secret = sessionSecret();
  if (secret.length < 16) throw new Error("Admin session secret is not configured");
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createAdminSession(username: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS;
  const payload = toBase64Url(encoder.encode(JSON.stringify({ sub: username, exp: expiresAt })));
  const key = await hmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  return `${payload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyAdminSession(token: string | undefined | null) {
  const expectedUser = process.env.ADMIN_USER;
  if (!token || !expectedUser) return false;

  try {
    const [payload, signature, extra] = token.split(".");
    if (!payload || !signature || extra !== undefined) return false;
    const key = await hmacKey();
    const validSignature = await crypto.subtle.verify("HMAC", key, fromBase64Url(signature), encoder.encode(payload));
    if (!validSignature) return false;
    const session = JSON.parse(new TextDecoder().decode(fromBase64Url(payload))) as { sub?: unknown; exp?: unknown };
    return session.sub === expectedUser && typeof session.exp === "number" && session.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function cookieValue(cookieHeader: string | null, name = ADMIN_SESSION_COOKIE) {
  for (const entry of cookieHeader?.split(";") ?? []) {
    const separator = entry.indexOf("=");
    if (separator < 0 || entry.slice(0, separator).trim() !== name) continue;
    return entry.slice(separator + 1).trim();
  }
  return undefined;
}

export async function isAdminAuthorized(cookieHeader: string | null) {
  return verifyAdminSession(cookieValue(cookieHeader));
}
