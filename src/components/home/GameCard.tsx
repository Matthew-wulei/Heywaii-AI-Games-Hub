import { Play, Eye, Star } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface GameCardProps {
  slug: string;
  title: string;
  category: string;
  description: string;
  plays: string;
  rating: number;
  image: string;
}

export function GameCard({
  slug,
  title,
  category,
  description,
  plays,
  rating,
  image,
}: GameCardProps) {
  return (
    <Link href={`/game/${slug}`}>
      <div className="group relative flex flex-col w-full bg-background-paper rounded-2xl overflow-hidden border border-white/5 hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] cursor-pointer">
        {/* Cover Image Area */}
        <div className="relative w-full aspect-video bg-background-elevated overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt={`${title} cover`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {/* Hover Overlay & Play Button */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
            <button
              className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white pl-1 shadow-[0_0_15px_rgba(139,92,246,0.5)]"
              aria-label={`Play ${title}`}
            >
              <Play className="w-6 h-6 fill-white" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4 flex flex-col gap-2 flex-1">
          <div className="flex justify-between items-start">
            <h3 className="text-text-primary text-lg font-semibold truncate pr-2">
              {title}
            </h3>
            <span className="px-2 py-1 text-xs rounded-md bg-white/10 text-text-secondary whitespace-nowrap">
              {category}
            </span>
          </div>
          <p className="text-text-secondary text-sm line-clamp-2 min-h-[40px]">
            {description}
          </p>

          {/* Bottom Data */}
          <div className="mt-auto pt-3 border-t border-white/5 flex justify-between items-center text-xs text-text-muted">
            <div className="flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>{plays}</span>
            </div>
            <div className="flex items-center gap-1.5 text-status-warning">
              <Star className="w-3.5 h-3.5 fill-status-warning" />
              <span className="font-medium text-text-primary">{rating}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}