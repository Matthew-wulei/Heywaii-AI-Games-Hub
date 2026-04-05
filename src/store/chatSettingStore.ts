import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface IChatSettingState {
  modelId: string;
  temperature: number;
  contentDiversity: number;
  maxTokens: number;
  language: string;
  includeScenario: boolean;
  
  setModelId: (id: string) => void;
  setTemperature: (temp: number) => void;
  setContentDiversity: (diversity: number) => void;
  setMaxTokens: (tokens: number) => void;
  setLanguage: (lang: string) => void;
  setIncludeScenario: (include: boolean) => void;
  resetSettings: () => void;
}

const DEFAULT_STATE = {
  modelId: "ultra-claude-4-sonnet", // Default as per rules
  temperature: 0.70, // 0.0 ~ 1.0
  contentDiversity: 0.70, // 0.0 ~ 1.0
  maxTokens: 400, // Range 175 ~ 650
  language: "English",
  includeScenario: false,
};

export const useChatSettingStore = create<IChatSettingState>()(
  persist(
    (set) => ({
      ...DEFAULT_STATE,
      
      setModelId: (id) => set({ modelId: id }),
      
      setTemperature: (temp) => {
        // Ensure within 0 ~ 1
        const validTemp = Math.max(0, Math.min(1, temp));
        set({ temperature: validTemp });
      },
      
      setContentDiversity: (diversity) => {
        // Ensure within 0 ~ 1
        const validDiversity = Math.max(0, Math.min(1, diversity));
        set({ contentDiversity: validDiversity });
      },
      
      setMaxTokens: (tokens) => {
        set({ maxTokens: tokens });
      },
      
      setLanguage: (lang) => set({ language: lang }),
      
      setIncludeScenario: (include) => set({ includeScenario: include }),
      
      resetSettings: () => set(DEFAULT_STATE),
    }),
    {
      name: 'chat-setting-storage', // key in localStorage
    }
  )
);