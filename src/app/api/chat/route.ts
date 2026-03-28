import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { decryptSecret } from "@/lib/crypto";

export const maxDuration = 30;

const SYSTEM_PROMPT =
  "You are an AI character in an immersive narrative game. Stay in character, keep responses concise, and drive the story forward. Offer clear choices when appropriate.";

const OFFICIAL_MODELS: Record<string, { openaiModel: string; defaultCost: number }> = {
  "gpt-4o": { openaiModel: "gpt-4o-mini", defaultCost: 10 },
  "claude-3-5": { openaiModel: "gpt-3.5-turbo", defaultCost: 15 },
  "gemini-1-5": { openaiModel: "gpt-3.5-turbo", defaultCost: 12 },
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
    const cost =
      config && config.isActive ? config.cost : spec.defaultCost;

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
