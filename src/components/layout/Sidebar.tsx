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
  Upload,
  User,
  Settings,
  LogOut,
  ShieldCheck,
  Menu,
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Games", href: "/game", icon: Gamepad2 },
  { name: "Characters", href: "/character", icon: Users },
  { name: "Creators", href: "/creators", icon: PenTool },
  { name: "Categories", href: "/categories", icon: Tags },
  { name: "Blog", href: "/blog", icon: FileText },
  { name: "Submit", href: "/submit", icon: Upload },
  { name: "Profile", href: "/profile", icon: User },
];

const bottomItems = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Logout", href: "#", icon: LogOut },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAdmin = (session?.user as any)?.role === "ADMIN";

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 p-3 bg-primary rounded-full md:hidden shadow-[0_0_15px_rgba(139,92,246,0.5)] text-white"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-background-paper/80 backdrop-blur-md border-r border-white/5 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="p-6 h-20 flex items-center border-b border-white/5">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent"
          >
            HeyWaii
          </Link>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto no-scrollbar">
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
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-text-secondary hover:bg-white/5 hover:text-text-primary"
                )}
                onClick={() => setIsOpen(false)}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive ? "text-primary" : "group-hover:text-text-primary"
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Navigation */}
        <div className="p-4 space-y-1 border-t border-white/5">
          {isAdmin && (
            <>
              <Link
                href="/admin/api-config"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-status-warning hover:bg-white/5",
                  pathname.startsWith("/admin/api-config") && "bg-white/5"
                )}
              >
                <ShieldCheck className="w-5 h-5" />
                Admin API
              </Link>
              <Link
                href="/admin/crawler"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-status-warning hover:bg-white/5",
                  pathname.startsWith("/admin/crawler") && "bg-white/5"
                )}
              >
                <ShieldCheck className="w-5 h-5" />
                Crawler
              </Link>
            </>
          )}
          {bottomItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-text-secondary hover:bg-white/5 hover:text-text-primary"
            >
              <item.icon className="w-5 h-5 group-hover:text-text-primary transition-colors" />
              {item.name}
            </Link>
          ))}
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}