'use client';

import { CharacterCard } from '@/types/character';
import { KananaRouteResponse } from '@/types/kanana';
import { getMockKananaResponseWithDelay } from '@/lib/kanana/mock-response';

export type KananaInputMode = 'image_only' | 'audio_only' | 'image_audio';

type KananaRuntimeMode = 'mock' | 'live';

function getKananaRuntimeMode(): KananaRuntimeMode {
  const raw = (process.env.NEXT_PUBLIC_KANANA_MODE ?? 'live').trim().toLowerCase();
  return raw === 'mock' ? 'mock' : 'live';
}

function toDataAudioUrl(audioBase64?: string | null, audioMimeType?: string | null): string | null {
  if (!audioBase64) return null;
  const mimeType = audioMimeType || 'audio/wav';
  return `data:${mimeType};base64,${audioBase64}`;
}

export function useKananaRequest() {
  const submitFirstTurn = async (payload: {
    image?: File;
    audio?: File;
    text?: string;
    mode?: KananaInputMode;
  }): Promise<{ character: CharacterCard; assistantText: string; audioUrl: string | null }> => {
    const mode = payload.mode ?? 'image_audio';
    const runtimeMode = getKananaRuntimeMode();

    if (runtimeMode === 'mock') {
      const mock = await getMockKananaResponseWithDelay(mode);
      const audioUrl = mock.audioUrl ?? toDataAudioUrl(mock.audioBase64, mock.audioMimeType);
      return {
        character: mock.character,
        assistantText: mock.assistantText,
        audioUrl,
      };
    }

    const formData = new FormData();

    if (payload.image) formData.append('image', payload.image);
    if (payload.audio) formData.append('audio', payload.audio);
    if (payload.text) formData.append('text', payload.text);
    if (payload.mode) formData.append('mode', payload.mode);

    const res = await fetch('/api/kanana', { method: 'POST', body: formData });
    const data: KananaRouteResponse = await res.json();
    if (!res.ok || !data.ok || !data.character || !data.assistantText) throw new Error(data.error ?? '응답을 가져오지 못했어.');

    const audioUrl = toDataAudioUrl(data.audioBase64, data.audioMimeType);

    return { character: data.character, assistantText: data.assistantText, audioUrl };
  };

  return { submitFirstTurn };
}
