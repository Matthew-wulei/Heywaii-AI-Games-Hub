import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getCharacterBySlug } from "@/lib/queries/content";
import { getUserCharacterChatMessages } from "@/lib/queries/chat";
import ChatClient from "./ChatClient";

type Props = { params: Promise<{ slug: string }> };

export default async function ChatPage({ params }: Props) {
  const { slug } = await params;
  const ch = await getCharacterBySlug(slug);
  if (!ch) notFound();

  const authorName = ch.creatorName || ch.author?.name || "HeyWaii community";
  const author = ["rubii", "genraton", "crushon", "taptale"].some(brand => authorName.toLowerCase().includes(brand)) 
    ? "Falton Den" 
    : authorName;

  // Transform Prisma Character object into the format expected by ChatClient
  const session = await auth();
  let persistedMessages: { id: string; role: "user" | "assistant"; content: string }[] = [];
  if (session?.user?.id) {
    const rows = await getUserCharacterChatMessages(session.user.id, ch.id);
    persistedMessages = rows.map((r) => ({
      id: r.id,
      role: r.role === "USER" ? "user" : "assistant",
      content: r.content,
    }));
  }

  const characterProps = {
    name: ch.name,
    slug: ch.slug,
    creator: author,
    description: ch.description,
    avatarUrl: ch.avatar,
    // Use the avatar as the background if a specific background is not available
    backgroundUrl: ch.avatar, 
    interactions: (ch.chatCount >= 1000 ? (ch.chatCount / 1000).toFixed(1) + 'k' : ch.chatCount) + " Chats",
    isNsfw: ch.isNsfw,
    stats: {
      likes: ch.likeCount,
      bookmarks: ch.bookmarkCount,
      chats: ch.chatCount,
    },
    tags: [ch.categorySlug, ch.gender, ch.isNsfw ? "NSFW" : null].filter(Boolean) as string[],
    greeting: ch.greeting || `Hi, I am ${ch.name}.`,
  };

  return (
    <ChatClient
      character={characterProps}
      persistedMessages={persistedMessages}
      canPersistHistory={Boolean(session?.user?.id)}
      isLoggedIn={Boolean(session?.user?.id)}
    />
  );
}
