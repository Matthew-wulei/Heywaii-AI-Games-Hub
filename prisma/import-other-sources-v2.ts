import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { PrismaClient, ContentStatus, ContentSource } from '@prisma/client'
import { inferCategorySlug } from '../src/lib/crawler/utils'

const prisma = new PrismaClient()

const BASE_DIR = 'D:/scraper_framework_v3/scraper_framework_latest/data_processed'
const DIRS = ['crushon', 'genraton', 'rubii']

function slugify(text: string): string {
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80)
    
  return slug || '-'
}

async function main() {
  console.log('🤖 Starting to import additional character sources into RDS...')

  let totalCreated = 0
  let totalSkipped = 0
  let totalUpdated = 0

  for (const source of DIRS) {
    const dirPath = path.join(BASE_DIR, source)
    if (!fs.existsSync(dirPath)) {
      console.warn(`Directory not found: ${dirPath}`)
      continue
    }

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'))
    console.log(`\nFound ${files.length} files in ${source}.`)

    for (const file of files) {
      try {
        const filePath = path.join(dirPath, file)
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        
        const title = data.name || data.title
        if (!title) {
          totalSkipped++
          continue
        }

        // Determine language priority
        const langData = data.zh_tw || data.en || {}
        let description = langData.description || data.describe || data.summary || 'No description available.'
        let greeting = langData.greeting || data.greeting || null

        // Tags & Category
        let tags: string[] = []
        if (data._meta && Array.isArray(data._meta.tags)) {
          tags = data._meta.tags
        } else if (Array.isArray(data.tag)) {
          tags = data.tag
        }
        
        const categorySlug = inferCategorySlug([title, ...tags, description].join(' '))

        // Gender mapping
        let genderStr = null
        if (data._meta && data._meta.gender !== undefined) {
          const g = data._meta.gender
          if (typeof g === 'number') {
            if (g === 1) genderStr = 'Male'
            else if (g === 2) genderStr = 'Female'
          } else if (typeof g === 'string') {
            const gl = g.toLowerCase()
            if (gl === 'male' || gl === 'm') genderStr = 'Male'
            else if (gl === 'female' || gl === 'f') genderStr = 'Female'
          }
        } else if (data.gender !== undefined) {
          const g = data.gender
          if (g === 1) genderStr = 'Male'
          else if (g === 2) genderStr = 'Female'
        }
        
        // Chat count
        const chatCount = data._meta?.chat_count || data.chat_count || 0
        
        // NSFW mapping (CrushOn and Rubii typically don't have explicit show_level like Taptale,
        // so we'll default them based on tags or source characteristics. For now, default false 
        // unless a tag explicitly says NSFW / R18).
        // Requirement: crushon and genraton are ALWAYS NSFW.
        const nsfwKeywords = ['nsfw', '18+', 'r18', 'sm', 'erotic', 'adult']
        let isNsfw = tags.some(t => nsfwKeywords.includes(t.toLowerCase()))
        
        if (source === 'crushon' || source === 'genraton') {
            isNsfw = true
        }

        let baseSlug = slugify(title)
        if (!baseSlug || baseSlug === '-') {
          baseSlug = crypto.createHash('md5').update(title).digest('hex').substring(0, 10)
        }

        let slug = baseSlug
        let attempt = 0
        let isUnique = false

        // Check if name exists (update if it does, create if not)
        const existingByName = await prisma.character.findFirst({ where: { name: title } })
        
        if (existingByName) {
          slug = existingByName.slug
          isUnique = true
        } else {
          // Resolve slug conflicts for new creation
          while (!isUnique) {
            const existing = await prisma.character.findUnique({ where: { slug } })
            if (!existing) {
              isUnique = true
            } else {
              attempt++
              slug = `${baseSlug}-${attempt}`
            }
          }
        }
        
        const creatorName = data.create_by_name || data._meta?.author_name || source || null;

        if (existingByName) {
          await prisma.character.update({
            where: { id: existingByName.id },
            data: {
              greeting: greeting || existingByName.greeting,
              description: description.substring(0, 5000),
              gender: genderStr || existingByName.gender,
              chatCount: Math.max(existingByName.chatCount, chatCount),
              isNsfw: existingByName.isNsfw || isNsfw,
            }
          })
          console.log(`  ✅ Updated existing: ${title}`)
          totalUpdated++
        } else {
          await prisma.character.create({
            data: {
              name: title,
              slug,
              avatar: data.avatar || data.cover_image || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&h=400&auto=format&fit=crop',
              description: description.substring(0, 5000),
              categorySlug,
              status: ContentStatus.PUBLISHED,
              source: ContentSource.CRAWLER,
              greeting,
              gender: genderStr,
              chatCount,
              isNsfw,
              creatorName
            },
          })
          console.log(`  ✅ Imported: ${title} [${categorySlug}]`)
          totalCreated++
        }

      } catch (e) {
        console.error(`❌ Failed to parse ${file} in ${source}:`, e)
        totalSkipped++
      }
    }
  }

  console.log(`\n🎉 Import complete! Created: ${totalCreated}, Updated: ${totalUpdated}, Skipped/Failed: ${totalSkipped}`)
}

main()
  .catch((e) => {
    console.error('❌ Import failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })