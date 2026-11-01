"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, UserRound, KeyRound } from "lucide-react";

export function AdminLoginForm({ nextPath, signedOut }: { nextPath: string; signedOut: boolean }) {
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
