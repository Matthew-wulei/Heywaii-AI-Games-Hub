"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { canonicalCategoryFromPath } from "@/lib/category-slug";
import { ChevronDown } from "lucide-react";
import { useState, useRef, useEffect, useTransition } from "react";

function capCategory(slug: string) {
  if (!slug) return "";
  if (slug.toLowerCase() === "other") return "All";
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

interface CategoryFilterProps {
  categories: string[];
}

export function CategoryFilter({ categories }: CategoryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [stylesOpen, setStylesOpen] = useState(false);
  const stylesRef = useRef<HTMLDivElement>(null);

  const currentSort = searchParams.get("sort") || "recent";
  const currentGender = searchParams.get("gender") || "All";
  const currentNsfw = searchParams.get("nsfw") === "true";

  const navigate = (href: string) => {
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  };

  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (stylesRef.current && !stylesRef.current.contains(event.target as Node)) {
        setStylesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    navigate(`${pathname}?${params.toString()}`);
  };

  const currentCategoryCanonical = canonicalCategoryFromPath(pathname, categories);

  const isAllSelected =
    pathname === "/character" && currentSort === "recent" && !currentCategoryCanonical;
  const isTrendingSelected = currentSort === "trending";

  return (
    <div
      className={cn(
        "relative z-30 mb-8 w-full isolate",
        isPending && "opacity-90"
      )}
      aria-busy={isPending}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.delete("sort");
                params.delete("category");
                params.set("page", "1");
                navigate(`/character?${params.toString()}`);
              }}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0",
                isAllSelected
                  ? "bg-primary text-white"
                  : "bg-background-paper border border-white/10 text-text-secondary hover:text-white"
              )}
            >
              All
            </button>

            <button
              type="button"
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString());
                params.set("sort", "trending");
                params.set("page", "1");
                navigate(`${pathname}?${params.toString()}`);
              }}
              className={cn(
                "px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap shrink-0",
                isTrendingSelected
                  ? "bg-primary text-white"
                  : "bg-background-paper border border-white/10 text-text-secondary hover:text-white"
              )}
            >
              Trending
            </button>

            <div className="relative shrink-0" ref={stylesRef}>
              <button
                type="button"
                onClick={() => setStylesOpen((o) => !o)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors whitespace-nowrap",
                  currentCategoryCanonical || stylesOpen
                    ? "bg-white/10 text-white border border-white/20"
                    : "bg-background-paper border border-white/10 text-text-secondary hover:text-white"
                )}
              >
                Styles{" "}
                {currentCategoryCanonical
                  ? `(${capCategory(currentCategoryCanonical)})`
                  : ""}
                <ChevronDown
                  className={cn(
                    "w-4 h-4 transition-transform",
                    stylesOpen && "rotate-180"
                  )}
                />
              </button>

              {stylesOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-background-elevated border border-white/10 rounded-xl shadow-2xl z-[60] p-2 max-h-[300px] overflow-y-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setStylesOpen(false);
                      const params = new URLSearchParams(searchParams.toString());
                      params.set("page", "1");
                      navigate(`/character?${params.toString()}`);
                    }}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                      !currentCategoryCanonical
                        ? "bg-primary/20 text-primary"
                        : "text-text-secondary hover:bg-white/5 hover:text-white"
                    )}
                  >
                    Reset (All Styles)
                  </button>
                  <div className="h-px bg-white/5 my-1" />
                  {categories.map((cat) => (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => {
                        setStylesOpen(false);
                        const params = new URLSearchParams(searchParams.toString());
                        params.set("page", "1");
                        navigate(
                          `/character/category/${encodeURIComponent(cat)}?${params.toString()}`
                        );
                      }}
                      className={cn(
                        "w-full text-left px-3 py-2 rounded-lg text-sm transition-colors",
                        currentCategoryCanonical &&
                          currentCategoryCanonical.toLowerCase() === cat.toLowerCase()
                          ? "bg-primary/20 text-primary"
                          : "text-text-secondary hover:bg-white/5 hover:text-white"
                      )}
                    >
                      {capCategory(cat)}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex bg-background-paper border border-white/10 rounded-xl p-1">
              {["All", "Male", "Female"].map((gender) => (
                <button
                  type="button"
                  key={gender}
                  onClick={() =>
                    updateParams({ gender: gender === "All" ? null : gender })
                  }
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-medium transition-colors",
                    currentGender === gender
                      ? "bg-white/10 text-white shadow-sm"
                      : "text-text-secondary hover:text-white"
                  )}
                >
                  {gender}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 cursor-pointer group bg-background-paper border border-white/10 rounded-xl px-4 py-2 hover:bg-white/5 transition-colors">
              <div
                className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                  currentNsfw
                    ? "bg-status-error border-status-error"
                    : "border-text-muted"
                )}
              >
                {currentNsfw && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    className="w-3 h-3 text-white"
                    stroke="currentColor"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium text-text-secondary group-hover:text-white transition-colors">
                NSFW
              </span>
              <input
                type="checkbox"
                className="hidden"
                checked={currentNsfw}
                onChange={(e) =>
                  updateParams({ nsfw: e.target.checked ? "true" : null })
                }
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
