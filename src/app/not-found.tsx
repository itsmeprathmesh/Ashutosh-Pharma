import Link from "next/link";

export default function NotFound() {
  return <main id="main-content" className="content-section"><div className="container empty-state"><h1>Page not found</h1><p>The page may have moved or the address may be incorrect.</p><Link className="button" href="/">Return home</Link></div></main>;
}
