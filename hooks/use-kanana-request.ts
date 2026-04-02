'use client';

import { CharacterCard } from '@/types/character';
import { KananaRouteResponse } from '@/types/kanana';
import { getMockKananaResponseWithDelay } from '@/lib/kanana/mock-response';
import { KananaInputMode, KananaTurnMode } from '@/lib/kanana/build-request';

type KananaRuntimeMode = 'mock' | 'live';

function getKananaRuntimeMode(): KananaRuntimeMode {
  const raw = (process.env.NEXT_PUBLIC_KANANA_MODE ?? 'live').trim().toLowerCase();
  return raw === 'mock' ? 'mock' : 'live';
}

const INVALID_BASE64_CHARS = /[^A-Za-z0-9+/=]/;

function toDataAudioUrl(audioBase64?: string | null, audioMimeType?: string | null): string | null {
  if (!audioBase64) return null;

  const normalizedBase64 = audioBase64.replace(/\s/g, '');
  if (!normalizedBase64 || INVALID_BASE64_CHARS.test(normalizedBase64)) return null;

  const rawMimeType = (audioMimeType || 'audio/wav').trim().toLowerCase();
  const safeMimeType = rawMimeType.startsWith('audio/') ? rawMimeType : 'audio/wav';

  return `data:${safeMimeType};base64,${normalizedBase64}`;
}

export function useKananaRequest() {
  const submitTurn = async (payload: {
    image?: File;
    audio?: File;
    text?: string;
    mode?: KananaInputMode;
    turnMode?: KananaTurnMode;
    character?: CharacterCard | null;
    previousUserText?: string | null;
    previousAssistantText?: string | null;
  }): Promise<{ character: CharacterCard; assistantText: string; audioUrl: string | null }> => {
    const mode = payload.mode ?? 'image_audio';
    const turnMode = payload.turnMode ?? 'first_turn';
    const runtimeMode = getKananaRuntimeMode();

    if (runtimeMode === 'mock') {
      const mockMode: KananaInputMode = turnMode === 'continue_turn' ? 'audio_only' : mode;
      const mock = await getMockKananaResponseWithDelay(mockMode);
      const audioUrl = mock.audioUrl ?? toDataAudioUrl(mock.audioBase64, mock.audioMimeType);
      return {
        character: payload.character ?? mock.character,
        assistantText: mock.assistantText,
        audioUrl,
      };
    }

    const formData = new FormData();

    if (payload.image) formData.append('image', payload.image);
    if (payload.audio) formData.append('audio', payload.audio);
    if (payload.text) formData.append('text', payload.text);
    if (payload.mode) formData.append('mode', payload.mode);
    if (payload.turnMode) formData.append('turnMode', payload.turnMode);
    if (payload.character) formData.append('character', JSON.stringify(payload.character));
    if (payload.previousUserText) formData.append('previousUserText', payload.previousUserText);
    if (payload.previousAssistantText) formData.append('previousAssistantText', payload.previousAssistantText);

    const res = await fetch('/api/kanana', { method: 'POST', body: formData });
    const data: KananaRouteResponse = await res.json();
    if (!res.ok || !data.ok || !data.character || !data.assistantText) throw new Error(data.error ?? '응답을 가져오지 못했어.');

    const audioUrl = toDataAudioUrl(data.audioBase64, data.audioMimeType);

    return { character: data.character, assistantText: data.assistantText, audioUrl };
  };

  const submitFirstTurn = (payload: {
    image?: File;
    audio?: File;
    text?: string;
    mode?: KananaInputMode;
  }) => submitTurn({ ...payload, turnMode: 'first_turn' });

  const submitContinueTurn = (payload: {
    audio?: File;
    text?: string;
    character: CharacterCard;
    previousUserText?: string | null;
    previousAssistantText?: string | null;
  }) =>
    submitTurn({
      ...payload,
      mode: 'audio_only',
      turnMode: 'continue_turn',
    });

  return { submitTurn, submitFirstTurn, submitContinueTurn };
}
