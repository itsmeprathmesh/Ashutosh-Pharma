import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  googleOAuthConfig,
  googleOAuthCookieName,
  googleHandoffCookieName,
  openGoogleOAuthTransaction,
  sealGoogleSessionHandoff,
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

function loginSuccess(request: NextRequest, handoff: string) {
  const nonce = request.headers.get("x-nonce") ?? randomBytes(18).toString("base64url");
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Completing sign in</title></head><body><main><h1>Completing sign in</h1><p>Continue to the admin panel.</p><form method="post" action="/api/admin/auth/google/complete"><button type="submit">Continue</button></form><script nonce="${nonce}">document.forms[0].requestSubmit();</script></main></body></html>`;
  const response = new NextResponse(html, { status: 200, headers: {
    "Content-Type": "text/html; charset=utf-8",
    "Content-Security-Policy": `default-src 'none'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'`,
    "Cache-Control": "no-store",
    "Referrer-Policy": "no-referrer",
    "X-Content-Type-Options": "nosniff",
  } });
  response.cookies.set(googleHandoffCookieName(), handoff, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/admin/auth/google/complete",
    maxAge: 90,
  });
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
    const handoff = await sealGoogleSessionHandoff(email, transaction.next);
    const response = loginSuccess(request, handoff);
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
