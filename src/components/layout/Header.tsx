import Link from "next/link";
import { Search, Bell, User, Coins } from "lucide-react";
import { auth, signIn, signOut } from "@/auth";

export async function Header() {
  const session = await auth();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const balance = session?.user ? (session.user as any).balance || 0 : 0;

  return (
    <header className="sticky top-0 z-30 h-20 w-full bg-background-paper/80 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 md:px-8">
      {/* Left section: Global Search */}
      <div className="flex-1 max-w-xl hidden md:flex">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-5 h-5 text-text-muted" />
          </div>
          <input
            type="search"
            className="block w-full p-3 pl-10 text-sm bg-background-elevated border border-white/10 rounded-xl text-text-primary focus:ring-primary focus:border-primary placeholder-text-muted transition-all duration-300"
            placeholder="Search games, characters, creators..."
          />
        </div>
      </div>

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

            {/* Notifications */}
            <button className="relative p-2 text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-white/5">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-error rounded-full ring-2 ring-background-paper"></span>
            </button>

            {/* User Profile Dropdown Placeholder */}
            <form action={async () => {
              "use server"
              await signOut()
            }}>
              <button 
                type="submit"
                className="flex items-center justify-center w-10 h-10 rounded-full bg-background-elevated border border-white/10 overflow-hidden hover:ring-2 ring-primary/50 transition-all"
                title="Sign out"
              >
                {session.user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={session.user?.image} alt="User avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-text-secondary" />
                )}
              </button>
            </form>
          </>
        ) : (
          <form action={async () => {
            "use server"
            await signIn("google")
          }}>
            <button 
              type="submit"
              className="px-5 py-2.5 text-sm font-medium text-white rounded-xl bg-white/10 hover:bg-white/20 transition-all border border-white/10"
            >
              Log in
            </button>
          </form>
        )}
      </div>
    </header>
  );
}