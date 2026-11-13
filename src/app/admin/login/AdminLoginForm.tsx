"use client";

export function AdminLoginForm({ nextPath, signedOut, googleEnabled, googleError }: { nextPath: string; signedOut: boolean; googleEnabled: boolean; googleError: boolean }) {
  return <div className="admin-google-login">
    {signedOut && <p className="admin-login-notice" role="status">You have been signed out.</p>}
    {googleError && <p className="admin-login-error" role="alert">Google sign-in failed or this account is not authorized.</p>}
    {googleEnabled ? <a className="admin-google-button" href={`/api/admin/auth/google/start?next=${encodeURIComponent(nextPath)}`}>
      <svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.9 6-15z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.7-5.1c-1.8 1.2-4.1 2-6.8 2-5.2 0-9.7-3.5-11.3-8.2H5.8v5.2A20 20 0 0 0 24 44z"/><path fill="#FBBC05" d="M12.7 27.9a12 12 0 0 1 0-7.8v-5.2H5.8a20 20 0 0 0 0 18.2z"/><path fill="#EA4335" d="M24 11.9c3 0 5.7 1 7.8 3.1l5.9-5.9C34.1 5.7 29.5 4 24 4A20 20 0 0 0 5.8 14.9l6.9 5.2c1.6-4.7 6.1-8.2 11.3-8.2z"/></svg>
      <span>Continue with Google</span>
    </a> : <p className="admin-login-error" role="status">Google admin sign-in is not configured. Add the Google OAuth settings to the deployment environment.</p>}
    <p className="admin-login-help">Use a Google account included in the authorized admin email list.</p>
  </div>;
}
