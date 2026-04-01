/**
 * HeyWaii Crawler — Per-source Scrapers
 *
 * Each scraper fetches a listing page, extracts game cards and returns
 * an array of RawGame objects normalised to the HeyWaii data structure.
 *
 * Supported sources (all static / SSR):
 *  1. freeai.games
 *  2. gamelist.ai
 *  3. aibuiltgames.com
 *  4. dang.ai/category/ai-games-list
 *  5. aixploria.com/en/category/games-en/
 *  6. lab.rosebud.ai/game-category/rpg-and-simulation-ai-games
 *  7. gameforge.com/en-US/littlegames/ai-games/
 */

import { load } from "cheerio";
import type { RawGame, ScraperResult } from "./types";
import {
  cleanText,
  buildShortDesc,
  resolveImageUrl,
  bestImgSrc,
  inferCategorySlug,
  fetchHtml,
  truncate,
} from "./utils";

// ---------------------------------------------------------------------------
// 1. freeai.games
// ---------------------------------------------------------------------------

export async function scrapeFreeAiGames(): Promise<ScraperResult> {
  const NAME = "freeai.games";
  const BASE = "https://freeai.games";
  const items: RawGame[] = [];
  const errors: string[] = [];

  const html = await fetchHtml(BASE);
  if (!html) {
    errors.push("Failed to fetch " + BASE);
    return { scraperName: NAME, items, errors };
  }

  const $ = load(html);

  $(".game-card, article.game-card, [class*='game-card']").each((_, el) => {
    try {
      const $el = $(el);
      const title = cleanText(
        $el.find("h2, h3, .game-title, .title").first().text() ||
          $el.find("a").first().attr("title") ||
          $el.find("img").first().attr("alt")
      );
      if (!title) return;

      const href =
        $el.find("a").first().attr("href") ||
        $el.closest("a").attr("href") ||
        "";
      const externalUrl = href ? new URL(href, BASE).href : BASE;

      const imgSrc = bestImgSrc($el.find("img").first());
      const coverImage = resolveImageUrl(imgSrc, BASE);

      const descRaw = cleanText(
        $el.find("p, .description, .excerpt").first().text()
      );
      const fullDescription = descRaw || `Play ${title} — an AI-powered game.`;
      const shortDescription = buildShortDesc(fullDescription, title);

      const tags = $el
        .find(".tag, .badge, [class*='tag']")
        .map((_, t) => cleanText($(t).text()))
        .get()
        .filter(Boolean);

      items.push({
        title,
        shortDescription,
        fullDescription,
        coverImage,
        externalUrl,
        sourceUrl: BASE,
        tags,
        categorySlug: inferCategorySlug([title, ...tags].join(" ")),
        scraperName: NAME,
      });
    } catch (e) {
      errors.push(String(e));
    }
  });

  return { scraperName: NAME, items, errors };
}

// ---------------------------------------------------------------------------
// 2. gamelist.ai
// ---------------------------------------------------------------------------

export async function scrapeGameListAi(): Promise<ScraperResult> {
  const NAME = "gamelist.ai";
  const BASE = "https://gamelist.ai";
  const items: RawGame[] = [];
  const errors: string[] = [];

  const html = await fetchHtml(BASE);
  if (!html) {
    errors.push("Failed to fetch " + BASE);
    return { scraperName: NAME, items, errors };
  }

  const $ = load(html);

  // Primary selector; fall back to any anchor with an img inside
  const cards = $(".search-game-item").length
    ? $(".search-game-item")
    : $("a:has(img)");

  cards.each((_, el) => {
    try {
      const $el = $(el);
      const title = cleanText(
        $el.find("h2, h3, .name, .title").first().text() ||
          $el.find("img").first().attr("alt")
      );
      if (!title) return;

      const href = $el.is("a")
        ? $el.attr("href")
        : $el.find("a").first().attr("href");
      const externalUrl = href ? new URL(href, BASE).href : BASE;

      const imgSrc = bestImgSrc($el.find("img").first());
      const coverImage = resolveImageUrl(imgSrc, BASE);

      const descRaw = cleanText($el.find("p, .desc").first().text());
      const fullDescription = descRaw || `Play ${title} — an AI-powered game.`;
      const shortDescription = buildShortDesc(fullDescription, title);

      const tags = $el
        .find(".tag, .category, .genre")
        .map((_, t) => cleanText($(t).text()))
        .get()
        .filter(Boolean);

      items.push({
        title,
        shortDescription,
        fullDescription,
        coverImage,
        externalUrl,
        sourceUrl: BASE,
        tags,
        categorySlug: inferCategorySlug([title, ...tags].join(" ")),
        scraperName: NAME,
      });
    } catch (e) {
      errors.push(String(e));
    }
  });

  return { scraperName: NAME, items, errors };
}

