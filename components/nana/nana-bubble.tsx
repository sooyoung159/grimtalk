import { SpeechBubble } from '@/components/common/speech-bubble';

type NanaVariant = 'idle' | 'thinking' | 'cheer' | 'wave';

const SRC_BY_VARIANT: Record<NanaVariant, string> = {
  idle: '/assets/nana/nana-idle.png',
  thinking: '/assets/nana/nana-thinking.png',
  cheer: '/assets/nana/nana-cheer.png',
  wave: '/assets/nana/nana-wave.png',
};

export function NanaBubble({ message, variant = 'idle', size = 'sm' }: { message: string; variant?: NanaVariant; size?: 'sm' | 'md' }) {
  const baseImageClass = size === 'md' ? 'h-24 w-24' : 'h-[4.25rem] w-[4.25rem]';
  const thinkingImageClass = size === 'md' ? 'h-24 w-24' : 'h-[4.4rem] w-[4.4rem]';
  const imageClass = variant === 'thinking' ? thinkingImageClass : baseImageClass;
  const rowAlignClass = variant === 'thinking' ? 'items-start' : 'items-center';

  return (
    <div className={`flex gap-3 ${rowAlignClass}`}>
      <img src={SRC_BY_VARIANT[variant]} alt="나나" className={`${imageClass} mt-0.5 shrink-0 object-contain drop-shadow-[0_3px_8px_rgba(0,0,0,0.08)]`} />
      <div className="min-w-0 flex-1">
        <SpeechBubble text={message} />
      </div>
    </div>
  );
}
