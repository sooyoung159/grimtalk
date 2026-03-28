import { SectionTitle } from '@/components/common/section-title';
import { SecondaryButton } from '@/components/common/secondary-button';
import { CapturePreviewCard } from './capture-preview-card';
import { RecordButton } from './record-button';
import { ExampleSpeechChips } from './example-speech-chips';
import { AudioLevelIndicator } from './audio-level-indicator';
import { COPY } from '@/lib/constants/copy';
import { NanaBubble } from '@/components/nana/nana-bubble';
import type { ConversationMessage } from '@/stores/conversation-store';

export function RecordScreen(props: {
  imageUrl: string;
  permission: 'idle' | 'granted' | 'denied';
  isRecording: boolean;
  errorMessage?: string | null;
  mode?: 'first_turn' | 'continue_turn';
  recentMessages?: ConversationMessage[];
  onRequestMic: () => Promise<void> | void;
  onStartRecording: () => Promise<void> | void;
  onStopRecording: () => Promise<void> | void;
  onBack: () => void;
}) {
  const isContinueTurn = props.mode === 'continue_turn';
  const latest = (props.recentMessages ?? []).slice(-2);

  const handle = async () => {
    if (props.permission !== 'granted') return props.onRequestMic();
    if (props.isRecording) return props.onStopRecording();
    return props.onStartRecording();
  };

  return (
    <div className="space-y-5 animate-result-enter">
      <SectionTitle
        title={isContinueTurn ? '이어서 한마디 더 해볼까?' : '그림 친구에게 말을 걸어볼까?'}
        description={
          isContinueTurn
            ? '방금 만난 같은 친구가 네 말을 기다리고 있어.'
            : '한마디만 들려줘도 친구가 목소리를 기억하고 답해줄 거야.'
        }
      />

      <div className="space-y-2">
        <CapturePreviewCard imageUrl={props.imageUrl} emptyMessage="여기에 네 그림 친구가 나타날 거야" />
        <p className="text-xs text-[#9A8F83]">{isContinueTurn ? '같은 친구에게 이어서 말을 걸어보자.' : '이 그림 친구에게 직접 말을 걸어보자.'}</p>
      </div>

      {isContinueTurn && latest.length > 0 && (
        <div className="space-y-2 rounded-[22px] border border-[#EFE7DC] bg-white/80 px-4 py-4">
          <p className="text-xs font-semibold tracking-wide text-[#8B8177]">방금 나눈 말</p>
          <div className="space-y-2">
            {latest.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`rounded-2xl px-3 py-2.5 text-sm leading-relaxed ${
                    isUser ? 'bg-[#F7F2EC] text-[#4A433E]' : 'bg-[#FFF7E8] text-[#3F3933]'
                  }`}
                >
                  <p className="mb-1 text-[11px] font-semibold text-[#8B8177]">{isUser ? '내가 한 말' : '친구가 한 말'}</p>
                  <p>{m.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <NanaBubble
        message={isContinueTurn ? '좋아, 이번엔 같은 친구가 이어서 대답해줄 거야.' : '짧게 말해줘도 충분해! 친구가 귀 기울이고 있어.'}
        variant="thinking"
      />

      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#8B8177]">이렇게 말해봐도 좋아</p>
        <ExampleSpeechChips items={COPY.exampleSpeech} />
      </div>

      <div className="flex justify-center pt-1">
        <RecordButton isRecording={props.isRecording} onClick={handle} />
      </div>

      <AudioLevelIndicator active={props.isRecording} />

      <SecondaryButton onClick={props.onBack}>{props.permission === 'granted' ? (isContinueTurn ? '결과 화면으로 돌아가기' : '그림 다시 보기') : '뒤로'}</SecondaryButton>

      {props.errorMessage && <p className="rounded-2xl bg-[#FFF5F2] px-4 py-3 text-sm text-[#A55445]">{props.errorMessage}</p>}
    </div>
  );
}
