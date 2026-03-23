import { SectionTitle } from '@/components/common/section-title';
import { SecondaryButton } from '@/components/common/secondary-button';
import { CapturePreviewCard } from './capture-preview-card';
import { RecordButton } from './record-button';
import { ExampleSpeechChips } from './example-speech-chips';
import { AudioLevelIndicator } from './audio-level-indicator';
import { COPY } from '@/lib/constants/copy';
import { NanaBubble } from '@/components/nana/nana-bubble';

export function RecordScreen(props: {
  imageUrl: string; permission: 'idle' | 'granted' | 'denied'; isRecording: boolean; errorMessage?: string | null;
  onRequestMic: () => Promise<void> | void; onStartRecording: () => Promise<void> | void; onStopRecording: () => Promise<void> | void; onBack: () => void;
}) {
  const handle = async () => {
    if (props.permission !== 'granted') return props.onRequestMic();
    if (props.isRecording) return props.onStopRecording();
    return props.onStartRecording();
  };

  return (
    <div className="space-y-5 animate-result-enter">
      <SectionTitle title="그림 친구에게 말을 걸어볼까?" description="한마디만 들려줘도 친구가 목소리를 기억하고 답해줄 거야." />

      <div className="space-y-2">
        <CapturePreviewCard imageUrl={props.imageUrl} />
        <p className="text-xs text-[#9A8F83]">이 그림 친구에게 직접 말을 걸어보자.</p>
      </div>

      <NanaBubble message="짧게 말해줘도 충분해! 친구가 귀 기울이고 있어." variant="thinking" />

      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#8B8177]">이렇게 말해봐도 좋아</p>
        <ExampleSpeechChips items={COPY.exampleSpeech} />
      </div>

      <div className="flex justify-center pt-1">
        <RecordButton isRecording={props.isRecording} onClick={handle} />
      </div>

      <AudioLevelIndicator active={props.isRecording} />

      <SecondaryButton onClick={props.onBack}>{props.permission === 'granted' ? '그림 다시 보기' : '뒤로'}</SecondaryButton>

      {props.errorMessage && <p className="rounded-2xl bg-[#FFF5F2] px-4 py-3 text-sm text-[#A55445]">{props.errorMessage}</p>}
    </div>
  );
}
