import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";

export const maxDuration = 30;

const SYSTEM_PROMPT =
  "You are an AI character in an immersive narrative game. Stay in character, keep responses concise, and drive the story forward. Offer clear choices when appropriate.";

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

async function resolveOpenAIApiKey(): Promise<string> {
  const row = await prisma.officialApiConfig.findUnique({
    where: { provider: "OPENAI" },
  });
  if (row?.key?.trim()) {
    try {
      return decryptSecret(row.key);
    } catch {
      return row.key;
    }
  }
  const env = process.env.OPENAI_API_KEY;
  if (!env) throw new Error("NO_OPENAI_KEY");
  return env;
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

    if (!Array.isArray(messages)) {
      return new Response("Bad request", { status: 400 });
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
        messages,
        system: SYSTEM_PROMPT,
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

    const openaiKey = await resolveOpenAIApiKey();
    const openai = createOpenAI({ apiKey: openaiKey });
    const result = await streamText({
      model: openai(spec.openaiModel),
      messages,
      system: SYSTEM_PROMPT,
    });
    return result.toTextStreamResponse();
  } catch (e) {
    console.error("Chat API Error:", e);
    return new Response("Chat processing failed", { status: 500 });
  }
}
