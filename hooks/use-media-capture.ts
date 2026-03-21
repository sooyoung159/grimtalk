'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useMediaCapture() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [permission, setPermission] = useState<'idle' | 'granted' | 'denied'>('idle');
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsReady(false);
  }, []);

  const requestCamera = async () => {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setPermission('granted');
      setIsReady(true);
      setError(null);
    } catch {
      setPermission('denied');
      setIsReady(false);
      setError('카메라를 켜주면 그림 친구를 만날 수 있어!');
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current) return null;
    const { videoWidth, videoHeight } = videoRef.current;
    if (!videoWidth || !videoHeight) {
      setError('카메라 준비가 조금 더 필요해. 잠깐만 기다려줄래?');
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = videoWidth;
    canvas.height = videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(videoRef.current, 0, 0);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/jpeg', 0.92));
    if (!blob) return null;

    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
    // TODO: previewUrl(object URL) revoke는 소비 레이어(store/page)에서 교체 시점에 정리 필요
    return { file, previewUrl: URL.createObjectURL(file) };
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return { videoRef, permission, isReady, error, requestCamera, captureFrame, stopCamera };
}
