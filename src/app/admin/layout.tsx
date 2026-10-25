import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <>
    <div className="admin-session-toolbar">
      <span><i aria-hidden="true"/> Secure admin workspace</span>
      <form action="/api/auth/logout" method="post">
        <button type="submit">Sign out</button>
      </form>
    </div>
    {children}
  </>;
}
