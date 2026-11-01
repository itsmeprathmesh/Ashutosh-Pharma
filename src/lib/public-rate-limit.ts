import { createHmac } from "node:crypto";
import { db } from "@/lib/db";

export async function publicRateLimit(request: Request, route: string, limit: number, windowMs: number) {
  const ip = request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("Rate limit hashing secret is not configured.");
  const ipHash = createHmac("sha256", secret).update(ip).digest("hex");
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${route}), hashtext(${ipHash}))`;
    const now = new Date();
    await tx.publicRateLimitAttempt.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 24 * 60 * 60_000) } } });
    const count = await tx.publicRateLimitAttempt.count({ where: { route, ipHash, createdAt: { gte: new Date(now.getTime() - windowMs) } } });
    if (count >= limit) return false;
    await tx.publicRateLimitAttempt.create({ data: { route, ipHash } });
    return true;
  });
}
