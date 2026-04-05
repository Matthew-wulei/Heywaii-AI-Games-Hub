import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  // eslint-disable-next-line no-var
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

/**
 * After changing prisma/schema.prisma, run `pnpm exec prisma generate` and
 * restart the dev server. A cached `globalThis.prisma` from before generate
 * will not pick up new models (e.g. CharacterLike, CharacterChat) until restart.
 */
export const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma
