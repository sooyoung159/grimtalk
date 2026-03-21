export function AudioPlayer({ audioUrl }: { audioUrl?: string | null }) {
  if (!audioUrl) return null;
  return <audio controls className="w-full"><source src={audioUrl} /></audio>;
}
