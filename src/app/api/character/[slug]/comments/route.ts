import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  characterSocialModelsReady,
  CHARACTER_SOCIAL_CLIENT_HINT,
} from "@/lib/prisma-character-social";
import { ContentStatus } from "@prisma/client";
import { normalizeCharacterRouteSegment } from "@/lib/queries/content";

const MAX_LEN = 2000;

function validatePlainComment(text: string): string | null {
  const t = text.trim();
  if (!t) return "Comment cannot be empty.";
  if (t.length > MAX_LEN) return `Comment must be at most ${MAX_LEN} characters.`;
  if (/https?:\/\//i.test(t)) return "Links are not allowed.";
  if (/\[.+?\]\(.+?\)/.test(t)) return "Rich text or markdown links are not allowed.";
  if (/<\/?[a-z][\s\S]*>/i.test(t)) return "HTML tags are not allowed.";
  return null;
}

export async function GET(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  if (!characterSocialModelsReady(prisma)) {
    return NextResponse.json({ comments: [] });
  }

  const { slug: rawSlug } = await ctx.params;
  const slug = normalizeCharacterRouteSegment(rawSlug);

  const character = await prisma.character.findFirst({
    where: { slug, status: ContentStatus.PUBLISHED },
    select: { id: true },
  });
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const rows = await prisma.characterComment.findMany({
    where: { characterId: character.id },
    orderBy: { createdAt: "desc" },
    take: 80,
    select: {
      id: true,
      body: true,
      createdAt: true,
      user: { select: { name: true, image: true } },
    },
  });

  return NextResponse.json({
    comments: rows.map((r) => ({
      id: r.id,
      body: r.body,
      createdAt: r.createdAt.toISOString(),
      authorName: r.user.name || "Member",
      authorImage: r.user.image,
    })),
  });
}

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Sign in to comment." }, { status: 401 });
  }

  if (!characterSocialModelsReady(prisma)) {
    return NextResponse.json({ error: CHARACTER_SOCIAL_CLIENT_HINT }, { status: 503 });
  }

  let bodyRaw: unknown;
  try {
    bodyRaw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const body =
    typeof bodyRaw === "object" && bodyRaw !== null && "body" in bodyRaw
      ? String((bodyRaw as { body: unknown }).body ?? "")
      : "";

  const err = validatePlainComment(body);
  if (err) {
    return NextResponse.json({ error: err }, { status: 400 });
  }

  const { slug: rawSlug } = await ctx.params;
  const slug = normalizeCharacterRouteSegment(rawSlug);

  const character = await prisma.character.findFirst({
    where: { slug, status: ContentStatus.PUBLISHED },
    select: { id: true },
  });
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const created = await prisma.characterComment.create({
    data: {
      userId,
      characterId: character.id,
      body: body.trim(),
    },
    select: {
      id: true,
      body: true,
      createdAt: true,
      user: { select: { name: true, image: true } },
    },
  });

  return NextResponse.json({
    comment: {
      id: created.id,
      body: created.body,
      createdAt: created.createdAt.toISOString(),
      authorName: created.user.name || "Member",
      authorImage: created.user.image,
    },
  });
}
