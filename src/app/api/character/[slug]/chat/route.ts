import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import {
  characterChatModelsReady,
  CHARACTER_SOCIAL_CLIENT_HINT,
} from "@/lib/prisma-character-social";
import { ContentStatus, CharacterChatRole } from "@prisma/client";
import { normalizeCharacterRouteSegment } from "@/lib/queries/content";

const MAX_MSG = 120_000;

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!characterChatModelsReady(prisma)) {
    return NextResponse.json({ error: CHARACTER_SOCIAL_CLIENT_HINT, messages: [] }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);

  const { slug: rawSlug } = await ctx.params;
  const slug = normalizeCharacterRouteSegment(rawSlug);

  const character = await prisma.character.findFirst({
    where: { slug, status: ContentStatus.PUBLISHED },
    select: { id: true },
  });
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const chat = await prisma.characterChat.findUnique({
    where: { userId_characterId: { userId, characterId: character.id } },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 10,
        skip: (page - 1) * 10,
        select: { id: true, role: true, content: true },
      },
    },
  });

  const rawMessages = chat?.messages ? chat.messages.reverse() : [];
  const mappedMessages = rawMessages.map(r => ({
      id: r.id,
      role: r.role === 'USER' ? 'user' : 'assistant',
      content: r.content
  }));

  return NextResponse.json({ messages: mappedMessages });
}

export async function POST(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!characterChatModelsReady(prisma)) {
    return NextResponse.json({ error: CHARACTER_SOCIAL_CLIENT_HINT }, { status: 503 });
  }

  let body: { userText?: string; assistantText?: string };
  try {
    body = (await req.json()) as { userText?: string; assistantText?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const userText = typeof body.userText === "string" ? body.userText : "";
  const assistantText = typeof body.assistantText === "string" ? body.assistantText : "";
  if (!userText.trim()) {
    return NextResponse.json({ error: "userText required" }, { status: 400 });
  }
  if (userText.length > MAX_MSG || assistantText.length > MAX_MSG) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const { slug: rawSlug } = await ctx.params;
  const slug = normalizeCharacterRouteSegment(rawSlug);

  const character = await prisma.character.findFirst({
    where: { slug, status: ContentStatus.PUBLISHED },
    select: { id: true, name: true, greeting: true },
  });
  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
  }

  const openingGreeting =
    character.greeting?.trim() || `Hi, I am ${character.name}.`;

    const result = await prisma.$transaction(async (tx) => {
    const chat = await tx.characterChat.upsert({
      where: { userId_characterId: { userId, characterId: character.id } },
      create: { userId, characterId: character.id },
      update: {},
    });

    const priorCount = await tx.characterChatMessage.count({
      where: { chatId: chat.id },
    });

    let openingMessageId: string | undefined;
    if (priorCount === 0) {
      const openingRow = await tx.characterChatMessage.create({
        data: {
          chatId: chat.id,
          role: CharacterChatRole.ASSISTANT,
          content: openingGreeting,
          createdAt: new Date(Date.now() - 1000), // Ensure it's slightly before the user message
        },
        select: { id: true },
      });
      openingMessageId = openingRow.id;
    }

    const userRow = await tx.characterChatMessage.create({
      data: {
        chatId: chat.id,
        role: CharacterChatRole.USER,
        content: userText,
      },
      select: { id: true },
    });

    const assistantRow = await tx.characterChatMessage.create({
      data: {
        chatId: chat.id,
        role: CharacterChatRole.ASSISTANT,
        content: assistantText,
      },
      select: { id: true },
    });

    await tx.characterChat.update({
      where: { id: chat.id },
      data: { updatedAt: new Date() },
    });

    return {
      userMessageId: userRow.id,
      assistantMessageId: assistantRow.id,
      openingMessageId,
    };
  });

  return NextResponse.json(result);
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!characterChatModelsReady(prisma)) {
    return NextResponse.json({ error: CHARACTER_SOCIAL_CLIENT_HINT, ok: false }, { status: 503 });
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

  const chat = await prisma.characterChat.findUnique({
    where: { userId_characterId: { userId, characterId: character.id } },
    select: { id: true },
  });
  if (chat) {
    await prisma.characterChatMessage.deleteMany({ where: { chatId: chat.id } });
    await prisma.characterChat.delete({ where: { id: chat.id } });
  }

  return NextResponse.json({ ok: true });
}
