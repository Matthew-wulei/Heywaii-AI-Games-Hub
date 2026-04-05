import { prisma } from "@/lib/prisma";
import { characterChatModelsReady } from "@/lib/prisma-character-social";

export async function getUserCharacterChatMessages(userId: string, characterId: string, page = 1, pageSize = 10) {
  if (!characterChatModelsReady(prisma)) {
    return [];
  }
  const chat = await prisma.characterChat.findUnique({
    where: { userId_characterId: { userId, characterId } },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: pageSize,
        skip: (page - 1) * pageSize,
        select: { id: true, role: true, content: true },
      },
    },
  });
  
  // Return in ascending order for rendering
  return chat?.messages ? chat.messages.reverse() : [];
}
