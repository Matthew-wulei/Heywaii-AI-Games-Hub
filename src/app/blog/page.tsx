import Link from "next/link";
import { Calendar, User, ArrowRight } from "lucide-react";
import { getPublishedArticles } from "@/lib/queries/content";

export default async function BlogPage() {
  const posts = await getPublishedArticles(24);

  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto pb-12">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">HeyWaii Blog</h1>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto md:mx-0">
          Insights, tutorials, and news about AI game development and the future of interactive storytelling.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {posts.map((post) => {
          const plain = post.content.replace(/^#+\s.*/gm, "").trim();
          const excerpt = plain.length > 180 ? `${plain.slice(0, 180)}…` : plain;
          const dateStr = post.publishedAt
            ? post.publishedAt.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })
            : "";
          const image =
            post.coverImage ||
            "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=800&auto=format&fit=crop";

          return (
            <article
              key={post.id}
              className="group bg-background-paper rounded-2xl border border-white/5 overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-lg"
            >
              <Link href={`/blog/${post.slug}`}>
                <div className="relative aspect-video overflow-hidden bg-background-elevated">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {post.category && (
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-medium rounded-full border border-white/10">
                        {post.category}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-center gap-4 text-xs text-text-muted mb-3">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" /> {dateStr}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" /> HeyWaii
                    </span>
                  </div>

                  <h2 className="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {post.title}
                  </h2>

                  <p className="text-text-secondary text-sm mb-6 line-clamp-3">{excerpt}</p>

                  <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    Read Article <ArrowRight className="w-4 h-4 ml-1" />
                  </div>
                </div>
              </Link>
            </article>
          );
        })}
      </div>

      {posts.length === 0 && (
        <p className="text-text-muted text-center py-16">No articles published yet.</p>
      )}
    </div>
  );
}
