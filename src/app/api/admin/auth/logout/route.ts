import { NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, adminCookieOptions } from "@/lib/auth-session";
import { sameOrigin } from "@/lib/auth";

export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const response = NextResponse.redirect(new URL("/admin/login?signedOut=1", request.url), 303);
  response.cookies.set(ADMIN_SESSION_COOKIE, "", { ...adminCookieOptions, maxAge: 0, expires: new Date(0) });
  return response;
}
