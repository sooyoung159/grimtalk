import { CharacterCard } from './character';

export interface KananaRouteResponse {
  ok: boolean;
  character?: CharacterCard;
  assistantText?: string;
  audioBase64?: string | null;
  audioMimeType?: string | null;
  error?: string;
}
