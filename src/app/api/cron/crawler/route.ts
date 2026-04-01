import { NextResponse } from "next/server";
import { runAllScrapers } from "@/lib/crawler/orchestrator";

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

  const summary = await runAllScrapers();
  return NextResponse.json({ ok: true, ...summary });
}
