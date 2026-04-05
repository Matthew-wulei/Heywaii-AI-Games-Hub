"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "heywaii-sidebar-collapsed";

/** md+ expanded rail width matches Sidebar `md:w-44` (11rem) */
const MAIN_PAD_EXPANDED_MD = "md:pl-44";
/** Collapsed rail w-14 */
const MAIN_PAD_COLLAPSED_MD = "md:pl-14";

export function AppLayoutClient({ children, header }: { children: React.ReactNode, header?: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const pathname = usePathname();

  // If the route is /chat/something, we want a full-screen immersive layout
  const isChatRoute = pathname?.startsWith("/chat/");

  /** Character grid listings: use full width, avoid large side gutters (not detail /character/[slug]) */
  const isCharacterListingRoute =
    pathname === "/character" ||
    (pathname?.startsWith("/character/category/") ?? false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "1") setIsSidebarCollapsed(true);
      else if (stored === "0") setIsSidebarCollapsed(false);
      else {
        // Narrow non-mobile viewport: start collapsed for more content room
        const mq = window.matchMedia("(min-width: 768px) and (max-width: 1279px)");
        if (mq.matches) setIsSidebarCollapsed(true);
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  const onToggleCollapse = useCallback(() => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  return (
    <div className="flex flex-1 min-h-screen">
      <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={onToggleCollapse} />
      <div
        className={cn(
          "flex-1 flex flex-col min-w-0 transition-[padding] duration-300 ease-in-out max-md:pl-0",
          hydrated && isSidebarCollapsed && !isChatRoute ? MAIN_PAD_COLLAPSED_MD : "",
          hydrated && !isSidebarCollapsed && !isChatRoute ? MAIN_PAD_EXPANDED_MD : "",
          isChatRoute ? "md:pl-0 h-[100dvh]" : "min-h-screen"
        )}
      >
        {!isChatRoute && header}
        <main
          className={cn(
            "flex-1 w-full mx-auto relative",
            isChatRoute
              ? "p-0 max-w-none h-[100dvh] overflow-hidden"
              : isCharacterListingRoute
                ? "p-3 sm:p-4 md:px-5 md:py-6 max-w-none"
                : "p-4 md:p-8 xl:px-12 max-w-screen-2xl"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
