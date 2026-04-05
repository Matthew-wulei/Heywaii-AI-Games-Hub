"use client";

import * as HoverCard from "@radix-ui/react-hover-card";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Components } from "react-markdown";
import { cn } from "@/lib/utils";

function stripBasicMarkdown(segment: string): string {
  let s = segment;
  s = s.replace(/\*\*([\s\S]*?)\*\*/g, "$1");
  s = s.replace(/__([\s\S]*?)__/g, "$1");
  s = s.replace(/`([^`]+)`/g, "$1");
  s = s.replace(/\*([^*]+)\*/g, "$1");
  s = s.replace(/_([^_\s][^_]*)_/g, "$1");
  s = s.replace(/^#{1,6}\s+/gm, "");
  return s.trim();
}

/**
 * First line of description: pipe-separated keywords and/or bracketed tags, minus Markdown noise.
 */
function extractHighlightTagLine(description: string, fallback: string): string {
  const trimmed = description.trim();
  if (!trimmed) return fallback;
  const firstLine = (trimmed.split(/\r?\n/)[0] ?? "").trim();
  if (!firstLine) return fallback;

  const bracketBlocks = [...firstLine.matchAll(/\[([^\]]+)\]/g)]
    .map((m) => stripBasicMarkdown(m[1] ?? "").trim())
    .filter(Boolean);

  let result: string;
  if (bracketBlocks.length > 0) {
    result = bracketBlocks.join(" · ");
  } else if (firstLine.includes("|")) {
    result = firstLine
      .split("|")
      .map((p) => stripBasicMarkdown(p))
      .map((p) => p.trim())
      .filter(Boolean)
      .join(" · ");
  } else {
    result = stripBasicMarkdown(firstLine);
  }

  if (!result) return fallback;
  return result.length > 200 ? `${result.slice(0, 197)}…` : result;
}

function getDescriptionRemainder(description: string): string {
  const trimmed = description.trim();
  const nl = trimmed.search(/\r?\n/);
  if (nl === -1) return "";
  return trimmed.slice(nl + 1).replace(/^\s*\r?\n/, "").trim();
}

const previewMarkdownComponents: Components = {
  em: ({ children, ...props }) => (
    <em className="text-zinc-400 not-italic" {...props}>
      {children}
    </em>
  ),
  strong: ({ children, ...props }) => (
    <strong className="text-pink-500 font-semibold" {...props}>
      {children}
    </strong>
  ),
  p: ({ children, ...props }) => (
    <p className="mb-1.5 last:mb-0 text-xs leading-relaxed text-zinc-300" {...props}>
      {children}
    </p>
  ),
};

export function CharacterCard({
  slug,
  name,
  avatar,
  categoryLabel,
  description,
  creatorName,
  chatCount,
  compact = false,
}: {
  slug: string;
  name: string;
  avatar: string;
  categoryLabel: string;
  description: string;
  creatorName?: string | null;
  chatCount?: number;
  /** Denser layout for grid views (e.g. 8 columns on xl). */
  compact?: boolean;
}) {
  const highlightLine = extractHighlightTagLine(description, categoryLabel);
  const remainder = getDescriptionRemainder(description);

  return (
    <HoverCard.Root openDelay={300} closeDelay={120}>
      <HoverCard.Trigger asChild>
        <Link href={`/character/${slug}`} className="block h-full rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-pink-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
          <article
            className={cn(
              "group h-full flex flex-col bg-background-paper border border-white/5 overflow-hidden",
              "hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]",
              compact ? "rounded-xl" : "rounded-2xl"
            )}
          >
            <div
              className={cn(
                "relative bg-background-elevated overflow-hidden",
                compact ? "aspect-[3/4]" : "aspect-[4/5]"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatar}
                alt={name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
            <div className={cn("flex flex-col flex-1", compact ? "p-2.5 sm:p-3" : "p-5")}>
              <div className="flex justify-between items-center gap-1 mb-0.5">
                <span
                  className={cn(
                    "uppercase tracking-wider text-text-muted font-semibold truncate",
                    compact ? "text-[9px]" : "text-[10px]"
                  )}
                >
                  {categoryLabel}
                </span>
                {chatCount !== undefined && chatCount > 0 && (
                  <span
                    className={cn(
                      "text-status-success font-medium shrink-0",
                      compact ? "text-[9px]" : "text-[10px]"
                    )}
                  >
                    {chatCount > 1000 ? `${(chatCount / 1000).toFixed(1)}k` : chatCount}
                    {compact ? " ch" : " chats"}
                  </span>
                )}
              </div>
              <h2
                className={cn(
                  "font-bold text-white group-hover:text-primary transition-colors",
                  compact ? "text-xs sm:text-sm line-clamp-2 leading-snug mb-0.5" : "text-lg mb-1 line-clamp-1"
                )}
              >
                {name}
              </h2>
              {creatorName && (
                <p
                  className={cn(
                    "text-text-muted line-clamp-1",
                    compact ? "text-[10px] mb-1" : "text-xs mb-2"
                  )}
                >
                  By {creatorName}
                </p>
              )}
              <p
                className={cn(
                  "text-text-secondary flex-1 leading-snug",
                  compact ? "text-[11px] sm:text-xs line-clamp-2" : "text-sm line-clamp-3"
                )}
              >
                {description}
              </p>
            </div>
          </article>
        </Link>
      </HoverCard.Trigger>

      <HoverCard.Portal>
        <HoverCard.Content
          side="right"
          align="start"
          sideOffset={8}
          avoidCollisions
          sticky="always"
          updatePositionStrategy="always"
          collisionPadding={{
            top: 72,
            bottom: 16,
            left: 8,
            right: 8,
          }}
          className={cn(
            "z-[200] flex w-64 max-w-[min(16rem,calc(100vw-1rem))] max-h-[min(22rem,calc(100dvh-5rem))] flex-col overflow-hidden rounded-xl border border-pink-500/35 bg-zinc-950 p-0",
            "shadow-[0_0_16px_rgba(255,45,85,0.25)]",
            "origin-[--radix-hover-card-content-transform-origin] outline-none"
          )}
        >
          <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-3 pt-3 pb-1.5">
            <p className="text-center text-[10px] leading-snug text-pink-400 sm:text-xs">{highlightLine}</p>

            <h3 className="mt-1.5 text-center text-sm font-bold text-pink-500 drop-shadow-[0_0_6px_rgba(236,72,153,0.65)]">
              Character Profile
            </h3>

            <div className="mt-2 rounded-lg border border-pink-500/30 overflow-hidden bg-black/40">
              <h4 className="px-2 pt-2 text-center text-base font-bold text-pink-500 drop-shadow-[0_0_6px_rgba(236,72,153,0.65)] leading-tight">
                {name}
              </h4>
              <div className="p-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatar}
                  alt={name}
                  className="aspect-[3/4] w-full max-h-36 rounded-b-md object-cover sm:max-h-40"
                  loading="lazy"
                />
              </div>
            </div>

            {remainder ? (
              <div
                className={cn(
                  "mt-2 max-h-24 overflow-y-auto border-t border-white/10 pt-2 pr-0.5 sm:max-h-28",
                  "[&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-pink-500/35"
                )}
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={previewMarkdownComponents}>
                  {remainder}
                </ReactMarkdown>
              </div>
            ) : null}
          </div>

          <HoverCard.Arrow className="fill-zinc-950" width={12} height={6} />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
