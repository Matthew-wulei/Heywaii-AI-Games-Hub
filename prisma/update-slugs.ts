import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'

const prisma = new PrismaClient()

function slugify(text: string): string {
  // First attempt: try to convert the actual characters
  const slug = text
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '') // Allow Chinese characters, alphanumeric, spaces and hyphens
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 80) // Limit length
    
  return slug;
}

async function main() {
  console.log('🔄 Updating character slugs...')
  
  const chars = await prisma.character.findMany({
    where: { 
      slug: { startsWith: 'taptale-' } 
    }
  })
  
  console.log(`Found ${chars.length} characters with taptale-* slugs`)
  
  let updated = 0
  
  for (const char of chars) {
    let baseSlug = slugify(char.name)
    
    // If slugify stripped everything out (e.g. full width special chars), use a hash of the name
    if (!baseSlug || baseSlug === '-') {
      baseSlug = crypto.createHash('md5').update(char.name).digest('hex').substring(0, 10)
    }

    let slug = baseSlug
    let attempt = 0
    let isUnique = false

    // Handle slug conflicts
    while (!isUnique) {
      const existing = await prisma.character.findUnique({ where: { slug } })
      // If no existing record OR existing record is THIS record (we are updating itself to the same generated slug)
      if (!existing || existing.id === char.id) {
        isUnique = true
      } else {
        attempt++
        slug = `${baseSlug}-${attempt}`
      }
    }
    
    if (char.slug !== slug) {
      await prisma.character.update({
        where: { id: char.id },
        data: { slug }
      })
      console.log(`Updated [${char.name}]: ${char.slug} -> ${slug}`)
      updated++
    }
  }
  
  // also fix those ones with just a "-" as slug
  const badChars = await prisma.character.findMany({
    where: { 
      slug: '-'
    }
  })
  
  for (const char of badChars) {
    let baseSlug = slugify(char.name)
    if (!baseSlug || baseSlug === '-') {
      baseSlug = crypto.createHash('md5').update(char.name).digest('hex').substring(0, 10)
    }

    let slug = baseSlug
    let attempt = 0
    let isUnique = false

    while (!isUnique) {
      const existing = await prisma.character.findUnique({ where: { slug } })
      if (!existing || existing.id === char.id) {
        isUnique = true
      } else {
        attempt++
        slug = `${baseSlug}-${attempt}`
      }
    }
    
    if (char.slug !== slug) {
      await prisma.character.update({
        where: { id: char.id },
        data: { slug }
      })
      console.log(`Updated bad slug [${char.name}]: ${char.slug} -> ${slug}`)
      updated++
    }
  }
  
  console.log(`\n✅ Finished updating slugs! Changed ${updated} characters.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
