'use client';

import { useRef, useState } from 'react';
import { Card } from '@/components/common/card';

export function AudioPlayer({ audioUrl }: { audioUrl?: string | null }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleToggle = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  if (!audioUrl) {
    return (
      <Card variant="base" className="space-y-1.5 p-3.5">
        <p className="text-xs font-semibold text-[#8B8177]">친구 목소리</p>
        <p className="text-sm leading-relaxed text-[#6E655E]">이번 응답에는 음성 클립이 없어요. 텍스트로도 충분히 대화를 이어갈 수 있어요.</p>
      </Card>
    );
  }

  return (
    <Card variant="base" className="space-y-2.5 p-3.5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-[#8B8177]">친구 목소리</p>
          <p className="mt-0.5 text-sm text-[#6E655E]">버튼을 눌러 방금 깨어난 친구의 목소리를 들어봐요.</p>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          className="rounded-full bg-[#2F2A26] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {isPlaying ? '멈춤' : '재생'}
        </button>
      </div>

      <audio
        ref={audioRef}
        className="hidden"
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      >
        <source src={audioUrl} />
      </audio>
    </Card>
  );
}
