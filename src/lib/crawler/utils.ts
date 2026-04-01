/**
 * HeyWaii Crawler — Shared Utilities
 */

import type { CheerioAPI } from "cheerio";

// ---------------------------------------------------------------------------
// Category inference
// ---------------------------------------------------------------------------

const CATEGORY_RULES: [RegExp, string][] = [
  [/\b(rpg|quest|dungeon|dragon|mage|sword|fantasy|hero|adventure)\b/i, "rpg"],
  [/\b(sim|colony|city|tycoon|build|manage|farm|life)\b/i, "simulation"],
  [/\b(puzzle|logic|brain|match|word|trivia|quiz)\b/i, "puzzle"],
  [/\b(romance|visual.?novel|vn|dating|otome|love)\b/i, "visual-novel"],
  [/\b(action|shooter|fight|combat|battle|war|fps)\b/i, "action"],
  [/\b(horror|survival|escape|mystery|thriller)\b/i, "horror"],
  [/\b(strategy|tower.?defense|rts|chess|card)\b/i, "strategy"],
  [/\b(chat|companion|ai.?friend|roleplay|character)\b/i, "chat"],
];

export function inferCategorySlug(text: string): string {
  const lower = text.toLowerCase();
  for (const [re, slug] of CATEGORY_RULES) {
    if (re.test(lower)) return slug;
  }
  return "imported";
}

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

export function cleanText(raw: string | undefined | null): string {
  if (!raw) return "";
  return raw.replace(/\s+/g, " ").trim();
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "…";
}

/** Build a short description from a longer one, or fall back to the title. */
export function buildShortDesc(full: string, title: string): string {
  const first = full.split(/[.\n]/)[0]?.trim() ?? "";
  const candidate = first.length > 20 ? first : full;
  return truncate(cleanText(candidate) || title, 200);
}

// ---------------------------------------------------------------------------
// Image URL helpers
// ---------------------------------------------------------------------------

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800&auto=format&fit=crop";

/**
 * Resolve a potentially relative image src to an absolute URL.
 * Returns the fallback if the src is empty or data-URI.
 */
export function resolveImageUrl(
  src: string | undefined | null,
  baseUrl: string
): string {
  if (!src || src.startsWith("data:")) return FALLBACK_COVER;
  try {
    return new URL(src, baseUrl).href;
  } catch {
    return FALLBACK_COVER;
  }
}

/**
 * Pick the best image src from an <img> element:
 * prefers data-src (lazy-load) → srcset first token → src.
 */
export function bestImgSrc($img: ReturnType<CheerioAPI>): string {
  const lazySrc =
    $img.attr("data-src") ??
    $img.attr("data-lazy-src") ??
    $img.attr("data-original");
  if (lazySrc) return lazySrc;

  const srcset = $img.attr("srcset");
  if (srcset) {
    const first = srcset.split(",")[0]?.trim().split(/\s+/)[0];
    if (first) return first;
  }

  return $img.attr("src") ?? "";
}

// ---------------------------------------------------------------------------
// Fetch helper with retry
// ---------------------------------------------------------------------------

export async function fetchHtml(
  url: string,
  retries = 2
): Promise<string | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; HeyWaiiCrawler/2.0; +https://heywaii.com/crawler)",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        if (attempt === retries) return null;
        await sleep(1000 * (attempt + 1));
        continue;
      }
      return await res.text();
    } catch {
      if (attempt === retries) return null;
      await sleep(1000 * (attempt + 1));
    }
  }
  return null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
