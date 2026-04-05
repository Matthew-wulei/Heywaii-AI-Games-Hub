"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useInView } from "react-intersection-observer";
import { CharacterCard } from "@/components/character/CharacterCard";

type Character = {
  id: string;
  slug: string;
  name: string;
  avatar: string;
  categorySlug: string;
  description: string;
  creatorName?: string | null;
  chatCount?: number;
};

function capCategory(slug: string) {
  if (!slug) return "";
  if (slug.toLowerCase() === "other") return "All";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

const MAX_ITEMS = 50;
const BATCH = 10;

export function InfiniteCharacterList({
  initialCharacters,
  categorySlug,
}: {
  initialCharacters: Character[];
  categorySlug?: string;
}) {
  const [characters, setCharacters] = useState<Character[]>(initialCharacters);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const { ref, inView } = useInView({ threshold: 0, rootMargin: "120px" });

  const fetchingRef = useRef(false);
  const charactersRef = useRef(characters);
  charactersRef.current = characters;

  // Reset when server sends a new first page (navigation / filters)
  useEffect(() => {
    setCharacters(initialCharacters);
    setHasMore(initialCharacters.length >= 20); // Should match initialLoadSize
    fetchingRef.current = false;
    charactersRef.current = initialCharacters; // CRITICAL: Update the ref immediately!
  }, [initialCharacters]);

  const loadMore = useCallback(async () => {
    if (fetchingRef.current) return;
    if (!hasMore || charactersRef.current.length >= MAX_ITEMS) return;

    fetchingRef.current = true;
    setIsLoading(true);

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const pageNumber = parseInt(urlParams.get("page") || "1", 10);
      const pageSkip = (pageNumber - 1) * 50;
      const currentLen = charactersRef.current.length;
      const skip = pageSkip + currentLen;

      const url = new URL("/api/character", window.location.origin);
      url.searchParams.set("skip", String(skip));
      url.searchParams.set("take", String(BATCH));
      if (categorySlug) url.searchParams.set("categorySlug", categorySlug);

      const sort = urlParams.get("sort");
      if (sort) url.searchParams.set("sort", sort);
      const gender = urlParams.get("gender");
      if (gender) url.searchParams.set("gender", gender);
      if (urlParams.get("nsfw") === "true") url.searchParams.set("nsfw", "true");
      const q = urlParams.get("q");
      if (q) url.searchParams.set("q", q);

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as { characters: Character[] };

      if (data.characters.length === 0) {
        setHasMore(false);
        return;
      }

      setCharacters((prev) => {
        const newChars = data.characters.filter(
          (c) => !prev.some((p) => p.id === c.id)
        );
        if (newChars.length === 0) {
          setHasMore(false);
          return prev;
        }

        let next = [...prev, ...newChars];
        if (data.characters.length < BATCH) {
          setHasMore(false);
        }
        if (next.length >= MAX_ITEMS) {
          setHasMore(false);
          next = next.slice(0, MAX_ITEMS);
        }
        return next;
      });
    } catch (err) {
      console.error("Failed to load more characters:", err);
      setHasMore(false);
    } finally {
      fetchingRef.current = false;
      setIsLoading(false);
    }
  }, [hasMore, categorySlug]);

  useEffect(() => {
    if (!inView || !hasMore) return;
    if (charactersRef.current.length >= MAX_ITEMS) return;
    void loadMore();
  }, [inView, hasMore, loadMore, characters.length]);

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2 sm:gap-3 md:gap-3">
        {characters.map((c) => (
          <CharacterCard
            key={c.id}
            compact
            slug={c.slug}
            name={c.name}
            avatar={c.avatar}
            categoryLabel={capCategory(c.categorySlug)}
            description={c.description}
            creatorName={c.creatorName}
            chatCount={c.chatCount}
          />
        ))}
      </div>

      {hasMore && characters.length < MAX_ITEMS && (
        <div ref={ref} className="w-full flex justify-center py-8 min-h-[4rem]">
          {isLoading && (
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          )}
        </div>
      )}

      {!hasMore && characters.length > 0 && characters.length < MAX_ITEMS && (
        <p className="text-text-muted text-center py-8 text-sm">
          No more characters found.
        </p>
      )}
    </>
  );
}
