import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.playHistory.findMany({
    where: { userId },
    orderBy: { playedAt: "desc" },
    take: 50,
    include: {
      game: {
        select: { slug: true, title: true, coverImage: true, shortDescription: true },
      },
    },
  });

  return NextResponse.json({
    items: rows.map((r) => ({
      playedAt: r.playedAt.toISOString(),
      game: r.game,
    })),
  });
}
