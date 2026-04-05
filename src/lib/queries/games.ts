import { prisma } from "@/lib/prisma";
import { ContentStatus } from "@prisma/client";

export async function getPublishedGames(take = 24, searchQuery?: string) {
  const where: { status: ContentStatus; title?: { contains: string } } = {
    status: ContentStatus.PUBLISHED,
  };
  const trimmed = searchQuery?.trim();
  if (trimmed) where.title = { contains: trimmed };

  return prisma.game.findMany({
    where,
    orderBy: { updatedAt: "desc" },
    take,
    select: {
      id: true,
      slug: true,
      title: true,
      url: true,
      shortDescription: true,
      coverImage: true,
      categorySlug: true,
      plays: true,
      likes: true,
    }
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
    select: {
      id: true,
      slug: true,
      title: true,
      url: true,
      shortDescription: true,
      coverImage: true,
      categorySlug: true,
      plays: true,
      likes: true,
    }
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
  const rows = await prisma.game.groupBy({
    by: ['categorySlug'],
    where: { status: ContentStatus.PUBLISHED },
    orderBy: { categorySlug: "asc" },
  });
  return rows.map((r) => r.categorySlug);
}
