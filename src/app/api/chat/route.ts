import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type CoreMessage } from "ai";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";
import { getCharacterForChatBySlug } from "@/lib/queries/content";

export const maxDuration = 30;

const SYSTEM_PROMPT =
  "You are an AI character in an immersive narrative game. Stay in character, keep responses concise, and drive the story forward. Offer clear choices when appropriate.";

const IMPORTANT_BLOCK =
  "[IMPORTANT: Stay in character at all times. Use the DIALOGUE MARKER defined for each character when speaking. Describe actions in *italics*. Keep responses immersive and consistent with the established scenario.]";

/** Client-facing model ids → actual OpenAI-compatible model id used on the server. */
const OFFICIAL_MODELS: Record<string, { openaiModel: string }> = {
  "gpt-4o": { openaiModel: "gpt-4o-mini" },
  "claude-3-5": { openaiModel: "gpt-3.5-turbo" },
  "gemini-1-5": { openaiModel: "gpt-3.5-turbo" },
};

/**
 * Bill by backend model only — client cannot pick a cheaper UI label for the same backend route.
 */
const COST_BY_BACKEND_MODEL: Record<string, number> = {
  "gpt-4o-mini": 10,
  "gpt-3.5-turbo": 8,
};

type ChatCharacterRow = NonNullable<Awaited<ReturnType<typeof getCharacterForChatBySlug>>>;

function buildSystemPromptFromCharacter(
  character: ChatCharacterRow,
  memories: string[] = []
): string {
  const p = character.personality?.trim();
  const s = character.scenario?.trim();
  const a = character.appearance?.trim();
  const hasAny = Boolean(p || s || a);

  if (!hasAny) {
    return character.systemPrompt?.trim() || SYSTEM_PROMPT;
  }

  const parts: string[] = [];
  if (p) parts.push(p);
  if (s) parts.push(s);
  if (a) parts.push(a);
  if (memories.length > 0) {
    parts.push(`[MEMORY:\n${memories.map((m) => `- ${m}`).join("\n")}\n]`);
  }
  parts.push(IMPORTANT_BLOCK);
  return parts.join("\n\n");
}

function firstAssistantMatchesGreeting(
  messages: Array<{ role?: string; content?: unknown }>,
  greeting: string | null
): boolean {
  if (!greeting?.trim()) return true;
  const m0 = messages[0];
  if (!m0 || m0.role !== "assistant") return false;
  const c = typeof m0.content === "string" ? m0.content : "";
  return c.trim() === greeting.trim();
}

function toCoreMessages(
  raw: unknown,
  greeting: string | null
): CoreMessage[] {
  if (!Array.isArray(raw)) return [];

  const rows = raw.filter(
    (m): m is { role: string; content: string } =>
      Boolean(m) &&
      typeof m === "object" &&
      (m as { role?: string }).role !== undefined &&
      typeof (m as { content?: unknown }).content === "string"
  );

  const base: CoreMessage[] = rows.map((m) => ({
    role: m.role as "user" | "assistant" | "system",
    content: m.content,
  }));

  const filtered = base.filter((m) => m.role === "user" || m.role === "assistant");

  if (!greeting?.trim()) return filtered;

  if (firstAssistantMatchesGreeting(filtered, greeting)) return filtered;

  return [{ role: "assistant", content: greeting.trim() }, ...filtered];
}

async function resolveOpenAIConfig(): Promise<{ apiKey: string; baseUrl?: string }> {
  const row = await prisma.officialApiConfig.findUnique({
    where: { provider: "OPENAI" },
  });
  if (row?.key?.trim()) {
    let apiKey: string;
    try {
      apiKey = decryptSecret(row.key);
    } catch {
      apiKey = row.key;
    }
    return { apiKey, baseUrl: row.baseUrl ?? undefined };
  }
  const env = process.env.OPENAI_API_KEY;
  if (!env) throw new Error("NO_OPENAI_KEY");
  return { apiKey: env };
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const messages = body.messages;
    const modelId: string = body.modelId ?? "gpt-4o";
    const characterSlug =
      typeof body.characterSlug === "string" ? body.characterSlug.trim() : "";

    if (!Array.isArray(messages)) {
      return new Response("Bad request", { status: 400 });
    }

    let systemText = SYSTEM_PROMPT;
    let coreMessages: CoreMessage[] = toCoreMessages(messages, null);

    if (characterSlug) {
      const character = await getCharacterForChatBySlug(characterSlug);
      if (!character) {
        return new Response("Character not found", { status: 400 });
      }
      systemText = buildSystemPromptFromCharacter(character, []);
      coreMessages = toCoreMessages(messages, character.greeting ?? null);
    }

    if (modelId === "deepseek-custom") {
      const row = await prisma.userApiKey.findUnique({
        where: {
          userId_provider: { userId, provider: "DEEPSEEK" },
        },
      });
      if (!row) {
        return new Response("No DeepSeek API key configured in profile", { status: 400 });
      }
      let apiKey: string;
      try {
        apiKey = decryptSecret(row.key);
      } catch {
        apiKey = row.key;
      }
      const deepseek = createOpenAI({
        apiKey,
        baseURL: "https://api.deepseek.com",
      });
      const result = await streamText({
        model: deepseek("deepseek-chat"),
        messages: coreMessages,
        system: systemText,
      });
      return result.toTextStreamResponse();
    }

    const spec = OFFICIAL_MODELS[modelId];
    if (!spec) {
      return new Response("Unknown model", { status: 400 });
    }

    const config = await prisma.officialApiConfig.findUnique({
      where: { provider: "OPENAI" },
    });
    const backendModel = spec.openaiModel;
    const cost =
      config?.isActive === true
        ? config.cost
        : (COST_BY_BACKEND_MODEL[backendModel] ?? 10);

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.balance < cost) {
      return new Response("Insufficient balance", { status: 402 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { balance: { decrement: cost } },
    });

    const { apiKey: openaiKey, baseUrl } = await resolveOpenAIConfig();
    const openai = createOpenAI({
      apiKey: openaiKey,
      ...(baseUrl ? { baseURL: baseUrl } : {}),
    });

    const result = await streamText({
      model: openai(backendModel),
      messages: coreMessages,
      system: systemText,
      temperature: body.temperature ?? 0.7,
      maxTokens: body.maxTokens ?? 400,
    });
    return result.toTextStreamResponse();
  } catch (e) {
    console.error("Chat API Error:", e);
    return new Response("Chat processing failed", { status: 500 });
  }
}
