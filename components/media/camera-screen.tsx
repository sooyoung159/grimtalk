import { SectionTitle } from '@/components/common/section-title';
import { PrimaryButton } from '@/components/common/primary-button';
import { SecondaryButton } from '@/components/common/secondary-button';
import { CameraFrame } from './camera-frame';
import { NanaBubble } from '@/components/nana/nana-bubble';

export function CameraScreen(props: {
  permission: 'idle' | 'granted' | 'denied'; isCameraReady: boolean; videoRef: React.RefObject<HTMLVideoElement | null>; errorMessage?: string | null;
  onRequestCamera: () => Promise<void> | void; onCapture: () => Promise<void> | void; onBack: () => void;
}) {
  return <div className="space-y-5">
    <SectionTitle title="그림을 보여줘!" description="스케치북을 카메라 가까이에 보여주면 친구를 더 잘 찾을 수 있어." />
    <NanaBubble message="우와! 어떤 그림 친구가 숨어 있을까?" />
    <CameraFrame videoRef={props.videoRef} ready={props.isCameraReady} />
    {props.permission !== 'granted' ? <PrimaryButton onClick={props.onRequestCamera}>카메라 켜기</PrimaryButton> : <PrimaryButton onClick={props.onCapture}>찰칵 찍기</PrimaryButton>}
    <SecondaryButton onClick={props.onBack}>뒤로</SecondaryButton>
    {props.errorMessage && <p className="text-sm text-[#A55445]">{props.errorMessage}</p>}
  </div>;
}
