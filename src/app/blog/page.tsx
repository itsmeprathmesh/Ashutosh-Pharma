import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { safeDatabaseQuery } from "@/lib/db-safe";
import { getPublicBlogPosts } from "@/lib/public-data";

export const dynamic = "force-dynamic";
export const metadata = { title: "Trade journal", description: "Pharmaceutical procurement notes for importers and institutional buyers.", alternates: { canonical: "/blog" } };

export default async function BlogList() {
  const posts = await safeDatabaseQuery(() => getPublicBlogPosts(), []);
  return <main id="main-content"><section className="page-hero"><div className="container"><span className="eyebrow">Trade journal <span aria-hidden="true">/</span> Notes and updates</span><h1>Information for<br/><em>professional buyers.</em></h1><p>Updates and practical notes for pharmaceutical sourcing and procurement teams.</p></div></section><section className="content-section"><div className="container">{posts.length ? <div className="blog-grid">{posts.map((post, index)=><article className="blog-card" key={post.id}><Link href={`/blog/${post.slug}`} className="blog-type-art"><span className="mono-mark">{String(index + 1).padStart(2, "0")}</span><span>{post.category}</span></Link><div className="blog-card-copy"><span className="product-category">{post.category} · {new Intl.DateTimeFormat("en-IN",{dateStyle:"medium"}).format(post.createdAt)}</span><h2><Link href={`/blog/${post.slug}`}>{post.title}</Link></h2><p>{post.excerpt}</p><Link href={`/blog/${post.slug}`} className="text-link">Read article <ArrowRight size={15}/></Link></div></article>)}</div>:<div className="empty-state">There are no published articles at this time.</div>}</div></section></main>;
}
