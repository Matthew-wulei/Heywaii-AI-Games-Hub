import { prisma } from "@/lib/prisma";
import { ContentStatus } from "@prisma/client";

export async function getPublishedArticles(take = 12) {
  return prisma.article.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    take,
  });
}

export async function getArticleBySlug(slug: string) {
  return prisma.article.findFirst({
    where: { slug, publishedAt: { not: null } },
  });
}

export async function getPublishedAnnouncements(take = 20) {
  return prisma.announcement.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    take,
  });
}

export async function getAnnouncementById(id: string) {
  return prisma.announcement.findFirst({
    where: { id, publishedAt: { not: null } },
  });
}

export async function getPublishedCharacters(take = 48) {
  return prisma.character.findMany({
    where: { status: ContentStatus.PUBLISHED },
    orderBy: { updatedAt: "desc" },
    take,
  });
}

export async function getCharactersByCategory(categorySlug: string, take = 48) {
  return prisma.character.findMany({
    where: { status: ContentStatus.PUBLISHED, categorySlug },
    orderBy: { updatedAt: "desc" },
    take,
  });
}

export async function getCharacterBySlug(slug: string) {
  return prisma.character.findFirst({
    where: { slug, status: ContentStatus.PUBLISHED },
    include: { author: { select: { name: true } } },
  });
}

export async function getPublishedCharacterCategorySlugs() {
  const rows = await prisma.character.findMany({
    where: { status: ContentStatus.PUBLISHED },
    select: { categorySlug: true },
    distinct: ["categorySlug"],
    orderBy: { categorySlug: "asc" },
  });
  return rows.map((r) => r.categorySlug);
}
