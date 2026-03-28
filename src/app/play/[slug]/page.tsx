import { notFound } from "next/navigation";
import { getGameBySlug, formatPlays, heuristicRating } from "@/lib/queries/games";
import { PlayChatClient } from "./play-chat-client";

export default async function PlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const game = await getGameBySlug(slug);
  if (!game) notFound();

  const playsLabel = formatPlays(game.plays);
  const rating = heuristicRating(game.likes, game.plays);
  const creatorName = game.author?.name ?? game.author?.email ?? "Unknown";

  return (
    <PlayChatClient
      slug={game.slug}
      gameTitle={game.title}
      coverImage={game.coverImage}
      categorySlug={game.categorySlug}
      playsLabel={playsLabel}
      rating={rating}
      creatorName={creatorName}
    />
  );
}
