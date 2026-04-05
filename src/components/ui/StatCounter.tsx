import React from 'react';
import { cn } from '@/lib/utils';
import { Eye, Heart, MessageSquare, Star, Users } from 'lucide-react';

export type StatIconType = 'view' | 'heart' | 'message' | 'star' | 'user';

export interface StatCounterProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  iconType?: StatIconType;
  customIcon?: React.ReactNode;
  formatFn?: (val: number) => string;
}

// Default number formatter (e.g., 3.3M, 4.2K)
const formatCompactNumber = (number: number) => {
  return Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(number);
};

const getIcon = (type: StatIconType) => {
  switch (type) {
    case 'view':
      return <Eye className="w-3.5 h-3.5" />;
    case 'heart':
      return <Heart className="w-3.5 h-3.5" />;
    case 'message':
      return <MessageSquare className="w-3.5 h-3.5" />;
    case 'star':
      return <Star className="w-3.5 h-3.5" />;
    case 'user':
      return <Users className="w-3.5 h-3.5" />;
    default:
      return null;
  }
};

export const StatCounter = React.forwardRef<HTMLDivElement, StatCounterProps>(
  (
    {
      value,
      iconType = 'view',
      customIcon,
      formatFn = formatCompactNumber,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 text-xs text-zinc-400 font-medium",
          className
        )}
        title={value.toLocaleString()} // Show full number on hover
        {...props}
      >
        <span className="shrink-0 text-zinc-500">
          {customIcon || getIcon(iconType)}
        </span>
        <span>{formatFn(value)}</span>
      </div>
    );
  }
);
StatCounter.displayName = "StatCounter";
