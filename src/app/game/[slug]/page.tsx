import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Play, Star, Share2, Heart, MessageSquare } from "lucide-react";
import Link from "next/link";
import {
  formatPlays,
  getGameBySlug,
  heuristicRating,
} from "@/lib/queries/games";

function capCategory(slug: string) {
  if (!slug) return "";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) {
    return { title: "Game Not Found | HeyWaii Gameshub" };
  }
  const site = "HeyWaii Gameshub";
  return {
    title: `${game.title} | ${site}`,
    description: game.shortDescription,
    openGraph: {
      title: `${game.title} | ${site}`,
      description: game.shortDescription,
      images: [game.coverImage],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${game.title} | ${site}`,
      description: game.shortDescription,
      images: [game.coverImage],
    },
  };
}

export default async function GameDetailPage({ params }: Props) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) notFound();

  const categoryLabel = capCategory(game.categorySlug);
  const authorName = game.author?.name ?? game.author?.email ?? "HeyWaii";
  const tagNames = game.tags.map((t) => t.tag.name);
  const rating = heuristicRating(game.likes, game.plays);
  const updatedAt = game.updatedAt.toISOString().slice(0, 10);

  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto pb-12">
      <nav className="flex text-sm text-text-muted mb-6 flex-wrap gap-y-1">
        <Link href="/" className="hover:text-text-primary transition-colors">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/game" className="hover:text-text-primary transition-colors">Games</Link>
        <span className="mx-2">/</span>
        <Link
          href={`/game/category/${game.categorySlug}`}
          className="hover:text-text-primary transition-colors"
        >
          {categoryLabel}
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-primary">{game.title}</span>
      </nav>

      <div className="relative w-full rounded-3xl overflow-hidden aspect-[21/9] md:aspect-[3/1] bg-background-elevated border border-white/5 mb-8">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${game.coverImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent md:bg-gradient-to-r md:from-background md:via-background/90 md:to-transparent" />

        <div className="absolute inset-0 flex flex-col md:flex-row items-end md:items-center p-6 md:p-10 gap-8">
          <div className="hidden md:block w-48 aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex-shrink-0 z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={game.coverImage} alt={game.title} className="w-full h-full object-cover" />
          </div>

          <div className="flex-1 z-10 w-full">
            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">{game.title}</h1>
            <p className="text-text-secondary text-sm md:text-base mb-6 max-w-2xl line-clamp-2">
              {game.shortDescription}
            </p>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <span className="px-3 py-1 text-xs font-medium rounded-md bg-white/10 text-white">
                {categoryLabel}
              </span>
              <div className="flex items-center gap-1.5 text-status-warning text-sm font-medium">
                <Star className="w-4 h-4 fill-status-warning" />
                {rating}
              </div>
              <div className="text-sm text-text-muted">
                Created by <span className="text-primary">{authorName}</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {game.url ? (
                <a
                  href={game.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative inline-flex items-center justify-center px-8 py-3.5 text-base font-medium text-white rounded-full bg-gradient-primary hover:opacity-90 transition-all duration-200 hover:shadow-[0_0_15px_rgba(236,72,153,0.5)] active:scale-95 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Play className="w-5 h-5 fill-white" />
                    Play Game
                  </span>
                </a>
              ) : (
                <Link
                  href={`/play/${game.slug}`}
                  className="relative inline-flex items-center justify-center px-8 py-3.5 text-base font-medium text-white rounded-full bg-gradient-primary hover:opacity-90 transition-all duration-200 hover:shadow-[0_0_15px_rgba(236,72,153,0.5)] active:scale-95 overflow-hidden"
                >
                  <span className="relative z-10 flex items-center gap-2">
                    <Play className="w-5 h-5 fill-white" />
                    Play AI Character
                  </span>
                </Link>
              )}

              <button
                type="button"
                className="p-3.5 rounded-full bg-white/5 border border-white/10 text-text-secondary hover:text-white hover:bg-white/10 transition-colors"
              >
                <Heart className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-3.5 rounded-full bg-white/5 border border-white/10 text-text-secondary hover:text-white hover:bg-white/10 transition-colors"
              >
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-background-paper rounded-2xl p-6 border border-white/5">
            <h2 className="text-xl font-bold text-white mb-4">About this game</h2>
            <div className="text-text-secondary leading-relaxed space-y-4">
              <p>{game.fullDescription}</p>
            </div>
          </section>

          <section className="bg-background-paper rounded-2xl p-6 border border-white/5">
            <h2 className="text-xl font-bold text-white mb-4">Tags</h2>
            <div className="flex flex-wrap gap-2">
              {tagNames.length === 0 ? (
                <span className="text-text-muted text-sm">No tags</span>
              ) : (
                tagNames.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 text-sm rounded-lg bg-background-elevated text-text-secondary border border-white/5"
                  >
                    {tag}
                  </span>
                ))
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="bg-background-paper rounded-2xl p-6 border border-white/5">
            <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-text-muted flex items-center gap-2">
                  <Play className="w-4 h-4" /> Total Plays
                </span>
                <span className="text-white font-medium">{formatPlays(game.plays)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted flex items-center gap-2">
                  <Heart className="w-4 h-4" /> Likes
                </span>
                <span className="text-white font-medium">{formatPlays(game.likes)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-text-muted flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Comments
                </span>
                <span className="text-white font-medium">—</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-white/5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-muted">Last Updated</span>
                <span className="text-text-secondary">{updatedAt}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-3">
                <span className="text-text-muted">Status</span>
                <span className="text-status-success capitalize">{game.status.toLowerCase()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "VideoGame",
            name: game.title,
            description: game.shortDescription,
            image: game.coverImage,
            genre: categoryLabel,
            author: { "@type": "Person", name: authorName },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: rating,
              ratingCount: Math.max(1, game.likes),
            },
          }),
        }}
      />
    </div>
  );
}
