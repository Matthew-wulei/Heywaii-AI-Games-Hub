import slugify from "slugify";
import { prisma } from "@/lib/prisma";

export function toSlug(input: string): string {
  return slugify(input, { lower: true, strict: true, trim: true });
}

export async function uniqueGameSlug(base: string): Promise<string> {
  let slug = toSlug(base);
  let n = 0;
  for (;;) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const exists = await prisma.game.findUnique({ where: { slug: candidate } });
    if (!exists) return candidate;
    n += 1;
  }
}

export async function uniqueCharacterSlug(base: string): Promise<string> {
  let slug = toSlug(base);
  let n = 0;
  for (;;) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const exists = await prisma.character.findUnique({ where: { slug: candidate } });
    if (!exists) return candidate;
    n += 1;
  }
}

export async function uniqueArticleSlug(base: string): Promise<string> {
  let slug = toSlug(base);
  let n = 0;
  for (;;) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const exists = await prisma.article.findUnique({ where: { slug: candidate } });
    if (!exists) return candidate;
    n += 1;
  }
}
