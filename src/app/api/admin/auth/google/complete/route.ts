import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_SECONDS,
  adminCookieOptionsForHost,
  createAdminSession,
} from "@/lib/auth-session";
import { sameOrigin } from "@/lib/auth";
import { googleHandoffCookieName, openGoogleSessionHandoff } from "@/lib/google-admin-auth";

export const runtime = "nodejs";

function clearHandoff(response: NextResponse) {
  response.cookies.set(googleHandoffCookieName(), "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/admin/auth/google/complete",
    maxAge: 0,
    expires: new Date(0),
  });
}

function failed(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/admin/login?google=failed", request.url), 303);
  clearHandoff(response);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function POST(request: NextRequest) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Request rejected." }, { status: 403 });
  const handoffToken = request.cookies.get(googleHandoffCookieName())?.value;
  if (!handoffToken) return failed(request);

  try {
    const handoff = await openGoogleSessionHandoff(handoffToken);
    const response = NextResponse.redirect(new URL(handoff.next, request.url), 303);
    clearHandoff(response);

    const cookieOptions = adminCookieOptionsForHost(request.nextUrl.hostname);
    if (cookieOptions.domain) response.cookies.set(ADMIN_SESSION_COOKIE, "", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    response.cookies.set(ADMIN_SESSION_COOKIE, await createAdminSession(handoff.email), {
      ...cookieOptions,
      expires: new Date(Date.now() + ADMIN_SESSION_SECONDS * 1000),
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return failed(request);
  }
}
