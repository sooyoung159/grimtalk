import { SectionTitle } from '@/components/common/section-title';
import { PrimaryButton } from '@/components/common/primary-button';
import { SecondaryButton } from '@/components/common/secondary-button';
import { CameraFrame } from './camera-frame';
import { NanaBubble } from '@/components/nana/nana-bubble';

export function CameraScreen(props: {
  permission: 'idle' | 'granted' | 'denied'; isCameraReady: boolean; videoRef: React.RefObject<HTMLVideoElement | null>; errorMessage?: string | null;
  onRequestCamera: () => Promise<void> | void; onCapture: () => Promise<void> | void; onBack: () => void;
}) {
  const cameraActionLabel = props.permission !== 'granted' ? '카메라 열기' : '이 그림 찍기';

  return (
    <div className="space-y-5 animate-result-enter">
      <SectionTitle title="그림을 보여줘!" description="그림이 또렷하게 보이면, 친구를 더 쉽게 깨울 수 있어." />
      <NanaBubble message="그림을 가운데로 맞춰서 보여줘. 준비되면 찰칵 찍어보자!" />

      <CameraFrame videoRef={props.videoRef} ready={props.isCameraReady} />

      <div className="space-y-3">
        <PrimaryButton onClick={props.permission !== 'granted' ? props.onRequestCamera : props.onCapture}>{cameraActionLabel}</PrimaryButton>
        <SecondaryButton onClick={props.onBack}>처음으로</SecondaryButton>
      </div>

      {props.errorMessage && <p className="rounded-2xl bg-[#FFF5F2] px-4 py-3 text-sm text-[#A55445]">{props.errorMessage}</p>}
    </div>
  );
}
