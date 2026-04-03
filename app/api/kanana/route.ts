import { NextResponse } from 'next/server';
import { buildKananaPayload, KananaInputMode, KananaTurnMode } from '@/lib/kanana/build-request';
import { parseKananaResponse } from '@/lib/kanana/parse-response';
import { wrapPcm16ToWav } from '@/lib/media/audio';
import { CharacterCard } from '@/types/character';

const REQUEST_TIMEOUT_MS = 20000;
const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_AUDIO_MIME = new Set([
  'audio/wav', 'audio/x-wav', 'audio/wave',
  // Safari/iOS fallback: WAV 변환 실패 시 원본 포맷이 올 수 있음
  'audio/mp4', 'audio/aac', 'audio/mpeg',
  'audio/webm', 'audio/ogg',
]);

type ErrorBody = { ok: false; error: string };

function fail(status: number, error: string) {
  return NextResponse.json<ErrorBody>({ ok: false, error }, { status });
}

function normalizeEndpoint(base: string): string {
  return base.trim().replace(/\/+$/, '');
}

function isFile(v: FormDataEntryValue | null): v is File {
  return typeof File !== 'undefined' && v instanceof File;
}

function isDebugEnabled(): boolean {
  return (process.env.KANANA_DEBUG ?? '').toLowerCase() === 'true';
}

function isAllowedAudioMime(mimeType: string): boolean {
  const normalized = mimeType.trim().toLowerCase();
  if (!normalized) return false;
  return ALLOWED_AUDIO_MIME.has(normalized);
}

function safeBase64Preview(input: string, maxLen = 500): string {
  const clipped = input.slice(0, maxLen);
  return clipped
    .replace(/data:[^;]+;base64,[A-Za-z0-9+/=]{20,}/g, (m) => `[REDACTED_DATA_URI len=${m.length}]`)
    .replace(/[A-Za-z0-9+/=]{80,}/g, (m) => `[REDACTED_BASE64 len=${m.length}]`);
}

function debugLog(label: string, payload: unknown) {
  if (!isDebugEnabled()) return;
  console.log(`[KANANA_DEBUG] ${label}`, payload);
}

function tryParseJson(text: string): unknown | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

function detectResponseAudioSourcePath(raw: unknown): string {
  if (!isRecord(raw)) return 'none';

  if (isRecord(raw.audio)) {
    if (typeof raw.audio.data === 'string') return 'audio.data';
    if (typeof raw.audio.base64 === 'string') return 'audio.base64';
  }

  const choices = Array.isArray(raw.choices) ? raw.choices : [];
  for (const choice of choices) {
    if (!isRecord(choice)) continue;
    const message = isRecord(choice.message) ? choice.message : null;
    if (!message) continue;

    if (isRecord(message.audio)) {
      if (typeof message.audio.data === 'string') return 'choices[].message.audio.data';
      if (typeof message.audio.base64 === 'string') return 'choices[].message.audio.base64';
    }

    if (Array.isArray(message.content)) {
      for (const c of message.content) {
        if (!isRecord(c)) continue;
        if (typeof c.audio_base64 === 'string') return 'choices[].message.content[].audio_base64';
        if (typeof c.base64 === 'string') return 'choices[].message.content[].base64';
        if (isRecord(c.input_audio) && typeof c.input_audio.data === 'string') {
          return 'choices[].message.content[].input_audio.data';
        }
      }
    }
  }

  return 'unknown';
}

function parseMode(v: FormDataEntryValue | null): KananaInputMode {
  if (typeof v !== 'string') return 'image_audio';
  if (v === 'image_only' || v === 'audio_only' || v === 'image_audio') return v;
  return 'image_audio';
}

function parseTurnMode(v: FormDataEntryValue | null): KananaTurnMode {
  if (typeof v !== 'string') return 'first_turn';
  return v === 'continue_turn' ? 'continue_turn' : 'first_turn';
}

