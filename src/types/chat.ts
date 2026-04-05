export enum SubscriptionTier {
  Free = 'Free',
  Standard = 'Standard',
  Premium = 'Premium',
  Luxe = 'Luxe',
  Elite = 'Elite',
  Imperial = 'Imperial',
}

export interface ShortTermMemory {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export interface SummarizedMemory {
  id: string;
  summary: string;
  coveredMessageIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PinnedMemory {
  id: string;
  content: string;
  pinnedAt: Date;
}

export interface CharacterProfile {
  id: string;
  name: string;
  age?: number;
  relationship?: string;
  appearance?: string;
  personality?: string;
  background?: string;
  creatorId?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  shortDescription?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatSession {
  id: string;
  characterId: string;
  userId: string;
  shortTermMemories: ShortTermMemory[];
  summarizedMemory?: SummarizedMemory;
  pinnedMemories: PinnedMemory[];
  createdAt: Date;
  updatedAt: Date;
}
