import { SectionTitle } from '@/components/common/section-title';
import { CapturePreviewCard } from '@/components/media/capture-preview-card';
import { CharacterCard } from './character-card';
import { AudioPlayer } from './audio-player';
import { ResultActions } from './result-actions';
import { CharacterCard as T } from '@/types/character';
import { NanaBubble } from '@/components/nana/nana-bubble';
import type { ConversationMessage } from '@/stores/conversation-store';
import { RecentConversationCard } from './recent-conversation-card';

export function ResultScreen({ imageUrl, character, assistantText, audioUrl, recentMessages, onTalkAgain, onRestart }: { imageUrl: string; character: T; assistantText: string; audioUrl?: string | null; recentMessages?: ConversationMessage[]; onTalkAgain: () => void; onRestart: () => void; }) {
  const latest = (recentMessages ?? []).slice(-2);

  return (
    <div className="space-y-5 animate-result-enter">
      <SectionTitle title="짜잔! 그림 친구를 만났어" description="네 그림이 살아나서, 지금 이렇게 인사하고 있어." />

      <div className="space-y-2.5">
        <p className="text-xs font-semibold tracking-wide text-[#8B8177]">내 그림</p>
        <CapturePreviewCard imageUrl={imageUrl} />
        <p className="text-xs text-[#9A8F83]">지금 깨어난 그림 친구의 모습</p>
      </div>

      <CharacterCard character={character} assistantText={assistantText} />
      <AudioPlayer audioUrl={audioUrl} />
      <RecentConversationCard messages={latest} />

      <div className="pt-1">
        <ResultActions onTalkAgain={onTalkAgain} onRestart={onRestart} />
      </div>

      <div className="pt-0.5">
        <NanaBubble message="우와! 정말 멋진 친구가 깨어났어." variant="cheer" size="sm" />
      </div>
    </div>
  );
}
