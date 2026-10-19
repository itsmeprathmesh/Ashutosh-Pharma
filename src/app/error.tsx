"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main id="main-content" className="content-section"><div className="container empty-state"><h1>We could not load this page</h1><p>Please try again. If the issue continues, contact our trade team.</p><button className="button" onClick={reset}>Try again</button> <Link className="text-link" href="/contact">Contact us</Link></div></main>;
}
