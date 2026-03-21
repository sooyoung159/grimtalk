'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

function getPreferredMimeType(): string {
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/mp4;codecs=mp4a.40.2',
    'audio/aac',
    'audio/ogg',
  ];

  const supported = candidates.find((v) => typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(v));
  return supported ?? '';
}

function pickFileExtension(mimeType: string): string {
  if (mimeType.includes('mp4') || mimeType.includes('m4a')) return 'm4a';
  if (mimeType.includes('aac')) return 'aac';
  if (mimeType.includes('ogg')) return 'ogg';
  if (mimeType.includes('mp3') || mimeType.includes('mpeg')) return 'mp3';
  if (mimeType.includes('wav')) return 'wav';
  return 'webm';
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
      const blob = await new Promise<Blob>((resolve, reject) => {
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

      const effectiveMimeType = blob.type || recorder.mimeType || selectedMimeTypeRef.current || 'audio/webm';
      const ext = pickFileExtension(effectiveMimeType);
      const file = new File([blob], `record-${Date.now()}.${ext}`, { type: effectiveMimeType });

      // TODO: Safari/iOS 계열은 audio/mp4, audio/x-m4a 같은 MIME이 나올 수 있음.
      //       서버단에서 input_audio format 매핑(mp4/aac/wav) 정책을 확정해야 함.
      return {
        file,
        previewUrl: URL.createObjectURL(file),
        durationMs: ms,
        mimeType: effectiveMimeType,
      };
    } catch {
      setError('녹음을 마무리하지 못했어. 한 번 더 해볼까?');
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
