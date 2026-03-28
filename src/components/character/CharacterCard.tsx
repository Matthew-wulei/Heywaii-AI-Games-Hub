import Link from "next/link";
import { cn } from "@/lib/utils";

export function CharacterCard({
  slug,
  name,
  avatar,
  categoryLabel,
  description,
}: {
  slug: string;
  name: string;
  avatar: string;
  categoryLabel: string;
  description: string;
}) {
  return (
    <Link href={`/character/${slug}`}>
      <article
        className={cn(
          "group h-full flex flex-col bg-background-paper rounded-2xl border border-white/5 overflow-hidden",
          "hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]"
        )}
      >
        <div className="relative aspect-[4/5] bg-background-elevated overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatar}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        </div>
        <div className="p-5 flex flex-col flex-1">
          <span className="text-[10px] uppercase tracking-wider text-text-muted font-semibold mb-1">
            {categoryLabel}
          </span>
          <h2 className="text-lg font-bold text-white mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {name}
          </h2>
          <p className="text-sm text-text-secondary line-clamp-3 flex-1">{description}</p>
        </div>
      </article>
    </Link>
  );
}
