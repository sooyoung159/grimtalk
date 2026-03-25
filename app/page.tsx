'use client';

import { useState } from 'react';
import { AppShell } from '@/components/common/app-shell';
import { LandingScreen } from '@/components/landing/landing-screen';
import { CameraScreen } from '@/components/media/camera-screen';
import { PreviewScreen } from '@/components/media/preview-screen';
import { RecordScreen } from '@/components/media/record-screen';
import { LoadingScreen } from '@/components/loading/loading-screen';
import { ResultScreen } from '@/components/result/result-screen';
import { ConversationScreen } from '@/components/conversation/conversation-screen';
import { useMediaCapture } from '@/hooks/use-media-capture';
import { useAudioRecorder } from '@/hooks/use-audio-recorder';
import { useKananaRequest, KananaInputMode } from '@/hooks/use-kanana-request';
import { useSessionStore } from '@/stores/session-store';
import { useConversationStore } from '@/stores/conversation-store';
import { getDefaultTextByMode } from '@/lib/kanana/build-request';

function trimContext(text: string | null, max: number): string | null {
  if (!text) return null;
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}…`;
}

function composeTurnText(mode: KananaInputMode, baseText: string, previousUser: string | null, previousAssistant: string | null): string {
  const compactUser = trimContext(previousUser, 80);
  const compactAssistant = trimContext(previousAssistant, 120);

  const sections: string[] = [
    `이번 턴 목표:\n${baseText}`,
    '이번 턴 우선 규칙:\n- 직전 대화는 참고만 하고, 지금 사용자의 마지막 발화(특히 방금 음성)에 먼저 반응해줘.\n- 이미 같은 친구로 대화 중이면 자기소개를 반복하지 마.',
  ];

  if (compactUser && compactAssistant) {
    sections.splice(1, 0, ['최근 1턴 참고:', `- 사용자: ${compactUser}`, `- 친구: ${compactAssistant}`].join('\n'));
  }

  if (mode === 'image_audio') {
    sections.push('추가 규칙:\n- 이미지 분위기를 유지하되, 이번 발화 반응을 가장 먼저 보여줘.');
  }

  return sections.join('\n\n');
}

function makeTranscriptKey(audioFile: File): string {
  return [audioFile.name, audioFile.size, audioFile.type, audioFile.lastModified].join(':');
}

export default function HomePage() {
  const step = useSessionStore((st) => st.step);
  const capturedImage = useSessionStore((st) => st.capturedImage);
  const currentCharacter = useSessionStore((st) => st.currentCharacter);
  const assistantText = useSessionStore((st) => st.assistantText);
  const assistantAudioUrl = useSessionStore((st) => st.assistantAudioUrl);
  const errorMessage = useSessionStore((st) => st.errorMessage);
  const recentTranscript = useSessionStore((st) => st.recentTranscript);
  const recentTranscriptKey = useSessionStore((st) => st.recentTranscriptKey);

  const setStep = useSessionStore((st) => st.setStep);
  const setSubmitting = useSessionStore((st) => st.setSubmitting);
  const setResult = useSessionStore((st) => st.setResult);
  const setErrorMessage = useSessionStore((st) => st.setErrorMessage);
  const setCapturedImage = useSessionStore((st) => st.setCapturedImage);
  const setRecordedAudio = useSessionStore((st) => st.setRecordedAudio);
  const setRecentTranscriptCache = useSessionStore((st) => st.setRecentTranscriptCache);
  const resetSession = useSessionStore((st) => st.resetSession);

  const media = useMediaCapture();
  const audio = useAudioRecorder();
  const kanana = useKananaRequest();
  const clearMessages = useConversationStore((st) => st.clearMessages);
  const addTurn = useConversationStore((st) => st.addTurn);
  const recentUserText = useConversationStore((st) => st.recentUserText);
  const recentAssistantText = useConversationStore((st) => st.recentAssistantText);
  const messages = useConversationStore((st) => st.messages);
  const [mode, setMode] = useState<KananaInputMode>('image_audio');

  const extractUserUtterance = async (audioFile?: File): Promise<string | null> => {
    if (!audioFile) return null;

    const key = makeTranscriptKey(audioFile);

    if (recentTranscriptKey === key && recentTranscript) {
      return recentTranscript;
    }

    try {
      const transcript = await kanana.submitFirstTurn({
        audio: audioFile,
        mode: 'audio_only',
      });
      const t = transcript.assistantText?.trim();
      if (!t) return null;

      setRecentTranscriptCache({ key, transcript: t });
      return t;
    } catch {
      return null;
    }
  };

  const submitByMode = async (payload: { image?: File; audioFile?: File }) => {
    setStep('loading');
    setSubmitting(true);
    try {
      const baseText = getDefaultTextByMode(mode);
      const requestText = composeTurnText(mode, baseText, recentUserText, recentAssistantText);

      const extractedUserUtterance = await extractUserUtterance(payload.audioFile);

      const result = await kanana.submitFirstTurn({ image: payload.image, audio: payload.audioFile, mode, text: requestText });
      setResult({ character: result.character, assistantText: result.assistantText, assistantAudioUrl: result.audioUrl });
      addTurn({
        userText: extractedUserUtterance ?? (mode === 'image_only' ? '이미지 설명 요청' : baseText),
        assistantText: result.assistantText,
        assistantAudioUrl: result.audioUrl,
      });
      setStep('result');
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '친구를 깨우지 못했어. 한 번 더 해볼까?');
      setStep(mode === 'image_only' ? 'preview' : 'record');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCapture = async () => {
    const captured = await media.captureFrame();
    if (!captured) return;
    setCapturedImage(captured);
    setStep('preview');
  };

  const handlePreviewContinue = async () => {
    if (mode === 'image_only') {
      if (!capturedImage.file) return;
      await submitByMode({ image: capturedImage.file });
      return;
    }
    setStep('record');
  };

  const handleStopRecording = async () => {
    const recorded = await audio.stopRecording();
    if (!recorded) return;

    setRecordedAudio(recorded);

    if (mode === 'audio_only') {
      await submitByMode({ audioFile: recorded.file });
      return;
    }

    if (!capturedImage.file) return;
    await submitByMode({ image: capturedImage.file, audioFile: recorded.file });
  };

  const handleStart = () => {
    setStep(mode === 'audio_only' ? 'record' : 'camera');
  };

  const isMockMode = process.env.NEXT_PUBLIC_KANANA_MODE === 'mock';
  const showModeToggle = process.env.NODE_ENV !== 'production' && isMockMode;

  return (
    <AppShell>
      {showModeToggle && (
        <div className="mb-3 flex gap-2 text-xs">
          {(['image_only', 'audio_only', 'image_audio'] as KananaInputMode[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded-full border px-3 py-1 ${mode === m ? 'bg-black text-white' : 'bg-white text-black'}`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {step === 'landing' && <LandingScreen onStart={handleStart} />}
      {step === 'camera' && <CameraScreen permission={media.permission} isCameraReady={media.isReady} videoRef={media.videoRef} errorMessage={media.error ?? errorMessage} onRequestCamera={media.requestCamera} onCapture={handleCapture} onBack={() => setStep('landing')} />}
      {step === 'preview' && capturedImage.previewUrl && <PreviewScreen imageUrl={capturedImage.previewUrl} onRetake={() => setStep('camera')} onContinue={handlePreviewContinue} />}
      {step === 'record' && (mode === 'audio_only' || capturedImage.previewUrl) && (
        <RecordScreen
          imageUrl={capturedImage.previewUrl ?? '/logo.svg'}
          permission={audio.permission}
          isRecording={audio.isRecording}
          errorMessage={audio.error ?? errorMessage}
          onRequestMic={audio.requestMic}
          onStartRecording={audio.startRecording}
          onStopRecording={handleStopRecording}
          onBack={() => setStep(mode === 'audio_only' ? 'landing' : 'preview')}
        />
      )}
      {step === 'loading' && <LoadingScreen imageUrl={capturedImage.previewUrl} />}
      {step === 'result' && currentCharacter && (
        <ResultScreen
          imageUrl={capturedImage.previewUrl ?? '/logo.svg'}
          character={currentCharacter}
          assistantText={assistantText}
          audioUrl={assistantAudioUrl}
          recentMessages={messages}
          onTalkAgain={() => setStep(mode === 'audio_only' ? 'record' : mode === 'image_only' ? 'preview' : 'record')}
          onRestart={() => {
            resetSession();
            clearMessages();
          }}
        />
      )}
      {step === 'conversation' && <ConversationScreen />}
    </AppShell>
  );
}
