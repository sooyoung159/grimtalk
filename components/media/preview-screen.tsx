import { SectionTitle } from '@/components/common/section-title';
import { PrimaryButton } from '@/components/common/primary-button';
import { SecondaryButton } from '@/components/common/secondary-button';
import { CapturePreviewCard } from './capture-preview-card';
import { NanaBubble } from '@/components/nana/nana-bubble';

export function PreviewScreen({ imageUrl, onRetake, onContinue }: { imageUrl: string; onRetake: () => void; onContinue: () => void; }) {
  return <div className="space-y-5"><SectionTitle title="이 그림으로 할까?" description="친구가 잘 보이면 그대로 계속해도 좋아!" /><CapturePreviewCard imageUrl={imageUrl} /><NanaBubble message="좋아! 이제 이 친구에게 말을 걸어보자." /><PrimaryButton onClick={onContinue}>이 그림으로 계속</PrimaryButton><SecondaryButton onClick={onRetake}>다시 찍기</SecondaryButton></div>;
}
