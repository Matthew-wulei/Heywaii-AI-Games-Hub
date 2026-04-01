import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth-api";
import { runScraperByName } from "@/lib/crawler/orchestrator";

/**
 * POST /api/admin/crawler/run
 * Body: { "scraperName": "freeai.games" }
 *
 * Runs a single named scraper and returns the import summary.
 * Replaces the old CrawlerSource-based single-run endpoint.
 */

const bodySchema = z.object({
  scraperName: z.string().min(1),
});

export async function POST(req: Request) {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body — expected { scraperName: string }" }, { status: 400 });
  }

  const summary = await runScraperByName(parsed.data.scraperName);
  return NextResponse.json({ ok: true, ...summary });
}
