export function CapturePreviewCard({ imageUrl, emptyMessage = '여기에 네 그림이 나타날 거야' }: { imageUrl?: string | null; emptyMessage?: string }) {
  const hasImage = Boolean(imageUrl?.trim());

  return (
    <div className="rounded-[26px] border border-[#EFEAE6] bg-[#FFFDF9] p-1 shadow-[0_10px_24px_rgba(103,95,89,0.08)]">
      {hasImage ? (
        <img src={imageUrl ?? ''} alt="captured" className="h-[360px] w-full rounded-[22px] border border-[#F2ECE6] object-cover" />
      ) : (
        <div className="relative flex h-[360px] w-full items-center justify-center overflow-hidden rounded-[22px] border border-[#F2ECE6] bg-[linear-gradient(180deg,#FFFDF8_0%,#FFF7EC_100%)] px-6 text-center">
          <div className="absolute left-8 top-8 h-2.5 w-2.5 rounded-full bg-[#F7E7A8] opacity-70" />
          <div className="absolute right-10 top-14 h-1.5 w-1.5 rounded-full bg-[#F3D9A4] opacity-70" />
          <div className="absolute inset-6 rounded-[18px] border border-dashed border-[#E9DDCC]" />
          <div className="space-y-3">
            <div className="mx-auto h-14 w-14 rounded-[18px] border border-[#E8DCC8] bg-white/70" />
            <p className="text-sm leading-relaxed text-[#8B8177]">{emptyMessage}</p>
          </div>
        </div>
      )}
    </div>
  );
}
