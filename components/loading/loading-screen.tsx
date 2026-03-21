import { SectionTitle } from '@/components/common/section-title';
import { NanaThinking } from '@/components/nana/nana-thinking';
import { LoadingStars } from './loading-stars';

export function LoadingScreen({ message = '잠깐만, 그림 친구가 깨어나고 있어!' }: { imageUrl?: string | null; message?: string }) {
  return <div className="space-y-6 py-10"><NanaThinking /><SectionTitle title={message} description="무슨 말을 할지 생각 중이야." align="center" /><LoadingStars /></div>;
}
