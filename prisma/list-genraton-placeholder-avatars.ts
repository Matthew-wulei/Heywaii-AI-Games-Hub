/**
 * List Genraton crawler characters whose avatar is the default Unsplash placeholder
 * used by import-other-sources-v3 (and crawler utils FALLBACK_COVER).
 *
 * Usage (point DATABASE_URL at prod / staging):
 *   pnpm exec npx tsx prisma/list-genraton-placeholder-avatars.ts
 *   pnpm exec npx tsx prisma/list-genraton-placeholder-avatars.ts --json
 *   pnpm exec npx tsx prisma/list-genraton-placeholder-avatars.ts --any-unsplash
 *
 * Requires local path to genraton processed JSON (for sourceUrl allow-list).
 */
import fs from 'fs'
import { PrismaClient, ContentSource } from '@prisma/client'

const prisma = new PrismaClient()

const GENRATON_DIR = 'D:/scraper_framework_v3/scraper_framework_latest/data_processed/genraton'
/** Same image id as import default + crawler FALLBACK_COVER */
const PLACEHOLDER_SUBSTR = 'photo-1542751371-adc38448a05e'
const BATCH = 400

async function main() {
  const asJson = process.argv.includes('--json')
  const anyUnsplash = process.argv.includes('--any-unsplash')

  if (!fs.existsSync(GENRATON_DIR)) {
    console.error(`Genraton directory not found: ${GENRATON_DIR}`)
    process.exit(1)
  }

  const ids = new Set<string>()
  for (const name of fs.readdirSync(GENRATON_DIR)) {
    if (!name.endsWith('.json')) continue
    const base = name.slice(0, -'.json'.length)
    ids.add(base)
    ids.add(name)
  }

  const list = [...ids]
  const rows: { sourceUrl: string | null; slug: string; name: string; avatar: string }[] = []

  for (let i = 0; i < list.length; i += BATCH) {
    const chunk = list.slice(i, i + BATCH)
    const found = await prisma.character.findMany({
      where: {
        source: ContentSource.CRAWLER,
        sourceUrl: { in: chunk },
        avatar: anyUnsplash ? { contains: 'unsplash.com' } : { contains: PLACEHOLDER_SUBSTR },
      },
      select: { sourceUrl: true, slug: true, name: true, avatar: true },
    })
    rows.push(...found)
  }

  if (asJson) {
    console.log(JSON.stringify({ count: rows.length, characters: rows }, null, 2))
  } else {
    const mode = anyUnsplash ? 'any unsplash.com' : `placeholder (${PLACEHOLDER_SUBSTR})`
    console.log(`Genraton + avatar ${mode}: ${rows.length} rows\n`)
    for (const r of rows) {
      console.log(`${r.slug}\t${r.name}\t${r.sourceUrl}`)
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
