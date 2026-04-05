import fs from 'fs'
import path from 'path'
import { PrismaClient, ContentStatus, ContentSource } from '@prisma/client'
import { inferCategorySlug } from '../src/lib/crawler/utils'

const prisma = new PrismaClient()

// Path to your taptale character_list.json
const CHATS_DIR = 'D:/scraper_framework_v3/scraper_framework_latest/data/taptale/chats'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)
}

async function main() {
  console.log('🤖 Starting to import Taptale characters into RDS...')

  if (!fs.existsSync(CHATS_DIR)) {
    console.error(`Directory not found: ${CHATS_DIR}`)
    process.exit(1)
  }

  const files = fs.readdirSync(CHATS_DIR).filter(f => f.endsWith('.json'))
  console.log(`Found ${files.length} character files.`)

  let created = 0
  let skipped = 0

  for (const file of files) {
    try {
      const filePath = path.join(CHATS_DIR, file)
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      const charInfo = data._character_info || data._raw || data
      
      const title = charInfo.nickname || data.title
      if (!title) {
        skipped++
        continue
      }
      
      const description = charInfo.role_desc || data.describe || charInfo.initial_message || 'No description available.'
      
      const baseSlug = slugify(title)
      let slug = baseSlug || `taptale-${charInfo.role_id || Date.now()}`
      let attempt = 0

      // Handle slug conflicts
      while (true) {
        const existing = await prisma.character.findUnique({ where: { slug } })
        if (!existing) break
        attempt++
        slug = `${baseSlug}-${attempt}`
      }

      const existingByUrl = await prisma.character.findFirst({ where: { name: title } })
      if (!existingByUrl) {
        console.log(`  ⏭  Skipped (not exist): ${title}`)
        skipped++
        continue
      }
      
      const existingSlug = existingByUrl.slug
      
      let tags: string[] = []
      if (Array.isArray(charInfo.role_tag)) {
          tags = charInfo.role_tag.filter(Boolean)
      } else if (typeof charInfo.role_tag === 'string') {
          tags = charInfo.role_tag.split(',').map((s: string) => s.trim()).filter(Boolean)
      } else if (Array.isArray(data.tag)) {
          tags = data.tag
      }
      
      const categorySlug = inferCategorySlug([title, ...tags, description].join(' '))

      await prisma.character.updateMany({
        where: { slug: existingSlug },
        data: {
          systemPrompt: charInfo.role_definition || data._detail?.role_definition || null,
          greeting: charInfo.initial_message || data._detail?.initial_message || null,
          gender: charInfo.sex === 1 ? 'Male' : charInfo.sex === 2 ? 'Female' : null,
          creatorName: charInfo.author_name || data._detail?.author_name || data._raw?.author_name || charInfo.author_id || data._detail?.author_id || data.create_by_name || null,
          chatCount: Number(charInfo.chat_count || data._detail?.chat_count || data.chat_count) || 0,
          isNsfw: (charInfo.show_level ?? data.show_level ?? 0) !== 5,
        }
      });

      console.log(`  ✅ Updated existing: ${title} [${categorySlug}]`)
      created++
      
      // Commit in chunks to avoid overwhelming the DB
      if (created % 100 === 0) {
        console.log(`...imported ${created} characters so far...`)
      }

    } catch (e) {
      console.error(`❌ Failed to parse ${file}:`, e)
      skipped++
    }
  }

  console.log(`\n🎉 Import complete! Created: ${created}, Skipped/Failed: ${skipped}`)
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
