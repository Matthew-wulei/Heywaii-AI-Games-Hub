import { NextResponse } from "next/server";
import { z } from "zod";
import { load } from "cheerio";
import { ContentSource, ContentStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth-api";
import { uniqueGameSlug } from "@/lib/slug";

const bodySchema = z.object({
  sourceId: z.string().min(1),
});

export async function POST(req: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const source = await prisma.crawlerSource.findUnique({
    where: { id: parsed.data.sourceId },
  });
  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  const dup = await prisma.game.findFirst({
    where: { sourceUrl: source.entryUrl },
  });
  if (dup) {
    return NextResponse.json({ ok: true, skipped: true, reason: "duplicate_source_url" });
  }

  const res = await fetch(source.entryUrl, {
    headers: { "User-Agent": "HeyWaiiCrawler/1.0" },
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) {
    return NextResponse.json(
      { error: `Fetch failed: ${res.status}` },
      { status: 502 }
    );
  }
  const html = await res.text();
  const $ = load(html);
  let title =
    (source.itemSelector
      ? $(source.itemSelector).first().text().trim()
      : "") ||
    $("h1").first().text().trim() ||
    $("title").first().text().trim() ||
    "Imported game";
  title = title.replace(/\s+/g, " ").slice(0, 200);

  const slug = await uniqueGameSlug(title);
  await prisma.game.create({
    data: {
      title,
      slug,
      url: source.entryUrl,
      shortDescription: title.slice(0, 150),
      fullDescription: `Automatically imported from ${source.entryUrl}`,
      coverImage:
        "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop",
      categorySlug: "imported",
      status: ContentStatus.PENDING,
      source: ContentSource.CRAWLER,
      sourceUrl: source.entryUrl,
    },
  });

  return NextResponse.json({ ok: true, slug });
}
