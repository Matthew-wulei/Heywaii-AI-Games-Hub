export type UserTier = 'Free' | 'Standard' | 'Premium' | 'Luxe' | 'Elite' | 'Imperial';

export interface IModel {
  id: string;
  name: string;
  tier: string;
  speed: 'Fast' | 'Medium' | 'Slow';
  recommended?: boolean;
  rating?: number;
  speedStr?: string;
}

export const MODELS: IModel[] = [
  // Tier 1 Models (Ultra Fast / High Tier)
  { id: "gpt-4o", name: "GPT-4o (Official)", tier: "Tier 1", speed: "Fast", recommended: true },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", tier: "Tier 1", speed: "Fast" },
  { id: "claude-3-opus", name: "Claude 3 Opus", tier: "Tier 1", speed: "Medium" },
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", tier: "Tier 1", speed: "Fast" },
  { id: "gemini-1-5-pro", name: "Gemini 1.5 Pro", tier: "Tier 1", speed: "Fast" },
  { id: "ultra-claude-4-sonnet", name: "Ultra Claude 4 Sonnet", tier: "Tier 1", speed: "Fast" },
  
  // Tier 2 Models (Balanced)
  { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", tier: "Tier 2", speed: "Fast" },
  { id: "claude-3-haiku", name: "Claude 3 Haiku", tier: "Tier 2", speed: "Fast" },
  { id: "gemini-1-5-flash", name: "Gemini 1.5 Flash", tier: "Tier 2", speed: "Fast" },
  { id: "llama-3-70b-instruct", name: "Llama 3 70B Instruct", tier: "Tier 2", speed: "Fast" },
  { id: "mixtral-8x22b", name: "Mixtral 8x22B", tier: "Tier 2", speed: "Fast" },
  { id: "command-r-plus", name: "Command R+", tier: "Tier 2", speed: "Medium" },

  // Tier 3 Models (Specialized / Open Source)
  { id: "llama-3-8b-instruct", name: "Llama 3 8B Instruct", tier: "Tier 3", speed: "Fast" },
  { id: "gemma-2-27b", name: "Gemma 2 27B", tier: "Tier 3", speed: "Fast" },
  { id: "mistral-large", name: "Mistral Large", tier: "Tier 3", speed: "Medium" },
  { id: "qwen-2-72b", name: "Qwen 2 72B", tier: "Tier 3", speed: "Medium" },
  { id: "deepseek-coder-v2", name: "DeepSeek Coder V2", tier: "Tier 3", speed: "Fast" },
  { id: "deepseek-custom", name: "DeepSeek (Custom Key)", tier: "Tier 3", speed: "Fast" },
  
  // Other Models to reach 30
  { id: "phi-3-mini", name: "Phi-3 Mini", tier: "Tier 3", speed: "Fast" },
  { id: "phi-3-small", name: "Phi-3 Small", tier: "Tier 3", speed: "Fast" },
  { id: "phi-3-medium", name: "Phi-3 Medium", tier: "Tier 3", speed: "Medium" },
  { id: "wizardlm-2-8x22b", name: "WizardLM-2 8x22B", tier: "Tier 2", speed: "Medium" },
  { id: "dbrx-instruct", name: "DBRX Instruct", tier: "Tier 2", speed: "Medium" },
  { id: "yi-large", name: "Yi Large", tier: "Tier 2", speed: "Medium" },
  { id: "snapper-7b", name: "Snapper 7B", tier: "Tier 3", speed: "Fast" },
  { id: "openhermes-2.5", name: "OpenHermes 2.5", tier: "Tier 3", speed: "Fast" },
  { id: "nous-hermes-2", name: "Nous Hermes 2", tier: "Tier 3", speed: "Medium" },
  { id: "dolphin-2.9", name: "Dolphin 2.9", tier: "Tier 3", speed: "Fast" },
  { id: "starcoder2-15b", name: "StarCoder2 15B", tier: "Tier 3", speed: "Fast" },
  { id: "codellama-70b", name: "CodeLlama 70B", tier: "Tier 2", speed: "Medium" }
];
