import { NextResponse } from "next/server";
import { importAllCrawlerSources } from "@/lib/crawler/import-from-source";

/**
 * Vercel Cron: set CRON_SECRET in project env and add to vercel.json crons.
 * Header: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 503 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await importAllCrawlerSources();
  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), results });
}
