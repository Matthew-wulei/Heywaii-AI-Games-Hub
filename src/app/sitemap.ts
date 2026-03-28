import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { ContentStatus } from "@prisma/client";

const staticFallback = (baseUrl: string): MetadataRoute.Sitemap => [
  { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
  { url: `${baseUrl}/game`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
  { url: `${baseUrl}/character`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
  { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
  { url: `${baseUrl}/announcements`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.65 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://heywaii.com";

  let games: { slug: string; updatedAt: Date; categorySlug: string }[];
  let characters: { slug: string; updatedAt: Date; categorySlug: string }[];
  let articles: { slug: string; updatedAt: Date }[];
  let announcements: { id: string; updatedAt: Date }[];
  let gameCats: { categorySlug: string }[];
  let charCats: { categorySlug: string }[];

  try {
    [games, characters, articles, announcements, gameCats, charCats] = await Promise.all([
    prisma.game.findMany({
      where: { status: ContentStatus.PUBLISHED },
      select: { slug: true, updatedAt: true, categorySlug: true },
    }),
    prisma.character.findMany({
      where: { status: ContentStatus.PUBLISHED },
      select: { slug: true, updatedAt: true, categorySlug: true },
    }),
    prisma.article.findMany({
      where: { publishedAt: { not: null } },
      select: { slug: true, updatedAt: true },
    }),
    prisma.announcement.findMany({
      where: { publishedAt: { not: null } },
      select: { id: true, updatedAt: true },
    }),
    prisma.game.findMany({
      where: { status: ContentStatus.PUBLISHED },
      select: { categorySlug: true },
      distinct: ["categorySlug"],
    }),
    prisma.character.findMany({
      where: { status: ContentStatus.PUBLISHED },
      select: { categorySlug: true },
      distinct: ["categorySlug"],
    }),
    ]);
  } catch {
    return staticFallback(baseUrl);
  }

  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/game`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/character`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.85 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.7 },
    { url: `${baseUrl}/announcements`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.65 },
  ];

  const gameCategoryUrls = gameCats.map((c) => ({
    url: `${baseUrl}/game/category/${c.categorySlug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  const charCategoryUrls = charCats.map((c) => ({
    url: `${baseUrl}/character/category/${c.categorySlug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.72,
  }));

  const gameUrls = games.map((g) => ({
    url: `${baseUrl}/game/${g.slug}`,
    lastModified: g.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const playUrls = games.map((g) => ({
    url: `${baseUrl}/play/${g.slug}`,
    lastModified: g.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const characterUrls = characters.map((ch) => ({
    url: `${baseUrl}/character/${ch.slug}`,
    lastModified: ch.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.65,
  }));

  const blogUrls = articles.map((a) => ({
    url: `${baseUrl}/blog/${a.slug}`,
    lastModified: a.updatedAt,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const announcementUrls = announcements.map((a) => ({
    url: `${baseUrl}/announcements/${a.id}`,
    lastModified: a.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.55,
  }));

  return [
    ...staticEntries,
    ...gameCategoryUrls,
    ...charCategoryUrls,
    ...gameUrls,
    ...playUrls,
    ...characterUrls,
    ...blogUrls,
    ...announcementUrls,
  ];
}
