import { SectionTitle } from '@/components/common/section-title';
import { PrimaryButton } from '@/components/common/primary-button';
import { SecondaryButton } from '@/components/common/secondary-button';
import { CapturePreviewCard } from './capture-preview-card';
import { NanaBubble } from '@/components/nana/nana-bubble';

export function PreviewScreen({ imageUrl, onRetake, onContinue }: { imageUrl: string; onRetake: () => void; onContinue: () => void; }) {
  return (
    <div className="space-y-5 animate-result-enter">
      <SectionTitle title="좋아! 이 그림으로 시작해볼까?" description="그림이 잘 보이면 바로 다음 단계에서 친구에게 말을 걸 수 있어." />

      <div className="space-y-2">
        <CapturePreviewCard imageUrl={imageUrl} emptyMessage="여기에 네 그림이 나타날 거야" />
        <p className="text-xs text-[#9A8F83]">지금 고른 그림이야. 마음에 들면 그대로 이어가자.</p>
      </div>

      <NanaBubble message="좋아! 이제 이 친구에게 한마디만 해주면 깨어날 거야." />

      <div className="space-y-3">
        <PrimaryButton onClick={onContinue}>이 그림으로 계속하기</PrimaryButton>
        <SecondaryButton onClick={onRetake}>다른 그림 고르기</SecondaryButton>
      </div>
    </div>
  );
}
