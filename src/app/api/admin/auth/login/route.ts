import { NextResponse } from "next/server";

/** Password and emailed-code sign-in has been replaced by Google OAuth. */
export async function POST() {
  return NextResponse.json({ error: "Use Google sign-in." }, { status: 410, headers: { "Cache-Control": "no-store" } });
}
