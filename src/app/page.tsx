"use client";

import { HeroSection } from "@/components/home/HeroSection";
import { DataPanel } from "@/components/home/DataPanel";
import { GameCard } from "@/components/home/GameCard";
import { useState } from "react";
import { cn } from "@/lib/utils";

const TABS = ["Trending", "Top Games", "New Releases", "Recommended"];

// Mock Data
const MOCK_GAMES = Array.from({ length: 12 }).map((_, i) => ({
  id: `game-${i}`,
  slug: `game-slug-${i}`,
  title: `AI Game Title ${i + 1}`,
  category: i % 2 === 0 ? "RPG" : "Simulation",
  description:
    "This is a short description of the game. It provides a quick overview of the gameplay, story, or mechanics to entice the player.",
  plays: `${(Math.random() * 10).toFixed(1)}k`,
  rating: Number((Math.random() * 1 + 4).toFixed(1)),
  image: `https://images.unsplash.com/photo-${1542751371 + i}-adc38448a05e?q=80&w=800&auto=format&fit=crop`, // Placeholder
}));

export default function Home() {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  return (
    <div className="flex flex-col w-full max-w-[1600px] mx-auto pb-12">
      <HeroSection />
      
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-text-primary mb-6">Platform Overview</h2>
        <DataPanel />
      </div>

      <div className="flex flex-col gap-6">
        {/* Tabs Navigation */}
        <div className="flex items-center gap-6 border-b border-white/10 overflow-x-auto no-scrollbar pb-1">
          {TABS.map((tab) => (
            <button
              key={tab}
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

        {/* Game Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
          {MOCK_GAMES.map((game) => (
            <GameCard key={game.id} {...game} />
          ))}
        </div>
      </div>
    </div>
  );
}
