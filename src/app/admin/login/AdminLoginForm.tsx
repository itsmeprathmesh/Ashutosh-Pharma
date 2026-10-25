"use client";

import { useState } from "react";
import { Eye, EyeOff, LockKeyhole, UserRound } from "lucide-react";

export function AdminLoginForm({ nextPath, signedOut }: { nextPath: string; signedOut: boolean }) {
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    const values = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: values.get("username"), password: values.get("password"), next: nextPath }),
      });
      const result = await response.json().catch(() => null) as { ok?: boolean; next?: string; error?: string } | null;
      if (!response.ok || !result?.ok) {
        setError(result?.error ?? "Sign-in could not be completed. Please try again.");
        setPending(false);
        return;
      }
      window.location.assign(result.next ?? "/admin");
    } catch {
      setError("We could not reach the sign-in service. Check your connection and retry.");
      setPending(false);
    }
  }

  return <>
    {signedOut && <p className="admin-login-notice" role="status">You have been signed out.</p>}
    <form className="admin-login-form" onSubmit={submit}>
      <label htmlFor="admin-username">Username</label>
      <div className="admin-login-input-wrap">
        <UserRound size={18} aria-hidden="true"/>
        <input id="admin-username" name="username" type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={256} autoFocus/>
      </div>
      <label htmlFor="admin-password">Password</label>
      <div className="admin-login-input-wrap">
        <LockKeyhole size={18} aria-hidden="true"/>
        <input id="admin-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required maxLength={1024}/>
        <button className="admin-password-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>
          {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
        </button>
      </div>
      {error && <p className="admin-login-error" role="alert">{error}</p>}
      <button className="admin-login-submit" type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in securely"}
        {!pending && <span aria-hidden="true">→</span>}
      </button>
      <p className="admin-login-help">Access is limited to authorized Ashutosh Pharma team members.</p>
    </form>
  </>;
}
