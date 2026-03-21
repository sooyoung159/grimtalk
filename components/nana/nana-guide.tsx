import { SpeechBubble } from '@/components/common/speech-bubble';
import { NanaFloating } from './nana-floating';

export function NanaGuide({ message }: { message: string }) {
  return <div className="space-y-3"><NanaFloating /><SpeechBubble text={message} /></div>;
}
