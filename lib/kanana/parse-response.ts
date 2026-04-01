import { CharacterCard } from '@/types/character';

type ParsedResult = {
  character: CharacterCard;
  assistantText: string;
  audioBase64: string | null;
  audioMimeType: string | null;
};

const FALLBACK_CHARACTER_POOL: CharacterCard[] = [
  {
    name: '루루',
    identity: '무지개 숲의 토끼 친구',
    traits: ['다정함', '용감함'],
    voiceTone: '밝고 따뜻함',
    greeting: '안녕! 나는 루루야!',
    question: '너는 오늘 어디로 가고 싶어?',
  },
  {
    name: '토리',
    identity: '나뭇잎 길을 걷는 작은 숲 친구',
    traits: ['호기심', '상냥함'],
    voiceTone: '맑고 경쾌함',
    greeting: '안녕! 나는 토리야!',
    question: '우리 먼저 어디를 구경해볼까?',
  },
  {
    name: '보리',
    identity: '햇빛 냄새를 좋아하는 들판 친구',
    traits: ['포근함', '차분함'],
    voiceTone: '부드럽고 잔잔함',
    greeting: '반가워, 나는 보리야.',
    question: '내 이름이 마음에 들어?',
  },
  {
    name: '모모',
    identity: '구름빛 숲에서 막 깨어난 몽글한 친구',
    traits: ['장난기', '다정함'],
    voiceTone: '몽글몽글하고 따뜻함',
    greeting: '안녕, 나는 모모야!',
    question: '우리 같이 무슨 놀이를 해볼까?',
  },
  {
    name: '별여우',
    identity: '반짝이는 숲길을 안내하는 여우 친구',
    traits: ['차분함', '위로'],
    voiceTone: '낮고 포근함',
    greeting: '안녕, 나는 별여우야.',
    question: '천천히 같이 걸어볼래?',
  },
];

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

function pickFallbackCharacter(seed?: string | null): CharacterCard {
  const source = (seed ?? '').trim();
  if (!source) return FALLBACK_CHARACTER_POOL[0];

  const hash = Array.from(source).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return FALLBACK_CHARACTER_POOL[hash % FALLBACK_CHARACTER_POOL.length];
}

function extractNameFromAssistantText(text: string): string | null {
  const normalized = text.replace(/\s+/g, ' ').trim();
  const patterns = [
    /내 이름은\s*([가-힣A-Za-z0-9]{2,12})/,
    /나는\s*([가-힣A-Za-z0-9]{2,12})야/,
    /나는\s*([가-힣A-Za-z0-9]{2,12})라고\s*해/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      const candidate = match[1].trim();
      if (candidate && candidate !== '카나나') return candidate;
    }
  }

  return null;
}

function extractCharacter(raw: unknown, assistantTextHint?: string | null): CharacterCard {
  const extractedName = assistantTextHint ? extractNameFromAssistantText(assistantTextHint) : null;

  if (!isRecord(raw)) {
    const fallback = pickFallbackCharacter(assistantTextHint);
    return extractedName ? { ...fallback, name: extractedName, greeting: `안녕! 나는 ${extractedName}야!` } : fallback;
  }

  const source = isRecord(raw.character)
    ? raw.character
    : isRecord(raw.data) && isRecord(raw.data.character)
      ? raw.data.character
      : null;

  const fallback = pickFallbackCharacter(assistantTextHint);

  if (!source) {
    return extractedName ? { ...fallback, name: extractedName, greeting: `안녕! 나는 ${extractedName}야!` } : fallback;
  }

  const resolvedName = pickFirstString(source.name, extractedName) ?? fallback.name;
  const greeting = pickFirstString(source.greeting, source.firstGreeting, source.first_greeting) ?? `안녕! 나는 ${resolvedName}야!`;

  return {
    name: resolvedName,
    identity: pickFirstString(source.identity, source.type, source.description) ?? fallback.identity,
    traits: normalizeTraits(source.traits),
    voiceTone: pickFirstString(source.voiceTone, source.voice_tone) ?? fallback.voiceTone,
    greeting,
    question: pickFirstString(source.question, source.followUpQuestion, source.follow_up_question) ?? fallback.question,
    narration: pickFirstString(source.narration) ?? undefined,
  };
}

function extractAssistantText(raw: unknown, fallbackCharacter: CharacterCard): string {
  if (!isRecord(raw)) {
    return `${fallbackCharacter.greeting} ${fallbackCharacter.question}`;
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

  return `${fallbackCharacter.greeting} ${fallbackCharacter.question}`;
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
  let assistantTextSeed: string | null = null;
  if (isRecord(raw) && Array.isArray(raw.choices) && raw.choices.length > 0) {
    const firstChoice = raw.choices[0];
    if (isRecord(firstChoice) && isRecord(firstChoice.message)) {
      assistantTextSeed = extractTextFromContent(firstChoice.message.content);
    }
  }

  const character = extractCharacter(raw, assistantTextSeed);
  const assistantText = extractAssistantText(raw, character);
  const { base64, mimeType } = findAudioCandidate(raw);

  return {
    character,
    assistantText,
    audioBase64: base64,
    audioMimeType: mimeType,
  };
}
