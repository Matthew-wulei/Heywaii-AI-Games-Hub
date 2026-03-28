import { openai } from '@ai-sdk/openai';
import { streamText } from 'ai';
import { auth } from '@/auth';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const session = await auth();
    const { messages, modelId } = await req.json();

    // In a real application, you would:
    // 1. Verify the user has enough coins or a valid custom key
    // 2. Fetch the custom key from DB if modelId implies a custom key
    // 3. Select the provider based on the modelId
    
    // Example: Mock logic for deducting balance or using custom key
    /*
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    if (modelId === 'deepseek-custom') {
      const customKey = await prisma.userApiKey.findUnique({ where: { userId_provider: { userId: session.user.id, provider: 'DEEPSEEK' } } });
      // initialize deepseek provider with customKey
    } else {
      // It's an official model, deduct balance
      const user = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (user.balance < 10) return new Response('Insufficient balance', { status: 402 });
      await prisma.user.update({ where: { id: user.id }, data: { balance: { decrement: 10 } } });
    }
    */

    // Using OpenAI as the default for this example. 
    // You would use `createOpenAI({ apiKey: customKey })` if using a custom key.
    
    // We'll mock the actual model call for safety, replacing it with a hardcoded model for testing
    // if OPENAI_API_KEY is not set in your .env
    const result = await streamText({
      model: openai('gpt-3.5-turbo'), // Map modelId to actual provider model
      messages,
      system: "You are an AI character in an immersive narrative game. Stay in character, keep responses concise, and drive the story forward. Provide interactive choices naturally in your dialogue when appropriate.",
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API Error:', error);
    return new Response('An error occurred during chat processing.', { status: 500 });
  }
}
