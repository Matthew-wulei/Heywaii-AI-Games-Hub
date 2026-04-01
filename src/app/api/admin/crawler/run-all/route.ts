import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth-api";
import { runAllScrapers } from "@/lib/crawler/orchestrator";

export async function POST() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const summary = await runAllScrapers();
  return NextResponse.json({ ok: true, ...summary });
}
