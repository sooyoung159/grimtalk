import type React from 'react';

export function CameraFrame({ videoRef, ready }: { videoRef: React.RefObject<HTMLVideoElement | null>; ready: boolean }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#DCCCF6]/35 bg-[#F8F4EE] p-2 shadow-[0_12px_28px_rgba(103,95,89,0.10)]">
      <div className="relative">
        <video ref={videoRef as React.RefObject<HTMLVideoElement>} autoPlay playsInline muted className="h-[320px] w-full rounded-[22px] object-cover" />
        <div className="pointer-events-none absolute inset-4 rounded-[18px] border border-white/45" />
      </div>

      {!ready ? (
        <p className="p-4 text-center text-sm text-[#675F59]">카메라를 준비 중이야...</p>
      ) : (
        <p className="p-3 text-center text-xs text-[#8B8177]">그림이 화면 가운데 오게 맞춰주면 더 잘 깨어날 수 있어.</p>
      )}
    </div>
  );
}
