"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Coins, Key, History, Star, Edit3, Save, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type GameSummary = {
  slug: string;
  title: string;
  coverImage: string;
  shortDescription: string;
};
const TABS = [
  { id: "assets", label: "Assets & Keys", icon: Coins },
  { id: "history", label: "Play History", icon: History },
  { id: "favorites", label: "Favorites", icon: Star },
];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [apiKey, setApiKey] = useState("");
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [keySaved, setKeySaved] = useState(false);
  const [historyItems, setHistoryItems] = useState<{ playedAt: string; game: GameSummary }[]>([]);
  const [favoriteItems, setFavoriteItems] = useState<{ id: string; game: GameSummary }[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || activeTab !== "history") return;
    setHistoryLoading(true);
    fetch("/api/user/play-history", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setHistoryItems(Array.isArray(d.items) ? d.items : []))
      .catch(() => setHistoryItems([]))
      .finally(() => setHistoryLoading(false));
  }, [activeTab, status]);

  useEffect(() => {
    if (status !== "authenticated" || activeTab !== "favorites") return;
    setFavoritesLoading(true);
    fetch("/api/user/favorites", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setFavoriteItems(Array.isArray(d.items) ? d.items : []))
      .catch(() => setFavoriteItems([]))
      .finally(() => setFavoritesLoading(false));
  }, [activeTab, status]);

  if (status === "loading") {
    return <div className="animate-pulse flex items-center justify-center h-64 text-text-muted">Loading profile...</div>;
  }

  if (status === "unauthenticated") {
    return <div className="flex flex-col items-center justify-center h-[50vh] text-center"><h1 className="text-2xl font-bold mb-4">Not Signed In</h1><p className="text-text-muted">Please log in to view your profile and assets.</p></div>;
  }

  const user = session?.user;
  const balance = user?.balance ?? 0;

  const handleSaveKey = async () => {
    const trimmed = apiKey.trim();
    if (trimmed.length < 8) return;
    try {
      const r = await fetch("/api/user/api-key", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: "DEEPSEEK", key: trimmed }),
      });
      if (!r.ok) {
        setKeySaved(false);
        return;
      }
      setIsEditingKey(false);
      setApiKey("");
      setKeySaved(true);
      setTimeout(() => setKeySaved(false), 3000);
    } catch {
      setKeySaved(false);
    }
  };

  const handleClearDeepseek = async () => {
    try {
      await fetch("/api/user/api-key?provider=DEEPSEEK", { method: "DELETE", credentials: "include" });
      setApiKey("");
      setIsEditingKey(false);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="flex flex-col w-full max-w-[1200px] mx-auto pb-12">
      
      {/* Profile Header */}
      <div className="relative w-full rounded-3xl overflow-hidden bg-background-elevated border border-white/5 mb-8 p-6 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
        {/* Avatar */}
        <div className="relative group cursor-pointer">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-background shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={user?.image || `https://ui-avatars.com/api/?name=${user?.name || "User"}&background=8B5CF6&color=fff&size=128`} alt="Profile" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
            <Edit3 className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 text-center md:text-left">
          <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">{user?.name || "Anonymous User"}</h1>
          <p className="text-text-secondary text-sm md:text-base mb-4">{user?.email}</p>
          
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <Coins className="w-5 h-5 text-status-warning" />
              <div className="flex flex-col">
                <span className="text-xs text-text-muted leading-tight">Balance</span>
                <span className="text-sm font-bold text-white leading-tight">{balance.toLocaleString()} Coins</span>
              </div>
            </div>
            <button className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors border border-white/10">
              Top Up
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 md:gap-6 border-b border-white/10 overflow-x-auto no-scrollbar pb-1 mb-8">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 pb-3 text-sm md:text-base font-medium transition-all whitespace-nowrap relative",
              activeTab === tab.id
                ? "text-primary"
                : "text-text-secondary hover:text-text-primary"
            )}
          >
            <tab.icon className={cn("w-4 h-4 md:w-5 md:h-5", activeTab === tab.id && "text-primary")} />
            {tab.label}
            {activeTab === tab.id && (
              <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-background-paper rounded-2xl border border-white/5 p-6 md:p-8 min-h-[400px]">
        
        {/* Assets & Keys Tab */}
        {activeTab === "assets" && (
          <div className="max-w-2xl space-y-8 animate-in fade-in duration-300">
            <section>
              <h2 className="text-xl font-bold text-white mb-4">Custom API Keys</h2>
              <p className="text-text-secondary text-sm mb-6">
                Configure your own Large Language Model API keys. When using custom keys, playing games will not consume platform Coins. 
                <span className="block mt-1 text-status-warning font-medium">Keys are encrypted before saving and only used securely server-side.</span>
              </p>

              <div className="space-y-4">
                <div className="bg-background-elevated p-4 rounded-xl border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-white flex items-center gap-2">
                      <Key className="w-4 h-4 text-text-muted" /> DeepSeek API Key
                    </label>
                    {keySaved && (
                      <span className="text-xs text-status-success flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Saved successfully
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mb-3">
                    Used for the &quot;DeepSeek (Custom Key)&quot; model in play mode. Official models use your
                    platform balance instead.
                  </p>

                  <div className="flex flex-wrap gap-3">
                    <input
                      type={isEditingKey ? "text" : "password"}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      disabled={!isEditingKey}
                      placeholder="sk-..."
                      className="flex-1 min-w-[200px] bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary focus:ring-1 ring-primary disabled:opacity-50 transition-all font-mono"
                    />
                    {isEditingKey ? (
                      <button
                        type="button"
                        onClick={() => void handleSaveKey()}
                        className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors flex items-center gap-2"
                      >
                        <Save className="w-4 h-4" /> Save
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsEditingKey(true)}
                        className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
                      >
                        Add / replace
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleClearDeepseek()}
                      className="px-4 py-2 rounded-lg bg-white/5 text-text-secondary text-sm hover:bg-white/10 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                <div className="bg-background-elevated p-4 rounded-xl border border-white/10 opacity-60">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-semibold text-white flex items-center gap-2">
                      <Key className="w-4 h-4 text-text-muted" /> Anthropic API Key
                    </label>
                  </div>
                  <div className="flex gap-3">
                    <input
                      type="password"
                      disabled
                      placeholder="Coming soon..."
                      className="flex-1 bg-background border border-white/10 rounded-lg px-3 py-2 text-sm text-text-primary disabled:opacity-50 transition-all font-mono"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="animate-in fade-in duration-300 space-y-4">
            {historyLoading ? (
              <p className="text-text-muted text-sm">Loading…</p>
            ) : historyItems.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-text-muted">
                <div className="text-center">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No play history yet.</p>
                </div>
              </div>
            ) : (
              <ul className="space-y-3">
                {historyItems.map((row) => (
                  <li key={`${row.playedAt}-${row.game.slug}`}>
                    <Link
                      href={`/game/${row.game.slug}`}
                      className="flex gap-4 p-4 rounded-xl bg-background-elevated border border-white/5 hover:border-primary/30 transition-colors"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={row.game.coverImage}
                        alt=""
                        className="w-20 h-14 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-white truncate">{row.game.title}</p>
                        <p className="text-xs text-text-muted mt-1">
                          {new Date(row.playedAt).toLocaleString()}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "favorites" && (
          <div className="animate-in fade-in duration-300 space-y-4">
            {favoritesLoading ? (
              <p className="text-text-muted text-sm">Loading…</p>
            ) : favoriteItems.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-text-muted">
                <div className="text-center">
                  <Star className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>You haven&apos;t favorited any games yet.</p>
                </div>
              </div>
            ) : (
              <ul className="grid gap-3 sm:grid-cols-2">
                {favoriteItems.map((row) => (
                  <li key={row.id}>
                    <Link
                      href={`/game/${row.game.slug}`}
                      className="flex gap-3 p-4 rounded-xl bg-background-elevated border border-white/5 hover:border-primary/30 transition-colors h-full"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={row.game.coverImage}
                        alt=""
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-medium text-white line-clamp-2">{row.game.title}</p>
                        <p className="text-xs text-text-secondary line-clamp-2 mt-1">
                          {row.game.shortDescription}
                        </p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

      </div>
    </div>
  );
}