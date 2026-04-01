/**
 * HeyWaii Crawler — Shared Types
 *
 * All per-source scrapers must return an array of `RawGame`.
 * The orchestrator normalises these into Prisma `Game` records.
 */

/** Normalised game object produced by every scraper. */
export interface RawGame {
  /** Game title (required) */
  title: string;
  /** Short one-liner description (≤ 200 chars) */
  shortDescription: string;
  /** Full description / about text */
  fullDescription: string;
  /** Absolute URL of the cover / thumbnail image */
  coverImage: string;
  /** Canonical external URL where the game is played */
  externalUrl: string;
  /** Source page URL (used for dedup) */
  sourceUrl: string;
  /** Tags / keywords extracted from the source */
  tags: string[];
  /** Category slug inferred from tags/title */
  categorySlug: string;
  /** Name of the scraper that produced this record */
  scraperName: string;
}

/** Result returned by each scraper function */
export interface ScraperResult {
  scraperName: string;
  items: RawGame[];
  errors: string[];
}
