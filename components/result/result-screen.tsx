import { CapturePreviewCard } from '@/components/media/capture-preview-card';
import { CharacterCard } from './character-card';
import { AudioPlayer } from './audio-player';
import { ResultActions } from './result-actions';
import { CharacterCard as T } from '@/types/character';
import { NanaBubble } from '@/components/nana/nana-bubble';
import type { ConversationMessage } from '@/stores/conversation-store';
import { RecentConversationCard } from './recent-conversation-card';

export function ResultScreen({ imageUrl, character, assistantText, audioUrl, recentMessages, onTalkAgain, onRestart }: { imageUrl?: string | null; character: T; assistantText: string; audioUrl?: string | null; recentMessages?: ConversationMessage[]; onTalkAgain: () => void; onRestart: () => void; }) {
  const latest = (recentMessages ?? []).slice(-2);

  return (
    <div className="space-y-4 animate-result-enter">
      <div className="space-y-2">
        <h2 className="text-[26px] font-bold leading-tight text-[#2F2A26]">{recentMessages && recentMessages.length > 2 ? '네 그림 친구가 이어서 대답했어' : '네 그림 친구가 처음 인사했어'}</h2>
      </div>

      <div className="space-y-3">
        <CapturePreviewCard imageUrl={imageUrl} emptyMessage="여기에 네 그림 친구가 나타날 거야" />
        <NanaBubble message={recentMessages && recentMessages.length > 2 ? '같은 그림 친구가 네 말에 이어서 답했어.' : '네 그림 친구가 방금 말을 걸었어.'} variant="cheer" size="sm" />
      </div>

      <div className="space-y-3">
        <CharacterCard character={character} assistantText={assistantText} />
        <AudioPlayer audioUrl={audioUrl} />
      </div>

      <div className="pt-1">
        <ResultActions onTalkAgain={onTalkAgain} onRestart={onRestart} />
      </div>

      <div className="pt-1">
        <RecentConversationCard messages={latest} />
      </div>
    </div>
  );
}
