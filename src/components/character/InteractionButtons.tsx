"use client";

import { useState } from "react";
import { Heart, Bookmark, Share, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHARACTER_SOCIAL_CLIENT_HINT } from "@/lib/prisma-character-social";

export function InteractionButtons({
  characterSlug,
  initialLikes,
  initialBookmarks,
  initialLiked,
  initialBookmarked,
  isSignedIn,
}: {
  characterSlug: string;
  initialLikes: number;
  initialBookmarks: number;
  initialLiked: boolean;
  initialBookmarked: boolean;
  isSignedIn: boolean;
}) {
  const [likes, setLikes] = useState(initialLikes);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [isLiked, setIsLiked] = useState(initialLiked);
  const [isBookmarked, setIsBookmarked] = useState(initialBookmarked);
  const [busy, setBusy] = useState<"like" | "bookmark" | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  async function postInteraction(type: "like" | "bookmark") {
    if (!isSignedIn) {
      setHint("Sign in to use likes and bookmarks.");
      return;
    }
    setHint(null);
    setBusy(type);
    try {
      const res = await fetch(
        `/api/character/${encodeURIComponent(characterSlug)}/interaction`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        }
      );
      const data = (await res.json()) as {
        error?: string;
        likeCount?: number;
        bookmarkCount?: number;
        liked?: boolean;
        bookmarked?: boolean;
      };
      if (!res.ok) {
        setHint(data.error || "Something went wrong.");
        return;
      }
      if (typeof data.likeCount === "number") setLikes(data.likeCount);
      if (typeof data.bookmarkCount === "number") setBookmarks(data.bookmarkCount);
      if (typeof data.liked === "boolean") setIsLiked(data.liked);
      if (typeof data.bookmarked === "boolean") setIsBookmarked(data.bookmarked);
    } catch {
      setHint("Network error. Try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => postInteraction("like")}
          className={cn(
            "flex-1 transition-colors border rounded-xl py-3 flex items-center justify-center gap-2 font-medium disabled:opacity-60",
            isLiked
              ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
              : "bg-background-elevated hover:bg-white/10 border-white/5 text-text-primary"
          )}
        >
          <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
          {likes}
        </button>
        <button
          type="button"
          disabled={busy !== null}
          onClick={() => postInteraction("bookmark")}
          className={cn(
            "flex-1 transition-colors border rounded-xl py-3 flex items-center justify-center gap-2 font-medium disabled:opacity-60",
            isBookmarked
              ? "bg-blue-500/10 border-blue-500/20 text-blue-500 hover:bg-blue-500/20"
              : "bg-background-elevated hover:bg-white/10 border-white/5 text-text-primary"
          )}
        >
          <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
          {bookmarks}
        </button>
        <button
          type="button"
          className="bg-background-elevated hover:bg-white/10 transition-colors border border-white/5 rounded-xl p-3 flex items-center justify-center text-text-primary"
        >
          <Share className="w-5 h-5" />
        </button>
        <button
          type="button"
          className="bg-background-elevated hover:bg-white/10 transition-colors border border-white/5 rounded-xl p-3 flex items-center justify-center text-text-primary"
        >
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      {hint && (
        <p
          className={cn(
            "text-xs px-1",
            hint === CHARACTER_SOCIAL_CLIENT_HINT ? "text-amber-500" : "text-amber-400/90"
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}