// ---------------------------------------------------------------------------
// 3. aibuiltgames.com
// ---------------------------------------------------------------------------

export async function scrapeAiBuiltGames(): Promise<ScraperResult> {
  const NAME = "aibuiltgames.com";
  const BASE = "https://aibuiltgames.com";
  const items: RawGame[] = [];
  const errors: string[] = [];

  const html = await fetchHtml(BASE);
  if (!html) {
    errors.push("Failed to fetch " + BASE);
    return { scraperName: NAME, items, errors };
  }

  const $ = load(html);

  // aibuiltgames uses .featured-game-card for featured games
  // and external href links for the game play buttons
  $(".featured-game-card, .fancy-card:has(.featured-game-info)").each((_, el) => {
    try {
      const $el = $(el);
      const $info = $el.find(".featured-game-info").length
        ? $el.find(".featured-game-info")
        : $el;

      const title = cleanText(
        $info.find("h4, h3, h2, .game-name, .title").first().text() ||
          $el.find("img").first().attr("alt")
      );
      if (!title) return;

      // Play button holds the external game URL
      const href =
        $el.find(".fancy-button, a[href*='http']").first().attr("href") ||
        $el.find("a").first().attr("href") ||
        "";
      const externalUrl = href && href.startsWith("http") ? href : BASE;

      const imgSrc = bestImgSrc($el.find(".game-screenshot img, img").first());
      const coverImage = resolveImageUrl(imgSrc, BASE);

      const descRaw = cleanText($info.find("p, .description").first().text());
      const fullDescription = descRaw || `Play ${title} — an AI-powered vibe-coded game.`;
      const shortDescription = buildShortDesc(fullDescription, title);

      const tags = $el
        .find(".category, .tag, .badge, [class*='tag']")
        .map((_, t) => cleanText($(t).text()))
        .get()
        .filter(Boolean);

      const author = cleanText($el.find(".author, .creator").first().text());
      const fullWithAuthor = author
        ? `${fullDescription}\n\nCreated by: ${author}`
        : fullDescription;

      items.push({
        title,
        shortDescription,
        fullDescription: fullWithAuthor,
        coverImage,
        externalUrl,
        sourceUrl: BASE,
        tags,
        categorySlug: inferCategorySlug([title, ...tags].join(" ")),
        scraperName: NAME,
      });
    } catch (e) {
      errors.push(String(e));
    }
  });

  return { scraperName: NAME, items, errors };
}

// ---------------------------------------------------------------------------
// 4. dang.ai — AI Games category
// ---------------------------------------------------------------------------

