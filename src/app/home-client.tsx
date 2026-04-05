"use client";

import { HeroSection } from "@/components/home/HeroSection";
import { DataPanel, type PlatformStatValues } from "@/components/home/DataPanel";
import { GameCard } from "@/components/home/GameCard";
import { useState } from "react";
import { cn } from "@/lib/utils";

const TABS = ["Trending", "Top Games", "New Releases", "Recommended"];

export type HomeGameCard = {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  plays: string;
  rating: number;
  image: string;
  url?: string | null;
};

export function HomeClient({
  games,
  stats,
}: {
  games: HomeGameCard[];
  stats: PlatformStatValues;
}) {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  return (
    <div className="flex flex-col w-full max-w-[1600px] mx-auto pb-12">
      <HeroSection />

      <div className="mb-10">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Platform Overview</h2>
        <DataPanel values={stats} />
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-6 border-b border-white/10 overflow-x-auto no-scrollbar pb-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={cn(
                "pb-3 text-sm md:text-base font-medium transition-all whitespace-nowrap relative",
                activeTab === tab
                  ? "text-primary"
                  : "text-text-secondary hover:text-text-primary"
              )}
            >
              {tab}
              {activeTab === tab && (
                <span className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-primary shadow-[0_0_10px_rgba(139,92,246,0.8)]" />
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
          {games.length === 0 ? (
            <p className="text-text-muted col-span-full text-center py-12">
              No published games yet. Run <code className="text-text-secondary">pnpm db:seed</code> after migrating the database.
            </p>
          ) : (
            games.map((game) => <GameCard key={game.id} {...game} />)
          )}
        </div>
      </div>
    </div>
  );
}
