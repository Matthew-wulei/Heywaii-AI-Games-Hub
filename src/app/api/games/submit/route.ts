import { NextResponse } from "next/server";
import { z } from "zod";
import { ContentStatus, ContentSource } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uniqueGameSlug } from "@/lib/slug";

const submitSchema = z.object({
  title: z.string().min(2).max(200),
  url: z.string().url().optional().or(z.literal("")),
  shortDescription: z.string().min(10).max(500),
  fullDescription: z.string().max(20000).optional(),
  categorySlug: z.string().min(1).max(64),
  coverImage: z.string().url().max(2048),
  tags: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json();
  const parsed = submitSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;
  const slug = await uniqueGameSlug(d.title);
  const game = await prisma.game.create({
    data: {
      title: d.title,
      slug,
      url: d.url || null,
      shortDescription: d.shortDescription,
      fullDescription: d.fullDescription ?? d.shortDescription,
      coverImage: d.coverImage,
      categorySlug: d.categorySlug.toLowerCase(),
      status: ContentStatus.PENDING,
      source: ContentSource.UGC,
      authorId: session.user.id,
    },
  });

  const tagNames = (d.tags ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const name of tagNames) {
    const tag = await prisma.tag.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    await prisma.gameTag.create({
      data: { gameId: game.id, tagId: tag.id },
    });
  }

  return NextResponse.json({ ok: true, slug: game.slug });
}
