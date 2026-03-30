import { ChangeEvent } from 'react';
import { SectionTitle } from '@/components/common/section-title';
import { PrimaryButton } from '@/components/common/primary-button';
import { SecondaryButton } from '@/components/common/secondary-button';
import { CameraFrame } from './camera-frame';
import { NanaBubble } from '@/components/nana/nana-bubble';

export function CameraScreen(props: {
  permission: 'idle' | 'granted' | 'denied';
  isCameraReady: boolean;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  fileInputRef?: React.RefObject<HTMLInputElement | null>;
  errorMessage?: string | null;
  onRequestCamera: () => Promise<void> | void;
  onCapture: () => Promise<void> | void;
  onPickFromLibrary: () => void;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => Promise<void> | void;
  onBack: () => void;
}) {
  const cameraActionLabel = props.permission !== 'granted' ? '카메라 열기' : '이 그림 찍기';
  const handleCameraAction = props.permission !== 'granted' ? props.onRequestCamera : props.onCapture;

  return (
    <div className="space-y-5 animate-result-enter">
      <SectionTitle title="그림을 보여줘!" description="지금 찍어도 되고, 앨범에 있는 그림 사진을 가져와도 좋아." />
      <NanaBubble message="그림을 가운데로 맞춰서 보여줘. 이미 찍어둔 그림이라면 앨범에서 바로 가져와도 돼!" />

      <CameraFrame videoRef={props.videoRef} ready={props.isCameraReady} />

      <input ref={props.fileInputRef as React.RefObject<HTMLInputElement>} type="file" accept="image/*" className="hidden" onChange={props.onFileChange} />

      <div className="space-y-3">
        <PrimaryButton onClick={handleCameraAction}>{cameraActionLabel}</PrimaryButton>
        <SecondaryButton onClick={props.onPickFromLibrary}>앨범에서 가져오기</SecondaryButton>
        <SecondaryButton onClick={props.onBack}>처음으로</SecondaryButton>
      </div>

      {props.errorMessage && <p className="rounded-2xl bg-[#FFF5F2] px-4 py-3 text-sm text-[#A55445]">{props.errorMessage}</p>}
    </div>
  );
}
