import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, Zap } from 'lucide-react';

export type ModelTier = 'free' | 'pro' | 'ultra';

export interface ModelBadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  tier: ModelTier;
  showIcon?: boolean;
}

export const ModelBadge = React.forwardRef<HTMLDivElement, ModelBadgeProps>(
  (
    {
      tier,
      showIcon = true,
      className,
      ...props
    },
    ref
  ) => {
    // Free tier generally doesn't show a badge, or shows a very subtle one.
    // If you strictly want 'no badge for free', you could return null here, 
    // but returning a subtle default allows for consistent UI if needed.
    if (tier === 'free') return null;

    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[10px] font-bold tracking-wider uppercase",
          {
            // 'free': 'bg-zinc-800 text-zinc-400', // Unused if returning null above
            'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_8px_-2px_rgba(59,130,246,0.2)]': tier === 'pro',
            'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_8px_-2px_rgba(168,85,247,0.2)]': tier === 'ultra',
          },
          className
        )}
        {...props}
      >
        {showIcon && tier === 'pro' && <Zap className="w-3 h-3" fill="currentColor" />}
        {showIcon && tier === 'ultra' && <Sparkles className="w-3 h-3" />}
        <span>{tier}</span>
      </div>
    );
  }
);
ModelBadge.displayName = "ModelBadge";
