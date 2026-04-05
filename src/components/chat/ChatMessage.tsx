import React, { useCallback, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

function reactNodeToPlainText(node: React.ReactNode): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(reactNodeToPlainText).join('');
  if (
    React.isValidElement(node) &&
    node.props &&
    typeof node.props === 'object' &&
    node.props !== null &&
    'children' in node.props
  ) {
    return reactNodeToPlainText((node.props as { children?: React.ReactNode }).children);
  }
  return '';
}

function skipWhitespaceChildIndex(arr: React.ReactNode[], from: number): number {
  let j = from;
  while (j < arr.length) {
    const n = arr[j];
    if (typeof n === 'string' && n.trim() === '') {
      j++;
      continue;
    }
    break;
  }
  return j;
}

/**
 * In a markdown paragraph, **Name's Thoughts** immediately followed by *em* / _em_ → thought bubble block.
 */
function wrapCrushOnThoughtStrongEm(children: React.ReactNode): React.ReactNode {
  const arr = React.Children.toArray(children);
  const out: React.ReactNode[] = [];
  for (let i = 0; i < arr.length; i++) {
    const node = arr[i];
    if (React.isValidElement(node) && node.type === 'strong') {
      const sp = node.props as { children?: React.ReactNode };
      const label = reactNodeToPlainText(sp.children).trim();
      if (/'s Thoughts$/.test(label)) {
        const j = skipWhitespaceChildIndex(arr, i + 1);
        const next = arr[j];
        if (j < arr.length && React.isValidElement(next) && next.type === 'em') {
          const ep = next.props as { children?: React.ReactNode };
          out.push(
            <div
              key={`crush-thought-${i}`}
              className="bg-gray-900/50 border border-dashed border-gray-600 rounded-lg p-3 text-sm relative mb-3 before:content-['💭'] before:absolute before:-left-3 before:-top-3 before:text-xl"
            >
              <strong className="text-white font-semibold block mb-1">{sp.children}</strong>
              <em className="text-gray-400 not-italic text-sm leading-relaxed block">{ep.children}</em>
            </div>
          );
          i = j;
          continue;
        }
      }
    }
    out.push(node);
  }
  if (out.length === 1) return out[0];
  return out;
}

