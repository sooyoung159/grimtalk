'use client';

import { useEffect, useMemo, useState } from 'react';
import { SectionTitle } from '@/components/common/section-title';
import { LoadingStars } from './loading-stars';
import { CapturePreviewCard } from '@/components/media/capture-preview-card';

const FIRST_TURN_LOADING_MESSAGES = [
  '친구가 조용히 눈을 뜨고 있어',
  '그림 속에서 목소리를 찾고 있어',
  '금방 인사를 들려줄 거야',
] as const;

const CONTINUE_TURN_LOADING_MESSAGES = [
  '친구가 방금 네 말을 듣고 있어',
  '같은 친구가 이어서 대답을 생각하고 있어',
  '금방 다시 말을 걸어줄 거야',
] as const;

export function LoadingScreen({ message, imageUrl, turnMode = 'first_turn' }: { imageUrl?: string | null; message?: string; turnMode?: 'first_turn' | 'continue_turn' }) {
  const [messageIndex, setMessageIndex] = useState(0);

  const title = useMemo(() => {
    if (message?.trim()) return message;
    return (turnMode === 'continue_turn' ? CONTINUE_TURN_LOADING_MESSAGES : FIRST_TURN_LOADING_MESSAGES)[messageIndex];
  }, [message, messageIndex, turnMode]);

  useEffect(() => {
    if (message?.trim()) return;

    const timer = setInterval(() => {
      const messages = turnMode === 'continue_turn' ? CONTINUE_TURN_LOADING_MESSAGES : FIRST_TURN_LOADING_MESSAGES;
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 1400);

    return () => clearInterval(timer);
  }, [message, turnMode]);

  return (
    <div className="space-y-5 py-8 animate-result-enter">
      <div className="space-y-2">
        <p className="text-center text-xs text-[#9A8F83]">{turnMode === 'continue_turn' ? '네 그림 친구가 이어서 답하는 중이야' : '네 그림 친구를 깨우는 중이야'}</p>
        <CapturePreviewCard imageUrl={imageUrl} emptyMessage="그림 친구를 기다리는 중이야" />
      </div>

      <SectionTitle title={title} description={turnMode === 'continue_turn' ? '같은 친구가 네 말을 듣고 이어서 답하고 있어.' : '나나가 그림 친구에게 살짝 말을 걸고 있어.'} align="center" />
      <LoadingStars />
    </div>
  );
}
