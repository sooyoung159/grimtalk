export function CapturePreviewCard({ imageUrl }: { imageUrl: string }) {
  return (
    <div className="rounded-[26px] border border-[#EFEAE6] bg-[#FFFDF9] p-1 shadow-[0_10px_24px_rgba(103,95,89,0.08)]">
      <img src={imageUrl} alt="captured" className="h-[360px] w-full rounded-[22px] border border-[#F2ECE6] object-cover" />
    </div>
  );
}