function HtmlSandbox({ htmlContent }: { htmlContent: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [iframeHeight, setIframeHeight] = useState<number | null>(null);

  const handleLoad = useCallback(() => {
    setLoaded(true);
    try {
      const doc = iframeRef.current?.contentWindow?.document;
      const h = doc?.body?.scrollHeight;
      if (typeof h === 'number' && !Number.isNaN(h)) {
        setIframeHeight(Math.max(h, 300));
      }
    } catch {
      /* cross-origin or inaccessible document */
    }
  }, []);

  return (
    <div className="relative w-full my-2 min-h-[300px]">
      {!loaded && (
        <div
          className="absolute inset-0 z-10 animate-pulse bg-zinc-800 rounded-xl h-[300px] w-full"
          aria-hidden
        />
      )}
      <iframe
        ref={iframeRef}
        srcDoc={htmlContent}
        sandbox="allow-scripts allow-popups allow-same-origin"
        title="Embedded HTML preview"
        onLoad={handleLoad}
        className="w-full border-none rounded-xl bg-transparent min-h-[300px]"
        style={
          iframeHeight != null
            ? { height: iframeHeight, minHeight: 300 }
            : { minHeight: 300 }
        }
      />
    </div>
  );
}

/** Shared fenced-```html → sandbox iframe; used in main message and thought bubbles. */
type CodeRendererProps = React.ComponentPropsWithoutRef<'code'> & {
  node?: unknown;
  inline?: boolean;
};

const markdownCodeWithHtmlSandbox = (({
  className,
  children,
  node: _node,
  inline: _inline,
  ...props
}: CodeRendererProps) => {
  void _node;
  void _inline;
  const cls = typeof className === 'string' ? className : '';
  if (cls.includes('language-html')) {
    const htmlString = reactNodeToPlainText(children);
    if (htmlString.trim().length > 0) {
      return <HtmlSandbox htmlContent={htmlString} />;
    }
  }
  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
}) as NonNullable<Components['code']>;

export interface ChatMessageProps {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  avatarUrl?: string;
  characterName?: string;
  isGenerating?: boolean;
}

/**
 * CrushOn-style blocks: optional 💭, then **Name's Thoughts**, then italic body (* or _) on following lines.
 */
function extractCrushOnThoughtBlocks(text: string): { blocks: string[]; rest: string } {
  const blocks: string[] = [];
  const re =
    /(?:^|\n)(💭\s*)?(\*\*[^*\n\r]+'s Thoughts\*\*)\s*(?:\r?\n)+(?:\*([\s\S]*?)\*|_([\s\S]*?)_)(?=\r?\n\r?\n|\r?\n$|$)/gm;
  const rest = text.replace(re, (_m, _emoji, header: string, starBody?: string, underBody?: string) => {
    const body = (starBody ?? underBody ?? "").trim();
    const title = header.replace(/^\*\*|\*\*$/g, "");
    blocks.push(`**${title}**: _${body}_`);
    return "\n";
  });
  return { blocks, rest: rest.replace(/\n{3,}/g, "\n\n").trim() };
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  content,
  avatarUrl,
  characterName = 'AI',
  isGenerating = false,
}) => {
  const isUser = role === 'user';

  // Extract thought bubbles and clean content
  const extractThoughts = (text: string) => {
    const thoughts: string[] = [];
    let cleanContent = text;

    // 1. Extract the specific format: 💭 **Name's Thoughts**: _italic_
    // Matches 💭, Name in strong tags, a colon, and the thought in italics (can span multiple lines).
    const specificFormatRegex = /💭\s*\*\*[^*]+\*\*\s*:\s*_[\s\S]*?_(?=\n|$)/g;
    
    cleanContent = cleanContent.replace(specificFormatRegex, (match) => {
      thoughts.push(match.replace(/^💭\s*/, '').trim());
      return '';
    });

    // 2. Extract generic format (fallback for normal lines starting with 💭)
    const lines = cleanContent.split('\n');
    const mainContent: string[] = [];
    let currentThought = '';

    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('💭')) {
        if (currentThought) thoughts.push(currentThought);
        currentThought = trimmed.substring(1).trim();
      } else if (currentThought) {
        if (trimmed === '' || (trimmed.startsWith('*') && trimmed.endsWith('*'))) {
          thoughts.push(currentThought);
          currentThought = '';
          if (trimmed !== '') mainContent.push(line);
        } else {
          currentThought += '\n' + line;
        }
      } else {
        mainContent.push(line);
      }
    });

    if (currentThought) {
      thoughts.push(currentThought);
    }

    return {
      thoughts,
      cleanContent: mainContent.join('\n').replace(/\n{3,}/g, '\n\n').trim(),
    };
  };

  const { blocks: crushThoughtBlocks, rest: afterCrushThoughts } = extractCrushOnThoughtBlocks(content);
  const { thoughts: legacyThoughts, cleanContent } = extractThoughts(afterCrushThoughts);
  const thoughts = [...crushThoughtBlocks, ...legacyThoughts];

  const markdownComponents: Components = {
    em: ({ children, ...props }) => (
      <em className="text-gray-400 not-italic text-sm leading-relaxed" {...props}>
        {children}
      </em>
    ),
    strong: ({ children, ...props }) => (
      <strong className="text-white font-semibold" {...props}>
        {children}
      </strong>
    ),
    p: ({ children, ...props }) => (
      <p className="mb-3 last:mb-0" {...props}>
        {wrapCrushOnThoughtStrongEm(children)}
      </p>
    ),
    img: ({ src, alt, ...props }) =>
      typeof src === 'string' ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={typeof alt === 'string' ? alt : ''}
          className="w-full rounded-xl my-3 object-cover max-h-96"
          loading="lazy"
          {...props}
        />
      ) : null,
    hr: () => <hr className="border-white/10 my-4" />,
    code: markdownCodeWithHtmlSandbox,
  };

  const thoughtBubbleMarkdownComponents: Components = {
    ...markdownComponents,
    p: ({ children }) => <span className="inline">{children}</span>,
  };

  return (
    <div
      className={`flex w-full mb-6 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        {!isUser && (
          <div className="flex-shrink-0 mr-4">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={`${characterName} avatar`}
                className="w-10 h-10 rounded-full object-cover border border-gray-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-semibold border border-gray-600">
                {characterName.charAt(0)}
              </div>
            )}
          </div>
        )}

        {/* Message Bubble */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {!isUser && (
            <span className="text-sm text-gray-400 mb-1 ml-1">{characterName}</span>
          )}

          <div
            className={`relative px-4 py-3 rounded-2xl ${
              isUser
                ? 'bg-blue-600 text-white rounded-tr-sm'
                : 'bg-gray-800 text-gray-100 rounded-tl-sm border border-gray-700'
            }`}
          >
            {/* Thought Bubbles */}
            {thoughts.length > 0 && !isUser && (
              <div className="mb-4 space-y-2">
                {thoughts.map((thought, index) => {
                  // If it matches the specific format "**Name's Thoughts**: _italic_", strip the formatting
                  let displayThought = thought;
                  const formatMatch = thought.match(/^\*\*([^*]+)\*\*\s*:\s*_([\s\S]*?)_$/);
                  if (formatMatch) {
                    displayThought = formatMatch[2]; // Just take the thought content, stripped of asterisks and underscores
                  }

                  return (
                    <div
                      key={index}
                      className="bg-gray-900/50 border border-dashed border-gray-600 rounded-lg p-3 text-sm text-gray-400 italic relative before:content-['💭'] before:absolute before:-left-3 before:-top-3 before:text-xl"
                    >
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          ...thoughtBubbleMarkdownComponents,
                          pre: ({ children }) => (
                            <div className="block w-full max-w-full my-2 not-italic">{children}</div>
                          ),
                        }}
                      >
                        {displayThought}
                      </ReactMarkdown>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Main Content Rendered with Markdown */}
            <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-gray-900">
              {cleanContent ? (
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]} 
                  components={markdownComponents}
                >
                  {cleanContent}
                </ReactMarkdown>
              ) : isGenerating ? (
                <div
                  className="text-gray-400 text-sm leading-none pl-1 py-1 min-h-[1.5rem] flex items-center animate-pulse select-none italic"
                  aria-label="Thinking"
                >
                  Thinking...
                </div>
              ) : null}
              {isGenerating && cleanContent && (
                <span className="inline-block ml-1 w-2 h-4 bg-primary animate-pulse align-middle" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Mock Data & Preview Example ---
/*
export const ChatMessagePreview = () => {
  return (
    <div className="p-8 bg-gray-950 min-h-screen">
      <div className="max-w-3xl mx-auto border border-gray-800 rounded-xl p-6 bg-gray-900 shadow-xl">
        <h2 className="text-xl text-white mb-6 font-bold border-b border-gray-800 pb-4">Chat Message Render Preview</h2>
        
        <ChatMessage
          id="msg-1"
          role="user"
          content="Hello! Can you tell me about the quest?"
        />
        
        <ChatMessage
          id="msg-2"
          role="assistant"
          characterName="Elora"
          avatarUrl="https://api.dicebear.com/7.x/avataaars/svg?seed=Elora"
          content={`💭 The mortal seeks knowledge of the ancient artifact. I should test their resolve first.
💭 They seem eager, but haste often leads to ruin in these lands.

*Elora slowly turns her gaze from the burning hearth, her eyes reflecting the dancing flames. She takes a slow sip from her wooden goblet before speaking.*

Ah, you ask about the **Tear of Aethelgard**. It is not a tale for the faint of heart.

*She leans forward, her voice dropping to a harsh whisper.*

Many have sought it. **None** have returned. What makes you think you are any different?`}
        />
      </div>
    </div>
  );
};
*/
