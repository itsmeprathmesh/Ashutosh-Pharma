import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth-session";

export async function proxy(request: NextRequest) {
  const nonceBytes = crypto.getRandomValues(new Uint8Array(18));
  const nonce = btoa(String.fromCharCode(...nonceBytes));
  const development = process.env.NODE_ENV !== "production";
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://*.public.blob.vercel-storage.com https://5.imimg.com https://*.google-analytics.com",
    "font-src 'self' data:",
    `connect-src 'self' https://*.public.blob.vercel-storage.com https://*.private.blob.vercel-storage.com https://*.google-analytics.com https://www.googletagmanager.com https://vitals.vercel-insights.com${development ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self' https://wa.me",
    "frame-ancestors 'none'",
    ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
  ].join("; ");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", csp);
  requestHeaders.set("x-nonce", nonce);
  const secure = (response: NextResponse) => {
    response.headers.set("Content-Security-Policy", csp);
    return response;
  };
  const next = () => secure(NextResponse.next({ request: { headers: requestHeaders } }));
  const { pathname, origin, search } = request.nextUrl;
  const adminPath = pathname === "/admin" || pathname.startsWith("/admin/") || pathname === "/api/admin" || pathname.startsWith("/api/admin/");
  const api = pathname === "/api/admin" || pathname.startsWith("/api/admin/");
  const openAuth = pathname.startsWith("/api/admin/auth/");
  // Public requests receive the nonce and headers but never enter the admin auth flow.
  if (!adminPath) return next();
  // This one route validates its own narrowly scoped machine token.
  if (pathname === "/api/admin/import" && request.method === "POST") return next();
  if (adminPath && !['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    if (request.headers.get("origin") !== origin) return secure(NextResponse.json({ error: "Cross-origin request blocked." }, { status: 403 }));
  }
  if (pathname === "/admin/login" || openAuth) {
    if (pathname === "/admin/login" && await verifyAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)) return secure(NextResponse.redirect(new URL("/admin", request.url)));
    return next();
  }
  const email = await verifyAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (email) {
    const response = next();
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }
  if (api) return secure(NextResponse.json({ error: "Authentication required." }, { status: 401, headers: { "Cache-Control": "no-store" } }));
  const login = new URL("/admin/login", request.url);
  login.searchParams.set("next", `${pathname}${search}`);
  return secure(NextResponse.redirect(login));
}

export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"] };
