import { SYSTEM_PROMPT } from './prompts';

export type KananaInputMode = 'image_only' | 'audio_only' | 'image_audio';

interface BuildKananaPayloadParams {
  imageBase64?: string;
  imageMimeType?: string;
  audioBase64?: string;
  audioMimeType?: string;
  text?: string;
  mode?: KananaInputMode;
}

export function getDefaultTextByMode(mode: KananaInputMode): string {
  if (mode === 'image_only') {
    return '이 이미지에 무엇이 보이는지 짧게 설명해줘.';
  }
  if (mode === 'audio_only') {
    return '방금 사용자가 한 말을 가능한 그대로 한국어로 적어줘. 뜻을 바꾸거나 요약하지 말고, 들은 문장을 최대한 원문에 가깝게 한 문장으로 써줘.';
  }

  return '이미지 속 친구가 되어, 방금 사용자의 말에 답해줘. 너는 그림 속 캐릭터다. 절대 카나나라고 소개하지 마. 사용자의 마지막 말에 직접 반응해라.';
}

export function buildKananaPayload(params: BuildKananaPayloadParams) {
  const {
    imageBase64,
    imageMimeType,
    audioBase64,
    // 호환성을 위해 유지(현재는 고정 wav 전송)
    audioMimeType: _audioMimeType,
    text,
    mode = 'image_audio',
  } = params;

  const userText = text?.trim() || getDefaultTextByMode(mode);

  const content: Array<Record<string, unknown>> = [{ type: 'text', text: userText }];

  if ((mode === 'image_only' || mode === 'image_audio') && imageBase64 && imageMimeType) {
    const imageDataUri = `data:${imageMimeType};base64,${imageBase64}`;
    content.push({
      type: 'image_url',
      image_url: { url: imageDataUri },
    });
  }

  if ((mode === 'audio_only' || mode === 'image_audio') && audioBase64) {
    content.push({
      type: 'input_audio',
      input_audio: {
        data: audioBase64,
        format: 'wav',
      },
    });
  }

  return {
    model: 'kanana-o',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content,
      },
    ],
    modalities: ['text', 'audio'],
  };
}
