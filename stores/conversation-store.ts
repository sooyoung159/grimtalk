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
  turnCount: number;
  recentUserText: string | null;
  recentAssistantText: string | null;
  addMessage: (message: ConversationMessage) => void;
  addTurn: (payload: { userText: string; assistantText: string; assistantAudioUrl?: string | null }) => void;
  updateLastAssistantTurn: (payload: { assistantText: string; assistantAudioUrl?: string | null }) => void;
  clearMessages: () => void;
}

function normalizeForRecent(text: string, max = 120): string {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  if (oneLine.length <= max) return oneLine;
  return `${oneLine.slice(0, max - 1)}…`;
}

export const useConversationStore = create<ConversationStore>((set) => ({
  messages: [],
  turnCount: 0,
  recentUserText: null,
  recentAssistantText: null,
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  addTurn: ({ userText, assistantText, assistantAudioUrl }) =>
    set((s) => {
      const nextTurn = s.turnCount + 1;
      const normalizedUserText = userText.trim() || '(사용자 발화 없음)';
      const normalizedAssistantText = assistantText.trim() || '(친구 응답 없음)';
      const recentUser = normalizeForRecent(normalizedUserText, 80);
      const recentAssistant = normalizeForRecent(normalizedAssistantText, 120);

      const userMessage: ConversationMessage = {
        id: `u-${nextTurn}-${Date.now()}`,
        role: 'user',
        text: normalizedUserText,
      };
      const assistantMessage: ConversationMessage = {
        id: `a-${nextTurn}-${Date.now()}`,
        role: 'assistant',
        text: normalizedAssistantText,
        audioUrl: assistantAudioUrl ?? null,
      };

      const nextMessages = [...s.messages, userMessage, assistantMessage].slice(-4);

      return {
        turnCount: nextTurn,
        recentUserText: recentUser,
        recentAssistantText: recentAssistant,
        messages: nextMessages,
      };
    }),
  updateLastAssistantTurn: ({ assistantText, assistantAudioUrl }) =>
    set((s) => {
      if (!s.messages.length) return s;

      const normalizedAssistantText = assistantText.trim() || '(친구 응답 없음)';
      const updatedMessages = [...s.messages];
      for (let i = updatedMessages.length - 1; i >= 0; i -= 1) {
        if (updatedMessages[i].role === 'assistant') {
          updatedMessages[i] = {
            ...updatedMessages[i],
            text: normalizedAssistantText,
            audioUrl: assistantAudioUrl ?? null,
          };
          break;
        }
      }

      return {
        messages: updatedMessages,
        recentAssistantText: normalizeForRecent(normalizedAssistantText, 120),
      };
    }),
  clearMessages: () => set({ messages: [], turnCount: 0, recentUserText: null, recentAssistantText: null }),
}));
