'use client';

import { useMemo, useRef, useState } from 'react';
import { Card } from '@/components/common/card';

function isPlayableAudioUrl(url?: string | null): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  return trimmed.startsWith('data:audio/') || trimmed.startsWith('blob:') || trimmed.startsWith('http://') || trimmed.startsWith('https://');
}

export function AudioPlayer({ audioUrl }: { audioUrl?: string | null }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const safeAudioUrl = useMemo(() => (isPlayableAudioUrl(audioUrl) ? audioUrl!.trim() : null), [audioUrl]);

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

  if (!safeAudioUrl) {
    return (
      <Card variant="base" className="space-y-1.5 p-4">
        <p className="text-xs font-semibold tracking-wide text-[#8B8177]">친구 목소리</p>
        <p className="text-sm leading-relaxed text-[#6E655E]">이번엔 글로 먼저 인사했어. 바로 아래 버튼으로 다시 말을 걸 수 있어.</p>
      </Card>
    );
  }

  return (
    <Card variant="base" className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-3 rounded-[22px] bg-[#FFF8E7] px-4 py-4">
        <div>
          <p className="text-xs font-semibold tracking-wide text-[#8B8177]">친구 목소리</p>
          <p className="mt-1 text-sm leading-relaxed text-[#6E655E]">
            {isPlaying ? '지금 이 친구가 너에게 직접 말하고 있어.' : '버튼을 누르면 방금 깨어난 친구의 목소리를 들을 수 있어.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleToggle}
          className="min-w-[84px] rounded-full bg-[#2F2A26] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {isPlaying ? '멈춤' : '듣기'}
        </button>
      </div>

      <audio
        ref={audioRef}
        className="hidden"
        onEnded={() => setIsPlaying(false)}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
      >
        <source src={safeAudioUrl} />
      </audio>
    </Card>
  );
}
