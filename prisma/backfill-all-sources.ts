/**
 * Backfill greeting, introduction, personality, scenario, appearance
 * from raw JSON files (crushon / genraton / mufy / rubii) into the database.
 *
 * Source directories (per source, first match wins):
 *   $SCRAPER_FRAMEWORK_ROOT/data_processed/<source>   (same layout as import-other-sources-v3)
 *   $SCRAPER_FRAMEWORK_ROOT/data/<source>
 *
 * Default SCRAPER_FRAMEWORK_ROOT:
 *   D:\scraper_framework_v3\scraper_framework_latest
 *
 * Match strategy (in order):
 *   1. data._original_id  → DB sourceUrl  (most reliable)
 *   2. filename (e.g. "abc.json") → DB sourceUrl
 *   3. name exact match  → only if unique in DB (skip if ambiguous)
 *
 * A field is only overwritten when the new value is LONGER than the existing one.
 *
 * Usage (recommended — loads .env from repo root):
 *   pnpm run backfill:sources -- --dry-run
 *   pnpm run backfill:sources
 *   pnpm run backfill:sources -- --only=crushon
 */

import fs from "fs";
import net from "net";
import path from "path";
import { config as loadEnv } from "dotenv";
import { PrismaClient } from "@prisma/client";

/** Resolved via ts-node CommonJS (see prisma/run-backfill.cjs). */
const repoRoot = path.resolve(__dirname, "..");
loadEnv({ path: path.join(repoRoot, ".env") });
loadEnv({ path: path.join(repoRoot, ".env.local") });

const dryRun = process.argv.includes("--dry-run");
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const onlySource = onlyArg?.slice("--only=".length).trim().toLowerCase();

const SCRAPER_ROOT =
  process.env.SCRAPER_FRAMEWORK_ROOT?.trim() ||
  path.join("D:", "scraper_framework_v3", "scraper_framework_latest");

const SOURCE_KEYS = ["crushon", "genraton", "mufy", "rubii"] as const;

function resolveSourceDir(source: string): string | null {
  const processed = path.join(SCRAPER_ROOT, "data_processed", source);
  const legacy = path.join(SCRAPER_ROOT, "data", source);
  if (fs.existsSync(processed)) return processed;
  if (fs.existsSync(legacy)) return legacy;
  return null;
}

/**
 * Prisma / mysql2 URL tweaks: shorten wait when the host is down or filtered.
 * (Some stacks still hang on DNS; we also TCP-probe below.)
 */
function withMysqlConnectTimeout(url: string, seconds: number): string {
  const u = url.trim();
  if (!u) return u;
  let out = u;
  const add = (k: string, v: string) => {
    if (new RegExp(`[?&]${k}=`, "i").test(out)) return;
    out = out.includes("?") ? `${out}&${k}=${v}` : `${out}?${k}=${v}`;
  };
  add("connect_timeout", String(seconds));
  add("connection_limit", "2");
  return out;
}

/** Fail fast when host:port is unreachable (before Prisma hangs on some networks). */
function probeMysqlTcp(url: string, timeoutMs: number): Promise<void> {
  const raw = url.trim();
  const forUrl = raw.replace(/^mysql:\/\//i, "http://");
  let host = "";
  let port = 3306;
  try {
    const u = new URL(forUrl);
    host = u.hostname;
    if (u.port) port = parseInt(u.port, 10) || 3306;
  } catch {
    return Promise.resolve();
  }
  if (!host) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port }, () => {
      socket.destroy();
      resolve();
    });
    socket.setTimeout(timeoutMs);
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error(`TCP ${timeoutMs}ms timeout — ${host}:${port} (VPN / security group / wrong host?)`));
    });
    socket.on("error", (err) => {
      socket.destroy();
      reject(err);
    });
  });
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is missing. Add it to .env in the repo root (or export it), then retry.");
  process.exit(1);
}
const databaseUrlResolved = databaseUrl;

const prisma = new PrismaClient({
  datasources: {
    db: { url: withMysqlConnectTimeout(databaseUrlResolved, 25) },
  },
});

const MAX_TEXT = 65_000;

function clip(s: string): string {
  return s.length <= MAX_TEXT ? s : s.slice(0, MAX_TEXT);
}

function coalesceStr(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === "string" && v.trim().length > 0) return v.trim();
  }
  return null;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : null;
}

function extractGreeting(data: Record<string, unknown>): string | null {
  const lang = asRecord(data.zh_tw) || asRecord(data.en) || {};
  return coalesceStr(lang.greeting, data.greeting);
}

function extractIntroduction(
  data: Record<string, unknown>,
  rawItem: Record<string, unknown>
): string | null {
  const lang = asRecord(data.zh_tw) || asRecord(data.en) || {};
  const rawNested = asRecord(rawItem._raw) || asRecord(data._raw);
  return coalesceStr(
    lang.introduction,
    data.codeRenderContent,        // CrushOn: HTML card (was missing in original importer)
    rawItem.codeRenderContent,
    data.introduction,
    rawItem.introduction,
    rawNested?.introduction,
    data.intro_html,
    data.profile_html,
    data.card_html,
    rawItem.intro_html,
    rawNested?.introduction_html
  );
}

