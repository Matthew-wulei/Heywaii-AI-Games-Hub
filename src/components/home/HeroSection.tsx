"use client";

import { Play } from "lucide-react";

export function HeroSection() {
  return (
    <div className="relative w-full rounded-3xl overflow-hidden aspect-[21/9] md:aspect-[21/8] bg-background-elevated border border-white/5 mb-8">
      {/* Background Image Placeholder */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40"></div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-center p-8 md:p-12 xl:p-16 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/20 border border-primary/30 text-primary text-xs font-medium w-fit mb-4">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
          Featured Game
        </div>
        
        <h1 className="text-3xl md:text-5xl xl:text-6xl font-bold text-white mb-4 leading-tight">
          Cyberpunk AI Adventure
        </h1>
        
        <p className="text-text-secondary text-sm md:text-base xl:text-lg mb-8 line-clamp-3 md:line-clamp-none">
          Immerse yourself in a neon-lit dystopia where every choice shapes the city. Interact with fully voiced AI characters with deep memories and dynamic personalities in this groundbreaking open-world narrative experience.
        </p>

        <div className="flex items-center gap-4">
          <button className="relative inline-flex items-center justify-center px-6 py-3 text-base font-medium text-white rounded-full bg-gradient-primary hover:opacity-90 transition-all duration-200 hover:shadow-[0_0_15px_rgba(236,72,153,0.5)] active:scale-95 overflow-hidden group">
            <span className="relative z-10 flex items-center gap-2">
              <Play className="w-5 h-5 fill-white" />
              Play Now
            </span>
          </button>
          <button className="px-6 py-3 text-base font-medium text-white rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-md">
            Details
          </button>
        </div>
      </div>
    </div>
  );
}