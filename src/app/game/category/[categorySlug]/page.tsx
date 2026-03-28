import Link from "next/link";
import { notFound } from "next/navigation";
import { GameCard } from "@/components/home/GameCard";
import {
  formatPlays,
  getGamesByCategory,
  getPublishedGameCategorySlugs,
  heuristicRating,
} from "@/lib/queries/games";

function capCategory(slug: string) {
  if (!slug) return "";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

type Props = { params: Promise<{ categorySlug: string }> };

export default async function GameCategoryPage({ params }: Props) {
  const { categorySlug } = await params;
  const normalized = categorySlug.toLowerCase();
  const valid = await getPublishedGameCategorySlugs();
  if (!valid.includes(normalized)) notFound();

  const games = await getGamesByCategory(normalized, 120);
  const label = capCategory(normalized);

  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto pb-12">
      <nav className="flex text-sm text-text-muted mb-6 flex-wrap gap-y-1">
        <Link href="/" className="hover:text-text-primary transition-colors">
          Home
        </Link>
        <span className="mx-2">/</span>
        <Link href="/game" className="hover:text-text-primary transition-colors">
          Games
        </Link>
        <span className="mx-2">/</span>
        <span className="text-text-primary">{label}</span>
      </nav>

      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">{label} games</h1>
        <p className="text-text-secondary text-lg max-w-2xl">
          Titles tagged with this category.{" "}
          <Link href="/game" className="text-primary hover:underline">
            All games
          </Link>
        </p>
      </div>

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
        <p className="text-text-muted text-center py-16">No games in this category yet.</p>
      )}
    </div>
  );
}
