import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from "@/lib/auth-session";

export async function requireAdmin(redirectToLogin = false): Promise<string | null> {
  const session = await verifyAdminSession((await cookies()).get(ADMIN_SESSION_COOKIE)?.value);
  if (!session && redirectToLogin) redirect("/admin/login");
  return session;
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  try { return Boolean(origin && new URL(origin).origin === new URL(request.url).origin); } catch { return false; }
}
