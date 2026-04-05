import { prisma } from "@/lib/prisma";
import { characterSocialModelsReady } from "@/lib/prisma-character-social";
import { ContentStatus, Prisma } from "@prisma/client";

export type CharacterListRow = {
  id: string;
  slug: string;
  name: string;
  avatar: string;
  categorySlug: string;
  description: string;
  creatorName: string | null;
  chatCount: number;
};

/** UTC YYYY-MM-DD — same order for everyone today; stable for skip/take until the next UTC day. */
function characterFeedShuffleSeed(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Character listing for /character feed + API.
 * NSFW is an outer scope: only when `isNsfw === true` may NSFW rows appear; otherwise the pool is SFW-only.
 * - trending: chatCount (optional NSFW-first ordering within that pool when opted in)
 * - recent: MD5(id, dailySeed) mix within the same pool — never widens past the NSFW gate above
 * 
 * Non-NSFW requirement: Ensure characters from taptale.ai appear first and make up at least 40% of each page.
 */
export async function queryCharacterFeed(params: {
  take: number;
  skip: number;
  orderBy: "recent" | "trending";
  categorySlug?: string;
  gender?: "Male" | "Female";
  /** Only explicit `true` opts in to NSFW rows; `false` / `undefined` ⇒ strict SFW. */
  isNsfw?: boolean;
  searchQuery?: string;
}): Promise<CharacterListRow[]> {
  const { take, skip, orderBy, categorySlug, gender, isNsfw, searchQuery } = params;
  const allowNsfwInFeed = isNsfw === true;

  // Interleaved fetching logic for non-NSFW to ensure 40% TapTale AI characters
  if (!allowNsfwInFeed && !searchQuery?.trim()) {
    const targetTapTaleCount = Math.ceil(take * 0.4);
    const targetOtherCount = take - targetTapTaleCount;
    
    // We calculate proportional skips
    // If overall we want to skip `skip` items, we skip 40% of them from taptale, 60% from others
    const skipTapTale = Math.floor(skip * 0.4);
    const skipOther = skip - skipTapTale;

    const baseConditions: Prisma.Sql[] = [Prisma.sql`c.status = ${ContentStatus.PUBLISHED}`, Prisma.sql`c.isNsfw = false`];
    if (categorySlug) baseConditions.push(Prisma.sql`c.categorySlug = ${categorySlug}`);
    if (gender) baseConditions.push(Prisma.sql`c.gender = ${gender}`);
    
    const tapTaleConditions = [...baseConditions, Prisma.sql`c.avatar LIKE '%taptale.ai%'`];
    const otherConditions = [...baseConditions, Prisma.sql`c.avatar NOT LIKE '%taptale.ai%' OR c.avatar IS NULL`];

    const tapTaleWhereSql = Prisma.join(tapTaleConditions, " AND ");
    const otherWhereSql = Prisma.join(otherConditions, " AND ");

    let orderSql;
    if (orderBy === "trending") {
      orderSql = Prisma.sql`c.chatCount DESC, c.id ASC`;
    } else {
      const seed = characterFeedShuffleSeed();
      orderSql = Prisma.sql`MD5(CONCAT(c.id, ${seed})) ASC`;
    }

    const [tapTaleRows, otherRows] = await Promise.all([
      prisma.$queryRaw<CharacterListRow[]>(
        Prisma.sql`
          SELECT c.id, c.slug, c.name, c.avatar, c.categorySlug, c.description, c.creatorName, c.chatCount
          FROM \`Character\` c
          WHERE ${tapTaleWhereSql}
          ORDER BY ${orderSql}
          LIMIT ${targetTapTaleCount} OFFSET ${skipTapTale}
        `
      ),
      prisma.$queryRaw<CharacterListRow[]>(
        Prisma.sql`
          SELECT c.id, c.slug, c.name, c.avatar, c.categorySlug, c.description, c.creatorName, c.chatCount
          FROM \`Character\` c
          WHERE ${otherWhereSql}
          ORDER BY ${orderSql}
          LIMIT ${targetOtherCount} OFFSET ${skipOther}
        `
      )
    ]);

    // Merge and interleave them (e.g. 1 taptale, 1 other, 1 other, 1 taptale...)
    const mergedRows: CharacterListRow[] = [];
    let tIndex = 0;
    let oIndex = 0;
    
    // We want 40% taptale, meaning ~2 out of every 5 items.
    // We'll just push them in a ratio pattern.
    while (tIndex < tapTaleRows.length || oIndex < otherRows.length) {
      if (tIndex < tapTaleRows.length) {
        mergedRows.push(tapTaleRows[tIndex++]);
      }
      if (oIndex < otherRows.length) {
        mergedRows.push(otherRows[oIndex++]);
      }
      if (oIndex < otherRows.length) { // Push a second 'other' to approximate 40/60
        mergedRows.push(otherRows[oIndex++]);
      }
    }

    return mergedRows.map((r) => ({
      ...r,
      chatCount: Number(r.chatCount),
    }));
  }

  // Original fallback logic for NSFW or when search query is active
  if (orderBy === "trending") {
    const where: Prisma.CharacterWhereInput = { status: ContentStatus.PUBLISHED };
    if (categorySlug) where.categorySlug = categorySlug;
    if (gender) where.gender = gender;
    if (!allowNsfwInFeed) where.isNsfw = false;
    if (searchQuery?.trim()) {
      where.name = { contains: searchQuery.trim() };
    }

    const orderByOptions: Prisma.CharacterOrderByWithRelationInput[] = [];
    if (allowNsfwInFeed) orderByOptions.push({ isNsfw: "desc" });
    orderByOptions.push({ chatCount: "desc" });

    return prisma.character.findMany({
      where,
      orderBy: orderByOptions,
      take,
      skip,
      select: {
        id: true,
        slug: true,
        name: true,
        avatar: true,
        categorySlug: true,
        description: true,
        creatorName: true,
        chatCount: true,
      },
    });
  }

  const seed = characterFeedShuffleSeed();
  const conditions: Prisma.Sql[] = [Prisma.sql`c.status = ${ContentStatus.PUBLISHED}`];
  if (categorySlug) conditions.push(Prisma.sql`c.categorySlug = ${categorySlug}`);
  if (gender) conditions.push(Prisma.sql`c.gender = ${gender}`);
  if (!allowNsfwInFeed) conditions.push(Prisma.sql`c.isNsfw = false`);
  if (searchQuery?.trim()) {
    const pattern = `%${searchQuery.trim()}%`;
    conditions.push(Prisma.sql`LOWER(c.name) LIKE LOWER(${pattern})`);
  }

  const whereSql = Prisma.join(conditions, " AND ");
  const orderSql = allowNsfwInFeed
    ? Prisma.sql`c.isNsfw DESC, MD5(CONCAT(c.id, ${seed})) ASC`
    : Prisma.sql`MD5(CONCAT(c.id, ${seed})) ASC`;

  const rows = await prisma.$queryRaw<CharacterListRow[]>(
    Prisma.sql`
      SELECT c.id, c.slug, c.name, c.avatar, c.categorySlug, c.description, c.creatorName, c.chatCount
      FROM \`Character\` c
      WHERE ${whereSql}
      ORDER BY ${orderSql}
      LIMIT ${take} OFFSET ${skip}
    `
  );

  return rows.map((r) => ({
    ...r,
    chatCount: Number(r.chatCount),
  }));
}

/** Trim + NFC so URL segments match DB rows across copy-paste / IME variants. */
export function normalizeCharacterRouteSegment(s: string): string {
  const t = s.trim();
  if (!t) return t;
  try {
    return t.normalize("NFC");
  } catch {
    return t;
  }
}

function safeDecodeURIComponent(s: string): string {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
}

export async function getPublishedArticles(take = 12) {
  return prisma.article.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    take,
  });
}

