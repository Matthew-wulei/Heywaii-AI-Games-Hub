import fs from 'fs'
import path from 'path'
import { PrismaClient, ContentSource } from '@prisma/client'

const prisma = new PrismaClient()

const MUFY_DIR = 'D:/scraper_framework_v3/scraper_framework_latest/data_processed/mufy'
const BATCH = 400

async function main() {
  if (!fs.existsSync(MUFY_DIR)) {
    console.error(`Mufy directory not found: ${MUFY_DIR}`)
    process.exit(1)
  }

  const ids = new Set<string>()
  for (const name of fs.readdirSync(MUFY_DIR)) {
    if (!name.endsWith('.json')) continue
    const base = name.slice(0, -'.json'.length)
    ids.add(base)
    ids.add(name)
  }

  const list = [...ids]
  let total = 0
  for (let i = 0; i < list.length; i += BATCH) {
    const chunk = list.slice(i, i + BATCH)
    const r = await prisma.character.updateMany({
      where: {
        source: ContentSource.CRAWLER,
        sourceUrl: { in: chunk },
      },
      data: { isNsfw: false },
    })
    total += r.count
  }

  console.log(`Updated isNsfw=false for ${total} crawler Character rows matching ${list.length} mufy id keys (batched).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
