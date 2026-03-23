'use client';

import { useEffect, useMemo, useState } from 'react';
import { SectionTitle } from '@/components/common/section-title';
import { LoadingStars } from './loading-stars';
import { CapturePreviewCard } from '@/components/media/capture-preview-card';

const LOADING_MESSAGES = [
  '친구가 조용히 눈을 뜨고 있어',
  '그림 속에서 목소리를 찾고 있어',
  '금방 인사를 들려줄 거야',
] as const;

export function LoadingScreen({ message, imageUrl }: { imageUrl?: string | null; message?: string }) {
  const [messageIndex, setMessageIndex] = useState(0);

  const title = useMemo(() => {
    if (message?.trim()) return message;
    return LOADING_MESSAGES[messageIndex] ?? LOADING_MESSAGES[0];
  }, [message, messageIndex]);

  useEffect(() => {
    if (message?.trim()) return;

    const timer = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 1400);

    return () => clearInterval(timer);
  }, [message]);

  return (
    <div className="space-y-5 py-8 animate-result-enter">
      {imageUrl && (
        <div className="space-y-2">
          <p className="text-center text-xs text-[#9A8F83]">네 그림 친구를 깨우는 중이야</p>
          <CapturePreviewCard imageUrl={imageUrl} />
        </div>
      )}

      <SectionTitle title={title} description="나나가 그림 친구에게 살짝 말을 걸고 있어." align="center" />
      <LoadingStars />
    </div>
  );
}
