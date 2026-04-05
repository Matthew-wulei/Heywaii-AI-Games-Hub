/**
 * Optional one-off: copy legacy `systemPrompt` into `personality` when personality/scenario/appearance
 * are all empty, so `buildSystemPromptFromCharacter` uses the new chain (personality + IMPORTANT block)
 * instead of the single-field fallback.
 *
 * Run (from repo root, after prisma generate):
 *   pnpm exec ts-node --compiler-options "{\"module\":\"CommonJS\"}" scripts/backfill-character-crushon-fields.ts
 *
 * Pass --dry-run to only print counts.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const rows = await prisma.character.findMany({
    where: {
      personality: null,
      scenario: null,
      appearance: null,
      NOT: { systemPrompt: null },
    },
    select: { id: true, slug: true, systemPrompt: true },
  });

  console.log(`Candidates (empty p/s/a, has systemPrompt): ${rows.length}`);
  if (dryRun) {
    await prisma.$disconnect();
    return;
  }

  for (const r of rows) {
    const sp = r.systemPrompt?.trim();
    if (!sp) continue;
    await prisma.character.update({
      where: { id: r.id },
      data: { personality: sp },
    });
    console.log(`Updated ${r.slug}`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
