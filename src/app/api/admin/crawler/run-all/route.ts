import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth-api";
import { importAllCrawlerSources } from "@/lib/crawler/import-from-source";

export async function POST() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const results = await importAllCrawlerSources();
  return NextResponse.json({ ok: true, results });
}
