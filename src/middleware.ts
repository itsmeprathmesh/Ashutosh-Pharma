import { NextRequest, NextResponse } from "next/server";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/admin-auth";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const hasSession = await verifyAdminSession(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);

  if (path === "/admin/login") {
    if (hasSession) return NextResponse.redirect(new URL("/admin", request.url));
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "no-store");
    return response;
  }

  if (hasSession) {
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) {
      const origin = request.headers.get("origin");
      if (!origin || origin !== request.nextUrl.origin) {
        return new NextResponse("Cross-origin admin request blocked", { status: 403 });
      }
    }
    const response = NextResponse.next();
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  }

  if (path.startsWith("/api/admin/")) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const login = new URL("/admin/login", request.url);
  login.searchParams.set("next", `${path}${request.nextUrl.search}`);
  const response = NextResponse.redirect(login, request.method === "GET" || request.method === "HEAD" ? 307 : 303);
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
