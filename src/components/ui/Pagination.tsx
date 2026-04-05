"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function Pagination({
  currentPage,
  totalPages,
}: {
  currentPage: number;
  totalPages: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  if (totalPages <= 1) return null;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-12">
      <button
        onClick={() => router.push(createPageURL(currentPage - 1))}
        disabled={currentPage <= 1}
        className={cn(
          "p-2 rounded-xl border border-white/10 transition-colors",
          currentPage <= 1
            ? "text-white/20 cursor-not-allowed"
            : "text-white hover:bg-white/5 hover:border-white/20"
        )}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-1">
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          // simple logic to center the active page a bit
          let pageNum = i + 1;
          if (totalPages > 5 && currentPage > 3) {
            pageNum = currentPage - 2 + i;
            if (pageNum > totalPages) pageNum = totalPages - (4 - i);
          }

          const isActive = currentPage === pageNum;

          return (
            <button
              key={pageNum}
              onClick={() => router.push(createPageURL(pageNum))}
              className={cn(
                "w-10 h-10 rounded-xl border text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(139,92,246,0.3)]"
                  : "border-transparent text-text-secondary hover:bg-white/5 hover:text-white"
              )}
            >
              {pageNum}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => router.push(createPageURL(currentPage + 1))}
        disabled={currentPage >= totalPages}
        className={cn(
          "p-2 rounded-xl border border-white/10 transition-colors",
          currentPage >= totalPages
            ? "text-white/20 cursor-not-allowed"
            : "text-white hover:bg-white/5 hover:border-white/20"
        )}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}
