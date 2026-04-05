/**
 * Backfill greeting, introduction, personality, scenario, appearance
 * from raw JSON files (crushon / genraton / mufy / rubii) into the database.
 *
 * Source directories (hardcoded):
 *   D:\scraper_framework_v3\scraper_framework_latest\data\crushon
 *   D:\scraper_framework_v3\scraper_framework_latest\data\genraton
 *   D:\scraper_framework_v3\scraper_framework_latest\data\mufy
 *   D:\scraper_framework_v3\scraper_framework_latest\data\rubii
 *
 * Match strategy (in order):
 *   1. data._original_id  → DB sourceUrl  (most reliable)
 *   2. filename (e.g. "abc.json") → DB sourceUrl
 *   3. name exact match  → only if unique in DB (skip if ambiguous)
 *
 * A field is only overwritten when the new value is LONGER than the existing one.
 *
 * Usage:
 *   # Preview (no writes):
 *   pnpm exec ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/backfill-all-sources.ts --dry-run
 *
 *   # Write all sources:
 *   pnpm exec ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/backfill-all-sources.ts
 *
 *   # Write one source only:
 *   pnpm exec ts-node --compiler-options "{\"module\":\"CommonJS\"}" prisma/backfill-all-sources.ts --only=crushon
 */

import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");
const onlyArg = process.argv.find((a) => a.startsWith("--only="));
const onlySource = onlyArg?.slice("--only=".length).trim().toLowerCase();

// ── Hardcoded source directories ──────────────────────────────────────────────
const SOURCE_DIRS: Record<string, string> = {
  crushon:  "D:\\scraper_framework_v3\\scraper_framework_latest\\data\\crushon",
  genraton: "D:\\scraper_framework_v3\\scraper_framework_latest\\data\\genraton",
  mufy:     "D:\\scraper_framework_v3\\scraper_framework_latest\\data\\mufy",
  rubii:    "D:\\scraper_framework_v3\\scraper_framework_latest\\data\\rubii",
};
// ─────────────────────────────────────────────────────────────────────────────

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
    ? [onlySource].filter((s) => SOURCE_DIRS[s])
    : Object.keys(SOURCE_DIRS);

  if (onlySource && sources.length === 0) {
    console.error(`Unknown source: "${onlySource}". Valid: ${Object.keys(SOURCE_DIRS).join(", ")}`);
    process.exit(1);
  }

  // ── Pre-load all DB characters into memory for fast lookup ──────────────────
  console.log("Loading DB index…");
  const dbChars = await prisma.character.findMany({
    select: {
      id: true,
      name: true,
      sourceUrl: true,
      greeting: true,
      introduction: true,
      personality: true,
      scenario: true,
      appearance: true,
    },
  });

  // sourceUrl → record
  const bySourceUrl = new Map(
    dbChars.filter((c) => c.sourceUrl).map((c) => [c.sourceUrl!, c])
  );
  // name → list of records (to detect duplicates)
  const byName = new Map<string, (typeof dbChars)[0][]>();
  for (const c of dbChars) {
    if (!byName.has(c.name)) byName.set(c.name, []);
    byName.get(c.name)!.push(c);
  }
  console.log(`Loaded ${dbChars.length} DB records\n`);
  // ────────────────────────────────────────────────────────────────────────────

  let totalUpdated = 0;
  let totalSkipped = 0;
  let totalNotFound = 0;
  let totalAmbiguous = 0;
  let totalNoData = 0;

  const BATCH = 100;

  for (const source of sources) {
    const dirPath = SOURCE_DIRS[source];

    if (!fs.existsSync(dirPath)) {
      console.warn(`⚠️  Directory not found, skipping: ${dirPath}`);
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
      // ──────────────────────────────────────────────────────────────────────

      const newGreeting     = extractGreeting(data);
      const newIntroduction = extractIntroduction(data, rawItem);
      const newPersonality  = extractPersonality(data, rawItem);
      const newScenario     = extractScenario(data, rawItem);
      const newAppearance   = extractAppearance(data, rawItem);

      const updateData: Record<string, string> = {};
      if (longer(existing.greeting,     newGreeting))     updateData.greeting     = clip(newGreeting!);
      if (longer(existing.introduction, newIntroduction)) updateData.introduction = clip(newIntroduction!);
      if (longer(existing.personality,  newPersonality))  updateData.personality  = clip(newPersonality!);
      if (longer(existing.scenario,     newScenario))     updateData.scenario     = clip(newScenario!);
      if (longer(existing.appearance,   newAppearance))   updateData.appearance   = clip(newAppearance!);

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
  .finally(() => prisma.$disconnect());
