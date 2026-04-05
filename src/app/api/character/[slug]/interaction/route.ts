import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  characterSocialModelsReady,
  CHARACTER_SOCIAL_CLIENT_HINT,
} from "@/lib/prisma-character-social";
import { ContentStatus } from "@prisma/client";
import { normalizeCharacterRouteSegment } from "@/lib/queries/content";

type Body = { type?: string };

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Sign in to like or bookmark." }, { status: 401 });
  }

  if (!characterSocialModelsReady(prisma)) {
    return NextResponse.json({ error: CHARACTER_SOCIAL_CLIENT_HINT }, { status: 503 });
  }

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = body.type === "bookmark" ? "bookmark" : body.type === "like" ? "like" : null;
  if (!type) {
    return NextResponse.json({ error: "type must be \"like\" or \"bookmark\"" }, { status: 400 });
  }

  const { slug: rawSlug } = await ctx.params;
  const slug = normalizeCharacterRouteSegment(rawSlug);

  const result = await prisma.$transaction(async (tx) => {
    const character = await tx.character.findFirst({
      where: { slug, status: ContentStatus.PUBLISHED },
      select: { id: true, likeCount: true, bookmarkCount: true },
    });
    if (!character) {
      return { notFound: true as const };
    }

    if (type === "like") {
      const existing = await tx.characterLike.findUnique({
        where: { userId_characterId: { userId, characterId: character.id } },
      });
      if (existing) {
        await tx.characterLike.delete({ where: { id: existing.id } });
        await tx.character.update({
          where: { id: character.id },
          data: { likeCount: Math.max(0, character.likeCount - 1) },
        });
      } else {
        await tx.characterLike.create({
          data: { userId, characterId: character.id },
        });
        await tx.character.update({
          where: { id: character.id },
          data: { likeCount: character.likeCount + 1 },
        });
      }
    } else {
      const existing = await tx.characterBookmark.findUnique({
        where: { userId_characterId: { userId, characterId: character.id } },
      });
      if (existing) {
        await tx.characterBookmark.delete({ where: { id: existing.id } });
        await tx.character.update({
          where: { id: character.id },
          data: { bookmarkCount: Math.max(0, character.bookmarkCount - 1) },
        });
      } else {
        await tx.characterBookmark.create({
          data: { userId, characterId: character.id },
        });
        await tx.character.update({
          where: { id: character.id },
          data: { bookmarkCount: character.bookmarkCount + 1 },
        });
      }
    }

    const fresh = await tx.character.findUnique({
      where: { id: character.id },
      select: { likeCount: true, bookmarkCount: true },
    });
    const [likedRow, bookmarkedRow] = await Promise.all([
      tx.characterLike.findUnique({
        where: { userId_characterId: { userId, characterId: character.id } },
        select: { id: true },
      }),
      tx.characterBookmark.findUnique({
        where: { userId_characterId: { userId, characterId: character.id } },
        select: { id: true },
      }),
    ]);

    return {
      notFound: false as const,
      likeCount: fresh?.likeCount ?? 0,
      bookmarkCount: fresh?.bookmarkCount ?? 0,
      liked: Boolean(likedRow),
      bookmarked: Boolean(bookmarkedRow),
    };
  });

  if (result.notFound) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  return NextResponse.json({
    likeCount: result.likeCount,
    bookmarkCount: result.bookmarkCount,
    liked: result.liked,
    bookmarked: result.bookmarked,
  });
}
