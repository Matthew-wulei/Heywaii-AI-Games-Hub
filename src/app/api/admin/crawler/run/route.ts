import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth-api";
import { importGameFromCrawlerSource } from "@/lib/crawler/import-from-source";

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

  const result = await importGameFromCrawlerSource(source);
  if (!result.ok) {
    return NextResponse.json(
      { error: result.error },
      { status: result.httpStatus ?? 500 }
    );
  }
  if ("skipped" in result && result.skipped) {
    return NextResponse.json({ ok: true, skipped: true, reason: result.reason });
  }
  if ("slug" in result) {
    return NextResponse.json({ ok: true, slug: result.slug });
  }
  return NextResponse.json({ error: "Unexpected crawler result" }, { status: 500 });
}
