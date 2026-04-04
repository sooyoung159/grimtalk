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
import { useKananaRequest } from '@/hooks/use-kanana-request';
import { KananaInputMode } from '@/lib/kanana/build-request';
import { useSessionStore } from '@/stores/session-store';
import { useConversationStore } from '@/stores/conversation-store';
import { getDefaultTextByMode } from '@/lib/kanana/build-request';

function makeTranscriptKey(audioFile: File): string {
  return [audioFile.name, audioFile.size, audioFile.type, audioFile.lastModified].join(':');
}

export default function HomePage() {
  const step = useSessionStore((st) => st.step);
  const capturedImage = useSessionStore((st) => st.capturedImage);
  const currentCharacter = useSessionStore((st) => st.currentCharacter);
  const fixedCharacterProfile = useSessionStore((st) => st.fixedCharacterProfile);
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
  const updateLastAssistantTurn = useConversationStore((st) => st.updateLastAssistantTurn);
  const recentUserText = useConversationStore((st) => st.recentUserText);
  const recentAssistantText = useConversationStore((st) => st.recentAssistantText);
  const messages = useConversationStore((st) => st.messages);
  const [mode, setMode] = useState<KananaInputMode>('image_audio');

  const extractUserUtterance = async (audioFile?: File): Promise<string | null> => {
    if (!audioFile) return null;

    const key = makeTranscriptKey(audioFile);
    if (recentTranscriptKey === key && recentTranscript !== null) {
      if (recentTranscript.trim()) return recentTranscript;
    }

    // 모바일 등에서 Web Speech API가 동작하지 않을 경우 
    // Kanana API 우회 호출을 하지 않고(API 사용량/속도 최적화) 고정 문구로 넘깁니다.
    setRecentTranscriptCache({ key, transcript: '' });
    return null;
  };

  const submitFirstTurn = async (payload: { image?: File; audioFile?: File }) => {
    setStep('loading');
    setSubmitting(true);
    try {
      const baseText = getDefaultTextByMode(mode, 'first_turn');
      const extractedUserUtterance = await extractUserUtterance(payload.audioFile);

      const result = await kanana.submitFirstTurn({ image: payload.image, audio: payload.audioFile, mode, text: baseText });
      setResult({ character: result.character, assistantText: result.assistantText, assistantAudioUrl: result.audioUrl });
      addTurn({
        userText: extractedUserUtterance ?? (mode === 'image_only' ? '이미지 설명 요청' : '그림 친구에게 첫 말을 걸었어.'),
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

  const submitContinueTurn = async (audioFile: File) => {
    if (!fixedCharacterProfile) return;

    setStep('loading');
    setSubmitting(true);
    try {
      const extractedUserUtterance = await extractUserUtterance(audioFile);
      const normalizedUserText = extractedUserUtterance ?? '방금 친구에게 다시 말을 걸었어.';

      addTurn({
        userText: normalizedUserText,
        assistantText: '...',
        assistantAudioUrl: null,
      });

      const result = await kanana.submitContinueTurn({
        audio: audioFile,
        character: fixedCharacterProfile,
        previousUserText: normalizedUserText,
        previousAssistantText: recentAssistantText,
      });

      setResult({ character: fixedCharacterProfile, assistantText: result.assistantText, assistantAudioUrl: result.audioUrl });
      updateLastAssistantTurn({
        assistantText: result.assistantText,
        assistantAudioUrl: result.audioUrl,
      });
      setStep('result');
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : '친구가 말을 잇지 못했어. 한 번 더 해볼까?');
      setStep('record');
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

  const handlePickFromLibrary = () => {
    media.openFilePicker();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = await media.handleFileChange(event);
    if (!selected) return;
    setCapturedImage(selected);
    setStep('preview');
  };

  const handlePreviewContinue = async () => {
    if (mode === 'image_only') {
      if (!capturedImage.file) return;
      await submitFirstTurn({ image: capturedImage.file });
      return;
    }
    setStep('record');
  };

  const handleStopRecording = async () => {
    const recorded = await audio.stopRecording();
    if (!recorded) return;

    setRecordedAudio(recorded);

    if (recorded.transcript) {
      const key = makeTranscriptKey(recorded.file);
      setRecentTranscriptCache({ key, transcript: recorded.transcript });
    }

    if (fixedCharacterProfile) {
      await submitContinueTurn(recorded.file);
      return;
    }

    if (mode === 'audio_only') {
      await submitFirstTurn({ audioFile: recorded.file });
      return;
    }

    if (!capturedImage.file) return;
    await submitFirstTurn({ image: capturedImage.file, audioFile: recorded.file });
  };

  const handleStart = () => {
    setStep(mode === 'audio_only' ? 'record' : 'camera');
  };

  const showModeToggle = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_KANANA_MODE === 'mock';

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
      {step === 'camera' && (
        <CameraScreen
          permission={media.permission}
          isCameraReady={media.isReady}
          videoRef={media.videoRef}
          fileInputRef={media.fileInputRef}
          errorMessage={media.error ?? errorMessage}
          onRequestCamera={media.requestCamera}
          onCapture={handleCapture}
          onPickFromLibrary={handlePickFromLibrary}
          onFileChange={handleFileChange}
          onBack={() => setStep('landing')}
        />
      )}
      {step === 'preview' && capturedImage.previewUrl && <PreviewScreen imageUrl={capturedImage.previewUrl} onRetake={() => setStep('camera')} onContinue={handlePreviewContinue} />}
      {step === 'record' && (mode === 'audio_only' || capturedImage.previewUrl || fixedCharacterProfile) && (
        <RecordScreen
          imageUrl={capturedImage.previewUrl ?? '/logo.svg'}
          permission={audio.permission}
          isRecording={audio.isRecording}
          errorMessage={audio.error ?? errorMessage}
          mode={fixedCharacterProfile ? 'continue_turn' : 'first_turn'}
          recentMessages={messages}
          onRequestMic={audio.requestMic}
          onStartRecording={audio.startRecording}
          onStopRecording={handleStopRecording}
          onBack={() => setStep(fixedCharacterProfile ? 'result' : mode === 'audio_only' ? 'landing' : 'preview')}
        />
      )}
      {step === 'loading' && <LoadingScreen imageUrl={capturedImage.previewUrl} turnMode={fixedCharacterProfile && messages.length > 0 ? 'continue_turn' : 'first_turn'} />}
      {step === 'result' && currentCharacter && (
        <ResultScreen
          imageUrl={capturedImage.previewUrl}
          character={currentCharacter}
          assistantText={assistantText}
          audioUrl={assistantAudioUrl}
          recentMessages={messages}
          onTalkAgain={() => setStep('record')}
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
