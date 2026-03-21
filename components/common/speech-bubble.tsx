import { Card } from './card';

export function SpeechBubble({ text }: { text: string }) {
  return <Card variant="speech"><p className="text-sm text-[#4A433E]">{text}</p></Card>;
}
