import { CharacterCard } from './character';

export type AppStep = 'landing' | 'camera' | 'preview' | 'record' | 'loading' | 'result' | 'conversation';

export interface CapturedImageState {
  file: File | null;
  previewUrl: string | null;
}

export interface RecordedAudioState {
  file: File | null;
  previewUrl: string | null;
  durationMs: number | null;
}

export interface SessionStore {
  step: AppStep;
  cameraPermission: 'idle' | 'granted' | 'denied';
  micPermission: 'idle' | 'granted' | 'denied';
  isCameraReady: boolean;
  isRecording: boolean;
  isSubmitting: boolean;
  capturedImage: CapturedImageState;
  recordedAudio: RecordedAudioState;
  currentCharacter: CharacterCard | null;
  assistantText: string;
  assistantAudioUrl: string | null;
  errorMessage: string | null;
  setStep: (step: AppStep) => void;
  setCameraPermission: (value: SessionStore['cameraPermission']) => void;
  setMicPermission: (value: SessionStore['micPermission']) => void;
  setCameraReady: (value: boolean) => void;
  setRecording: (value: boolean) => void;
  setSubmitting: (value: boolean) => void;
  setCapturedImage: (payload: CapturedImageState) => void;
  setRecordedAudio: (payload: RecordedAudioState) => void;
  setResult: (payload: { character: CharacterCard; assistantText: string; assistantAudioUrl: string | null }) => void;
  setErrorMessage: (value: string | null) => void;
  resetSession: () => void;
}
