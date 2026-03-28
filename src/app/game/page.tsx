import Link from "next/link";
import { GameCard } from "@/components/home/GameCard";
import { formatPlays, getPublishedGames, getPublishedGameCategorySlugs, heuristicRating } from "@/lib/queries/games";

function capCategory(slug: string) {
  if (!slug) return "";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export default async function GamesIndexPage() {
  const [games, categories] = await Promise.all([getPublishedGames(120), getPublishedGameCategorySlugs()]);

  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto pb-12">
      <nav className="flex text-sm text-text-muted mb-6">
        <Link href="/" className="hover:text-text-primary transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-primary">Games</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Games</h1>
        <p className="text-text-secondary text-lg max-w-2xl">
          Browse AI-powered games on HeyWaii. Filter by category or open a title to play.
        </p>
      </div>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-10">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/game/category/${cat}`}
              className="px-4 py-2 rounded-xl bg-background-paper border border-white/10 text-sm text-text-secondary hover:border-primary/40 hover:text-primary transition-colors"
            >
              {capCategory(cat)}
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        {games.map((g) => (
          <GameCard
            key={g.id}
            slug={g.slug}
            title={g.title}
            category={capCategory(g.categorySlug)}
            description={g.shortDescription}
            plays={formatPlays(g.plays)}
            rating={heuristicRating(g.likes, g.plays)}
            image={g.coverImage}
          />
        ))}
      </div>

      {games.length === 0 && (
        <p className="text-text-muted text-center py-16">No published games yet. Check back soon.</p>
      )}
    </div>
  );
}
