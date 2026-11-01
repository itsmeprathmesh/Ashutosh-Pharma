export const ADMIN_LOGIN_WINDOW_MS = 15 * 60_000;
export const ADMIN_LOGIN_MAX_FAILURES = 5;
export const ADMIN_CODE_TTL_MS = 10 * 60_000;

export function loginIsLocked(failuresInWindow: number) { return failuresInWindow >= ADMIN_LOGIN_MAX_FAILURES; }

export function adminCodeIsUsable(code: { used: boolean; attempts: number; expiresAt: Date }, now = new Date()) {
  return !code.used && code.attempts < ADMIN_LOGIN_MAX_FAILURES && code.expiresAt.getTime() > now.getTime();
}

export function sameLoginFailureMessage() { return "Invalid details"; }
