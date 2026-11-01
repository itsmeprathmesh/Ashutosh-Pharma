import { NextResponse, type NextRequest } from "next/server";
import {
  GOOGLE_OAUTH_TTL_SECONDS,
  googleOAuthCookieName,
  googleOAuthConfig,
  googlePkceChallenge,
  newGoogleOAuthTransaction,
  safeAdminNext,
  sealGoogleOAuthTransaction,
} from "@/lib/google-admin-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const config = googleOAuthConfig();
  if (!config || (process.env.SESSION_SECRET?.length ?? 0) < 32) {
    return NextResponse.redirect(new URL("/admin/login?google=unavailable", request.url));
  }

  const callbackOrigin = new URL(config.redirectUri).origin;
  if (request.nextUrl.origin !== callbackOrigin) {
    const canonicalStart = new URL("/api/admin/auth/google/start", callbackOrigin);
    const next = request.nextUrl.searchParams.get("next");
    if (next) canonicalStart.searchParams.set("next", safeAdminNext(next));
    return NextResponse.redirect(canonicalStart);
  }

  const transaction = newGoogleOAuthTransaction(request.nextUrl.searchParams.get("next") ?? undefined);
  const signedTransaction = await sealGoogleOAuthTransaction(transaction);
  const authorization = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorization.search = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid email",
    state: transaction.state,
    nonce: transaction.nonce,
    code_challenge: googlePkceChallenge(transaction.verifier),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();

  const response = NextResponse.redirect(authorization);
  response.cookies.set(googleOAuthCookieName(), signedTransaction, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: GOOGLE_OAUTH_TTL_SECONDS,
  });
  response.headers.set("Cache-Control", "no-store");
  return response;
}
