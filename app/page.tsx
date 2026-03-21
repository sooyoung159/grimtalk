'use client';

import { useEffect, useState } from 'react';
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

export default function HomePage() {
  const s = useSessionStore();
  const media = useMediaCapture();
  const audio = useAudioRecorder();
  const kanana = useKananaRequest();
  const clearMessages = useConversationStore((st) => st.clearMessages);
  const [mode, setMode] = useState<KananaInputMode>('image_audio');

  useEffect(() => {
    s.setCameraPermission(media.permission);
    s.setCameraReady(media.isReady);
  }, [media.permission, media.isReady]);

  useEffect(() => {
    s.setMicPermission(audio.permission);
    s.setRecording(audio.isRecording);
  }, [audio.permission, audio.isRecording]);

  const submitByMode = async (payload: { image?: File; audioFile?: File }) => {
    s.setStep('loading');
    s.setSubmitting(true);
    try {
      const result = await kanana.submitFirstTurn({ image: payload.image, audio: payload.audioFile, mode });
      s.setResult({ character: result.character, assistantText: result.assistantText, assistantAudioUrl: result.audioUrl });
      s.setStep('result');
    } catch (e) {
      s.setErrorMessage(e instanceof Error ? e.message : '친구를 깨우지 못했어. 한 번 더 해볼까?');
      s.setStep(mode === 'image_only' ? 'preview' : 'record');
    } finally {
      s.setSubmitting(false);
    }
  };

  const handleCapture = async () => {
    const captured = await media.captureFrame();
    if (!captured) return;
    s.setCapturedImage(captured);
    s.setStep('preview');
  };

  const handlePreviewContinue = async () => {
    if (mode === 'image_only') {
      if (!s.capturedImage.file) return;
      await submitByMode({ image: s.capturedImage.file });
      return;
    }
    s.setStep('record');
  };

  const handleStopRecording = async () => {
    const recorded = await audio.stopRecording();
    if (!recorded) return;

    s.setRecordedAudio(recorded);

    if (mode === 'audio_only') {
      await submitByMode({ audioFile: recorded.file });
      return;
    }

    if (!s.capturedImage.file) return;
    await submitByMode({ image: s.capturedImage.file, audioFile: recorded.file });
  };

  const handleStart = () => {
    s.setStep(mode === 'audio_only' ? 'record' : 'camera');
  };

  const showModeToggle = process.env.NODE_ENV !== 'production';

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

      {s.step === 'landing' && <LandingScreen onStart={handleStart} />}
      {s.step === 'camera' && <CameraScreen permission={s.cameraPermission} isCameraReady={s.isCameraReady} videoRef={media.videoRef} errorMessage={media.error ?? s.errorMessage} onRequestCamera={media.requestCamera} onCapture={handleCapture} onBack={() => s.setStep('landing')} />}
      {s.step === 'preview' && s.capturedImage.previewUrl && <PreviewScreen imageUrl={s.capturedImage.previewUrl} onRetake={() => s.setStep('camera')} onContinue={handlePreviewContinue} />}
      {s.step === 'record' && (mode === 'audio_only' || s.capturedImage.previewUrl) && (
        <RecordScreen
          imageUrl={s.capturedImage.previewUrl ?? '/logo.svg'}
          permission={s.micPermission}
          isRecording={s.isRecording}
          errorMessage={audio.error ?? s.errorMessage}
          onRequestMic={audio.requestMic}
          onStartRecording={audio.startRecording}
          onStopRecording={handleStopRecording}
          onBack={() => s.setStep(mode === 'audio_only' ? 'landing' : 'preview')}
        />
      )}
      {s.step === 'loading' && <LoadingScreen imageUrl={s.capturedImage.previewUrl} />}
      {s.step === 'result' && s.currentCharacter && (
        <ResultScreen
          imageUrl={s.capturedImage.previewUrl ?? '/logo.svg'}
          character={s.currentCharacter}
          assistantText={s.assistantText}
          audioUrl={s.assistantAudioUrl}
          onTalkAgain={() => s.setStep(mode === 'audio_only' ? 'record' : mode === 'image_only' ? 'preview' : 'record')}
          onRestart={() => {
            s.resetSession();
            clearMessages();
          }}
        />
      )}
      {s.step === 'conversation' && <ConversationScreen />}
    </AppShell>
  );
}
