/**
 * HeyWaii Crawler — Orchestrator
 *
 * Runs all scrapers, deduplicates against the database, normalises
 * RawGame → Prisma Game and upserts records.
 *
 * Usage (called from API routes / cron):
 *   import { runAllScrapers } from "@/lib/crawler/orchestrator";
 *   const summary = await runAllScrapers();
 */

import { prisma } from "@/lib/prisma";
import { uniqueGameSlug } from "@/lib/slug";
import { ContentStatus, ContentSource } from "@prisma/client";
import { ALL_SCRAPERS } from "./scrapers";
import type { RawGame } from "./types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OrchestratorSummary {
  ranAt: string;
  scrapers: {
    name: string;
    fetched: number;
    inserted: number;
    skipped: number;
    errors: string[];
  }[];
  totalInserted: number;
  totalSkipped: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Normalise a tag string: lowercase, trim, max 50 chars, no duplicates. */
function normaliseTags(raw: string[]): string[] {
  const seen = new Set<string>();
  return raw
    .map((t) => t.toLowerCase().trim().slice(0, 50))
    .filter((t) => t.length > 1 && !seen.has(t) && seen.add(t));
}

/** Upsert a Tag row and return its id. */
async function upsertTag(name: string): Promise<string> {
  const tag = await prisma.tag.upsert({
    where: { name },
    update: {},
    create: { name },
  });
  return tag.id;
}

// ---------------------------------------------------------------------------
// Core: persist a single RawGame
// ---------------------------------------------------------------------------

interface PersistResult {
  inserted: boolean;
  skipped: boolean;
  reason?: string;
}

async function persistGame(raw: RawGame): Promise<PersistResult> {
  // --- Dedup: same externalUrl already in DB? ---
  const dupByExternal = await prisma.game.findFirst({
    where: { url: raw.externalUrl },
    select: { id: true },
  });
  if (dupByExternal) {
    return { inserted: false, skipped: true, reason: "duplicate_external_url" };
  }

  // --- Dedup: same sourceUrl already in DB? ---
  const dupBySource = await prisma.game.findFirst({
    where: { sourceUrl: raw.sourceUrl, title: raw.title },
    select: { id: true },
  });
  if (dupBySource) {
    return { inserted: false, skipped: true, reason: "duplicate_source_title" };
  }

  // --- Build slug ---
  const slug = await uniqueGameSlug(raw.title);

  // --- Upsert tags ---
  const tagNames = normaliseTags(raw.tags);
  const tagIds = await Promise.all(tagNames.map(upsertTag));

  // --- Create game ---
  await prisma.game.create({
    data: {
      title: raw.title.slice(0, 200),
      slug,
      url: raw.externalUrl,
      shortDescription: raw.shortDescription,
      fullDescription: raw.fullDescription,
      coverImage: raw.coverImage,
      categorySlug: raw.categorySlug,
      status: ContentStatus.PENDING,   // Admin review before publishing
      source: ContentSource.CRAWLER,
      sourceUrl: raw.sourceUrl,
      tags: {
        create: tagIds.map((tagId) => ({ tagId })),
      },
    },
  });

  return { inserted: true, skipped: false };
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function runAllScrapers(): Promise<OrchestratorSummary> {
  const summary: OrchestratorSummary = {
    ranAt: new Date().toISOString(),
    scrapers: [],
    totalInserted: 0,
    totalSkipped: 0,
  };

  for (const scraper of ALL_SCRAPERS) {
    const result = await scraper();
    let inserted = 0;
    let skipped = 0;
    const persistErrors: string[] = [...result.errors];

    for (const raw of result.items) {
      try {
        const r = await persistGame(raw);
        if (r.inserted) inserted++;
        else skipped++;
      } catch (e) {
        persistErrors.push(`persist error for "${raw.title}": ${String(e)}`);
        skipped++;
      }
    }

    summary.scrapers.push({
      name: result.scraperName,
      fetched: result.items.length,
      inserted,
      skipped,
      errors: persistErrors,
    });
    summary.totalInserted += inserted;
    summary.totalSkipped += skipped;
  }

  return summary;
}

// ---------------------------------------------------------------------------
// Run a single named scraper (used by admin "Run" button)
// ---------------------------------------------------------------------------

export async function runScraperByName(
  name: string
): Promise<OrchestratorSummary> {
  const scraper = ALL_SCRAPERS.find((s) => {
    // Match on the scraperName returned by the function
    // We call it briefly to get the name — no actual fetch yet.
    // Instead, we match by function name convention.
    return s.name.toLowerCase().includes(name.toLowerCase());
  });

  if (!scraper) {
    return {
      ranAt: new Date().toISOString(),
      scrapers: [
        {
          name,
          fetched: 0,
          inserted: 0,
          skipped: 0,
          errors: [`No scraper found matching name: ${name}`],
        },
      ],
      totalInserted: 0,
      totalSkipped: 0,
    };
  }

  // Temporarily wrap in runAllScrapers logic
  const result = await scraper();
  let inserted = 0;
  let skipped = 0;
  const persistErrors: string[] = [...result.errors];

  for (const raw of result.items) {
    try {
      const r = await persistGame(raw);
      if (r.inserted) inserted++;
      else skipped++;
    } catch (e) {
      persistErrors.push(`persist error for "${raw.title}": ${String(e)}`);
      skipped++;
    }
  }

  return {
    ranAt: new Date().toISOString(),
    scrapers: [
      {
        name: result.scraperName,
        fetched: result.items.length,
        inserted,
        skipped,
        errors: persistErrors,
      },
    ],
    totalInserted: inserted,
    totalSkipped: skipped,
  };
}
