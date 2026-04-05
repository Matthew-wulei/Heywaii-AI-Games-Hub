import { PrismaClient, ContentSource } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const result = await prisma.character.deleteMany({
    where: {
      source: ContentSource.CRAWLER,
      OR: [
        { sourceUrl: { startsWith: 'chara_' } },
        { avatar: { contains: 'rubii.ai' } },
        { avatar: { contains: 'rubi.ai' } },
      ],
    },
  })
  console.log(`Deleted ${result.count} crawler characters (Rubii: chara_* sourceUrl or rubii/rubi avatar host).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
