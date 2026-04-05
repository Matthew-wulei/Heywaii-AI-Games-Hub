import { notFound } from "next/navigation";
import { getGameBySlug, formatPlays, heuristicRating } from "@/lib/queries/games";
import { getCharacterBySlug } from "@/lib/queries/content";
import { PlayChatClient } from "./play-chat-client";

export default async function PlayPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  // 并行查询 Game 和 Character，两者都找不到才 404
  const [game, character] = await Promise.all([
    getGameBySlug(slug),
    getCharacterBySlug(slug),
  ]);

  if (!game && !character) notFound();

  // 用 Character 数据补充或替代 Game 数据
  const gameTitle = game?.title ?? character?.name ?? slug;
  const coverImage =
    game?.coverImage ??
    character?.avatar ??
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop";
  const categorySlug = game?.categorySlug ?? character?.categorySlug ?? "character";
  const playsLabel = game ? formatPlays(game.plays) : "0";
  const rating = game ? heuristicRating(game.likes, game.plays) : 4.5;
  const creatorName =
    game?.author?.name ??
    game?.author?.email ??
    character?.creatorName ??
    character?.author?.name ??
    "HeyWaii community";

  return (
    <PlayChatClient
      slug={slug}
      gameTitle={gameTitle}
      coverImage={coverImage}
      categorySlug={categorySlug}
      playsLabel={playsLabel}
      rating={rating}
      creatorName={creatorName}
      character={character}
    />
  );
}
