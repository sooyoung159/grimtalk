'use client';

import { ChangeEvent, useCallback, useEffect, useRef, useState } from 'react';

export function useMediaCapture() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
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

  const buildImageState = async (source: Blob, filename: string, type: string) => {
    const file = source instanceof File ? source : new File([source], filename, { type });
    return { file, previewUrl: URL.createObjectURL(file) };
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

    return buildImageState(blob, `capture-${Date.now()}.jpg`, 'image/jpeg');
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return null;
    if (!file.type.startsWith('image/')) {
      setError('그림이 잘 보이는 사진을 골라줘!');
      return null;
    }

    stopCamera();
    setError(null);
    return buildImageState(file, file.name || `upload-${Date.now()}.jpg`, file.type || 'image/jpeg');
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return { videoRef, fileInputRef, permission, isReady, error, requestCamera, captureFrame, openFilePicker, handleFileChange, stopCamera };
}
