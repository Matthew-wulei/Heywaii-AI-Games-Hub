import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
p.character.count().then(console.log).finally(() => p.$disconnect())