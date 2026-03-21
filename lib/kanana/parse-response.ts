import { CharacterCard } from '@/types/character';

/**
 * parse-response.ts
 *
 * [현재 전제]
 * - 본 파서는 non-stream(JSON 일괄 응답) 형태를 우선 가정한다.
 * - 즉, route.ts에서 await response.json() 이후 들어오는 raw 객체를 파싱한다.
 *
 * [현재 미지원]
 * - SSE/stream delta 조립 처리 (예: choices[].delta.content, choices[].delta.audio 등)
 * - 청크 단위로 텍스트/오디오를 누적하는 로직
 *
 * [TODO]
 * - 실제 Kanana 샘플 JSON(성공/에러/오디오 포함/stream 포함)을 확보한 뒤
 *   canonical 경로를 고정하고 fallback 가지를 축소해야 한다.
 */

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
  // [FALLBACK] content가 string 또는 array(object|string)일 수 있다고 가정한 방어 파싱.
  // 근거: Kanana 공식 response schema가 저장소 내에 없고(docs/TODO.md),
  // parse 단계에서 다중 shape 대응이 필요하도록 구현되어 있음.
  if (typeof content === 'string') return content.trim() || null;
  if (!Array.isArray(content)) return null;

  const chunks: string[] = [];
  for (const item of content) {
    if (typeof item === 'string') {
      if (item.trim()) chunks.push(item.trim());
      continue;
    }
    if (!isRecord(item)) continue;

    // [FALLBACK] text/value alias 대응
    const text = pickFirstString(item.text, item.value);
    if (text) chunks.push(text);

    // [FALLBACK] nested output_text.{text|value} 대응
    if (isRecord(item.output_text)) {
      const nested = pickFirstString(item.output_text.text, item.output_text.value);
      if (nested) chunks.push(nested);
    }
  }

  return chunks.length ? chunks.join('\n') : null;
}

function extractAssistantText(raw: unknown): string {
  if (!isRecord(raw)) {
    // [FALLBACK] 응답 구조 미확인/비정상 시 앱 안전 기본문구
    return '안녕! 나는 네 그림 친구야. 오늘 어떤 모험을 해볼까?';
  }

  // [ASSUMED] 1순위: choices[].message.content (chat.completions 계열 관행)
  const choices = Array.isArray(raw.choices) ? raw.choices : [];
  for (const choice of choices) {
    if (!isRecord(choice)) continue;
    const msg = isRecord(choice.message) ? choice.message : null;
    const fromMessage = msg ? extractTextFromContent(msg.content) : null;
    if (fromMessage) return fromMessage;

    // [FALLBACK] 2순위: choices[].text
    const fromChoiceText = pickFirstString(choice.text);
    if (fromChoiceText) return fromChoiceText;
  }

  // [FALLBACK] 3순위: output[].content (다른 응답 shape 대응)
  const output = Array.isArray(raw.output) ? raw.output : [];
  for (const out of output) {
    if (!isRecord(out)) continue;
    const text = extractTextFromContent(out.content);
    if (text) return text;
  }

  // [FALLBACK] 모든 경로 실패 시 기본문구
  return '안녕! 나는 네 그림 친구야. 오늘 어떤 모험을 해볼까?';
}

function findAudioCandidate(raw: unknown): { base64: string | null; mimeType: string | null } {
  if (!isRecord(raw)) return { base64: null, mimeType: null };

  // [FALLBACK] 1순위: top-level audio
  const direct = isRecord(raw.audio) ? raw.audio : null;
  if (direct) {
    const base64 = pickFirstString(direct.base64, direct.data);
    const mimeType = pickFirstString(direct.mimeType, direct.mime_type, direct.format) ?? 'audio/mpeg';
    if (base64) return { base64, mimeType };
  }

  // [ASSUMED/FALLBACK] 2순위: choices[].message.audio
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

    // [FALLBACK] 3순위: content[] 내부 audio 필드/alias 대응
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

function normalizeTraits(v: unknown): [string, string] {
  if (Array.isArray(v)) {
    const t = v.map((x) => (typeof x === 'string' ? x.trim() : '')).filter(Boolean);
    if (t.length >= 2) return [t[0], t[1]];
    if (t.length === 1) return [t[0], '호기심'];
  }
  // [FALLBACK] traits 부재/비정상 시 기본 2개
  return ['다정함', '용감함'];
}

function fallbackCharacter(): CharacterCard {
  // [FALLBACK] 캐릭터 정보가 없거나 shape가 다를 때 앱 동작 보장을 위한 기본값
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

  // [FALLBACK] character 위치가 불명확하여 다중 경로 지원
  const source = isRecord(raw.character)
    ? raw.character
    : isRecord(raw.data) && isRecord(raw.data.character)
      ? raw.data.character
      : null;

  if (!source) return fallbackCharacter();

  // [FALLBACK] snake/camel/별칭 필드 동시 대응
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

export function parseKananaResponse(raw: unknown): ParsedResult {
  // [CONFIRMED] 반환 shape은 앱 내부 계약(types/kanana.ts, hooks/use-kanana-request.ts)
  const assistantText = extractAssistantText(raw);
  const { base64, mimeType } = findAudioCandidate(raw);
  const character = extractCharacter(raw);

  return {
    character,
    assistantText,
    audioBase64: base64,
    audioMimeType: mimeType,
  };
}
