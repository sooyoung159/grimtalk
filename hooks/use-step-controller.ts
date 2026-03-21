'use client';
import { useSessionStore } from '@/stores/session-store';

export function useStepController() {
  const step = useSessionStore((s) => s.step);
  const setStep = useSessionStore((s) => s.setStep);
  return { step, setStep };
}
