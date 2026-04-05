import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { PrismaClient, ContentStatus, ContentSource } from '@prisma/client'
import { inferCategorySlug } from '../src/lib/crawler/utils'

const prisma = new PrismaClient()

// We will read from data_processed for text info, and data/source/character_list.json to lookup avatar!
const BASE_PROCESSED_DIR = 'D:/scraper_framework_v3/scraper_framework_latest/data_processed'
const BASE_RAW_DIR = 'D:/scraper_framework_v3/scraper_framework_latest/data'
const ALL_DIRS = ['crushon', 'genraton', 'mufy', 'rubii'] as const
const RUBII_ORIGIN = 'https://rubii.ai'

const onlyArg = process.argv.find((a) => a.startsWith('--only='))
const onlySource = onlyArg?.slice('--only='.length)?.trim()
const DIRS = onlySource
  ? ALL_DIRS.filter((d) => d === onlySource)
  : [...ALL_DIRS]

if (onlySource && DIRS.length === 0) {
  console.error(`Unknown --only=${onlySource}. Use one of: ${ALL_DIRS.join(', ')}`)
  process.exit(1)
}

function mediaFieldToRubiiUrl(field: unknown): string | null {
  if (field == null) return null
  if (typeof field === 'string') {
    const s = field.trim()
    if (!s) return null
    if (s.startsWith('http://') || s.startsWith('https://')) return s
    if (s.startsWith('/')) return RUBII_ORIGIN + s
    return null
  }
  if (typeof field === 'object') {
    const o = field as Record<string, unknown>
    const s3 = o.s3_key
    if (typeof s3 === 'string' && s3.trim()) {
      const k = s3.trim()
      return k.startsWith('http') ? k : RUBII_ORIGIN + (k.startsWith('/') ? k : `/${k}`)
    }
    const url = o.url
    if (typeof url === 'string' && url.trim()) return mediaFieldToRubiiUrl(url)
  }
  return null
}

/** Genraton: per-app JSON in data/genraton/chats/ has avatar/cover; character_list is incomplete. */
function mergeGenratonRawItem(
  rawMap: Map<string, unknown>,
  file: string,
  originalId: string | undefined,
  title: string
): Record<string, unknown> {
  const fromMap = (rawMap.get(originalId || '') ||
    rawMap.get(`name:${title}`) ||
    {}) as Record<string, unknown>
  const chatPath = path.join(BASE_RAW_DIR, 'genraton', 'chats', file)
  if (!fs.existsSync(chatPath)) return fromMap
  try {
    const chat = JSON.parse(fs.readFileSync(chatPath, 'utf-8')) as Record<string, unknown>
    return { ...fromMap, ...chat }
  } catch {
    return fromMap
  }
}

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

/** MySQL @db.Text safe upper bound */
const MAX_TEXT_FIELD = 65_000

