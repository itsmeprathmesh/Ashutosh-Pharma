import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { safeDatabaseQuery } from "@/lib/db-safe";
type Props={params:Promise<{slug:string}>};
export const dynamic="force-dynamic";
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const post=await safeDatabaseQuery(()=>db.blogPost.findUnique({where:{slug}}),null);return post?.published?{title:post.title,description:post.excerpt,alternates:{canonical:`/blog/${post.slug}`},openGraph:{title:post.title,description:post.excerpt,type:"article"}}:{};}
export default async function BlogPost({params}:Props){const {slug}=await params;const post=await safeDatabaseQuery(()=>db.blogPost.findUnique({where:{slug}}),null);if(!post||!post.published)notFound();const share=`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_SITE_URL??""}/blog/${post.slug}`)}`;return <main id="main-content"><section className="page-hero"><div className="container"><span className="eyebrow">{post.category} · {new Intl.DateTimeFormat("en",{dateStyle:"long"}).format(post.createdAt)}</span><h1>{post.title}</h1><p>{post.excerpt}</p></div></section><article className="content-section"><div className="container prose-block blog-article">{post.content.split(/\n\n+/).map((paragraph,i)=><p key={i}>{paragraph}</p>)}<p>Share this article: <a href={share} target="_blank" rel="noreferrer">LinkedIn</a> · <a href={`https://wa.me/?text=${encodeURIComponent(post.title)}`} target="_blank" rel="noreferrer">WhatsApp</a></p><Link className="text-link" href="/blog">← All insights</Link></div></article></main>;}