export async function getArticleBySlug(slug: string) {
  return prisma.article.findFirst({
    where: { slug, publishedAt: { not: null } },
  });
}

export async function getPublishedAnnouncements(take = 20) {
  return prisma.announcement.findMany({
    where: { publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    take,
  });
}

export async function getAnnouncementById(id: string) {
  return prisma.announcement.findFirst({
    where: { id, publishedAt: { not: null } },
  });
}

export async function getPublishedCharacters(
  take = 48, 
  skip = 0, 
  orderBy: 'recent' | 'trending' = 'recent',
  gender?: 'Male' | 'Female',
  isNsfw?: boolean,
  searchQuery?: string
) {
  return queryCharacterFeed({
    take,
    skip,
    orderBy,
    gender,
    isNsfw,
    searchQuery,
  });
}

export async function getPublishedCharactersCount(gender?: 'Male' | 'Female', isNsfw?: boolean, searchQuery?: string) {
  const where: any = { status: ContentStatus.PUBLISHED };
  if (gender) where.gender = gender;
  if (isNsfw === true) {
    // We allow both true/false to be counted
  } else {
    // Exclude NSFW strictly
    where.isNsfw = false;
  }
  if (searchQuery) where.name = { contains: searchQuery, mode: 'insensitive' };

  return prisma.character.count({
    where,
  });
}

export async function getCharactersByCategory(
  categorySlug: string, 
  take = 48, 
  skip = 0,
  orderBy: 'recent' | 'trending' = 'recent',
  gender?: 'Male' | 'Female',
  isNsfw?: boolean,
  searchQuery?: string
) {
  return queryCharacterFeed({
    take,
    skip,
    orderBy,
    categorySlug,
    gender,
    isNsfw,
    searchQuery,
  });
}

export async function getCharactersByCategoryCount(categorySlug: string, gender?: 'Male' | 'Female', isNsfw?: boolean, searchQuery?: string) {
  const where: any = { status: ContentStatus.PUBLISHED, categorySlug };
  if (gender) where.gender = gender;
  if (isNsfw === true) {
    // Allowed both
  } else {
    where.isNsfw = false; // Strictly exclude
  }
  if (searchQuery) where.name = { contains: searchQuery, mode: 'insensitive' };

  return prisma.character.count({
    where,
  });
}

export async function getCharacterBySlug(slugParam: string) {
  const decoded = safeDecodeURIComponent(slugParam);
  
  return prisma.character.findFirst({
    where: { 
      slug: decoded, 
      status: ContentStatus.PUBLISHED 
    },
    include: { author: { select: { name: true } } },
  });
}

/** Narrow row for `/api/chat` — explicit select so new fields are never undefined when present in DB. */
export async function getCharacterForChatBySlug(slugParam: string) {
  const decoded = safeDecodeURIComponent(slugParam);
  return prisma.character.findFirst({
    where: { slug: decoded, status: ContentStatus.PUBLISHED },
    select: {
      id: true,
      slug: true,
      name: true,
      greeting: true,
      systemPrompt: true,
      personality: true,
      scenario: true,
      appearance: true,
    },
  });
}

export async function getCharacterInteractionFlags(userId: string, characterId: string) {
  if (!characterSocialModelsReady(prisma)) {
    return { liked: false, bookmarked: false };
  }
  const [like, bookmark] = await Promise.all([
    prisma.characterLike.findUnique({
      where: { userId_characterId: { userId, characterId } },
      select: { id: true },
    }),
    prisma.characterBookmark.findUnique({
      where: { userId_characterId: { userId, characterId } },
      select: { id: true },
    }),
  ]);
  return { liked: Boolean(like), bookmarked: Boolean(bookmark) };
}

export async function getCharacterCommentsForDetail(characterId: string, take = 80) {
  if (!characterSocialModelsReady(prisma)) {
    return [];
  }
  return prisma.characterComment.findMany({
    where: { characterId },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      body: true,
      createdAt: true,
      user: { select: { name: true, image: true } },
    },
  });
}

export async function getPublishedCharacterCategorySlugs() {
  const rows = await prisma.character.groupBy({
    by: ['categorySlug'],
    where: { status: ContentStatus.PUBLISHED },
    orderBy: { categorySlug: "asc" },
  });
  return rows.map((r) => r.categorySlug);
}
