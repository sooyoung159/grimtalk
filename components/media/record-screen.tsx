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
  return <div className="space-y-5"><SectionTitle title="그림 친구에게 말을 걸어볼까?" description="인사해도 좋고, 이름을 물어봐도 좋아!" /><CapturePreviewCard imageUrl={props.imageUrl} /><NanaBubble message="짧게 한마디 해보면 친구가 대답할지도 몰라!" /><ExampleSpeechChips items={COPY.exampleSpeech} /><div className="flex justify-center"><RecordButton isRecording={props.isRecording} onClick={handle} /></div><AudioLevelIndicator active={props.isRecording} /><SecondaryButton onClick={props.onBack}>뒤로</SecondaryButton>{props.errorMessage && <p className="text-sm text-[#A55445]">{props.errorMessage}</p>}</div>;
}
