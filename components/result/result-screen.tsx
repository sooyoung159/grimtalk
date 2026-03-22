import { SectionTitle } from '@/components/common/section-title';
import { CapturePreviewCard } from '@/components/media/capture-preview-card';
import { CharacterCard } from './character-card';
import { AudioPlayer } from './audio-player';
import { ResultActions } from './result-actions';
import { CharacterCard as T } from '@/types/character';
import { NanaBubble } from '@/components/nana/nana-bubble';
import type { ConversationMessage } from '@/stores/conversation-store';

export function ResultScreen({ imageUrl, character, assistantText, audioUrl, recentMessages, onTalkAgain, onRestart }: { imageUrl: string; character: T; assistantText: string; audioUrl?: string | null; recentMessages?: ConversationMessage[]; onTalkAgain: () => void; onRestart: () => void; onReplayAudio?: () => void; }) {
  const latest = (recentMessages ?? []).slice(-2);

  return <div className="space-y-5"><SectionTitle title="짜잔! 그림 친구를 만났어" description="네 그림 속 친구가 이렇게 말하고 있어!" /><CapturePreviewCard imageUrl={imageUrl} /><CharacterCard character={character} assistantText={assistantText} /><AudioPlayer audioUrl={audioUrl} />{latest.length > 0 && <div className="rounded-2xl border border-[#EFE7DC] bg-white p-3"><p className="mb-2 text-xs font-semibold text-[#8B8177]">방금 대화</p><div className="space-y-1">{latest.map((m) => <p key={m.id} className="text-xs text-[#4A433E]"><span className="font-semibold mr-1">{m.role === 'user' ? '나' : '친구'}</span>{m.text}</p>)}</div></div>}<ResultActions onTalkAgain={onTalkAgain} onRestart={onRestart} /><NanaBubble message="우와! 정말 멋진 친구가 깨어났어." variant="cheer" size="sm" /></div>;
}
