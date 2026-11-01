import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ADMIN_SESSION_COOKIE, ADMIN_SESSION_SECONDS, adminCookieOptions, createAdminSession } from "@/lib/auth-session";
import {
  googleOAuthConfig,
  googleOAuthCookieName,
  openGoogleOAuthTransaction,
  secureStringEqual,
  verifyGoogleIdentity,
} from "@/lib/google-admin-auth";

export const runtime = "nodejs";

const tokenResponseSchema = z.object({ id_token: z.string().min(1).max(16_384) }).passthrough();

function loginFailure(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/admin/login?google=failed", request.url));
  response.cookies.set(googleOAuthCookieName(), "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0, expires: new Date(0) });
  response.headers.set("Cache-Control", "no-store");
  return response;
}

export async function GET(request: NextRequest) {
  const config = googleOAuthConfig();
  const cookie = request.cookies.get(googleOAuthCookieName())?.value;
  const state = request.nextUrl.searchParams.get("state") ?? "";
  const code = request.nextUrl.searchParams.get("code");
  if (!config || !cookie || !state || !code || request.nextUrl.searchParams.has("error")) return loginFailure(request);
  if (request.nextUrl.origin !== new URL(config.redirectUri).origin) return loginFailure(request);

  try {
    const transaction = await openGoogleOAuthTransaction(cookie);
    if (!secureStringEqual(state, transaction.state)) return loginFailure(request);

    const body = new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
      code_verifier: transaction.verifier,
    });
    const tokenResult = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });
    if (!tokenResult.ok) return loginFailure(request);
    const tokenPayload = tokenResponseSchema.safeParse(await tokenResult.json());
    if (!tokenPayload.success) return loginFailure(request);

    const email = await verifyGoogleIdentity(tokenPayload.data.id_token, config.clientId, transaction.nonce);
    const response = NextResponse.redirect(new URL(transaction.next, request.url));
    response.cookies.set(ADMIN_SESSION_COOKIE, await createAdminSession(email), {
      ...adminCookieOptions,
      expires: new Date(Date.now() + ADMIN_SESSION_SECONDS * 1000),
    });
    response.cookies.set(googleOAuthCookieName(), "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch {
    return loginFailure(request);
  }
}
