import React from 'react';
import { cn } from '@/lib/utils';

export interface TagChipProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  variant?: 'default' | 'unfiltered' | 'corruption' | 'outline' | 'secondary';
  icon?: React.ReactNode;
  expandable?: boolean;
}

export const TagChip = React.forwardRef<HTMLDivElement, TagChipProps>(
  (
    {
      label,
      variant = 'default',
      icon,
      expandable = false,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium transition-colors cursor-default",
          "border border-transparent",
          // Variant styles
          {
            'bg-zinc-800 text-zinc-300 hover:bg-zinc-700': variant === 'default',
            'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20': variant === 'unfiltered',
            'bg-purple-500/10 text-purple-400 border-purple-500/20 hover:bg-purple-500/20': variant === 'corruption',
            'bg-transparent border-zinc-700 text-zinc-400 hover:bg-zinc-800': variant === 'outline',
            'bg-zinc-900 text-zinc-400 border-zinc-800 hover:bg-zinc-800 hover:text-zinc-300': variant === 'secondary',
          },
          // Expandable styles (hover effect to show it's interactive)
          expandable && "cursor-pointer hover:shadow-sm active:scale-95",
          className
        )}
        {...props}
      >
        {icon && <span className="shrink-0 flex items-center justify-center w-3 h-3">{icon}</span>}
        <span className={cn("truncate", expandable ? "max-w-[120px]" : "")}>{label}</span>
      </div>
    );
  }
);
TagChip.displayName = "TagChip";
