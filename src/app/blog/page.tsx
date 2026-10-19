import Link from "next/link";
import { db } from "@/lib/db";
import Image from "next/image";
import { safeDatabaseQuery } from "@/lib/db-safe";
export const dynamic = "force-dynamic";
export const metadata = { title: "Trade insights", description: "Original pharmaceutical procurement notes for importers and institutional buyers.", alternates: { canonical: "/blog" } };
export default async function BlogList() {
 const posts = await safeDatabaseQuery(() => db.blogPost.findMany({ where:{ published:true }, orderBy:{ createdAt:"desc" } }), []);
 return <main id="main-content"><section className="page-hero"><div className="container"><span className="eyebrow">Trade insights</span><h1>Notes for professional buyers</h1><p>Original updates for importers and institutional procurement teams.</p></div></section><section className="section"><div className="container">{posts.length ? <div className="blog-grid">{posts.map((post)=><article className="blog-card" key={post.id}><Link href={`/blog/${post.slug}`} className="blog-image"><Image src={post.imageUrl && /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i.test(post.imageUrl) ? post.imageUrl : "/blog-journal.svg"} alt="" fill sizes="(max-width:680px) 90vw, 33vw" unoptimized/></Link><span className="product-category">{post.category} · {new Intl.DateTimeFormat("en",{dateStyle:"medium"}).format(post.createdAt)}</span><h3><Link href={`/blog/${post.slug}`}>{post.title}</Link></h3><p>{post.excerpt}</p><Link href={`/blog/${post.slug}`} className="text-link">Read more ↗</Link></article>)}</div>:<div className="empty-state">No articles are published yet. TODO: add client-approved editorial content.</div>}</div></section></main>;
}