function extractPersonality(
  data: Record<string, unknown>,
  rawItem: Record<string, unknown>
): string | null {
  const lang = asRecord(data.zh_tw) || asRecord(data.en) || {};
  const rawNested = asRecord(rawItem._raw) || asRecord(data._raw);
  const detail = asRecord(data.detail) || asRecord(rawItem.detail);
  return coalesceStr(
    lang.personality, lang.persona,
    data.personality, data.persona,
    rawItem.personality, rawItem.persona,
    rawNested?.personality, rawNested?.persona,
    detail?.personality,
    data.char_description, rawItem.char_description
  );
}

function extractScenario(
  data: Record<string, unknown>,
  rawItem: Record<string, unknown>
): string | null {
  const lang = asRecord(data.zh_tw) || asRecord(data.en) || {};
  const rawNested = asRecord(rawItem._raw) || asRecord(data._raw);
  return coalesceStr(
    lang.scenario, lang.world_scenario,
    data.scenario, data.world_scenario,
    rawItem.scenario, rawNested?.scenario,
    data.background_story, rawItem.background_story
  );
}

function extractAppearance(
  data: Record<string, unknown>,
  rawItem: Record<string, unknown>
): string | null {
  const lang = asRecord(data.zh_tw) || asRecord(data.en) || {};
  const rawNested = asRecord(rawItem._raw) || asRecord(data._raw);
  return coalesceStr(
    lang.appearance, lang.char_appearance,
    data.appearance, data.char_appearance,
    rawItem.appearance, rawNested?.appearance,
    data.physical_description, rawItem.physical_description
  );
}

/** Only overwrite when new value is strictly longer than existing */
function longer(existing: string | null | undefined, next: string | null): boolean {
  return !!next && next.length > 0 && (!existing || next.length > existing.length);
}

