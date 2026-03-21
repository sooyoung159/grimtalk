import { PrimaryButton } from '@/components/common/primary-button';
import { SecondaryButton } from '@/components/common/secondary-button';

export function ResultActions({ onTalkAgain, onRestart }: { onTalkAgain: () => void; onRestart: () => void }) {
  return <div className="space-y-3"><PrimaryButton onClick={onTalkAgain}>다시 말 걸기</PrimaryButton><SecondaryButton onClick={onRestart}>새 그림으로 해보기</SecondaryButton></div>;
}
