"use client";

import { Search, Sparkles, Gamepad2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  FormEvent,
  KeyboardEvent,
} from "react";
import { cn } from "@/lib/utils";

function capCategory(slug: string) {
  if (!slug) return "";
  if (slug.toLowerCase() === "other") return "All";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

type SuggestCharacter = {
  slug: string;
  name: string;
  avatar: string;
  categorySlug: string;
  isNsfw: boolean;
};

type SuggestGame = {
  slug: string;
  title: string;
  coverImage: string;
  categorySlug: string;
};

type SuggestResponse = {
  characters: SuggestCharacter[];
  games: SuggestGame[];
};

const DEBOUNCE_MS = 260;

export function GlobalSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nsfwOptIn = searchParams.get("nsfw") === "true";
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SuggestResponse>({ characters: [], games: [] });
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  const rows = useMemo(() => {
    const list: Array<
      | { kind: "character"; item: SuggestCharacter }
      | { kind: "game"; item: SuggestGame }
    > = [];
    for (const c of data.characters) list.push({ kind: "character", item: c });
    for (const g of data.games) list.push({ kind: "game", item: g });
    return list;
  }, [data]);

  const fetchSuggest = useCallback(async (q: string) => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setLoading(true);
    try {
      const sp = new URLSearchParams({ q });
      if (nsfwOptIn) sp.set("nsfw", "true");
      const res = await fetch(`/api/search/suggest?${sp.toString()}`, {
        signal: ac.signal,
      });
      if (!res.ok) throw new Error("suggest failed");
      const json = (await res.json()) as SuggestResponse;
      if (!ac.signal.aborted) {
        setData({
          characters: Array.isArray(json.characters) ? json.characters : [],
          games: Array.isArray(json.games) ? json.games : [],
        });
      }
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      setData({ characters: [], games: [] });
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [nsfwOptIn]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setData({ characters: [], games: [] });
      setLoading(false);
      setActiveIndex(-1);
      return;
    }
    const t = window.setTimeout(() => {
      void fetchSuggest(q);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query, fetchSuggest]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (activeIndex >= rows.length) setActiveIndex(rows.length > 0 ? rows.length - 1 : -1);
  }, [rows.length, activeIndex]);

  const trimmed = query.trim();
  const showPanel = open && trimmed.length >= 1;

  const goRow = (index: number) => {
    const row = rows[index];
    if (!row) return;
    if (row.kind === "character") router.push(`/character/${row.item.slug}`);
    else router.push(`/game/${row.item.slug}`);
    setOpen(false);
    inputRef.current?.blur();
  };

  const characterSearchHref = useMemo(() => {
    const sp = new URLSearchParams({ q: trimmed });
    if (nsfwOptIn) sp.set("nsfw", "true");
    return `/character?${sp.toString()}`;
  }, [trimmed, nsfwOptIn]);

  const submitFallback = () => {
    if (!trimmed) return;
    router.push(characterSearchHref);
    setOpen(false);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0 && rows[activeIndex]) {
      goRow(activeIndex);
      return;
    }
    submitFallback();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!showPanel) return;
    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (rows.length === 0 ? -1 : i < rows.length - 1 ? i + 1 : 0));
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (rows.length === 0 ? -1 : i <= 0 ? -1 : i - 1));
    }
  };

  const hasResults = data.characters.length > 0 || data.games.length > 0;
  const showEmpty = !loading && trimmed.length >= 1 && !hasResults;

  return (
    <form
      onSubmit={handleSubmit}
      className="flex-1 max-w-xl min-w-0 hidden md:flex relative z-40"
      role="search"
    >
      <div ref={wrapRef} className="relative w-full">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none z-10">
          {loading ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" aria-hidden />
          ) : (
            <Search className="w-5 h-5 text-text-muted" aria-hidden />
          )}
        </div>
        <input
          ref={inputRef}
          type="search"
          autoComplete="off"
          aria-expanded={showPanel}
          aria-controls="global-search-suggest"
          aria-activedescendant={
            activeIndex >= 0 ? `search-suggest-${activeIndex}` : undefined
          }
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="block w-full py-2.5 pl-10 pr-3 text-sm bg-background-elevated border border-white/10 rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50 placeholder-text-muted transition-all duration-300 shadow-inner shadow-black/20"
          placeholder="Search characters & games…"
        />

        {showPanel && (
          <div
            id="global-search-suggest"
            className="absolute left-0 right-0 top-[calc(100%+6px)] rounded-xl border border-white/10 bg-background-paper/95 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.45)] overflow-hidden max-h-[min(70vh,420px)] flex flex-col"
            role="listbox"
            aria-label="Search suggestions"
          >
            <div className="overflow-y-auto no-scrollbar overscroll-contain flex-1 py-2">
              {data.characters.length > 0 && (
                <div className="px-2">
                  <div className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Characters
                  </div>
                  <ul className="space-y-0.5">
                    {data.characters.map((c, i) => {
                      const idx = i;
                      const active = activeIndex === idx;
                      return (
                        <li key={`c-${c.slug}`}>
                          <button
                            type="button"
                            id={`search-suggest-${idx}`}
                            role="option"
                            aria-selected={active}
                            onMouseEnter={() => setActiveIndex(idx)}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => goRow(idx)}
                            className={cn(
                              "w-full flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                              active
                                ? "bg-primary/15 text-text-primary"
                                : "hover:bg-white/5 text-text-secondary"
                            )}
                          >
                            <span className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-white/5 ring-1 ring-white/10">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={c.avatar}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium text-text-primary truncate">
                                {c.name}
                              </span>
                              <span className="block text-xs text-text-muted truncate">
                                {capCategory(c.categorySlug)}
                                {c.isNsfw ? " · NSFW" : ""}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {data.games.length > 0 && (
                <div className={cn("px-2", data.characters.length > 0 && "mt-2 pt-2 border-t border-white/5")}>
                  <div className="flex items-center gap-1.5 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-muted">
                    <Gamepad2 className="w-3.5 h-3.5 text-emerald-400/90" />
                    Games
                  </div>
                  <ul className="space-y-0.5">
                    {data.games.map((g, j) => {
                      const idx = data.characters.length + j;
                      const active = activeIndex === idx;
                      return (
                        <li key={`g-${g.slug}`}>
                          <button
                            type="button"
                            id={`search-suggest-${idx}`}
                            role="option"
                            aria-selected={active}
                            onMouseEnter={() => setActiveIndex(idx)}
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => goRow(idx)}
                            className={cn(
                              "w-full flex items-center gap-3 rounded-lg px-2 py-2 text-left transition-colors",
                              active
                                ? "bg-emerald-500/10 text-text-primary"
                                : "hover:bg-white/5 text-text-secondary"
                            )}
                          >
                            <span className="relative h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-white/5 ring-1 ring-white/10">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={g.coverImage}
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium text-text-primary truncate">
                                {g.title}
                              </span>
                              <span className="block text-xs text-text-muted truncate">
                                {capCategory(g.categorySlug)}
                              </span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {showEmpty && (
                <p className="px-4 py-8 text-center text-sm text-text-muted">
                  No characters or games match &ldquo;{trimmed}&rdquo;.
                </p>
              )}

              {loading && !hasResults && (
                <div className="px-4 py-10 flex flex-col items-center gap-2 text-text-muted text-sm">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  Searching…
                </div>
              )}
            </div>

            {trimmed.length >= 1 && (
              <div className="shrink-0 border-t border-white/10 bg-black/20 px-2 py-2 flex flex-wrap gap-2">
                <Link
                  href={characterSearchHref}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setOpen(false)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-primary/20 text-text-secondary hover:text-text-primary transition-colors"
                >
                  All characters →
                </Link>
                <Link
                  href={`/game?q=${encodeURIComponent(trimmed)}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setOpen(false)}
                  className="text-xs px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-emerald-500/15 text-text-secondary hover:text-text-primary transition-colors"
                >
                  All games →
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
