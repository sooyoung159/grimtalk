import { SpeechBubble } from '@/components/common/speech-bubble';

type NanaVariant = 'idle' | 'cheer' | 'wave';

const SRC_BY_VARIANT: Record<NanaVariant, string> = {
  idle: '/assets/nana/nana-idle.png',
  cheer: '/assets/nana/nana-cheer.png',
  wave: '/assets/nana/nana-wave.png',
};

export function NanaBubble({ message, variant = 'idle', size = 'sm' }: { message: string; variant?: NanaVariant; size?: 'sm' | 'md' }) {
  const imageClass = size === 'md' ? 'h-24 w-24' : 'h-16 w-16';
  return (
    <div className="flex items-start gap-3">
      <img src={SRC_BY_VARIANT[variant]} alt="나나" className={`${imageClass} shrink-0 object-contain`} />
      <div className="flex-1">
        <SpeechBubble text={message} />
      </div>
    </div>
  );
}
