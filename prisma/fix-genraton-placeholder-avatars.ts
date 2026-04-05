/**
 * Fix Genraton characters that still use the Unsplash placeholder avatar.
 * Full cover URLs live in data/genraton/chats/{object_id}.json (not always in character_list.json).
 *
 *   pnpm exec npx tsx prisma/fix-genraton-placeholder-avatars.ts
 *   pnpm exec npx tsx prisma/fix-genraton-placeholder-avatars.ts --dry-run
 */
import fs from 'fs'
import path from 'path'
import { PrismaClient, ContentSource } from '@prisma/client'

const prisma = new PrismaClient()

const GENRATON_PROCESSED = 'D:/scraper_framework_v3/scraper_framework_latest/data_processed/genraton'
const GENRATON_CHATS = 'D:/scraper_framework_v3/scraper_framework_latest/data/genraton/chats'
const GENRATON_RAW_LIST =
  'D:/scraper_framework_v3/scraper_framework_latest/data/genraton/character_list.json'
const PLACEHOLDER_SUBSTR = 'photo-1542751371-adc38448a05e'
const DEFAULT_AVATAR =
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=400&h=400&auto=format&fit=crop'
const BATCH = 400

function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function isPlaceholderAvatar(url: string): boolean {
  return url.includes(PLACEHOLDER_SUBSTR)
}

/** Aligns with core/character_image_urls.py extract_image_urls_from_raw(site=genraton) */
function imageUrlFromGenratonChatRaw(data: Record<string, unknown>): string | null {
  let u = str(data.avatar)
  if (u) return u
  u = str(data.cover_image)
  if (u) return u
  const detail = data._detail
  const raw = data._raw
  const d = detail && typeof detail === 'object' ? (detail as Record<string, unknown>) : null
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : null
  u = str(d?.cover) || str(r?.cover)
  if (u) return u
  u = str(d?.cover_tiny)
  if (u) return u
  u = str(d?.icon)
  if (u) return u
  return null
}

function buildRawMap(rawData: unknown[]): Map<string, Record<string, unknown>> {
  const rawMap = new Map<string, Record<string, unknown>>()
  for (const item of rawData) {
    if (!item || typeof item !== 'object') continue
    const row = item as Record<string, unknown>
    const id =
      row.id ||
      row.characterId ||
      row._id ||
      row.object_id ||
      row.role_id
    const name = row.name || row.title
    if (id) rawMap.set(String(id), row)
    const characterId = row.character_id
    if (characterId) rawMap.set(String(characterId), row)
    if (name) rawMap.set(`name:${name}`, row)
  }
  return rawMap
}

/** Fallback when chats/*.json is missing — same as import-other-sources-v3 genraton branch */
function resolveGenratonAvatarFromList(
  data: Record<string, unknown>,
  rawItem: Record<string, unknown>
): string {
  let av: unknown =
    rawItem.avatar ||
    rawItem.avatarUrl ||
    rawItem.cover ||
    rawItem.cover_image ||
    data.avatar ||
    data.cover_image ||
    DEFAULT_AVATAR

  const rawNested = rawItem._raw
  if (rawNested && typeof rawNested === 'object' && (rawNested as Record<string, unknown>).cover) {
    av = (rawNested as Record<string, unknown>).cover
  } else if (
    typeof av === 'string' &&
    !av.startsWith('http') &&
    data.avatar &&
    typeof data.avatar === 'object' &&
    (data.avatar as Record<string, unknown>).url
  ) {
    av = (data.avatar as Record<string, unknown>).url
  } else if (
    typeof rawItem.avatar === 'object' &&
    rawItem.avatar &&
    (rawItem.avatar as Record<string, unknown>).url
  ) {
    av = (rawItem.avatar as Record<string, unknown>).url
  }

  return typeof av === 'string' ? av : DEFAULT_AVATAR
}

function baseIdFromSourceUrl(sourceUrl: string | null): string | null {
  if (!sourceUrl) return null
  return sourceUrl.endsWith('.json') ? sourceUrl.slice(0, -'.json'.length) : sourceUrl
}

function processedPath(baseId: string): string {
  return path.join(GENRATON_PROCESSED, `${baseId}.json`)
}

