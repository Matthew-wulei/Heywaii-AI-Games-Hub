import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiProvider } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";

const postSchema = z.object({
  provider: z.nativeEnum(ApiProvider),
  key: z.string().min(8).max(2048),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }
  let enc: string;
  try {
    enc = encryptSecret(parsed.data.key);
  } catch {
    return NextResponse.json(
      { error: "ENCRYPTION_SECRET not configured on server" },
      { status: 500 }
    );
  }
  await prisma.userApiKey.upsert({
    where: {
      userId_provider: {
        userId: session.user.id,
        provider: parsed.data.provider,
      },
    },
    create: {
      userId: session.user.id,
      provider: parsed.data.provider,
      key: enc,
    },
    update: { key: enc },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const provider = searchParams.get("provider") as ApiProvider | null;
  if (!provider || !Object.values(ApiProvider).includes(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }
  await prisma.userApiKey.deleteMany({
    where: { userId: session.user.id, provider },
  });
  return NextResponse.json({ ok: true });
}
