'use client';

import { CharacterCard } from '@/types/character';
import { KananaRouteResponse } from '@/types/kanana';

export type KananaInputMode = 'image_only' | 'audio_only' | 'image_audio';

export function useKananaRequest() {
  const submitFirstTurn = async (payload: {
    image?: File;
    audio?: File;
    text?: string;
    mode?: KananaInputMode;
  }): Promise<{ character: CharacterCard; assistantText: string; audioUrl: string | null }> => {
    const formData = new FormData();

    if (payload.image) formData.append('image', payload.image);
    if (payload.audio) formData.append('audio', payload.audio);
    if (payload.text) formData.append('text', payload.text);
    if (payload.mode) formData.append('mode', payload.mode);

    const res = await fetch('/api/kanana', { method: 'POST', body: formData });
    const data: KananaRouteResponse = await res.json();
    if (!res.ok || !data.ok || !data.character || !data.assistantText) throw new Error(data.error ?? '응답을 가져오지 못했어.');

    const mimeType = data.audioMimeType || 'audio/wav';
    const audioUrl = data.audioBase64 ? `data:${mimeType};base64,${data.audioBase64}` : null;

    return { character: data.character, assistantText: data.assistantText, audioUrl };
  };

  return { submitFirstTurn };
}
