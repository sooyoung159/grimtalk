'use client';

import { create } from 'zustand';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  audioUrl?: string | null;
}

interface ConversationStore {
  messages: ConversationMessage[];
  addMessage: (message: ConversationMessage) => void;
  clearMessages: () => void;
}

export const useConversationStore = create<ConversationStore>((set) => ({
  messages: [],
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  clearMessages: () => set({ messages: [] }),
}));
