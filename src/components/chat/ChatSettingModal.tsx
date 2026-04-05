import React from 'react';
import { X, SlidersHorizontal, Cpu, RotateCcw, Lock } from 'lucide-react';
import { useChatSettingStore } from '@/store/chatSettingStore';
import { ModelSelector } from './ModelSelector';
import { SliderParam } from './SliderParam';

interface ChatSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type UserTier = "Free" | "Standard" | "Premium" | "Luxe" | "Elite" | "Imperial";

const TIER_LIMITS: Record<UserTier, { maxTokensLimit: number; isSliderEnabled: boolean }> = {
  Free: { maxTokensLimit: 225, isSliderEnabled: false },
  Standard: { maxTokensLimit: 275, isSliderEnabled: false },
  Premium: { maxTokensLimit: 325, isSliderEnabled: false },
  Luxe: { maxTokensLimit: 450, isSliderEnabled: true },
  Elite: { maxTokensLimit: 550, isSliderEnabled: true },
  Imperial: { maxTokensLimit: 650, isSliderEnabled: true },
};

export const ChatSettingModal: React.FC<ChatSettingModalProps> = ({ isOpen, onClose }) => {
  // Hardcoded for now based on instructions. Ideally pass as prop or fetch from user store.
  const userTier = "Free" as UserTier;
  const { maxTokensLimit, isSliderEnabled } = TIER_LIMITS[userTier];

  const {
    modelId,
    temperature,
    contentDiversity,
    maxTokens,
    language,
    includeScenario,
    setModelId,
    setTemperature,
    setContentDiversity,
    setMaxTokens,
    setLanguage,
    setIncludeScenario,
    resetSettings
  } = useChatSettingStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Body */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
              <SlidersHorizontal className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Chat Settings</h2>
              <p className="text-xs text-gray-400">Configure AI model and response behavior</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={resetSettings}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex items-center gap-2 text-sm"
              title="Reset to defaults"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area - Split Layout */}
        <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-[500px]">
          
          {/* Left Column: Model Selection */}
          <div className="w-full md:w-1/2 p-4 sm:p-6 border-r border-white/10 flex flex-col gap-4 bg-white/[0.01]">
            <div className="flex items-center gap-2 text-white font-medium">
              <Cpu className="w-4 h-4 text-primary" />
              <h3>Language Model</h3>
            </div>
            <p className="text-xs text-gray-400">
              Select the AI engine for this conversation. Different models offer various speeds and capabilities.
            </p>
            
            <div className="flex-1 mt-2">
              <ModelSelector 
                selectedModelId={modelId} 
                onSelectModel={setModelId} 
                userTier={userTier}
              />
            </div>
          </div>

          {/* Right Column: Parameters */}
          <div className="w-full md:w-1/2 p-4 sm:p-6 flex flex-col gap-8 overflow-y-auto custom-scrollbar">
            
            <div>
              <div className="flex items-center gap-2 text-white font-medium mb-1">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                <h3>Generation Parameters</h3>
              </div>
              <p className="text-xs text-gray-400 mb-6">
                Fine-tune how the AI generates text. Hover over parameters for more details.
              </p>
            </div>

            <div className="space-y-8">
              <SliderParam
                label="Temperature"
                value={temperature}
                min={0.0}
                max={1.0}
                step={0.05}
                onChange={setTemperature}
                formatValue={(v) => v.toFixed(2)}
                description="Controls randomness. Lower values make the output more focused and deterministic, while higher values make it more creative."
              />

              <SliderParam
                label="Content Diversity"
                value={contentDiversity}
                min={0.0}
                max={1.0}
                step={0.05}
                onChange={setContentDiversity}
                formatValue={(v) => v.toFixed(2)}
                description="Affects how likely the AI is to branch out into new topics or stick closely to the most probable next words."
              />

              {/* Max Output Length with VIP logic */}
              <div className="relative">
                <SliderParam
                  label="Max Output Length"
                  value={maxTokens}
                  min={175}
                  max={maxTokensLimit}
                  step={25}
                  onChange={setMaxTokens}
                  disabled={!isSliderEnabled}
                  description="The maximum number of tokens (roughly 3/4 of a word) the AI will generate in a single response."
                />
                {!isSliderEnabled && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-[1px] rounded-lg z-10 cursor-not-allowed border border-amber-500/20" title="Upgrade your tier to unlock longer responses">
                    <div className="bg-black/80 px-3 py-1.5 rounded-md flex items-center gap-2 border border-amber-500/50 shadow-lg">
                      <Lock className="w-4 h-4 text-amber-500" />
                      <span className="text-xs text-amber-500 font-bold">Luxe Tier Required for custom length</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Language Preference */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-200">Language Preference</label>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/50"
                >
                  <option value="English">English</option>
                  <option value="繁体中文">繁体中文</option>
                  <option value="日本語">日本語</option>
                  <option value="简体中文">简体中文</option>
                </select>
                <p className="text-xs text-gray-400">
                  Select the language in which you want the AI to respond.
                </p>
              </div>

              {/* Scenario-based Experience Toggle */}
              <div className="space-y-3 relative">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-200">
                      Scenario-based Experience <span className="text-[10px] ml-2 px-1.5 py-0.5 rounded text-amber-200 bg-amber-600/40 border border-amber-500/50 font-bold uppercase tracking-wide">VIP</span>
                    </label>
                    <p className="text-xs text-gray-400 mt-1">
                      Enable rich scenario contexts for a more immersive roleplay experience.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={includeScenario}
                      onChange={(e) => setIncludeScenario(e.target.checked)}
                      disabled={userTier === 'Free'}
                    />
                    <div className={`w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary ${userTier === 'Free' ? 'opacity-50 grayscale' : ''}`}></div>
                  </label>
                </div>
                {userTier === 'Free' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg cursor-not-allowed z-10" title="Upgrade to VIP to enable Scenario-based Experience">
                    <Lock className="w-5 h-5 text-amber-500/80 mr-2" />
                    <span className="text-xs text-amber-500/80 font-bold uppercase">VIP Required</span>
                  </div>
                )}
              </div>
            </div>

            {/* Info Box */}
            <div className="mt-auto pt-6">
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                <h4 className="text-sm font-medium text-primary mb-1">Tip</h4>
                <p className="text-xs text-primary/80 leading-relaxed">
                  For Roleplay scenarios, a temperature around 0.70 - 0.85 usually provides the best balance between creativity and character consistency.
                </p>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};