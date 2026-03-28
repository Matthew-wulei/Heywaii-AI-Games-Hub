import { prisma } from "@/lib/prisma";
import { ContentStatus } from "@prisma/client";

export async function getPublishedGames(take = 24) {
  return prisma.game.findMany({
    where: { status: ContentStatus.PUBLISHED },
    orderBy: { updatedAt: "desc" },
    take,
    include: { tags: { include: { tag: true } } },
  });
}

export async function getGamesByCategory(categorySlug: string, take = 48) {
  return prisma.game.findMany({
    where: {
      status: ContentStatus.PUBLISHED,
      categorySlug,
    },
    orderBy: { plays: "desc" },
    take,
    include: { tags: { include: { tag: true } } },
  });
}

export async function getGameBySlug(slug: string) {
  return prisma.game.findFirst({
    where: { slug, status: ContentStatus.PUBLISHED },
    include: {
      tags: { include: { tag: true } },
      author: { select: { name: true, email: true } },
    },
  });
}

export function formatPlays(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export function heuristicRating(likes: number, plays: number): number {
  if (plays <= 0) return 4.5;
  const r = 4 + Math.min(1, likes / Math.max(plays, 1) * 5);
  return Math.round(r * 10) / 10;
}

export async function getPublishedGameCategorySlugs() {
  const rows = await prisma.game.findMany({
    where: { status: ContentStatus.PUBLISHED },
    select: { categorySlug: true },
    distinct: ["categorySlug"],
    orderBy: { categorySlug: "asc" },
  });
  return rows.map((r) => r.categorySlug);
}
