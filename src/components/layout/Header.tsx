import Link from "next/link";
import { Suspense } from "react";
import { Coins } from "lucide-react";
import { auth } from "@/auth";
import { NotificationBell } from "@/components/layout/notification-bell";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { LoginButton } from "@/components/auth/LoginButton";
import { UserAvatar } from "@/components/auth/UserAvatar";

export async function Header() {
  const session = await auth();
  const balance = session?.user?.balance ?? 0;

  return (
    <header className="sticky top-0 z-30 h-20 w-full bg-background-paper/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 md:px-8">
      {/* Left section: Global Search */}
      <Suspense
        fallback={
          <div className="flex-1 max-w-xl hidden md:block h-11 rounded-xl bg-background-elevated/60 border border-white/5 animate-pulse" />
        }
      >
        <GlobalSearch />
      </Suspense>

      {/* Right section: Actions */}
      <div className="flex items-center gap-4 md:gap-6 ml-auto">
        {/* Create / Submit Button Placeholder */}
        <Link
          href="/submit"
          className="hidden md:flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white rounded-xl bg-gradient-primary hover:opacity-90 transition-all duration-200 hover:shadow-[0_0_15px_rgba(236,72,153,0.5)] active:scale-95"
        >
          Create / Submit
        </Link>

        {session ? (
          <>
            {/* Balance Display */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background-elevated border border-white/5">
              <Coins className="w-4 h-4 text-status-warning" />
              <span className="text-sm font-medium text-text-primary">
                {balance.toLocaleString()}
              </span>
            </div>

            <NotificationBell />

            <Link
              href="/profile"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-background-elevated border border-white/10 overflow-hidden hover:ring-2 ring-primary/50 transition-all"
              title="Profile"
            >
              <UserAvatar image={session.user?.image} />
            </Link>
          </>
        ) : (
          <LoginButton />
        )}
      </div>
    </header>
  );
}