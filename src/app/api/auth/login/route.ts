import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_SECONDS, createAdminSession } from "@/lib/admin-auth";
import { readJsonBody } from "@/lib/request-body";

const loginSchema = z.object({
  username: z.string().max(256),
  password: z.string().max(1024),
  next: z.string().max(512).optional(),
});

function constantTimeEqual(actual: string, expected: string) {
  const actualDigest = createHmac("sha256", "admin-login-compare").update(actual).digest();
  const expectedDigest = createHmac("sha256", "admin-login-compare").update(expected).digest();
  return timingSafeEqual(actualDigest, expectedDigest) && actual.length === expected.length;
}

function clientIp(request: Request) {
  const value = request.headers.get("x-vercel-forwarded-for")
    ?? request.headers.get("x-real-ip")
    ?? request.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim()
    ?? "unknown";
  return value.slice(0, 128) || "unknown";
}

function safeNextPath(value: string | undefined) {
  if (!value || !value.startsWith("/admin") || value.startsWith("//") || value === "/admin/login" || value.startsWith("/admin/login?")) return "/admin";
  if (value !== "/admin" && !value.startsWith("/admin/")) return "/admin";
  return value;
}

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  let sameOrigin = false;
  try { sameOrigin = Boolean(origin && new URL(origin).origin === new URL(request.url).origin); } catch { /* Invalid origin */ }
  if (!sameOrigin) return NextResponse.json({ error: "Sign-in request was rejected." }, { status: 403, headers: { "Cache-Control": "no-store" } });

  const body = await readJsonBody(request, 4 * 1024);
  if (!body.ok) return NextResponse.json({ error: "Enter a valid username and password." }, { status: body.status, headers: { "Cache-Control": "no-store" } });
  const parsed = loginSchema.safeParse(body.value);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid username and password." }, { status: 400, headers: { "Cache-Control": "no-store" } });

  const expectedUser = process.env.ADMIN_USER;
  const expectedPass = process.env.ADMIN_PASS;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET || expectedPass;
  if (!expectedUser || !expectedPass || !sessionSecret || sessionSecret.length < 16
    || expectedUser === "replace-me"
    || expectedPass === "replace-with-a-long-random-password"
    || sessionSecret === "replace-with-at-least-32-random-characters") {
    return NextResponse.json({ error: "Admin sign-in is not configured. Contact your site administrator." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  const usernameMatches = constantTimeEqual(parsed.data.username, expectedUser);
  const passwordMatches = constantTimeEqual(parsed.data.password, expectedPass);
  const credentialsValid = usernameMatches && passwordMatches;
  const ipHash = createHmac("sha256", sessionSecret).update(clientIp(request)).digest("hex");
  const now = new Date();
  const lockoutSince = new Date(now.getTime() - 15 * 60 * 1000);
  const cleanupBefore = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  let result: "allowed" | "invalid" | "limited";
  try {
    result = await db.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${ipHash}))`;
      await tx.adminLoginAttempt.deleteMany({ where: { createdAt: { lt: cleanupBefore } } });
      const attempts = await tx.adminLoginAttempt.count({ where: { ipHash, createdAt: { gte: lockoutSince } } });
      if (attempts >= 5) return "limited";
      if (!credentialsValid) {
        await tx.adminLoginAttempt.create({ data: { ipHash } });
        return "invalid";
      }
      await tx.adminLoginAttempt.deleteMany({ where: { ipHash } });
      return "allowed";
    });
  } catch {
    return NextResponse.json({ error: "Sign-in is temporarily unavailable. Please try again shortly." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }

  if (result === "limited") return NextResponse.json({ error: "Too many attempts. Wait 15 minutes and try again." }, { status: 429, headers: { "Cache-Control": "no-store" } });
  if (result === "invalid") return NextResponse.json({ error: "The username or password is incorrect." }, { status: 401, headers: { "Cache-Control": "no-store" } });

  const response = NextResponse.json({ ok: true, next: safeNextPath(parsed.data.next) }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(ADMIN_SESSION_COOKIE, await createAdminSession(expectedUser), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_SECONDS,
  });
  return response;
}
