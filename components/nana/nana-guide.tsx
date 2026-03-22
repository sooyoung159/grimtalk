import { SpeechBubble } from '@/components/common/speech-bubble';
import { NanaFloating } from './nana-floating';

export function NanaGuide({ message }: { message: string }) {
  return <div className="space-y-2.5"><NanaFloating /><div className="mx-auto max-w-[28rem]"><SpeechBubble text={message} /></div></div>;
}
