import type React from 'react';

export function CameraFrame({ videoRef, ready }: { videoRef: React.RefObject<HTMLVideoElement | null>; ready: boolean }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-[#CDB7FB]/30 bg-[#F7F4F1] p-2 shadow-[0_12px_28px_rgba(103,95,89,0.10)]">
      <video ref={videoRef as React.RefObject<HTMLVideoElement>} autoPlay playsInline muted className="h-[320px] w-full rounded-[22px] object-cover" />
      {!ready && <p className="p-4 text-center text-sm text-[#675F59]">카메라를 준비 중이야...</p>}
    </div>
  );
}
