import { CharacterCard } from '@/types/character';

type ParsedResult = {
  character: CharacterCard;
  assistantText: string;
  audioBase64: string | null;
  audioMimeType: string | null;
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

function pickFirstString(...values: unknown[]): string | null {
  for (const v of values) {
    const s = asString(v);
    if (s) return s;
  }
  return null;
}

function extractTextFromContent(content: unknown): string | null {
  if (typeof content === 'string') return content.trim() || null;
  if (!Array.isArray(content)) return null;

  const chunks: string[] = [];
  for (const item of content) {
    if (typeof item === 'string') {
      if (item.trim()) chunks.push(item.trim());
      continue;
    }
    if (!isRecord(item)) continue;

    const text = pickFirstString(item.text, item.value);
    if (text) chunks.push(text);

    if (isRecord(item.output_text)) {
      const nested = pickFirstString(item.output_text.text, item.output_text.value);
      if (nested) chunks.push(nested);
    }
  }

  return chunks.length ? chunks.join('\n') : null;
}

function normalizeTraits(v: unknown): [string, string] {
  if (Array.isArray(v)) {
    const t = v.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean);
    if (t.length >= 2) return [t[0], t[1]];
    if (t.length === 1) return [t[0], '호기심'];
  }
  return ['다정함', '용감함'];
}

function fallbackCharacter(): CharacterCard {
  return {
    name: '루루',
    identity: '무지개 숲의 친구',
    traits: ['다정함', '용감함'],
    voiceTone: '밝고 따뜻함',
    greeting: '안녕! 나는 루루야!',
    question: '너는 오늘 어디로 가고 싶어?',
  };
}

function extractCharacter(raw: unknown): CharacterCard {
  if (!isRecord(raw)) return fallbackCharacter();

  const source = isRecord(raw.character)
    ? raw.character
    : isRecord(raw.data) && isRecord(raw.data.character)
      ? raw.data.character
      : null;

  if (!source) return fallbackCharacter();

  const base = fallbackCharacter();
  return {
    name: pickFirstString(source.name) ?? base.name,
    identity: pickFirstString(source.identity, source.type, source.description) ?? base.identity,
    traits: normalizeTraits(source.traits),
    voiceTone: pickFirstString(source.voiceTone, source.voice_tone) ?? base.voiceTone,
    greeting: pickFirstString(source.greeting, source.firstGreeting, source.first_greeting) ?? base.greeting,
    question: pickFirstString(source.question, source.followUpQuestion, source.follow_up_question) ?? base.question,
    narration: pickFirstString(source.narration) ?? undefined,
  };
}

function extractAssistantText(raw: unknown, character: CharacterCard): string {
  if (!isRecord(raw)) {
    return `${character.greeting} ${character.question}`;
  }

  const choices = Array.isArray(raw.choices) ? raw.choices : [];
  for (const choice of choices) {
    if (!isRecord(choice)) continue;
    const msg = isRecord(choice.message) ? choice.message : null;
    const fromMessage = msg ? extractTextFromContent(msg.content) : null;
    if (fromMessage) return fromMessage;

    const fromChoiceText = pickFirstString(choice.text);
    if (fromChoiceText) return fromChoiceText;
  }

  const output = Array.isArray(raw.output) ? raw.output : [];
  for (const out of output) {
    if (!isRecord(out)) continue;
    const text = extractTextFromContent(out.content);
    if (text) return text;
  }

  return `${character.greeting} ${character.question}`;
}

function findAudioCandidate(raw: unknown): { base64: string | null; mimeType: string | null } {
  if (!isRecord(raw)) return { base64: null, mimeType: null };

  const direct = isRecord(raw.audio) ? raw.audio : null;
  if (direct) {
    const base64 = pickFirstString(direct.base64, direct.data);
    const mimeType = pickFirstString(direct.mimeType, direct.mime_type, direct.format) ?? 'audio/mpeg';
    if (base64) return { base64, mimeType };
  }

  const choices = Array.isArray(raw.choices) ? raw.choices : [];
  for (const choice of choices) {
    if (!isRecord(choice)) continue;
    const message = isRecord(choice.message) ? choice.message : null;
    if (!message) continue;

    const mAudio = isRecord(message.audio) ? message.audio : null;
    if (mAudio) {
      const base64 = pickFirstString(mAudio.base64, mAudio.data);
      const mimeType = pickFirstString(mAudio.mimeType, mAudio.mime_type, mAudio.format) ?? 'audio/mpeg';
      if (base64) return { base64, mimeType };
    }

    if (Array.isArray(message.content)) {
      for (const c of message.content) {
        if (!isRecord(c)) continue;
        const inputAudio = isRecord(c.input_audio) ? c.input_audio : null;
        const base64 = pickFirstString(c.audio_base64, c.base64, inputAudio?.data);
        const mimeType = pickFirstString(c.audio_mime_type, c.mimeType, inputAudio?.format) ?? 'audio/mpeg';
        if (base64) return { base64, mimeType };
      }
    }
  }

  return { base64: null, mimeType: null };
}

export function parseKananaResponse(raw: unknown): ParsedResult {
  const character = extractCharacter(raw);
  const assistantText = extractAssistantText(raw, character);
  const { base64, mimeType } = findAudioCandidate(raw);

  return {
    character,
    assistantText,
    audioBase64: base64,
    audioMimeType: mimeType,
  };
}
