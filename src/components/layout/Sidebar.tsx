"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Gamepad2,
  Users,
  PenTool,
  Tags,
  FileText,
  Settings,
  ShieldCheck,
  Menu,
  PanelLeftClose,
  PanelLeft,
  X,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { name: "Home", href: "/", icon: LayoutDashboard },
  { name: "Games", href: "/game", icon: Gamepad2 },
  { name: "Characters", href: "/character", icon: Users },
  { name: "Creators", href: "/creators", icon: PenTool },
];

export function Sidebar({
  isCollapsed,
  onToggleCollapse,
}: {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <>
      {/* Mobile / small tablet: open menu */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-primary rounded-full md:hidden shadow-[0_0_15px_rgba(139,92,246,0.5)] text-white"
        aria-label="Open navigation menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 bg-background-paper/80 backdrop-blur-md border-r border-white/5 flex flex-col transition-[width,transform] duration-300 ease-in-out md:translate-x-0",
          "max-md:w-[min(100vw-2rem,11rem)]",
          isCollapsed ? "md:w-14" : "md:w-44",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Collapse toggle: md+ (non-H5). On mobile drawer, show close affordance in header row */}
        <div
          className={cn(
            "h-14 shrink-0 flex items-center border-b border-white/5",
            isCollapsed ? "justify-center px-0" : "justify-between gap-2 pl-3 pr-2"
          )}
        >
          <Link
            href="/"
            className={cn(
              "font-bold bg-gradient-primary bg-clip-text text-transparent truncate min-w-0",
              isCollapsed ? "text-[11px] leading-tight text-center px-0 max-w-[2.5rem]" : "text-base md:text-sm pl-1"
            )}
            onClick={() => setIsOpen(false)}
          >
            {isCollapsed ? "HW" : "HeyWaii"}
          </Link>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="md:hidden p-2 rounded-lg text-text-secondary hover:bg-white/5 hover:text-text-primary"
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden md:inline-flex p-2 rounded-lg text-text-secondary hover:bg-white/5 hover:text-text-primary"
              aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={isCollapsed ? "Expand" : "Collapse"}
            >
              {isCollapsed ? (
                <PanelLeft className="w-5 h-5" />
              ) : (
                <PanelLeftClose className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto no-scrollbar">
          {navItems.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl transition-all duration-200 group text-sm",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-text-secondary hover:bg-white/5 hover:text-text-primary",
                  isCollapsed
                    ? "justify-center px-0 py-2.5"
                    : "px-3 py-2.5"
                )}
                onClick={() => setIsOpen(false)}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    "w-[1.125rem] h-[1.125rem] shrink-0",
                    isActive ? "text-primary" : "group-hover:text-text-primary"
                  )}
                />
                {!isCollapsed && (
                  <span className="truncate leading-tight">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 pt-1 space-y-0.5 border-t border-white/5 shrink-0">
          {isAdmin && (
            <>
              <Link
                href="/admin/api-config"
                className={cn(
                  "flex items-center gap-2.5 rounded-xl transition-all duration-200 group text-status-warning hover:bg-white/5 text-sm",
                  pathname.startsWith("/admin/api-config") && "bg-white/5",
                  isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
                )}
                onClick={() => setIsOpen(false)}
                title={isCollapsed ? "Admin API" : undefined}
              >
                <ShieldCheck className="w-[1.125rem] h-[1.125rem] shrink-0" />
                {!isCollapsed && <span className="truncate">Admin API</span>}
              </Link>
              <Link
                href="/admin/crawler"
                className={cn(
                  "flex items-center gap-2.5 rounded-xl transition-all duration-200 group text-status-warning hover:bg-white/5 text-sm",
                  pathname.startsWith("/admin/crawler") && "bg-white/5",
                  isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
                )}
                onClick={() => setIsOpen(false)}
                title={isCollapsed ? "Crawler" : undefined}
              >
                <ShieldCheck className="w-[1.125rem] h-[1.125rem] shrink-0" />
                {!isCollapsed && <span className="truncate">Crawler</span>}
              </Link>
            </>
          )}
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-2.5 rounded-xl transition-all duration-200 group text-text-secondary hover:bg-white/5 hover:text-text-primary text-sm",
              isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
            )}
            onClick={() => setIsOpen(false)}
            title={isCollapsed ? "Settings" : undefined}
          >
            <Settings className="w-[1.125rem] h-[1.125rem] shrink-0 group-hover:text-text-primary transition-colors" />
            {!isCollapsed && <span className="truncate">Settings</span>}
          </Link>
          <Link
            href="/blog"
            className={cn(
              "flex items-center gap-2.5 rounded-xl transition-all duration-200 group text-text-secondary hover:bg-white/5 hover:text-text-primary text-sm",
              isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"
            )}
            onClick={() => setIsOpen(false)}
            title={isCollapsed ? "Blog" : undefined}
          >
            <FileText className="w-[1.125rem] h-[1.125rem] shrink-0 group-hover:text-text-primary transition-colors" />
            {!isCollapsed && <span className="truncate">Blog</span>}
          </Link>

          {!isCollapsed && (
            <div className="px-3 pt-3 pb-2 space-y-2 border-t border-white/5 mt-1">
              <p className="text-[10px] leading-snug text-text-secondary/80">
                HeyWaii Technology Inc.
              </p>
              <div className="flex flex-wrap gap-x-2 gap-y-1 text-[11px]">
                <Link
                  href="/terms"
                  className="text-text-secondary hover:text-primary underline-offset-2 hover:underline"
                  onClick={() => setIsOpen(false)}
                >
                  Terms
                </Link>
                <span className="text-text-secondary/40" aria-hidden>
                  ·
                </span>
                <Link
                  href="/privacy"
                  className="text-text-secondary hover:text-primary underline-offset-2 hover:underline"
                  onClick={() => setIsOpen(false)}
                >
                  Privacy
                </Link>
              </div>
            </div>
          )}
        </div>
      </aside>

      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden
        />
      )}
    </>
  );
}
