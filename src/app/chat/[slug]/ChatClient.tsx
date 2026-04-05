'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInputArea } from '@/components/chat/ChatInputArea';
import { NsfwWarningModal } from '@/components/ui/NsfwWarningModal';

type ChatRow = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  characterName?: string;
  avatarUrl?: string;
  isGenerating?: boolean;
};

type PersistedMsg = { id: string; role: 'user' | 'assistant'; content: string };

function buildInitialRows(
  persisted: PersistedMsg[],
  character: { name: string; avatarUrl: string; greeting: string }
): ChatRow[] {
  if (persisted.length > 0) {
    return persisted.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      ...(m.role === 'assistant'
        ? { characterName: character.name, avatarUrl: character.avatarUrl }
        : {}),
    }));
  }
  return [
    {
      id: 'local-greeting',
      role: 'assistant',
      characterName: character.name,
      avatarUrl: character.avatarUrl,
      content: character.greeting,
    },
  ];
}

function formatCount(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export default function ChatClient({
  character,
  persistedMessages = [],
  canPersistHistory = false,
  isLoggedIn = false,
}: {
  character: any;
  persistedMessages?: PersistedMsg[];
  canPersistHistory?: boolean;
  isLoggedIn?: boolean;
}) {
  const router = useRouter();
  const [showNsfwWarning, setShowNsfwWarning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isFetchingHistory, setIsFetchingHistory] = useState(false);
  const [hasMoreHistory, setHasMoreHistory] = useState(canPersistHistory && persistedMessages.length >= 10);
  const [page, setPage] = useState(1);

  useEffect(() => {
    // Only run on the client side
    if (typeof window !== 'undefined' && character.isNsfw) {
      const confirmedTimestamp = localStorage.getItem('nsfw_confirmed_timestamp');
      if (!confirmedTimestamp) {
        // use a timeout to avoid synchronous setState inside useEffect leading to "cascading renders" error in next.js
        setTimeout(() => setShowNsfwWarning(true), 0);
      }
    }
  }, [character.isNsfw]);

  const handleNsfwConfirm = () => {
    localStorage.setItem('nsfw_confirmed_timestamp', Date.now().toString());
    setShowNsfwWarning(false);
  };

  const handleNsfwGoBack = () => {
    router.back();
  };

  // State for sidebars
  const [messages, setMessages] = useState<ChatRow[]>(() =>
    buildInitialRows(persistedMessages, character)
  );

  const messagesRef = useRef<ChatRow[]>(messages);
  messagesRef.current = messages;

  const assistantStreamRef = useRef('');

  const handleScroll = useCallback(async () => {
    if (!scrollRef.current || isFetchingHistory || !hasMoreHistory || !canPersistHistory) return;
    
    // Check if scrolled near top
    if (scrollRef.current.scrollTop < 50) {
      setIsFetchingHistory(true);
      const prevScrollHeight = scrollRef.current.scrollHeight;
      
      try {
        const nextPage = page + 1;
          const res = await fetch(`/api/character/${encodeURIComponent(character.slug)}/chat?page=${nextPage}`);
        if (res.ok) {
          const data = await res.json() as { messages: PersistedMsg[] };
          if (data.messages && data.messages.length > 0) {
            const olderRows = data.messages.map(m => ({
                id: m.id,
                role: m.role,
                content: m.content,
                ...(m.role === 'assistant'
                  ? { characterName: character.name, avatarUrl: character.avatarUrl }
                  : {}),
            })) as ChatRow[];

            setMessages(prev => {
                const combined = [...olderRows, ...prev];
                messagesRef.current = combined;
                return combined;
            });
            setPage(nextPage);
            setHasMoreHistory(data.messages.length >= 10);

            // Restore scroll position
            setTimeout(() => {
                if (scrollRef.current) {
                    const newScrollHeight = scrollRef.current.scrollHeight;
                    scrollRef.current.scrollTop = newScrollHeight - prevScrollHeight;
                }
            }, 0);
          } else {
            setHasMoreHistory(false);
          }
        }
      } catch (e) {
        console.error('Failed to fetch history:', e);
      } finally {
        setIsFetchingHistory(false);
      }
    }
  }, [isFetchingHistory, hasMoreHistory, canPersistHistory, page, character]);

  const handleStartNewChat = useCallback(async () => {
    if (canPersistHistory) {
      try {
        await fetch(`/api/character/${encodeURIComponent(character.slug)}/chat`, {
          method: 'DELETE',
        });
      } catch (e) {
        console.error('Clear chat failed:', e);
      }
    }
    const fresh = buildInitialRows([], character);
    setMessages(fresh);
    messagesRef.current = fresh;
  }, [canPersistHistory, character]);

  const handleSendMessage = async (content: string) => {
    const userId = `u-${Date.now()}`;
    const assistantMsgId = `a-${Date.now()}`;

    const newUserMsg: ChatRow = {
      id: userId,
      role: 'user',
      content,
    };

    const assistantPlaceholder: ChatRow = {
      id: assistantMsgId,
      role: 'assistant',
      characterName: character.name,
      avatarUrl: character.avatarUrl,
      content: '',
      isGenerating: true,
    };

    const prev = messagesRef.current;
    const apiMessages = [...prev, newUserMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    assistantStreamRef.current = '';
    setMessages([...prev, newUserMsg, assistantPlaceholder]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: apiMessages,
          modelId: 'gpt-4o',
          characterSlug: character.slug,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let lineBuffer = '';

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (!value) continue;

        lineBuffer += decoder.decode(value, { stream: true });
        const lines = lineBuffer.split('\n');
        lineBuffer = lines.pop() ?? '';

        for (const line of lines) {
          if (line.startsWith('0:')) {
            try {
              const text = JSON.parse(line.slice(2)) as string;
              assistantStreamRef.current += text;
              setMessages((prevMsgs) =>
                prevMsgs.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: msg.content + text, isGenerating: false }
                    : msg
                )
              );
            } catch {
              /* partial JSON */
            }
          } else if (line.startsWith('text:')) {
            try {
              const text = JSON.parse(line.slice(5)) as string;
              assistantStreamRef.current += text;
              setMessages((prevMsgs) =>
                prevMsgs.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: msg.content + text, isGenerating: false }
                    : msg
                )
              );
            } catch {
              /* ignore */
            }
          } else if (
            line.trim() &&
            !line.startsWith('e:') &&
            !line.startsWith('d:') &&
            !line.startsWith('f:')
          ) {
            if (line.includes('"text"')) continue;
            let text = line;
            if (text.startsWith('"') && text.endsWith('"')) {
              try {
                text = JSON.parse(text) as string;
              } catch {
                /* keep raw */
              }
            }
            if (text.length > 0) {
              assistantStreamRef.current += text;
              setMessages((prevMsgs) =>
                prevMsgs.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: msg.content + text, isGenerating: false }
                    : msg
                )
              );
            }
          }
        }
      }

      if (lineBuffer.trim()) {
        const line = lineBuffer;
        if (line.startsWith('0:')) {
          try {
            const text = JSON.parse(line.slice(2)) as string;
            assistantStreamRef.current += text;
            setMessages((prevMsgs) =>
              prevMsgs.map((msg) =>
                msg.id === assistantMsgId
                  ? { ...msg, content: msg.content + text, isGenerating: true }
                  : msg
              )
            );
          } catch {
            /* ignore */
          }
        }
      }

      setMessages((prevMsgs) =>
        prevMsgs.map((msg) =>
          msg.id === assistantMsgId ? { ...msg, isGenerating: false } : msg
        )
      );

      if (canPersistHistory) {
        try {
          const saveRes = await fetch(
            `/api/character/${encodeURIComponent(character.slug)}/chat`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userText: content,
                assistantText: assistantStreamRef.current,
              }),
            }
          );
          const saveData = (await saveRes.json()) as {
            userMessageId?: string;
            assistantMessageId?: string;
            openingMessageId?: string;
            error?: string;
          };
          if (
            saveRes.ok &&
            saveData.userMessageId &&
            saveData.assistantMessageId
          ) {
            setMessages((prevMsgs) =>
              prevMsgs.map((msg) => {
                if (saveData.openingMessageId && msg.id === 'local-greeting') {
                  return { ...msg, id: saveData.openingMessageId! };
                }
                if (msg.id === userId) return { ...msg, id: saveData.userMessageId! };
                if (msg.id === assistantMsgId) {
                  return { ...msg, id: saveData.assistantMessageId! };
                }
                return msg;
              })
            );
          }
        } catch (e) {
          console.error('Persist chat failed:', e);
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prevMsgs) =>
        prevMsgs.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content: '*Error connecting to the AI model.*',
                isGenerating: false,
              }
            : msg
        )
      );
    }
  };

  return (
    <>
      {showNsfwWarning && (
        <NsfwWarningModal onConfirm={handleNsfwConfirm} onGoBack={handleNsfwGoBack} />
      )}
      <div className={`relative flex h-full w-full overflow-hidden bg-transparent text-white ${showNsfwWarning ? 'blur-md pointer-events-none' : ''}`}>
        {/* Background Image with Blur */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${character.backgroundUrl})` }}
      />
      <div className="absolute inset-0 z-0 bg-black/40 backdrop-blur-md" />

      {/* Mobile Header / Hamburger */}
      <div className="absolute top-0 left-0 right-0 h-16 z-50 flex items-center justify-between px-4 md:hidden bg-gradient-to-b from-black/80 to-transparent">
        <div className="w-10"></div> {/* Spacer for alignment */}
        <div className="font-semibold">{character.name}</div>
        <div className="w-10"></div> {/* Spacer for alignment */}
      </div>

      {/* Main Chat Area */}
      <div className="relative z-10 flex-1 flex flex-col h-full min-w-0 pt-16 md:pt-0">
        
        {/* Messages List */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 md:px-8 py-6 custom-scrollbar"
        >
          <div className="max-w-4xl mx-auto flex flex-col justify-end min-h-full">
            {isFetchingHistory && (
              <div className="flex justify-center py-4">
                <Loader2 className="w-5 h-5 text-white/50 animate-spin" />
              </div>
            )}
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                id={msg.id}
                role={msg.role}
                content={msg.content}
                avatarUrl={msg.avatarUrl}
                characterName={msg.characterName}
                isGenerating={msg.isGenerating}
              />
            ))}
          </div>
        </div>

        {/* Input Area */}
        <div className="w-full max-w-4xl mx-auto mb-4 md:mb-8 relative z-20">
          <ChatInputArea 
            onSendMessage={handleSendMessage}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </div>

      <aside
        className="relative z-10 hidden md:flex w-80 flex-shrink-0 flex-col h-full border-l border-white/10 bg-black/55 backdrop-blur-xl overflow-y-auto custom-scrollbar"
        aria-label="Character details"
      >
        <div className="p-5 pb-8 space-y-5">
          <div className="flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={character.avatarUrl}
              alt={character.name}
              className="w-28 h-28 rounded-2xl object-cover border border-white/15 shadow-lg"
            />
            <h2 className="mt-4 text-lg font-bold text-white leading-tight">{character.name}</h2>
            <p className="mt-1 text-xs text-white/45">
              Created by{' '}
              <span className="text-white/75">{character.creator}</span>
            </p>
            <Link
              href={`/character/${encodeURIComponent(character.slug)}`}
              className="mt-3 text-xs font-medium text-pink-300 hover:text-pink-200 underline-offset-2 hover:underline"
            >
              View character profile
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-center">
            <div>
              <div className="text-sm font-semibold text-white">
                {formatCount(Number(character.stats?.chats ?? 0))}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-white/40">Chats</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                {formatCount(Number(character.stats?.likes ?? 0))}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-white/40">Likes</div>
            </div>
            <div>
              <div className="text-sm font-semibold text-white">
                {formatCount(Number(character.stats?.bookmarks ?? 0))}
              </div>
              <div className="text-[10px] uppercase tracking-wider text-white/40">Saves</div>
            </div>
          </div>

          {Array.isArray(character.tags) && character.tags.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-1.5">
                {(character.tags as string[]).map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-white/80 border border-white/10"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {typeof character.description === 'string' && character.description.trim().length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-white/40 mb-2">About</h3>
              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap break-words">
                {character.description}
              </p>
            </div>
          )}
        </div>
      </aside>

      <style dangerouslySetInnerHTML={{
        __html: `
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
          }
        `
      }} />
      </div>
    </>
  );
}
