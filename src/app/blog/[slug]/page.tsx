import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Calendar } from "lucide-react";
import { getArticleBySlug } from "@/lib/queries/content";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getArticleBySlug(slug);
  if (!post) return { title: "Article Not Found | HeyWaii Gameshub" };
  const site = "HeyWaii Gameshub";
  const desc = post.content.slice(0, 160).replace(/\s+/g, " ");
  return {
    title: `${post.title} | ${site}`,
    description: desc,
    openGraph: {
      title: `${post.title} | ${site}`,
      description: desc,
      images: post.coverImage ? [post.coverImage] : undefined,
      type: "article",
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params;
  const post = await getArticleBySlug(slug);
  if (!post) notFound();

  const dateStr = post.publishedAt
    ? post.publishedAt.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <div className="flex flex-col w-full max-w-[800px] mx-auto pb-12">
      <nav className="flex text-sm text-text-muted mb-6">
        <Link href="/" className="hover:text-text-primary transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/blog" className="hover:text-text-primary transition-colors">
          Blog
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-primary line-clamp-1">{post.title}</span>
      </nav>

      <header className="mb-8">
        {post.category && (
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-primary mb-3">
            {post.category}
          </span>
        )}
        <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{post.title}</h1>
        <div className="flex items-center gap-2 text-sm text-text-muted">
          <Calendar className="w-4 h-4" />
          {dateStr}
        </div>
      </header>

      {post.coverImage && (
        <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/5 mb-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={post.coverImage} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <article className="prose prose-invert max-w-none">
        <div className="text-text-secondary whitespace-pre-wrap leading-relaxed text-base md:text-lg">
          {post.content}
        </div>
      </article>
    </div>
  );
}
