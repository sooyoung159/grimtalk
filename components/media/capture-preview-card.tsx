export function CapturePreviewCard({ imageUrl }: { imageUrl: string }) {
  return <img src={imageUrl} alt="captured" className="h-[360px] w-full rounded-[24px] border border-[#EFEAE6] object-cover" />;
}
