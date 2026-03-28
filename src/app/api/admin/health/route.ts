import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth-api";
import { decryptSecret } from "@/lib/crypto";

export async function GET() {
  const admin = await requireAdminSession();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const openaiRow = await prisma.officialApiConfig.findUnique({
    where: { provider: "OPENAI" },
  });

  let openaiMs: number | null = null;
  let openaiOk = false;

  const envKey = process.env.OPENAI_API_KEY;
  let apiKey = envKey ?? "";
  if (openaiRow?.key?.trim()) {
    try {
      apiKey = decryptSecret(openaiRow.key);
    } catch {
      apiKey = openaiRow.key;
    }
  }

  if (apiKey) {
    const t0 = Date.now();
    try {
      const r = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${apiKey}` },
        signal: AbortSignal.timeout(8000),
      });
      openaiOk = r.ok;
      openaiMs = Date.now() - t0;
    } catch {
      openaiOk = false;
      openaiMs = null;
    }
  }

  return NextResponse.json({
    openai: {
      ok: openaiOk,
      pingMs: openaiMs,
      configured: Boolean(apiKey),
    },
    anthropic: {
      ok: false,
      pingMs: null,
      configured: false,
    },
  });
}
