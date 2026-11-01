import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_SECONDS, adminCookieOptionsForHost, adminEmails, createAdminSession } from "@/lib/auth-session";
import { sameOrigin } from "@/lib/auth";
import { ADMIN_LOGIN_MAX_FAILURES, ADMIN_LOGIN_WINDOW_MS, adminCodeIsUsable } from "@/lib/auth-policy";
import { readJsonBody } from "@/lib/request-body";

export const runtime = "nodejs";
const schema = z.object({ challengeId: z.string().max(64), code: z.string().regex(/^\d{6}$/), next: z.string().max(512).optional() });
const fail = () => NextResponse.json({ error: "Invalid details" }, { status: 401, headers: { "Cache-Control": "no-store" } });
const digest = (value: string) => createHmac("sha256", process.env.SESSION_SECRET ?? "invalid-session-secret").update(value).digest();
const digestHex = (value: string) => digest(value).toString("hex");
function requestIp(request: Request) { return (request.headers.get("x-vercel-forwarded-for") ?? request.headers.get("x-real-ip") ?? "unknown").split(",")[0].trim().slice(0, 128); }

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const body = await readJsonBody(request, 4 * 1024);
  const input = body.ok ? schema.safeParse(body.value) : { success: false as const };
  if (!input.success) return fail();
  const ipHash = digestHex(requestIp(request));
  try {
    const verifiedEmail = await db.$transaction(async (tx) => {
      const row = await tx.adminLoginCode.findUnique({ where: { id: input.data.challengeId } });
      const emailHash = row?.emailHash ?? ipHash;
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${ipHash}), hashtext(${emailHash}))`;
      const now = new Date(), since = new Date(now.getTime() - ADMIN_LOGIN_WINDOW_MS);
      const [ipFailures, emailFailures] = await Promise.all([
        tx.adminLoginAttempt.count({ where: { ipHash, createdAt: { gte: since } } }),
        row ? tx.adminLoginAttempt.count({ where: { emailHash: row.emailHash, createdAt: { gte: since } } }) : Promise.resolve(0),
      ]);
      const locks = await tx.adminLoginLockout.findMany({ where: { key: { in: [`ip:${ipHash}`, `email:${emailHash}`] }, lockedUntil: { gt: now } } });
      if (locks.length || ipFailures >= ADMIN_LOGIN_MAX_FAILURES || emailFailures >= ADMIN_LOGIN_MAX_FAILURES) return null;
      const expected = row ? Buffer.from(row.codeHash, "hex") : digest("missing-challenge");
      const supplied = row ? digest(`admin-login-code:${row.email}:${input.data.code}`) : digest("missing-challenge");
      const matches = expected.length === supplied.length && timingSafeEqual(expected, supplied);
      if (!row || !matches || !adminCodeIsUsable(row) || !adminEmails().has(row.email.toLowerCase())) {
        await tx.adminLoginAttempt.create({ data: { ipHash, emailHash: row?.emailHash ?? null } });
        const emailFailureCount = row ? emailFailures : 0;
        if (ipFailures + 1 >= ADMIN_LOGIN_MAX_FAILURES) await tx.adminLoginLockout.upsert({ where: { key: `ip:${ipHash}` }, create: { key: `ip:${ipHash}`, lockedUntil: new Date(now.getTime() + ADMIN_LOGIN_WINDOW_MS) }, update: { lockedUntil: new Date(now.getTime() + ADMIN_LOGIN_WINDOW_MS) } });
        if (emailFailureCount + 1 >= ADMIN_LOGIN_MAX_FAILURES) await tx.adminLoginLockout.upsert({ where: { key: `email:${emailHash}` }, create: { key: `email:${emailHash}`, lockedUntil: new Date(now.getTime() + ADMIN_LOGIN_WINDOW_MS) }, update: { lockedUntil: new Date(now.getTime() + ADMIN_LOGIN_WINDOW_MS) } });
        if (row && !row.used && row.attempts < ADMIN_LOGIN_MAX_FAILURES) await tx.adminLoginCode.updateMany({ where: { id: row.id, used: false, attempts: { lt: ADMIN_LOGIN_MAX_FAILURES } }, data: { attempts: { increment: 1 } } });
        return null;
      }
      const consumed = await tx.adminLoginCode.updateMany({ where: { id: row.id, used: false, expiresAt: { gt: new Date() }, attempts: { lt: ADMIN_LOGIN_MAX_FAILURES }, codeHash: row.codeHash }, data: { used: true } });
      return consumed.count ? row.email.toLowerCase() : null;
    });
    if (!verifiedEmail) return fail();
    const response = NextResponse.json({ ok: true, next: input.data.next?.startsWith("/admin/") && !input.data.next.startsWith("//") ? input.data.next : "/admin" }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(ADMIN_SESSION_COOKIE, await createAdminSession(verifiedEmail), { ...adminCookieOptionsForHost(new URL(request.url).hostname), expires: new Date(Date.now() + ADMIN_SESSION_SECONDS * 1000) });
    return response;
  } catch {
    return NextResponse.json({ error: "Sign-in is temporarily unavailable." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
