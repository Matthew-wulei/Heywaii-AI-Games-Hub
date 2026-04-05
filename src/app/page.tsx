import {
  formatPlays,
  getPublishedGames,
  heuristicRating,
} from "@/lib/queries/games";
import { getPlatformStats } from "@/lib/queries/stats";
import { HomeClient, type HomeGameCard } from "./home-client";

export default async function Home() {
  const [games, stats] = await Promise.all([
    getPublishedGames(24),
    getPlatformStats(),
  ]);

  const cards: HomeGameCard[] = games.map((g) => ({
    id: g.id,
    slug: g.slug,
    title: g.title,
    category: g.categorySlug,
    description: g.shortDescription,
    plays: formatPlays(g.plays),
    rating: heuristicRating(g.likes, g.plays),
    image: g.coverImage,
    url: g.url,
  }));

  return <HomeClient games={cards} stats={stats} />;
}
