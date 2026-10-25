import type { Metadata } from "next";
import Image from "next/image";
import { ShieldCheck, Boxes, ClipboardList, ChartNoAxesColumnIncreasing } from "lucide-react";
import { AdminLoginForm } from "./AdminLoginForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin sign in | Ashutosh Pharma",
  robots: { index: false, follow: false },
};

type LoginSearchParams = { next?: string | string[]; signedOut?: string | string[] };

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<LoginSearchParams> }) {
  const params = await searchParams;
  const nextPath = Array.isArray(params.next) ? params.next[0] : params.next;
  const signedOut = (Array.isArray(params.signedOut) ? params.signedOut[0] : params.signedOut) === "1";

  return <main className="admin-login-page">
    <div className="admin-login-orbit admin-login-orbit-one" aria-hidden="true"/>
    <div className="admin-login-orbit admin-login-orbit-two" aria-hidden="true"/>
    <section className="admin-login-card" aria-labelledby="admin-login-title">
      <div className="admin-login-panel">
        <div className="admin-login-brand">
          <Image src="/ashutosh-pharma-logo.png" alt="Ashutosh Pharma — Wholesale & Export" width={842} height={240} priority/>
        </div>
        <div className="admin-login-heading">
          <span className="admin-login-kicker"><ShieldCheck size={15} aria-hidden="true"/> Authorized access</span>
          <h1 id="admin-login-title">Welcome back</h1>
          <p>Sign in to manage trade enquiries and catalogue operations.</p>
        </div>
        <AdminLoginForm nextPath={nextPath ?? "/admin"} signedOut={signedOut}/>
        <div className="admin-login-privacy"><span className="admin-login-lock"><ShieldCheck size={16} aria-hidden="true"/></span><span>Your sign-in is protected with a secure session cookie.</span></div>
      </div>

      <aside className="admin-login-brand-panel" aria-label="Ashutosh Pharma administration workspace">
        <div className="admin-login-pattern" aria-hidden="true"/>
        <div className="admin-login-panel-content">
          <span className="admin-login-eyebrow">ASHUTOSH PHARMA · NAGPUR, INDIA</span>
          <div className="admin-login-symbol" aria-hidden="true"><span>A</span><i/></div>
          <p className="admin-login-panel-label">Operations workspace</p>
          <h2>One secure place for your trade operations.</h2>
          <p className="admin-login-panel-copy">Review enquiries, manage product information, and keep your B2B catalogue up to date.</p>
          <div className="admin-login-feature-list">
            <div><span><ClipboardList size={17}/></span><p><strong>Trade enquiries</strong><small>Review and follow up with buyers</small></p></div>
            <div><span><Boxes size={17}/></span><p><strong>Product catalogue</strong><small>Manage reviewed product listings</small></p></div>
            <div><span><ChartNoAxesColumnIncreasing size={17}/></span><p><strong>Business overview</strong><small>Keep daily operations organized</small></p></div>
          </div>
        </div>
        <div className="admin-login-panel-foot"><span>WHOLESALE & EXPORT</span><span>SECURE ADMIN</span></div>
      </aside>
    </section>
    <p className="admin-login-copyright">© {new Date().getFullYear()} Ashutosh Pharma. Authorized personnel only.</p>
  </main>;
}
