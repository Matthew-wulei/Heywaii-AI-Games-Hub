import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { IModel, MODELS, UserTier } from '@/types/model';
import { Zap, Gauge, BrainCircuit, Lock } from 'lucide-react';

interface ModelSelectorProps {
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  className?: string;
  userTier?: UserTier;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModelId,
  onSelectModel,
  className,
  userTier = 'Free'
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Group models by tier for organized display
  const groupedModels = useMemo(() => {
    const filtered = MODELS.filter(m => 
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      m.tier.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    return filtered.reduce((acc, model) => {
      if (!acc[model.tier]) {
        acc[model.tier] = [];
      }
      acc[model.tier].push(model);
      return acc;
    }, {} as Record<string, IModel[]>);
  }, [searchTerm]);

  const tiers = Object.keys(groupedModels).sort();

  const SpeedIcon = ({ speed }: { speed: IModel['speed'] }) => {
    switch(speed) {
      case 'Fast': return <Zap className="w-3 h-3 text-yellow-400" />;
      case 'Medium': return <Gauge className="w-3 h-3 text-blue-400" />;
      case 'Slow': return <BrainCircuit className="w-3 h-3 text-purple-400" />;
    }
  };

  const renderBadges = (name: string) => {
    const badges = [];
    if (name.toLowerCase().includes('ultra')) {
      badges.push(
        <span key="ultra" className="text-[10px] px-1.5 py-0.5 rounded text-purple-200 bg-purple-600/40 border border-purple-500/50 font-bold tracking-wide">
          ULTRA
        </span>
      );
    }
    if (name.toLowerCase().includes('pro')) {
      badges.push(
        <span key="pro" className="text-[10px] px-1.5 py-0.5 rounded text-blue-200 bg-blue-600/40 border border-blue-500/50 font-bold tracking-wide">
          PRO
        </span>
      );
    }
    return badges;
  };

  return (
    <div className={cn("flex flex-col h-full bg-[#111] rounded-xl overflow-hidden border border-white/10", className)}>
      <div className="p-3 border-b border-white/10 bg-[#1a1a1a]">
        <input
          type="text"
          placeholder="Search models..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-gray-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
        {tiers.map(tier => (
          <div key={tier} className="space-y-1">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-1 sticky top-0 bg-[#111] z-10">
              {tier}
            </h4>
            <div className="space-y-1">
              {groupedModels[tier].map(model => {
                const isSelected = selectedModelId === model.id;
                
                // Logic based on tier and model name
                const isProModel = model.name.toLowerCase().includes('pro');
                const isUltraModel = model.name.toLowerCase().includes('ultra');
                
                // For Free users, Pro and Ultra models are locked
                const isLocked = userTier === 'Free' && (isProModel || isUltraModel);

                return (
                  <button
                    key={model.id}
                    onClick={() => {
                      if (isLocked) {
                        alert("Upgrade required for this model!");
                        return;
                      }
                      onSelectModel(model.id);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200 group relative",
                      isSelected 
                        ? "bg-primary/20 border border-primary/50 shadow-[0_0_10px_rgba(139,92,246,0.1)]" 
                        : "border border-transparent hover:bg-white/5",
                      isLocked ? "opacity-60 grayscale hover:bg-white/5" : "cursor-pointer"
                    )}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-medium text-sm",
                          isSelected ? "text-primary" : "text-gray-200"
                        )}>
                          {model.name}
                        </span>
                        <div className="flex items-center gap-1">
                          {renderBadges(model.name)}
                          {model.recommended && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                              Recommended
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <SpeedIcon speed={model.speed} />
                          {model.speed}
                        </span>
                        <span className="flex items-center gap-1">
                          ⚡ {model.speedStr || '1.6s'}
                        </span>
                        <span className="flex items-center gap-1 text-yellow-500/80">
                          ⭐ {model.rating || '2.65'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center">
                      {isLocked ? (
                        <Lock className="w-4 h-4 text-gray-500" />
                      ) : (
                        <div className={cn(
                          "w-4 h-4 rounded-full border-2 flex items-center justify-center",
                          isSelected ? "border-primary" : "border-gray-600 group-hover:border-gray-400"
                        )}>
                          {isSelected && <div className="w-2 h-2 bg-primary rounded-full" />}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {tiers.length === 0 && (
          <div className="text-center py-8 text-gray-500 text-sm">
            No models found matching &quot;{searchTerm}&quot;
          </div>
        )}
      </div>
    </div>
  );
};