async function main() {
  const dryRun = process.argv.includes('--dry-run')

  if (!fs.existsSync(GENRATON_PROCESSED)) {
    console.error(`Missing: ${GENRATON_PROCESSED}`)
    process.exit(1)
  }
  if (!fs.existsSync(GENRATON_CHATS)) {
    console.error(`Missing: ${GENRATON_CHATS}`)
    process.exit(1)
  }

  const ids = new Set<string>()
  for (const name of fs.readdirSync(GENRATON_PROCESSED)) {
    if (!name.endsWith('.json')) continue
    const base = name.slice(0, -'.json'.length)
    ids.add(base)
    ids.add(name)
  }
  const list = [...ids]

  const placeholderRows: { id: string; sourceUrl: string | null; slug: string; avatar: string }[] = []
  for (let i = 0; i < list.length; i += BATCH) {
    const chunk = list.slice(i, i + BATCH)
    const found = await prisma.character.findMany({
      where: {
        source: ContentSource.CRAWLER,
        sourceUrl: { in: chunk },
        avatar: { contains: PLACEHOLDER_SUBSTR },
      },
      select: { id: true, sourceUrl: true, slug: true, avatar: true },
    })
    placeholderRows.push(...found)
  }

  console.log(`Placeholder Genraton rows: ${placeholderRows.length}${dryRun ? ' (dry-run)' : ''}\n`)

  let rawMap: Map<string, Record<string, unknown>> | null = null
  function getRawMap(): Map<string, Record<string, unknown>> {
    if (!rawMap) {
      if (!fs.existsSync(GENRATON_RAW_LIST)) {
        rawMap = new Map()
      } else {
        console.log('Loading character_list.json for fallback lookups…')
        const rawData = JSON.parse(fs.readFileSync(GENRATON_RAW_LIST, 'utf-8')) as unknown[]
        rawMap = buildRawMap(rawData)
      }
    }
    return rawMap
  }

  let updated = 0
  let skippedStillPlaceholder = 0
  let skippedNoProcessedFile = 0
  let skippedNoSource = 0
  let skippedUnchanged = 0
  let fromChats = 0
  let fromListFallback = 0

  for (const row of placeholderRows) {
    const baseId = baseIdFromSourceUrl(row.sourceUrl)
    if (!baseId) {
      skippedNoSource++
      continue
    }

    const procPath = processedPath(baseId)
    if (!fs.existsSync(procPath)) {
      skippedNoProcessedFile++
      console.warn(`No processed file: ${baseId}`)
      continue
    }

    let data: Record<string, unknown>
    try {
      data = JSON.parse(fs.readFileSync(procPath, 'utf-8')) as Record<string, unknown>
    } catch (e) {
      console.warn(`Parse processed ${procPath}:`, e)
      continue
    }

    const chatPath = path.join(GENRATON_CHATS, `${baseId}.json`)
    let newAvatar: string | null = null

    if (fs.existsSync(chatPath)) {
      try {
        const chat = JSON.parse(fs.readFileSync(chatPath, 'utf-8')) as Record<string, unknown>
        newAvatar = imageUrlFromGenratonChatRaw(chat)
      } catch (e) {
        console.warn(`Parse chat ${chatPath}:`, e)
      }
    }

    if (!newAvatar || isPlaceholderAvatar(newAvatar)) {
      const title = (data.name || data.title) as string | undefined
      const originalId = data._original_id as string | undefined
      const rm = getRawMap()
      const rawItem =
        (originalId ? rm.get(originalId) : undefined) ||
        (title ? rm.get(`name:${title}`) : undefined) ||
        {}
      newAvatar = resolveGenratonAvatarFromList(data, rawItem)
      if (!isPlaceholderAvatar(newAvatar)) fromListFallback++
    } else {
      fromChats++
    }

    if (isPlaceholderAvatar(newAvatar)) {
      skippedStillPlaceholder++
      console.warn(`Still placeholder: ${row.slug} (${row.sourceUrl})`)
      continue
    }

    if (newAvatar === row.avatar) {
      skippedUnchanged++
      continue
    }

    if (dryRun) {
      console.log(`[dry-run] ${row.slug}\n  -> ${newAvatar.slice(0, 100)}…`)
      updated++
      continue
    }

    await prisma.character.update({
      where: { id: row.id },
      data: { avatar: newAvatar },
    })
    updated++
  }

  console.log(
    `\nDone. ${dryRun ? 'Would update' : 'Updated'}: ${updated}, still placeholder: ${skippedStillPlaceholder}, no processed: ${skippedNoProcessedFile}, no sourceUrl: ${skippedNoSource}, unchanged: ${skippedUnchanged}`
  )
  console.log(`Resolved from chats/*.json: ${fromChats}, list fallback attempts: ${fromListFallback}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