export async function scrapeDangAi(): Promise<ScraperResult> {
  const NAME = "dang.ai";
  const BASE = "https://dang.ai";
  const ENTRY = "https://dang.ai/category/ai-games-list";
  const items: RawGame[] = [];
  const errors: string[] = [];

  const html = await fetchHtml(ENTRY);
  if (!html) {
    errors.push("Failed to fetch " + ENTRY);
    return { scraperName: NAME, items, errors };
  }

  const $ = load(html);

  // Primary: .voting-content-left_wrapper; fallback: any card-like block
  const cards = $("div.voting-content-left_wrapper").length
    ? $("div.voting-content-left_wrapper")
    : $(".tool-card, .product-card, article");

  cards.each((_, el) => {
    try {
      const $el = $(el);

      const title = cleanText(
        $el.find("h2, h3, .tool-name, .product-name, strong").first().text()
      );
      if (!title) return;

      const href =
        $el.find("a").first().attr("href") ||
        $el.closest("a").attr("href") ||
        "";
      const externalUrl = href
        ? href.startsWith("http")
          ? href
          : new URL(href, BASE).href
        : BASE;

      const imgSrc = bestImgSrc($el.find("img").first());
      const coverImage = resolveImageUrl(imgSrc, BASE);

      const descRaw = cleanText(
        $el.find("p, .description, .tagline").first().text()
      );
      const fullDescription = descRaw || `Play ${title} — an AI-powered game.`;
      const shortDescription = buildShortDesc(fullDescription, title);

      const tags = $el
        .find(".tag, .badge, .category")
        .map((_, t) => cleanText($(t).text()))
        .get()
        .filter(Boolean);

      items.push({
        title,
        shortDescription,
        fullDescription,
        coverImage,
        externalUrl,
        sourceUrl: ENTRY,
        tags,
        categorySlug: inferCategorySlug([title, ...tags].join(" ")),
        scraperName: NAME,
      });
    } catch (e) {
      errors.push(String(e));
    }
  });

  return { scraperName: NAME, items, errors };
}

// ---------------------------------------------------------------------------
// 5. aixploria.com — Games category (paginated)
// ---------------------------------------------------------------------------

export async function scrapeAixploria(): Promise<ScraperResult> {
  const NAME = "aixploria.com";
  const BASE = "https://www.aixploria.com";
  const ENTRY = "https://www.aixploria.com/en/category/games-en/";
  const items: RawGame[] = [];
  const errors: string[] = [];

  // Scrape up to 3 pages
  for (let page = 1; page <= 3; page++) {
    const url = page === 1 ? ENTRY : `${ENTRY}page/${page}/`;
    const html = await fetchHtml(url);
    if (!html) {
      errors.push(`Failed to fetch page ${page}: ${url}`);
      break;
    }

    const $ = load(html);
    const cards = $(".post-item, article.post, .tool-item");
    if (!cards.length) break; // no more pages

    cards.each((_, el) => {
      try {
        const $el = $(el);

        const title = cleanText(
          $el.find("h2, h3, .entry-title, .post-title").first().text()
        );
        if (!title) return;

        const href =
          $el.find("a").first().attr("href") ||
          $el.closest("a").attr("href") ||
          "";
        const externalUrl = href ? new URL(href, BASE).href : BASE;

        const imgSrc = bestImgSrc($el.find("img").first());
        const coverImage = resolveImageUrl(imgSrc, BASE);

        const descRaw = cleanText(
          $el.find(".entry-summary, .excerpt, p").first().text()
        );
        const fullDescription = descRaw || `Play ${title} — an AI-powered game.`;
        const shortDescription = buildShortDesc(fullDescription, title);

        const tags = $el
          .find(".tag, .category, .post-category")
          .map((_, t) => cleanText($(t).text()))
          .get()
          .filter(Boolean);

        items.push({
          title,
          shortDescription,
          fullDescription,
          coverImage,
          externalUrl,
          sourceUrl: url,
          tags,
          categorySlug: inferCategorySlug([title, ...tags].join(" ")),
          scraperName: NAME,
        });
      } catch (e) {
        errors.push(String(e));
      }
    });
  }

  return { scraperName: NAME, items, errors };
}

// ---------------------------------------------------------------------------
// 6. lab.rosebud.ai — RPG & Simulation category
// ---------------------------------------------------------------------------

