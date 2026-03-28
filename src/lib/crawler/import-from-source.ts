import { load } from "cheerio";
import { ContentSource, ContentStatus, type CrawlerSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { uniqueGameSlug } from "@/lib/slug";

export type CrawlerImportResult =
  | { ok: true; slug: string }
  | { ok: true; skipped: true; reason: string }
  | { ok: false; error: string; httpStatus?: number };

/** Lightweight category guess from title (no external AI). */
export function inferCategorySlugFromTitle(title: string): string {
  const t = title.toLowerCase();
  if (/\b(rpg|quest|dungeon|dragon|mage|sword)\b/.test(t)) return "rpg";
  if (/\b(sim|colony|city|tycoon|build|manage)\b/.test(t)) return "simulation";
  if (/\b(puzzle|logic|brain|match)\b/.test(t)) return "puzzle";
  if (/\b(romance|visual novel|vn|dating)\b/.test(t)) return "visual-novel";
  if (/\b(action|shooter|fight|combat)\b/.test(t)) return "action";
  return "imported";
}

export async function importGameFromCrawlerSource(source: CrawlerSource): Promise<CrawlerImportResult> {
  const dup = await prisma.game.findFirst({
    where: { sourceUrl: source.entryUrl },
  });
  if (dup) {
    return { ok: true, skipped: true, reason: "duplicate_source_url" };
  }

  const res = await fetch(source.entryUrl, {
    headers: { "User-Agent": "HeyWaiiCrawler/1.0" },
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) {
    return { ok: false, error: `Fetch failed: ${res.status}`, httpStatus: 502 };
  }
  const html = await res.text();
  const $ = load(html);
  let title =
    (source.itemSelector ? $(source.itemSelector).first().text().trim() : "") ||
    $("h1").first().text().trim() ||
    $("title").first().text().trim() ||
    "Imported game";
  title = title.replace(/\s+/g, " ").slice(0, 200);

  const categorySlug = inferCategorySlugFromTitle(title);
  const slug = await uniqueGameSlug(title);

  await prisma.game.create({
    data: {
      title,
      slug,
      url: source.entryUrl,
      shortDescription: title.slice(0, 150),
      fullDescription: `Automatically imported from ${source.entryUrl}`,
      coverImage:
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
      categorySlug,
      status: ContentStatus.PENDING,
      source: ContentSource.CRAWLER,
      sourceUrl: source.entryUrl,
    },
  });

  return { ok: true, slug };
}

export async function importAllCrawlerSources(): Promise<{ sourceId: string; result: CrawlerImportResult }[]> {
  const sources = await prisma.crawlerSource.findMany({ orderBy: { createdAt: "asc" } });
  const out: { sourceId: string; result: CrawlerImportResult }[] = [];
  for (const s of sources) {
    const result = await importGameFromCrawlerSource(s);
    out.push({ sourceId: s.id, result });
  }
  return out;
}