function clipDbText(s: string | null): string | null {
  if (s == null) return null
  return s.length <= MAX_TEXT_FIELD ? s : s.slice(0, MAX_TEXT_FIELD)
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function coalesceStr(...vals: unknown[]): string | null {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return null
}

/**
 * Map crawler / processed JSON into Prisma Character roleplay columns.
 * Order: localized blob first, then processed root, then raw list / nested _raw.
 */
function extractRoleplayFields(
  data: Record<string, unknown>,
  langData: Record<string, unknown>,
  rawItem: Record<string, unknown>
): {
  personality: string | null
  scenario: string | null
  appearance: string | null
  introduction: string | null
  systemPrompt: string | null
} {
  const dataMeta = asRecord(data._meta)
  const rawMeta = asRecord(rawItem._meta)
  const rawNested = asRecord(rawItem._raw) || asRecord(data._raw)
  const detail = asRecord(data.detail) || asRecord(rawItem.detail)
  const charInfo = asRecord(data.char_info) || asRecord(rawItem.char_info)

  const personality = clipDbText(
    coalesceStr(
      langData.personality,
      langData.persona,
      data.personality,
      data.persona,
      rawItem.personality,
      rawItem.persona,
      rawNested?.personality,
      rawNested?.persona,
      dataMeta?.personality,
      rawMeta?.personality,
      detail?.personality,
      charInfo?.personality,
      data.char_description,
      rawItem.char_description,
      rawNested?.char_description
    )
  )

  const scenario = clipDbText(
    coalesceStr(
      langData.scenario,
      langData.world_scenario,
      data.scenario,
      data.world_scenario,
      rawItem.scenario,
      rawNested?.scenario,
      dataMeta?.scenario,
      rawMeta?.scenario,
      detail?.scenario,
      charInfo?.scenario,
      data.background_story,
      rawItem.background_story
    )
  )

  const appearance = clipDbText(
    coalesceStr(
      langData.appearance,
      langData.char_appearance,
      data.appearance,
      data.char_appearance,
      rawItem.appearance,
      rawNested?.appearance,
      rawNested?.char_appearance,
      dataMeta?.appearance,
      rawMeta?.appearance,
      detail?.appearance,
      charInfo?.appearance,
      data.physical_description,
      rawItem.physical_description
    )
  )

  const introduction = clipDbText(
    coalesceStr(
      langData.introduction,
      data.introduction,
      rawItem.introduction,
      rawNested?.introduction,
      data.intro_html,
      data.profile_html,
      data.card_html,
      rawItem.intro_html,
      rawNested?.introduction_html
    )
  )

  const systemPrompt = clipDbText(
    coalesceStr(
      langData.system_prompt,
      langData.systemPrompt,
      data.system_prompt,
      data.systemPrompt,
      rawItem.system_prompt,
      rawNested?.system_prompt,
      data.system,
      data.instructions,
      data.prompt,
      dataMeta?.system_prompt,
      rawMeta?.system_prompt,
      detail?.system_prompt
    )
  )

  return { personality, scenario, appearance, introduction, systemPrompt }
}

async function main() {
  console.log('🤖 Starting to import additional character sources into RDS...')
  if (onlySource) console.log(`   (restricted to: ${onlySource})`)

  let totalCreated = 0
  let totalSkipped = 0
  let totalUpdated = 0

  for (const source of DIRS) {
    const dirPath = path.join(BASE_PROCESSED_DIR, source)
    const rawListPath = path.join(BASE_RAW_DIR, source, 'character_list.json')
    
    if (!fs.existsSync(dirPath)) {
      console.warn(`Directory not found: ${dirPath}`)
      continue
    }
    
    // Load raw list into memory for avatar lookups
    const rawMap = new Map()
    if (fs.existsSync(rawListPath)) {
      try {
        const rawData = JSON.parse(fs.readFileSync(rawListPath, 'utf-8'))
        for (const item of rawData) {
            // Find the unique ID based on the source
            let id = item.id || item.characterId || item._id || item.object_id || item.role_id;
            // Also store by name as fallback
            let name = item.name || item.title;
            if (id) rawMap.set(id.toString(), item);
            const characterId = (item as { character_id?: string }).character_id;
            if (characterId) rawMap.set(characterId, item);
            if (name) rawMap.set(`name:${name}`, item);
        }
        console.log(`Loaded ${rawMap.size} raw mapping entries for ${source}`)
      } catch (e) {
        console.error(`Failed to load raw list for ${source}`, e)
      }
    }

    const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json'))
    console.log(`\nFound ${files.length} files in ${source}.`)

    for (const file of files) {
      try {
        const filePath = path.join(dirPath, file)
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        
        const title = data.name || data.title
        const originalId = data._original_id
        if (!title) {
          totalSkipped++
          continue
        }
        
        // Find avatar from rawMap (+ genraton chats/*.json when present)
        const rawItem =
          source === 'genraton'
            ? mergeGenratonRawItem(rawMap, file, originalId, title)
            : ((rawMap.get(originalId) || rawMap.get(`name:${title}`) || {}) as Record<string, unknown>)
        const defaultAvatar =
          'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&h=400&auto=format&fit=crop'

        let avatar: string
        if (source === 'rubii') {
          avatar =
            mediaFieldToRubiiUrl(rawItem.avatar) ||
            mediaFieldToRubiiUrl(rawItem.cover) ||
            mediaFieldToRubiiUrl((rawItem as { avatarUrl?: unknown }).avatarUrl) ||
            mediaFieldToRubiiUrl(data.avatar) ||
            mediaFieldToRubiiUrl(data.cover) ||
            mediaFieldToRubiiUrl(data.cover_image) ||
            defaultAvatar
        } else {
          let av: unknown =
            rawItem.avatar ||
            rawItem.avatarUrl ||
            rawItem.cover ||
            rawItem.cover_image ||
            data.avatar ||
            data.cover_image ||
            defaultAvatar

          // Genraton specific avatar extraction from nested _raw object
          const rawNested = (rawItem as Record<string, unknown>)._raw as
            | Record<string, unknown>
            | undefined
            | null;
          if (source === 'genraton' && rawNested && rawNested.cover != null) {
            av = rawNested.cover
          } else if (
            source === 'genraton' &&
            typeof av === 'string' &&
            !av.startsWith('http') &&
            data.avatar &&
            typeof data.avatar === 'object' &&
            data.avatar !== null &&
            'url' in data.avatar
          ) {
            const u = (data.avatar as { url?: unknown }).url
            if (typeof u === 'string') av = u
          } else if (
            source === 'genraton' &&
            rawItem.avatar &&
            typeof rawItem.avatar === 'object' &&
            rawItem.avatar !== null &&
            'url' in rawItem.avatar
          ) {
            const u = (rawItem.avatar as { url?: unknown }).url
            if (typeof u === 'string') av = u
          }

          avatar = typeof av === 'string' ? av : defaultAvatar
        }
        
        // Determine language priority
        const langData = data.zh_tw || data.en || {}
        let description = langData.description || data.describe || data.summary || 'No description available.'
        let greeting = langData.greeting || data.greeting || null

        const langObj =
          typeof langData === 'object' && langData !== null
            ? (langData as Record<string, unknown>)
            : {}
        const rp = extractRoleplayFields(data, langObj, rawItem)

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
        
        // NSFW mapping
        const nsfwKeywords = ['nsfw', '18+', 'r18', 'sm', 'erotic', 'adult', 'h', 'ecchi', 'sex']
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

        // Check if name exists
        const existingByName = await prisma.character.findFirst({ where: { name: title } })
        
        // We do NOT use existingByName to merge anymore.
        // We want to force each source's character to be imported individually based on its source.
        // We only use existingBySourceUrl to know if THIS specific json file was imported already.
        const existingBySourceUrl = await prisma.character.findFirst({
          where: { sourceUrl: originalId || file }
        })

        const existing = existingBySourceUrl;

        if (existing) {
          slug = existing.slug
          isUnique = true
        } else {
          // Resolve slug conflicts for new creation
          while (!isUnique) {
            const existingSlug = await prisma.character.findUnique({ where: { slug } })
            if (!existingSlug) {
              isUnique = true
            } else {
              attempt++
              slug = `${baseSlug}-${attempt}`
            }
          }
        }
        
        const creatorName = rawItem.creatorName || rawItem.create_by_name || rawItem.author_name || data.create_by_name || data._meta?.author_name || source || null;

        const isDefaultAvatar = typeof avatar === 'string' && avatar.includes('unsplash.com')

        if (existing) {
          // If we found a proper avatar that isn't the fallback, use it. Otherwise keep existing.
          const newAvatar = isDefaultAvatar ? existing.avatar : avatar;
          
          await prisma.character.update({
            where: { id: existing.id },
            data: {
              greeting: greeting || existing.greeting,
              description: description.substring(0, 5000),
              gender: genderStr || existing.gender,
              chatCount: Math.max(existing.chatCount, chatCount),
              isNsfw: existing.isNsfw || isNsfw,
              avatar: newAvatar,
              creatorName: creatorName === source ? existing.creatorName : (creatorName || existing.creatorName),
              personality: rp.personality ?? existing.personality,
              scenario: rp.scenario ?? existing.scenario,
              appearance: rp.appearance ?? existing.appearance,
              introduction: rp.introduction ?? existing.introduction,
              systemPrompt: rp.systemPrompt ?? existing.systemPrompt,
            }
          })
          console.log(`  ✅ Updated existing by source: ${title}`)
          totalUpdated++
        } else {
          await prisma.character.create({
            data: {
              name: title,
              slug,
              avatar: avatar,
              description: description.substring(0, 5000),
              categorySlug,
              status: ContentStatus.PUBLISHED,
              source: ContentSource.CRAWLER,
              sourceUrl: originalId || file,
              greeting,
              gender: genderStr,
              chatCount,
              isNsfw,
              creatorName,
              ...(rp.personality != null && { personality: rp.personality }),
              ...(rp.scenario != null && { scenario: rp.scenario }),
              ...(rp.appearance != null && { appearance: rp.appearance }),
              ...(rp.introduction != null && { introduction: rp.introduction }),
              ...(rp.systemPrompt != null && { systemPrompt: rp.systemPrompt }),
            },
          })
          console.log(`  ✅ Imported new: ${title} [${categorySlug}]`)
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