export async function scrapeRosebud(): Promise<ScraperResult> {
  const NAME = "rosebud.ai";
  const BASE = "https://lab.rosebud.ai";
  const ENTRY =
    "https://lab.rosebud.ai/game-category/rpg-and-simulation-ai-games";
  const items: RawGame[] = [];
  const errors: string[] = [];

  const html = await fetchHtml(ENTRY);
  if (!html) {
    errors.push("Failed to fetch " + ENTRY);
    return { scraperName: NAME, items, errors };
  }

  const $ = load(html);

  // Primary: a.blog-card; fallback: any anchor with an image
  const cards = $("a.blog-card").length ? $("a.blog-card") : $("a:has(img)");

  cards.each((_, el) => {
    try {
      const $el = $(el);

      const title = cleanText(
        $el.find("h2, h3, .title, .game-title").first().text() ||
          $el.find("img").first().attr("alt")
      );
      if (!title) return;

      const href = $el.attr("href") || "";
      const externalUrl = href ? new URL(href, BASE).href : BASE;

      const imgSrc = bestImgSrc($el.find("img").first());
      const coverImage = resolveImageUrl(imgSrc, BASE);

      const descRaw = cleanText($el.find("p, .description").first().text());
      const fullDescription = descRaw || `Play ${title} — an AI RPG/simulation game on Rosebud.`;
      const shortDescription = buildShortDesc(fullDescription, title);

      const tags = $el
        .find(".tag, .badge, .category")
        .map((_, t) => cleanText($(t).text()))
        .get()
        .filter(Boolean);

      // Rosebud games are RPG/sim by definition
      if (!tags.includes("rpg")) tags.push("rpg");

      items.push({
        title,
        shortDescription,
        fullDescription,
        coverImage,
        externalUrl,
        sourceUrl: ENTRY,
        tags,
        categorySlug: "rpg",
        scraperName: NAME,
      });
    } catch (e) {
      errors.push(String(e));
    }
  });

  return { scraperName: NAME, items, errors };
}

// ---------------------------------------------------------------------------
// 7. gameforge.com — Little Games AI section
// ---------------------------------------------------------------------------

export async function scrapeGameforge(): Promise<ScraperResult> {
  const NAME = "gameforge.com";
  const BASE = "https://gameforge.com";
  const ENTRY = "https://gameforge.com/en-US/littlegames/ai-games/";
  const items: RawGame[] = [];
  const errors: string[] = [];

  const html = await fetchHtml(ENTRY);
  if (!html) {
    errors.push("Failed to fetch " + ENTRY);
    return { scraperName: NAME, items, errors };
  }

  const $ = load(html);

  // gameforge uses .game-col > .game-wrapper > a structure
  // The anchor href is unquoted in the HTML, cheerio handles it fine
  $(".game-col").each((_, el) => {
    try {
      const $el = $(el);
      const $wrapper = $el.find(".game-wrapper");
      const $anchor = $wrapper.find("a").first();

      const title = cleanText(
        $anchor.find("img").first().attr("alt") ||
          $anchor.find("img").first().attr("title") ||
          $anchor.attr("title")
      );
      if (!title) return;

      const href = $anchor.attr("href") || "";
      const externalUrl = href ? new URL(href, BASE).href : BASE;

      // Cover image: prefer srcset first token, fallback to src
      const $img = $anchor.find("img").first();
      const imgSrc = bestImgSrc($img);
      // poster from data-video attribute as fallback
      const poster = $wrapper.find("[data-poster]").attr("data-poster") || "";
      const coverImage = resolveImageUrl(imgSrc || poster, BASE);

      const fullDescription = `Play ${title} for free — an AI-powered browser game on Gameforge.`;
      const shortDescription = truncate(title + " — free AI browser game.", 200);

      items.push({
        title,
        shortDescription,
        fullDescription,
        coverImage,
        externalUrl,
        sourceUrl: ENTRY,
        tags: [],
        categorySlug: inferCategorySlug(title),
        scraperName: NAME,
      });
    } catch (e) {
      errors.push(String(e));
    }
  });

  return { scraperName: NAME, items, errors };
}

// ---------------------------------------------------------------------------
// Registry — all scrapers in one place
// ---------------------------------------------------------------------------

export const ALL_SCRAPERS = [
  scrapeFreeAiGames,
  scrapeGameListAi,
  scrapeAiBuiltGames,
  scrapeDangAi,
  scrapeAixploria,
  scrapeRosebud,
  scrapeGameforge,
] as const;