async function main() {
  console.log(`\n🚀 backfill-all-sources  mode=${dryRun ? "DRY RUN" : "WRITE"}  source=${onlySource ?? "ALL"}\n`);

  const sources = onlySource
    ? SOURCE_KEYS.filter((s) => s === onlySource)
    : [...SOURCE_KEYS];

  if (onlySource && sources.length === 0) {
    console.error(`Unknown source: "${onlySource}". Valid: ${SOURCE_KEYS.join(", ")}`);
    process.exit(1);
  }

  // ── Pre-load all DB characters into memory for fast lookup ──────────────────
  console.log("Probing database host (TCP)…");
  try {
    await probeMysqlTcp(databaseUrlResolved, 12_000);
    console.log("Database host accepts TCP; loading index…");
  } catch (e) {
    console.error(
      "Cannot reach MySQL host. Fix VPN / RDS whitelist / DATABASE_URL, then run again.\n",
      e
    );
    process.exit(1);
  }

  const pageSize = Math.min(
    8000,
    Math.max(500, parseInt(process.env.BACKFILL_PAGE_SIZE || "5000", 10) || 5000)
  );

  type LightChar = { id: string; name: string; sourceUrl: string | null };
  const dbChars: LightChar[] = [];

  try {
    let cursor: { id: string } | undefined;
    for (;;) {
      const batch = await prisma.character.findMany({
        take: pageSize,
        ...(cursor ? { cursor, skip: 1 } : {}),
        orderBy: { id: "asc" },
        select: { id: true, name: true, sourceUrl: true },
      });
      if (batch.length === 0) break;
      dbChars.push(...batch);
      cursor = { id: batch[batch.length - 1].id };
      process.stdout.write(`\rLoading DB index (light)… ${dbChars.length} rows   `);
    }
    process.stdout.write("\n");
  } catch (e: unknown) {
    const code = e && typeof e === "object" && "code" in e ? String((e as { code?: string }).code) : "";
    console.error("Failed to load characters from the database.");
    if (code === "P1001" || /connect|ECONNREFUSED|ETIMEDOUT/i.test(String(e))) {
      console.error(
        "Check VPN / RDS IP whitelist / DATABASE_URL. connect_timeout=25s is applied on the client URL."
      );
    }
    console.error(e);
    process.exit(1);
  }

  // sourceUrl → light row
  const bySourceUrl = new Map(
    dbChars.filter((c) => c.sourceUrl).map((c) => [c.sourceUrl!, c])
  );
  const byName = new Map<string, LightChar[]>();
  for (const c of dbChars) {
    if (!byName.has(c.name)) byName.set(c.name, []);
    byName.get(c.name)!.push(c);
  }
  console.log(`Indexed ${dbChars.length} DB rows (long fields load on demand)\n`);

  const fullSelect = {
    id: true,
    name: true,
    sourceUrl: true,
    greeting: true,
    introduction: true,
    personality: true,
    scenario: true,
    appearance: true,
  } as const;

  type FullChar = {
    id: string;
    name: string;
    sourceUrl: string | null;
    greeting: string | null;
    introduction: string | null;
    personality: string | null;
    scenario: string | null;
    appearance: string | null;
  };
  const fullCache = new Map<string, FullChar>();

  async function getFullRow(id: string): Promise<FullChar | null> {
    const hit = fullCache.get(id);
    if (hit) return hit;
    const row = await prisma.character.findUnique({
      where: { id },
      select: fullSelect,
    });
    if (!row) return null;
    fullCache.set(id, row);
    return row;
  }
  // ────────────────────────────────────────────────────────────────────────────

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalNotFound = 0;
  let totalAmbiguous = 0;
  let totalNoData = 0;

  const BATCH = 100;

  console.log(`SCRAPER_FRAMEWORK_ROOT → ${SCRAPER_ROOT}\n`);

  for (const source of sources) {
    const dirPath = resolveSourceDir(source);

    if (!dirPath) {
      console.warn(
        `⚠️  No data folder for "${source}" (tried data_processed and data under SCRAPER_FRAMEWORK_ROOT), skipping.`
      );
      continue;
    }

    const files = fs.readdirSync(dirPath).filter((f) => f.endsWith(".json"));
    console.log(`📂 ${source}: ${files.length} JSON files`);

    const batch: Array<{ id: string; data: Record<string, string> }> = [];

    const flush = async () => {
      if (batch.length === 0) return;
      if (!dryRun) {
        await Promise.all(
          batch.map(({ id, data }) =>
            prisma.character.update({ where: { id }, data })
          )
        );
      }
      totalUpdated += batch.length;
      if (!dryRun) console.log(`   ✅ Written ${totalUpdated} total so far…`);
      batch.length = 0;
    };

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      let data: Record<string, unknown>;
      try {
        data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
      } catch {
        totalSkipped++;
        continue;
      }

      const name = (
        ((data.name || data.title) as string | undefined) ?? ""
      ).trim();
      const originalId = data._original_id as string | undefined;
      // Some raw files use id / characterId instead of _original_id
      const rawId = (data.characterId || data.id) as string | undefined;
      const fileBase = file.replace(".json", "");

      // Raw item embedded in processed file (for field extraction)
      const rawItem = asRecord(data._raw) || {};

      // ── Match DB record ────────────────────────────────────────────────────
      let existing =
        bySourceUrl.get(originalId ?? "") ||
        bySourceUrl.get(file) ||           // "abc.json"
        bySourceUrl.get(fileBase) ||       // "abc"
        (rawId ? bySourceUrl.get(rawId) : undefined);

      if (!existing && name) {
        const matches = byName.get(name) ?? [];
        if (matches.length === 1) {
          existing = matches[0];
        } else if (matches.length > 1) {
          totalAmbiguous++;
          continue;
        }
      }

      if (!existing) {
        totalNotFound++;
        continue;
      }

      const existingFull = await getFullRow(existing.id);
      if (!existingFull) {
        totalNotFound++;
        continue;
      }
      // ──────────────────────────────────────────────────────────────────────

      const newGreeting     = extractGreeting(data);
      const newIntroduction = extractIntroduction(data, rawItem);
      const newPersonality  = extractPersonality(data, rawItem);
      const newScenario     = extractScenario(data, rawItem);
      const newAppearance   = extractAppearance(data, rawItem);

      const updateData: Record<string, string> = {};
      if (longer(existingFull.greeting,     newGreeting))     updateData.greeting     = clip(newGreeting!);
      if (longer(existingFull.introduction, newIntroduction)) updateData.introduction = clip(newIntroduction!);
      if (longer(existingFull.personality,  newPersonality))  updateData.personality  = clip(newPersonality!);
      if (longer(existingFull.scenario,     newScenario))     updateData.scenario     = clip(newScenario!);
      if (longer(existingFull.appearance,   newAppearance))   updateData.appearance   = clip(newAppearance!);

      if (Object.keys(updateData).length === 0) {
        totalSkipped++;
        continue;
      }

      if (dryRun) {
        const fields = Object.entries(updateData)
          .map(([k, v]) => `${k}(${v.length}ch)`)
          .join(", ");
        console.log(`   [DRY] "${name || file}" → ${fields}`);
        totalUpdated++;
        continue;
      }

      batch.push({ id: existing.id, data: updateData });
      if (batch.length >= BATCH) await flush();
    }

    await flush();
    console.log(`   Done ${source}.\n`);
  }

  console.log("=".repeat(44));
  console.log(`✅ Updated:   ${totalUpdated}`);
  console.log(`⏭️  Skipped:   ${totalSkipped}  (no better data / already up-to-date)`);
  console.log(`❓ Not found: ${totalNotFound}  (no DB match by sourceUrl or name)`);
  console.log(`⚠️  Ambiguous: ${totalAmbiguous}  (duplicate names in DB, skipped)`);
  console.log(`🔇 No data:   ${totalNoData}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
