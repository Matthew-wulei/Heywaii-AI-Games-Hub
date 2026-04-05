import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const char = await prisma.character.findFirst({ where: { name: 'Lyla' } })
  console.log(JSON.stringify(char, null, 2))
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())