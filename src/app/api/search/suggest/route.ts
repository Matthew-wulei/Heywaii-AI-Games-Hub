import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ContentStatus } from "@prisma/client";

const MAX_PER_TYPE = 8;
const MAX_Q = 80;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const raw = searchParams.get("q")?.trim() ?? "";
  const q = raw.slice(0, MAX_Q);

  if (q.length < 1) {
    return NextResponse.json({ characters: [], games: [] });
  }

  try {
    const baseWhere = { status: ContentStatus.PUBLISHED };
    const allowNsfw = searchParams.get("nsfw") === "true";
    const characterWhere = {
      ...baseWhere,
      name: { contains: q },
      ...(!allowNsfw ? { isNsfw: false } : {}),
    };

    const [characters, games] = await Promise.all([
      prisma.character.findMany({
        where: characterWhere,
        orderBy: [{ chatCount: "desc" }, { createdAt: "desc" }],
        take: MAX_PER_TYPE,
        select: {
          slug: true,
          name: true,
          avatar: true,
          categorySlug: true,
          isNsfw: true,
        },
      }),
      prisma.game.findMany({
        where: { ...baseWhere, title: { contains: q } },
        orderBy: [{ plays: "desc" }, { updatedAt: "desc" }],
        take: MAX_PER_TYPE,
        select: {
          slug: true,
          title: true,
          coverImage: true,
          categorySlug: true,
        },
      }),
    ]);

    return NextResponse.json({ characters, games });
  } catch (error) {
    console.error("search suggest:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
