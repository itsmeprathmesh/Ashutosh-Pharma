import { createHmac, randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { Resend } from "resend";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { adminEmails } from "@/lib/auth-session";
import { sameOrigin } from "@/lib/auth";
import { ADMIN_LOGIN_MAX_FAILURES, ADMIN_LOGIN_WINDOW_MS } from "@/lib/auth-policy";
import { readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";
const schema = z.object({ email: z.string().max(320), password: z.string().max(1024), next: z.string().max(512).optional() });
const dummyBcrypt = "$2b$12$exbuNpToIOWJSkC2RfKCjuG1IkZ47Vg3mdI0VELwxUOTExmSEOX8i";
const fail = () => NextResponse.json({ error: "Invalid details" }, { status: 401, headers: { "Cache-Control": "no-store" } });
const secret = () => process.env.SESSION_SECRET ?? "";
const digest = (value: string) => createHmac("sha256", secret()).update(value).digest("hex");
function clientIp(request: Request) { return (request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown").split(",")[0].trim().slice(0, 128); }
function safeNext(value?: string) { return value?.startsWith("/admin/") && !value.startsWith("//") && !value.startsWith("/admin/login") ? value : "/admin"; }
const pause = (start: number) => new Promise((resolve) => setTimeout(resolve, Math.max(0, 650 - (Date.now() - start))));
function configuredPasswordHash() {
  let encoded = (process.env.ADMIN_PASSWORD_HASH_B64 ?? "").trim().replace(/^ADMIN_PASSWORD_HASH_B64\s*=/i, "").trim();
  if ((encoded.startsWith("\"") && encoded.endsWith("\"")) || (encoded.startsWith("'") && encoded.endsWith("'"))) encoded = encoded.slice(1, -1).trim();
  const candidate = Buffer.from(encoded, "base64").toString("utf8");
  return /^\$2[aby]\$\d\d\$/.test(candidate) ? candidate : "";
}

export async function POST(request: Request) {
  const start = Date.now();
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const body = await readJsonBody(request, 4 * 1024);
  const input = body.ok ? schema.safeParse(body.value) : { success: false as const };
  if (!input.success) {
    if (secret().length >= 32) {
      const ipHash = digest(clientIp(request));
      const emailHash = digest("invalid-login-input");
      try {
        await db.$transaction(async (tx) => {
          await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${ipHash}), hashtext(${emailHash}))`;
          const now = new Date(), since = new Date(now.getTime() - ADMIN_LOGIN_WINDOW_MS);
          const lockKey = `ip:${ipHash}`;
          const lock = await tx.adminLoginLockout.findUnique({ where: { key: lockKey } });
          const count = await tx.adminLoginAttempt.count({ where: { ipHash, createdAt: { gte: since } } });
          if (!lock || lock.lockedUntil <= now) {
            if (count < ADMIN_LOGIN_MAX_FAILURES) await tx.adminLoginAttempt.create({ data: { ipHash, emailHash } });
            if (count + 1 >= ADMIN_LOGIN_MAX_FAILURES) await tx.adminLoginLockout.upsert({ where: { key: lockKey }, create: { key: lockKey, lockedUntil: new Date(now.getTime() + ADMIN_LOGIN_WINDOW_MS) }, update: { lockedUntil: new Date(now.getTime() + ADMIN_LOGIN_WINDOW_MS) } });
          }
          await tx.adminLoginAttempt.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60_000) } } });
        });
      } catch { /* Keep malformed login responses generic when the database is unavailable. */ }
    }
    await pause(start); return fail();
  }
  if (secret().length < 32) { await pause(start); return fail(); }
  const email = input.data.email.trim().toLowerCase();
  const emailAllowed = adminEmails().has(email);
  let hash = dummyBcrypt;
  try { hash = configuredPasswordHash() || dummyBcrypt; } catch { /* use fixed dummy */ }
  const passwordValid = await bcrypt.compare(input.data.password, hash).catch(() => false);
  const ipHash = digest(clientIp(request)), emailHash = digest(email);
  const now = new Date(), since = new Date(now.getTime() - ADMIN_LOGIN_WINDOW_MS);
  try {
    const result = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${ipHash}), hashtext(${emailHash}))`;
      const [ipCount, emailCount] = await Promise.all([
        tx.adminLoginAttempt.count({ where: { ipHash, createdAt: { gte: since } } }),
        tx.adminLoginAttempt.count({ where: { emailHash, createdAt: { gte: since } } }),
      ]);
      const locks = await tx.adminLoginLockout.findMany({ where: { key: { in: [`ip:${ipHash}`, `email:${emailHash}`] }, lockedUntil: { gt: now } } });
      await tx.adminLoginAttempt.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60_000) } } });
      if (locks.length || ipCount >= ADMIN_LOGIN_MAX_FAILURES || emailCount >= ADMIN_LOGIN_MAX_FAILURES) return false;
      if (!passwordValid || !emailAllowed) {
        await tx.adminLoginAttempt.create({ data: { ipHash, emailHash } });
        if (ipCount + 1 >= ADMIN_LOGIN_MAX_FAILURES) await tx.adminLoginLockout.upsert({ where: { key: `ip:${ipHash}` }, create: { key: `ip:${ipHash}`, lockedUntil: new Date(now.getTime() + ADMIN_LOGIN_WINDOW_MS) }, update: { lockedUntil: new Date(now.getTime() + ADMIN_LOGIN_WINDOW_MS) } });
        if (emailCount + 1 >= ADMIN_LOGIN_MAX_FAILURES) await tx.adminLoginLockout.upsert({ where: { key: `email:${emailHash}` }, create: { key: `email:${emailHash}`, lockedUntil: new Date(now.getTime() + ADMIN_LOGIN_WINDOW_MS) }, update: { lockedUntil: new Date(now.getTime() + ADMIN_LOGIN_WINDOW_MS) } });
        return false;
      }
      return true;
    });
    if (!result) { await pause(start); return fail(); }
    const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const codeHash = digest(`admin-login-code:${email}:${code}`);
    const challenge = await db.$transaction(async (tx) => {
      await tx.adminLoginCode.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60_000) } } });
      await tx.adminLoginCode.updateMany({ where: { emailHash, used: false }, data: { used: true } });
      return tx.adminLoginCode.create({ data: { email, emailHash, ipHash, codeHash, expiresAt: new Date(Date.now() + 10 * 60_000) } });
    });
    const resend = new Resend(process.env.RESEND_API_KEY);
    const sent = await resend.emails.send({ from: process.env.AUTH_FROM_EMAIL ?? "", to: email, subject: "Your Ashutosh Pharma admin sign-in code", text: `Your sign-in code is ${code}. It expires in 10 minutes.` });
    if (sent.error) { await db.adminLoginCode.update({ where: { id: challenge.id }, data: { used: true } }); await pause(start); return fail(); }
    return NextResponse.json({ ok: true, challengeId: challenge.id, next: safeNext(input.data.next) }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    await pause(start); return fail();
  }
}
