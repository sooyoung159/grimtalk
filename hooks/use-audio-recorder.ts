'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * 목표 샘플레이트 (Kanana API가 기대하는 WAV 포맷)
 */
const TARGET_SAMPLE_RATE = 16000;

/**
 * Float32 PCM → 16-bit signed integer PCM
 */
function floatTo16BitPCM(input: Float32Array): Int16Array {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i += 1) {
    const s = Math.max(-1, Math.min(1, input[i] ?? 0));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output;
}

/**
 * 16-bit PCM 데이터를 WAV Blob으로 인코딩
 */
function encodePcm16ToWav(pcm16: Int16Array, sampleRate: number, channels: number): Blob {
  const bitsPerSample = 16;
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);
  const dataSize = pcm16.length * 2;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i += 1) {
      view.setUint8(offset + i, text.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < pcm16.length; i += 1) {
    view.setInt16(offset, pcm16[i], true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * 간단한 다운샘플링 (리니어 보간)
 * AudioContext가 목표 샘플레이트를 지원하지 않는 경우에 사용
 */
function downsampleBuffer(buffer: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return buffer;
  const ratio = fromRate / toRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i += 1) {
    const srcIdx = i * ratio;
    const low = Math.floor(srcIdx);
    const high = Math.min(low + 1, buffer.length - 1);
    const frac = srcIdx - low;
    result[i] = (buffer[low] ?? 0) * (1 - frac) + (buffer[high] ?? 0) * frac;
  }
  return result;
}

/**
 * Web Audio API의 ScriptProcessorNode를 이용한 직접 PCM 녹음 훅
 *
 * - MediaRecorder를 사용하지 않음 → MIME 타입/코덱 호환 문제 없음
 * - decodeAudioData를 사용하지 않음 → Safari "The string did not match the expected pattern" 에러 우회
 * - 녹음 종료 시 즉시 WAV Blob 생성
 */
export function useAudioRecorder() {
  const [permission, setPermission] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const pcmChunksRef = useRef<Float32Array[]>([]);
  const startedAtRef = useRef(0);

  const cleanup = useCallback(() => {
    try { processorRef.current?.disconnect(); } catch { /* noop */ }
    try { sourceRef.current?.disconnect(); } catch { /* noop */ }
    try { gainRef.current?.disconnect(); } catch { /* noop */ }
    streamRef.current?.getTracks().forEach((t) => t.stop());

    if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
      audioCtxRef.current.close().catch(() => { /* noop */ });
    }

    streamRef.current = null;
    audioCtxRef.current = null;
    sourceRef.current = null;
    processorRef.current = null;
    gainRef.current = null;
    pcmChunksRef.current = [];
    setIsRecording(false);
  }, []);

  const requestMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermission('granted');
      setError(null);
    } catch {
      setPermission('denied');
      setError('네 목소리를 들려주면 그림 친구가 깨어날 수 있어!');
    }
  };

  const startRecording = async () => {
    try {
      if (isRecording) return;
      cleanup();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // AudioContext 생성 — 가능하면 목표 샘플레이트(16kHz)로 설정
      const AudioContextCtor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextCtor) {
        throw new Error('Web Audio API가 지원되지 않는 환경이야.');
      }

      let ctx: AudioContext;
      try {
        ctx = new AudioContextCtor({ sampleRate: TARGET_SAMPLE_RATE });
      } catch {
        // 일부 브라우저에서 sampleRate 지정이 실패할 수 있음
        ctx = new AudioContextCtor();
      }

      // iOS Safari에서 AudioContext가 suspended 상태로 시작될 수 있음
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      audioCtxRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);
      sourceRef.current = source;

      // ScriptProcessorNode로 raw PCM 캡처 (bufferSize 4096, mono)
      const processor = ctx.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      pcmChunksRef.current = [];

      processor.onaudioprocess = (e: AudioProcessingEvent) => {
        const channelData = e.inputBuffer.getChannelData(0);
        // Float32Array를 복사하여 저장 (버퍼가 재사용되므로 반드시 복사)
        pcmChunksRef.current.push(new Float32Array(channelData));
      };

      // 스피커로 소리가 나가지 않도록 gain을 0으로 설정
      const gain = ctx.createGain();
      gain.gain.value = 0;
      gainRef.current = gain;

      // source → processor → gain(0) → destination
      // ScriptProcessorNode는 destination에 연결해야 onaudioprocess가 호출됨
      source.connect(processor);
      processor.connect(gain);
      gain.connect(ctx.destination);

      startedAtRef.current = Date.now();
      setError(null);
      setIsRecording(true);
    } catch {
      cleanup();
      setError('마이크를 시작하지 못했어. 다시 시도해볼까?');
    }
  };

  const stopRecording = async () => {
    const ctx = audioCtxRef.current;
    if (!ctx || !isRecording) {
      setIsRecording(false);
      return null;
    }

    try {
      // 연결 해제
      try { processorRef.current?.disconnect(); } catch { /* noop */ }
      try { sourceRef.current?.disconnect(); } catch { /* noop */ }
      try { gainRef.current?.disconnect(); } catch { /* noop */ }

      // 스트림 정지
      streamRef.current?.getTracks().forEach((t) => t.stop());

      const actualSampleRate = ctx.sampleRate;

      // AudioContext 닫기
      if (ctx.state !== 'closed') {
        await ctx.close();
      }

      const ms = Date.now() - startedAtRef.current;
      setDurationMs(ms);
      setIsRecording(false);

      // PCM 청크 병합
      const chunks = pcmChunksRef.current;
      const totalLength = chunks.reduce((acc, c) => acc + c.length, 0);

      if (totalLength === 0) {
        setError('녹음된 소리가 없어. 한 번 더 해볼까?');
        return null;
      }

      const merged = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }

      // 다운샘플링 (AudioContext의 실제 sampleRate가 16kHz가 아닌 경우)
      const mono = actualSampleRate !== TARGET_SAMPLE_RATE
        ? downsampleBuffer(merged, actualSampleRate, TARGET_SAMPLE_RATE)
        : merged;

      // WAV 생성
      const pcm16 = floatTo16BitPCM(mono);
      const wavBlob = encodePcm16ToWav(pcm16, TARGET_SAMPLE_RATE, 1);

      const file = new File([wavBlob], `record-${Date.now()}.wav`, { type: 'audio/wav' });

      return {
        file,
        previewUrl: URL.createObjectURL(file),
        durationMs: ms,
        mimeType: 'audio/wav' as const,
      };
    } catch {
      setError('녹음을 WAV 형식으로 변환하지 못했어. 한 번 더 해볼까?');
      setIsRecording(false);
      return null;
    } finally {
      audioCtxRef.current = null;
      sourceRef.current = null;
      processorRef.current = null;
      gainRef.current = null;
      streamRef.current = null;
      pcmChunksRef.current = [];
    }
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return { permission, isRecording, durationMs, error, requestMic, startRecording, stopRecording };
}
