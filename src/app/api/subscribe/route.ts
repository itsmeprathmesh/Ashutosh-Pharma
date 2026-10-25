import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { readJsonBody } from "@/lib/request-body";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Newsletter sign-up is temporarily unavailable" }, { status: 503 });
  const body = await readJsonBody(request, 4 * 1024);
  if (!body.ok) return NextResponse.json({ error: body.status === 413 ? "Request is too large" : "Enter a valid email address" }, { status: body.status });
  const parsed = z.object({ email: z.string().trim().email().max(254) }).safeParse(body.value);
  if (!parsed.success) return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  try {
    await db.subscriber.upsert({ where: { email: parsed.data.email.toLowerCase() }, update: {}, create: { email: parsed.data.email.toLowerCase() } });
  } catch {
    return NextResponse.json({ error: "Newsletter sign-up is temporarily unavailable" }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
