"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHARACTER_SOCIAL_CLIENT_HINT } from "@/lib/prisma-character-social";

export type CommentItem = {
  id: string;
  body: string;
  createdAt: string;
  authorName: string;
  authorImage: string | null;
};

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return "";
  }
}

export function CharacterComments({
  characterSlug,
  initialComments,
  isSignedIn,
}: {
  characterSlug: string;
  initialComments: CommentItem[];
  isSignedIn: boolean;
}) {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!isSignedIn) {
      setError("Sign in to post a comment.");
      return;
    }
    const trimmed = text.trim();
    if (!trimmed) return;

    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/character/${encodeURIComponent(characterSlug)}/comments`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body: trimmed }),
        }
      );
      const data = (await res.json()) as { error?: string; comment?: CommentItem };
      if (!res.ok) {
        setError(data.error || "Could not post comment.");
        return;
      }
      if (data.comment) {
        setComments((prev) => [data.comment!, ...prev]);
        setText("");
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-background-paper rounded-3xl border border-white/5 p-6 md:p-8">
      {error === CHARACTER_SOCIAL_CLIENT_HINT && (
        <div className="mb-4 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm">
          {error}
        </div>
      )}
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-bold text-white">Community</h2>
        <span className="text-sm text-text-muted">Text comments only</span>
      </div>

      {isSignedIn ? (
        <form onSubmit={handleSubmit} className="mb-8 space-y-3">
          <label className="sr-only" htmlFor="character-comment">
            Your comment
          </label>
          <textarea
            id="character-comment"
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            rows={3}
            placeholder="Share your thoughts (plain text only, no links)…"
            className="w-full rounded-2xl border border-white/10 bg-background-elevated px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 resize-y min-h-[88px]"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-text-muted">{text.length} / 2000</span>
            <button
              type="submit"
              disabled={submitting || !text.trim()}
              className={cn(
                "px-5 py-2 rounded-xl text-sm font-medium transition-colors",
                submitting || !text.trim()
                  ? "bg-white/10 text-text-muted cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90 text-white"
              )}
            >
              {submitting ? "Posting…" : "Post comment"}
            </button>
          </div>
          {error && error !== CHARACTER_SOCIAL_CLIENT_HINT && <p className="text-sm text-red-400">{error}</p>}
        </form>
      ) : (
        <p className="text-sm text-text-secondary mb-8 rounded-2xl border border-dashed border-white/10 bg-background-elevated/40 px-4 py-3">
          <Link
            href={`/api/auth/signin?callbackUrl=${encodeURIComponent(`/character/${characterSlug}`)}`}
            className="text-primary hover:underline"
          >
            Sign in
          </Link>{" "}
          to leave a comment.
        </p>
      )}

      {comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-12 border border-dashed border-white/10 rounded-2xl bg-background-elevated/30">
          <MessageCircle className="w-10 h-10 text-text-muted mb-3 opacity-50" />
          <p className="text-text-secondary text-sm">No comments yet</p>
          <p className="text-text-muted text-xs mt-1">Be the first to say something.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li
              key={c.id}
              className="rounded-2xl border border-white/5 bg-background-elevated/50 p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 overflow-hidden flex-shrink-0 flex items-center justify-center text-primary text-sm font-semibold">
                  {c.authorImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.authorImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (c.authorName || "M").charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
                    <span className="text-sm font-medium text-white">{c.authorName}</span>
                    <span className="text-xs text-text-muted">{formatTime(c.createdAt)}</span>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary whitespace-pre-wrap break-words">
                    {c.body}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
