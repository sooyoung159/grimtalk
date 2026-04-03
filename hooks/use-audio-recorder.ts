'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { convertRecordedBlobToWav16kMono } from '@/lib/media/audio-browser';

/**
 * Safari/iOS 친화적으로 MIME type 후보를 선택한다.
 * Safari에서는 audio/mp4가 가장 안정적이므로 최우선 후보로 배치.
 */
function getPreferredMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return '';

  // Safari/iOS에서 audio/mp4를 최우선으로 사용
  // audio/mp4는 decodeAudioData 호환성이 가장 높다
  const candidates = [
    'audio/mp4',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/aac',
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg',
  ];

  const supported = candidates.find((v) => MediaRecorder.isTypeSupported(v));
  return supported ?? '';
}

export function useAudioRecorder() {
  const [permission, setPermission] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [isRecording, setIsRecording] = useState(false);
  const [durationMs, setDurationMs] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const startedAtRef = useRef(0);
  const selectedMimeTypeRef = useRef<string>('');

  const cleanup = useCallback(() => {
    if (mediaRef.current && mediaRef.current.state !== 'inactive') {
      try {
        mediaRef.current.stop();
      } catch {
        // noop
      }
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    mediaRef.current = null;
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

      const selectedMimeType = getPreferredMimeType();
      selectedMimeTypeRef.current = selectedMimeType;

      const recorder = selectedMimeType ? new MediaRecorder(stream, { mimeType: selectedMimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onerror = () => {
        setError('녹음 중 문제가 생겼어. 다시 시도해볼까?');
      };

      recorder.start();
      mediaRef.current = recorder;
      startedAtRef.current = Date.now();
      setError(null);
      setIsRecording(true);
    } catch {
      cleanup();
      setError('마이크를 시작하지 못했어. 다시 시도해볼까?');
    }
  };

  const stopRecording = async () => {
    const recorder = mediaRef.current;
    if (!recorder || recorder.state === 'inactive') {
      setIsRecording(false);
      return null;
    }

    try {
      const recordedBlob = await new Promise<Blob>((resolve, reject) => {
        recorder.onstop = () => {
          const finalMime = recorder.mimeType || selectedMimeTypeRef.current || 'audio/webm';
          resolve(new Blob(chunksRef.current, { type: finalMime }));
        };
        recorder.onerror = () => reject(new Error('recorder error'));
        recorder.stop();
      });

      streamRef.current?.getTracks().forEach((t) => t.stop());
      const ms = Date.now() - startedAtRef.current;
      setDurationMs(ms);
      setIsRecording(false);

      // WAV 변환 시도 — 실패해도 원본 blob으로 fallback
      let wavBlob: Blob;
      try {
        wavBlob = await convertRecordedBlobToWav16kMono(recordedBlob);
      } catch (convertError) {
        console.warn('[audio-recorder] WAV 변환 실패, 원본 blob 사용:', convertError);
        // 원본 blob을 audio/wav MIME으로 감싸서 전달
        // 서버에서 MIME 검증에 실패할 수 있으므로, 원본 MIME 유지
        wavBlob = recordedBlob;
      }

      const mimeType = wavBlob.type.startsWith('audio/wav') ? 'audio/wav' : wavBlob.type || 'audio/wav';
      const file = new File([wavBlob], `record-${Date.now()}.wav`, { type: mimeType });

      return {
        file,
        previewUrl: URL.createObjectURL(file),
        durationMs: ms,
        mimeType,
      };
    } catch {
      setError('녹음을 WAV 형식으로 변환하지 못했어. 한 번 더 해볼까?');
      setIsRecording(false);
      return null;
    } finally {
      mediaRef.current = null;
      streamRef.current = null;
      selectedMimeTypeRef.current = '';
    }
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return { permission, isRecording, durationMs, error, requestMic, startRecording, stopRecording };
}
