import React from 'react';
import { cn } from '@/lib/utils';

interface SliderParamProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  className?: string;
  description?: string;
  disabled?: boolean;
}

export const SliderParam: React.FC<SliderParamProps> = ({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue = (v) => v.toString(),
  className,
  description,
  disabled = false
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    onChange(Number(e.target.value));
  };

  // Calculate percentage for styling the custom range input background
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-white">{label}</label>
        <span className="text-sm text-gray-400 font-mono bg-white/5 px-2 py-0.5 rounded">
          {formatValue(value)}
        </span>
      </div>
      
      {description && (
        <p className="text-xs text-gray-500 mb-2">{description}</p>
      )}

      <div className={cn("relative pt-2 pb-2", disabled && "opacity-50 grayscale")}>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            "w-full h-1.5 bg-gray-700 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-primary/50",
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          )}
          style={{
            backgroundImage: `linear-gradient(to right, #8b5cf6 ${percentage}%, transparent ${percentage}%)`
          }}
        />
        <style dangerouslySetInnerHTML={{
          __html: `
            input[type=range]::-webkit-slider-thumb {
              appearance: none;
              width: 16px;
              height: 16px;
              border-radius: 50%;
              background: #fff;
              cursor: pointer;
              box-shadow: 0 0 0 2px #8b5cf6;
              transition: transform 0.1s;
            }
            input[type=range]::-webkit-slider-thumb:hover {
              transform: scale(1.2);
            }
          `
        }} />
      </div>
      
      <div className="flex justify-between text-xs text-gray-500">
        <span>{formatValue(min)}</span>
        <span>{formatValue(max)}</span>
      </div>
    </div>
  );
};