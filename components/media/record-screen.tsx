import { SectionTitle } from '@/components/common/section-title';
import { SecondaryButton } from '@/components/common/secondary-button';
import { RecordButton } from './record-button';
import { ExampleSpeechChips } from './example-speech-chips';
import { AudioLevelIndicator } from './audio-level-indicator';
import { COPY } from '@/lib/constants/copy';
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
            ? '같은 친구가 네 말을 기다리고 있어.'
            : '한마디만 들려줘도 친구가 목소리를 기억하고 답해줄 거야.'
        }
      />

      {/* 이전 대화 맥락 — continue_turn에서 메신저 스타일로 표시 */}
      {isContinueTurn && latest.length > 0 && (
        <div className="space-y-2 rounded-[22px] border border-[#EFE7DC] bg-white/80 px-4 py-4">
          <p className="text-xs font-semibold tracking-wide text-[#8B8177]">방금 나눈 대화</p>
          <div className="space-y-2">
            {latest.filter((m) => m.text.trim() !== '...').map((m) => {
              const isUser = m.role === 'user';
              return (
                <div key={m.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-[18px] px-3.5 py-2.5 text-sm leading-relaxed ${
                      isUser
                        ? 'rounded-br-[6px] bg-[#F0EBE5] text-[#4A433E]'
                        : 'rounded-bl-[6px] bg-[#FFF7E8] text-[#3F3933]'
                    }`}
                  >
                    <p>{m.text}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="pt-1 text-center text-[11px] text-[#B5A88D]">
            ↓ 여기에 이어서 말해봐
          </p>
        </div>
      )}

      {/* 첫 턴일 때만 그림 미리보기 */}
      {!isContinueTurn && (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <img
              src={props.imageUrl}
              alt="그림 친구"
              className="h-16 w-16 rounded-[16px] border border-[#F2ECE6] object-cover shadow-[0_4px_12px_rgba(103,95,89,0.08)]"
            />
            <p className="text-sm text-[#9A8F83]">이 그림 친구에게 직접 말을 걸어보자.</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs font-semibold text-[#8B8177]">이렇게 말해봐도 좋아</p>
        <ExampleSpeechChips items={COPY.exampleSpeech} />
      </div>

      <div className="flex flex-col items-center gap-3 pt-1">
        <RecordButton isRecording={props.isRecording} onClick={handle} />
        <p className="text-xs text-[#B5A88D]">
          {props.isRecording ? '말이 끝나면 다시 눌러줘' : '버튼을 누르고 말해봐'}
        </p>
      </div>

      <AudioLevelIndicator active={props.isRecording} />

      <SecondaryButton onClick={props.onBack}>
        {props.permission === 'granted' ? (isContinueTurn ? '결과 화면으로 돌아가기' : '그림 다시 보기') : '뒤로'}
      </SecondaryButton>

      {props.errorMessage && <p className="rounded-2xl bg-[#FFF5F2] px-4 py-3 text-sm text-[#A55445]">{props.errorMessage}</p>}
    </div>
  );
}
