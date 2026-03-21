'use client';

import { create } from 'zustand';
import { SessionStore } from '@/types/session';

const initial = {
  step: 'landing',
  cameraPermission: 'idle',
  micPermission: 'idle',
  isCameraReady: false,
  isRecording: false,
  isSubmitting: false,
  capturedImage: { file: null, previewUrl: null },
  recordedAudio: { file: null, previewUrl: null, durationMs: null },
  currentCharacter: null,
  assistantText: '',
  assistantAudioUrl: null,
  errorMessage: null,
} as const;

export const useSessionStore = create<SessionStore>((set) => ({
  ...initial,
  setStep: (step) => set({ step }),
  setCameraPermission: (cameraPermission) => set({ cameraPermission }),
  setMicPermission: (micPermission) => set({ micPermission }),
  setCameraReady: (isCameraReady) => set({ isCameraReady }),
  setRecording: (isRecording) => set({ isRecording }),
  setSubmitting: (isSubmitting) => set({ isSubmitting }),
  setCapturedImage: (capturedImage) => set({ capturedImage }),
  setRecordedAudio: (recordedAudio) => set({ recordedAudio }),
  setResult: ({ character, assistantText, assistantAudioUrl }) => set({ currentCharacter: character, assistantText, assistantAudioUrl }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  resetSession: () => set({ ...initial }),
}));
