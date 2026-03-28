import { CharacterCard } from './character';
import { KananaTurnMode } from '@/lib/kanana/build-request';

export interface KananaRouteResponse {
  ok: boolean;
  character?: CharacterCard;
  assistantText?: string;
  audioBase64?: string | null;
  audioMimeType?: string | null;
  error?: string;
}

export interface KananaRouteRequestMeta {
  mode?: 'image_only' | 'audio_only' | 'image_audio';
  turnMode?: KananaTurnMode;
  character?: CharacterCard | null;
  previousUserText?: string | null;
  previousAssistantText?: string | null;
}
