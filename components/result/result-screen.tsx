import { SectionTitle } from '@/components/common/section-title';
import { CapturePreviewCard } from '@/components/media/capture-preview-card';
import { CharacterCard } from './character-card';
import { AudioPlayer } from './audio-player';
import { ResultActions } from './result-actions';
import { CharacterCard as T } from '@/types/character';
import { NanaBubble } from '@/components/nana/nana-bubble';

export function ResultScreen({ imageUrl, character, assistantText, audioUrl, onTalkAgain, onRestart }: { imageUrl: string; character: T; assistantText: string; audioUrl?: string | null; onTalkAgain: () => void; onRestart: () => void; onReplayAudio?: () => void; }) {
  return <div className="space-y-5"><SectionTitle title="짜잔! 그림 친구를 만났어" description="네 그림 속 친구가 이렇게 말하고 있어!" /><CapturePreviewCard imageUrl={imageUrl} /><CharacterCard character={character} assistantText={assistantText} /><AudioPlayer audioUrl={audioUrl} /><ResultActions onTalkAgain={onTalkAgain} onRestart={onRestart} /><NanaBubble message="우와! 정말 멋진 친구가 깨어났어." /></div>;
}
