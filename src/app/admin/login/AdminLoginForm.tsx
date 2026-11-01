"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, UserRound, KeyRound } from "lucide-react";

export function AdminLoginForm({ nextPath, signedOut, googleEnabled, googleError }: { nextPath: string; signedOut: boolean; googleEnabled: boolean; googleError: boolean }) {
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [email, setEmail] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    const values = new FormData(event.currentTarget);
    try {
      const response = await fetch(challengeId ? "/api/admin/auth/verify" : "/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(challengeId ? { challengeId, code: values.get("code"), next: nextPath } : { email: values.get("email"), password: values.get("password"), next: nextPath }),
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; challengeId?: string; next?: string; error?: string } | null;
      if (!response.ok || !result?.ok) {
        setError(result?.error ?? "Invalid details");
        setPending(false);
        return;
      }
      if (!challengeId && result.challengeId) { setEmail(String(values.get("email"))); setChallengeId(result.challengeId); setPending(false); return; }
      window.location.assign(result.next ?? "/admin");
    } catch {
      setError("Invalid details");
      setPending(false);
    }
  }

  return <>
    {signedOut && <p className="admin-login-notice" role="status">You have been signed out.</p>}
    {googleError && <p className="admin-login-error" role="alert">Google sign-in failed or this account is not authorized.</p>}
    {googleEnabled && !challengeId && <>
      <a className="admin-google-button" href={`/api/admin/auth/google/start?next=${encodeURIComponent(nextPath)}`}>
        <svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.9 6-15z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.7-5.1c-1.8 1.2-4.1 2-6.8 2-5.2 0-9.7-3.5-11.3-8.2H5.8v5.2A20 20 0 0 0 24 44z"/><path fill="#FBBC05" d="M12.7 27.9a12 12 0 0 1 0-7.8v-5.2H5.8a20 20 0 0 0 0 18.2z"/><path fill="#EA4335" d="M24 11.9c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 5.7 29.5 4 24 4A20 20 0 0 0 5.8 14.9l6.9 5.2c1.6-4.7 6.1-8.2 11.3-8.2z"/></svg>
        <span>Continue with Google</span>
      </a>
      <div className="admin-login-divider" aria-hidden="true"><span>or continue with email</span></div>
    </>}
    <form className="admin-login-form" onSubmit={submit}>
      {challengeId ? <>
      <p>Enter the 6-digit code sent to {email}.</p>
      <label htmlFor="admin-code">Email code</label>
      <div className="admin-login-input-wrap"><KeyRound size={18} aria-hidden="true"/><input id="admin-code" name="code" type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus/></div>
      </> : <>
      <label htmlFor="admin-email">Email</label>
      <div className="admin-login-input-wrap">
        <UserRound size={18} aria-hidden="true"/>
        <input id="admin-email" name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={320} autoFocus/>
      </div>
      <label htmlFor="admin-password">Password</label>
      <div className="admin-login-input-wrap">
        <LockKeyhole size={18} aria-hidden="true"/>
        <input id="admin-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required maxLength={1024}/>
        <button className="admin-password-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>
          {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
        </button>
      </div>
      </>}
      {error && <p className="admin-login-error" role="alert">{error}</p>}
      <button className="admin-login-submit" type="submit" disabled={pending}>
        {pending ? (challengeId ? "Verifying…" : "Sending code…") : (challengeId ? "Verify code" : "Continue securely")}
        {!pending && <span aria-hidden="true">→</span>}
      </button>
      <p className="admin-login-help">Access is limited to authorized Ashutosh Pharma team members.</p>
    </form>
  </>;
}
