import Link from "next/link";
import { Calendar, User, ArrowRight } from "lucide-react";

const MOCK_BLOGS = Array.from({ length: 6 }).map((_, i) => ({
  id: `blog-${i}`,
  slug: `blog-post-${i}`,
  title: `How to Create Compelling AI Characters - Part ${i + 1}`,
  excerpt: "Learn the secrets of prompting and persona design to make your AI characters truly come alive in your next text-based adventure game.",
  author: "HeyWaii Team",
  date: "Mar 24, 2026",
  category: "Tutorial",
  image: `https://images.unsplash.com/photo-${1550751827 + i}-4b4d4de81156?q=80&w=800&auto=format&fit=crop`
}));

export default function BlogPage() {
  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto pb-12">
      <div className="mb-10 text-center md:text-left">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">HeyWaii Blog</h1>
        <p className="text-text-secondary text-lg max-w-2xl mx-auto md:mx-0">
          Insights, tutorials, and news about AI game development and the future of interactive storytelling.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {MOCK_BLOGS.map((post) => (
          <article key={post.id} className="group bg-background-paper rounded-2xl border border-white/5 overflow-hidden hover:border-primary/50 transition-all duration-300 shadow-lg">
            <Link href={`/blog/${post.slug}`}>
              <div className="relative aspect-video overflow-hidden bg-background-elevated">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={post.image} 
                  alt={post.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 bg-black/60 backdrop-blur-md text-white text-xs font-medium rounded-full border border-white/10">
                    {post.category}
                  </span>
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex items-center gap-4 text-xs text-text-muted mb-3">
                  <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {post.date}</span>
                  <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> {post.author}</span>
                </div>
                
                <h2 className="text-xl font-bold text-white mb-3 group-hover:text-primary transition-colors line-clamp-2">
                  {post.title}
                </h2>
                
                <p className="text-text-secondary text-sm mb-6 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                  Read Article <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>
    </div>
  );
}