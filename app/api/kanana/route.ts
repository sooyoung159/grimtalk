import { NextResponse } from 'next/server';
import { buildKananaPayload, KananaInputMode } from '@/lib/kanana/build-request';
import { parseKananaResponse } from '@/lib/kanana/parse-response';
import { AudioConversionError, convertAudioToWav, wrapPcm16ToWav } from '@/lib/media/audio';

const REQUEST_TIMEOUT_MS = 20000;
const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_AUDIO_MIME = new Set([
  'audio/webm',
  'audio/wav',
  'audio/mpeg',
  'audio/mp3',
  'audio/ogg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/aac',
  'audio/mp4;codecs=mp4a.40.2',
]);
const ALLOWED_AUDIO_PREFIXES = ['audio/webm', 'audio/wav', 'audio/mpeg', 'audio/mp3', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac'];

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
  if (ALLOWED_AUDIO_MIME.has(normalized)) return true;
  return ALLOWED_AUDIO_PREFIXES.some((prefix) => normalized.startsWith(prefix));
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
    const image = formData.get('image');
    const audio = formData.get('audio');
    const text = (formData.get('text') as string | null) ?? undefined;

    const needsImage = mode === 'image_only' || mode === 'image_audio';
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
      return fail(400, '지원하지 않는 음성 형식이야.');
    }

    const imageBase64 = isFile(image) ? Buffer.from(await image.arrayBuffer()).toString('base64') : undefined;
    const imageMimeType = isFile(image) ? image.type : undefined;

    let requestAudioBase64: string | undefined;
    if (isFile(audio) && needsAudio) {
      const rawAudioBuffer = Buffer.from(await audio.arrayBuffer());
      let wav;
      try {
        wav = await convertAudioToWav({ buffer: rawAudioBuffer, mimeType: audio.type });
      } catch (e) {
        if (e instanceof AudioConversionError) {
          debugLog('audio convert failed', {
            mode,
            audioMimeType: audio.type,
            audioByteSize: audio.size,
            reason: e.detail ?? e.userMessage,
          });
          return fail(400, e.userMessage);
        }
        return fail(400, '오디오 형식을 변환하지 못했어. 다시 시도해줘.');
      }
      requestAudioBase64 = wav.buffer.toString('base64');

      debugLog('audio input normalized', {
        mode,
        originalMimeType: audio.type,
        originalByteSize: audio.size,
        convertedMimeType: wav.mimeType,
        convertedByteSize: wav.byteSize,
      });
    }

    const requestBody = buildKananaPayload({
      mode,
      imageBase64,
      imageMimeType,
      audioBase64: requestAudioBase64,
      audioMimeType: 'audio/wav',
      text,
    });

    debugLog('upstream request summary', {
      mode,
      hasImage: Boolean(imageBase64),
      hasAudio: Boolean(requestAudioBase64),
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
      status: upstream.status,
      ok: upstream.ok,
      contentType: upstream.headers.get('content-type'),
    });

    const upstreamText = await upstream.text();
    debugLog('upstream raw response preview', {
      mode,
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

    let responseAudioBase64 = parsed.audioBase64;
    let responseAudioMimeType = parsed.audioMimeType;

    if (parsed.audioBase64) {
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
          sourcePath: detectResponseAudioSourcePath(raw),
          decodedPcmByteLength: pcmBuffer.length,
          wrappedWavByteLength: wavBuffer.length,
        });
      } catch {
        debugLog('response audio wrap failed', {
          mode,
          sourcePath: detectResponseAudioSourcePath(raw),
          parsedAudioMimeType: parsed.audioMimeType,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      character: parsed.character,
      assistantText: parsed.assistantText,
      audioBase64: responseAudioBase64,
      audioMimeType: responseAudioMimeType,
    });
  } catch {
    return fail(500, '문제가 생겼어. 한 번 더 해볼까?');
  }
}