function parseCharacter(v: FormDataEntryValue | null): CharacterCard | null {
  if (typeof v !== 'string') return null;
  try {
    const parsed = JSON.parse(v);
    if (
      isRecord(parsed) &&
      typeof parsed.name === 'string' &&
      typeof parsed.identity === 'string' &&
      Array.isArray(parsed.traits) &&
      parsed.traits.length >= 2 &&
      typeof parsed.voiceTone === 'string' &&
      typeof parsed.greeting === 'string' &&
      typeof parsed.question === 'string'
    ) {
      return {
        name: parsed.name,
        identity: parsed.identity,
        traits: [String(parsed.traits[0]), String(parsed.traits[1])],
        voiceTone: parsed.voiceTone,
        greeting: parsed.greeting,
        question: parsed.question,
        narration: typeof parsed.narration === 'string' ? parsed.narration : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

const BANNED_IDENTITY_PATTERNS = [
  /나는\s*카카오에서\s*온\s*ai/i,
  /나는\s*카나나/i,
  /카카오의\s*도우미/i,
  /ai\s*카나나/i,
  /인공지능/i,
  /ai\s*비서/i,
];

function alignCharacterToAssistantText(character: CharacterCard, assistantText: string): CharacterCard {
  const normalized = assistantText.replace(/\s+/g, ' ').trim();
  // 공백 포함 이름 매칭 (예: "빨간 레고 게", "파란 고래")
  const patterns = [
    /내 이름은\s*([가-힣A-Za-z0-9\s]{2,20}?)(?:야|이야|라고|입니다|이에요|[.!,])/,
    /나는\s*([가-힣A-Za-z0-9\s]{2,20}?)(?:야|이야|라고|입니다|이에요|[.!,])/,
    /나는\s*([가-힣A-Za-z0-9\s]{2,20}?)라고\s*해/,
  ];

  for (const pattern of patterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      const extractedName = match[1].trim();
      if (extractedName && extractedName !== '카나나' && extractedName !== character.name) {
        // 응답 텍스트에서 identity도 추출
        const parts = normalized.split(/[,.!]/).map((s) => s.trim()).filter((s) => s.length > 4);
        const identity = parts.length >= 2
          ? parts[1].replace(/^\s*(그리고|그래서|그런데)\s*/, '').trim()
          : null;

        return {
          ...character,
          name: extractedName,
          identity: (identity && identity.length > 4) ? identity : `그림 속에서 막 깨어난 ${extractedName}`,
          greeting: `안녕! 나는 ${extractedName}야!`,
        };
      }
    }
  }

  return character;
}

function buildSafeAssistantText(character: CharacterCard, turnMode: KananaTurnMode): string {
  if (turnMode === 'continue_turn') {
    return `${character.name}인 내가 방금 네 말을 듣고 더 가까이 왔어. ${character.question}`;
  }
  return `${character.greeting} ${character.question}`;
}

function sanitizeAssistantText(text: string, character: CharacterCard, turnMode: KananaTurnMode): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return buildSafeAssistantText(character, turnMode);
  }

  if (BANNED_IDENTITY_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return buildSafeAssistantText(character, turnMode);
  }

  return normalized;
}

export async function POST(req: Request) {
  try {
    const endpointRaw = process.env.KANANA_BASE_URL ?? '';
    const apiKey = process.env.KANANA_API_KEY ?? '';

    if (!endpointRaw || !apiKey) {
      return fail(500, '서버 키 설정이 필요해.');
    }

    const endpoint = normalizeEndpoint(endpointRaw);
    if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
      return fail(500, 'KANANA_BASE_URL 형식이 올바르지 않아.');
    }

    const formData = await req.formData();
    const mode = parseMode(formData.get('mode'));
    const turnMode = parseTurnMode(formData.get('turnMode'));
    const character = parseCharacter(formData.get('character'));
    const previousUserText = (formData.get('previousUserText') as string | null) ?? undefined;
    const previousAssistantText = (formData.get('previousAssistantText') as string | null) ?? undefined;
    const image = formData.get('image');
    const audio = formData.get('audio');
    const text = (formData.get('text') as string | null) ?? undefined;

    const needsImage = turnMode === 'first_turn' && (mode === 'image_only' || mode === 'image_audio');
    const needsAudio = mode === 'audio_only' || mode === 'image_audio';

    if (needsImage && !isFile(image)) {
      return fail(400, '이미지가 빠졌어.');
    }
    if (needsAudio && !isFile(audio)) {
      return fail(400, '음성이 빠졌어.');
    }

    if (isFile(image) && !ALLOWED_IMAGE_MIME.has(image.type)) {
      return fail(400, '지원하지 않는 이미지 형식이야. (jpg/png/webp)');
    }

    if (isFile(audio) && !isAllowedAudioMime(audio.type)) {
      debugLog('audio mime rejected', {
        mode,
        received: audio.type,
        normalized: audio.type.trim().toLowerCase(),
      });
      return fail(400, '지원하지 않는 음성 형식이야. 녹음을 다시 해줘.');
    }

    const imageBase64 = isFile(image) ? Buffer.from(await image.arrayBuffer()).toString('base64') : undefined;
    const imageMimeType = isFile(image) ? image.type : undefined;

    let requestAudioBase64: string | undefined;
    if (isFile(audio) && needsAudio) {
      const audioBuffer = Buffer.from(await audio.arrayBuffer());
      requestAudioBase64 = audioBuffer.toString('base64');

      debugLog('audio input passthrough', {
        mode,
        turnMode,
        mimeType: audio.type,
        byteSize: audio.size,
      });
    }

    const requestBody = buildKananaPayload({
      mode,
      turnMode,
      character,
      previousUserText,
      previousAssistantText,
      imageBase64,
      imageMimeType,
      audioBase64: requestAudioBase64,
      audioMimeType: 'audio/wav',
      text,
    });

    debugLog('upstream request summary', {
      mode,
      turnMode,
      hasImage: Boolean(imageBase64),
      hasAudio: Boolean(requestAudioBase64),
      hasCharacter: Boolean(character),
      hasPreviousUserText: Boolean(previousUserText),
      hasPreviousAssistantText: Boolean(previousAssistantText),
      textLength: text?.trim().length ?? 0,
    });

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let upstream: Response;
    try {
      upstream = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') {
        return fail(504, '응답이 지연되고 있어. 잠깐 후 다시 해보자.');
      }
      return fail(502, '지금은 친구를 깨우기 어려워.');
    } finally {
      clearTimeout(timeout);
    }

    debugLog('upstream status', {
      mode,
      turnMode,
      status: upstream.status,
      ok: upstream.ok,
      contentType: upstream.headers.get('content-type'),
    });

    const upstreamText = await upstream.text();
    debugLog('upstream raw response preview', {
      mode,
      turnMode,
      length: upstreamText.length,
      preview: safeBase64Preview(upstreamText, 800),
    });

    if (!upstream.ok) {
      if (upstream.status === 401 || upstream.status === 403) return fail(401, '인증 문제가 있어.');
      if (upstream.status === 429) return fail(429, '잠깐 쉬었다가 다시 해보자.');
      if (upstream.status >= 500) return fail(502, '그림 친구가 잠시 쉬고 있어.');
      return fail(400, '요청 형식을 다시 확인해볼게.');
    }

    const raw = tryParseJson(upstreamText);
    if (!raw) {
      return fail(502, '응답을 읽지 못했어. 한 번 더 해볼까?');
    }

    const parsed = parseKananaResponse(raw);
    const baseCharacter = turnMode === 'continue_turn' && character ? character : parsed.character;
    const resolvedAssistantText = sanitizeAssistantText(parsed.assistantText, baseCharacter, turnMode);
    const resolvedCharacter = turnMode === 'first_turn' ? alignCharacterToAssistantText(baseCharacter, resolvedAssistantText) : baseCharacter;

    let responseAudioBase64 = parsed.audioBase64;
    let responseAudioMimeType = parsed.audioMimeType;
    const normalizedParsedAssistantText = parsed.assistantText.replace(/\s+/g, ' ').trim();
    const assistantTextWasSanitized = resolvedAssistantText !== normalizedParsedAssistantText;

    if (assistantTextWasSanitized) {
      responseAudioBase64 = null;
      responseAudioMimeType = null;
    }

    if (parsed.audioBase64 && !assistantTextWasSanitized) {
      try {
        const pcmBuffer = Buffer.from(parsed.audioBase64, 'base64');
        const wavBuffer = wrapPcm16ToWav({
          pcm: pcmBuffer,
          sampleRate: 24000,
          channels: 1,
          bitsPerSample: 16,
        });

        responseAudioBase64 = wavBuffer.toString('base64');
        responseAudioMimeType = 'audio/wav';

        debugLog('response audio wrapped', {
          mode,
          turnMode,
          sourcePath: detectResponseAudioSourcePath(raw),
          decodedPcmByteLength: pcmBuffer.length,
          wrappedWavByteLength: wavBuffer.length,
        });
      } catch {
        debugLog('response audio wrap failed', {
          mode,
          turnMode,
          sourcePath: detectResponseAudioSourcePath(raw),
          parsedAudioMimeType: parsed.audioMimeType,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      character: resolvedCharacter,
      assistantText: resolvedAssistantText,
      audioBase64: responseAudioBase64,
      audioMimeType: responseAudioMimeType,
    });
  } catch {
    return fail(500, '문제가 생겼어. 한 번 더 해볼까?');
  }
}
