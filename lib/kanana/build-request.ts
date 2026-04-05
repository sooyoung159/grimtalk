import { CharacterCard } from '@/types/character';
import { CONTINUE_TURN_SYSTEM_PROMPT, FIRST_TURN_SYSTEM_PROMPT } from './prompts';

export type KananaInputMode = 'image_only' | 'audio_only' | 'image_audio';
export type KananaTurnMode = 'first_turn' | 'continue_turn';

interface BuildKananaPayloadParams {
  imageBase64?: string;
  imageMimeType?: string;
  audioBase64?: string;
  audioMimeType?: string;
  text?: string;
  mode?: KananaInputMode;
  turnMode?: KananaTurnMode;
  character?: CharacterCard | null;
  previousUserText?: string | null;
  previousAssistantText?: string | null;
}

function trimContext(text: string | null | undefined, max: number): string | null {
  if (!text) return null;
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) return null;
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}…`;
}

function buildCharacterProfile(character?: CharacterCard | null): string | null {
  if (!character) return null;

  const lines = [
    '고정 캐릭터 프로필:',
    `- 이름: ${character.name}`,
    `- 정체: ${character.identity}`,
    `- 성격: ${character.traits.join(', ')}`,
    `- 목소리 톤: ${character.voiceTone}`,
    `- 첫 인사 톤 참고: ${character.greeting}`,
    `- 질문 톤 참고: ${character.question}`,
  ];

  return lines.join('\n');
}

export function getDefaultTextByMode(mode: KananaInputMode, turnMode: KananaTurnMode = 'first_turn'): string {
  if (mode === 'image_only') {
    return '이미지 속 친구의 관점에서, 방금 막 살아난 것처럼 짧고 따뜻하게 첫 인사를 건네줘. 설명보다 만남의 장면이 먼저 느껴지게 하고, 마지막엔 가벼운 질문 한 문장을 붙여줘.';
  }
  if (mode === 'audio_only' && turnMode === 'first_turn') {
    return '방금 사용자가 한 말을 가능한 그대로 한국어로 적어줘. 뜻을 바꾸거나 요약하지 말고, 들은 문장을 최대한 원문에 가깝게 한 문장으로 써줘.';
  }
  if (turnMode === 'continue_turn') {
    return [
      '이번 턴 목표: 이미 만난 같은 그림 친구로서, 방금 사용자의 말에 이어서 답해줘.',
      '느낌: 새 친구를 다시 만드는 것이 아니라, 같은 친구와 대화가 이어지는 느낌이어야 해.',
      '형식: 2~3문장, 짧고 따뜻하게, 마지막은 부담 없는 짧은 질문으로 끝내줘.',
    ].join('\n');
  }

  return [
    '이번 턴 목표: 이미지 속 친구가 되어, 방금 사용자의 말에 답해줘.',
    '느낌: 예쁜 정보 정리가 아니라, 막 살아난 그림 친구와의 첫 만남 장면처럼 느껴지게 해줘.',
    '우선순위: 직전 대화는 참고만 하고, 이번 마지막 발화에 먼저 반응해줘.',
    '형식: 2~4문장, 짧고 따뜻하게, 마지막은 부담 없는 질문으로 끝내줘.',
  ].join('\n');
}

export function buildKananaPayload(params: BuildKananaPayloadParams) {
  const {
    imageBase64,
    imageMimeType,
    audioBase64,
    audioMimeType: _audioMimeType,
    text,
    mode = 'image_audio',
    turnMode = 'first_turn',
    character,
    previousUserText,
    previousAssistantText,
  } = params;

  const baseText = text?.trim() || getDefaultTextByMode(mode, turnMode);
  const content: Array<Record<string, unknown>> = [];

  const profile = buildCharacterProfile(character);
  const sections = [baseText];
  if (profile) sections.push(profile);

  if (turnMode === 'continue_turn') {
    const compactUser = trimContext(previousUserText, 80);
    const compactAssistant = trimContext(previousAssistantText, 120);

    if (compactAssistant) {
      const lines = ['최근 1턴 참고:'];
      if (compactUser) lines.push(`- 사용자: ${compactUser}`);
      lines.push(`- 친구: ${compactAssistant}`);
      sections.push(lines.join('\n'));
    }
    sections.push('이번 턴 우선 규칙:\n- 같은 친구처럼 이어서 말해줘.\n- 절대 네 이름을 다시 언급하며 인사하지 마.\n- 사용자를 네 이름으로 부르거나 헷갈리지 마.\n- 방금 사용자가 한 말을 듣자마자 나온 즉각적인 반응을 첫 문장에 보여줘.');

    content.push({ type: 'text', text: sections.join('\n\n') });
  } else {
    // 첫 턴이고 캐릭터가 미리 설정되어 있다면 자신의 정체성을 알고 시작합니다.
    if (character?.name) {
      sections.push(`너는 이미 '${character.name}'이라는 이름과 설정을 가진 캐릭터야. 사용자에게 너의 이름을 말하고 인사해줘. 절대 다른 이름을 짓거나 사용자의 이름을 네 이름으로 착각하지 마.`);
    } else {
      sections.push('이름이 아직 없으므로 첫 인사에서 그림에 어울리는 짧은 이름을 하나 지어서 알려줘.\n규칙 1: 반드시 대답 어딘가에 "내 이름은 OO(이)야!" 또는 "나는 OO라고 해"와 같이 정확한 이름 정의 표현을 포함해.\n규칙 2: 이름 소개 바로 뒷 문장에, 네가 구체적으로 어떤 특징을 가진 친구인지(너의 정체성)를 한 문장으로 딱 설명해 줘. (예: "나는 오늘 숲길을 산책하러 나온 토끼 친구야.")');
    }
    content.push({ type: 'text', text: sections.join('\n\n') });
  }

  if (turnMode === 'first_turn' && (mode === 'image_only' || mode === 'image_audio') && imageBase64 && imageMimeType) {
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
      { role: 'system', content: turnMode === 'continue_turn' ? CONTINUE_TURN_SYSTEM_PROMPT : FIRST_TURN_SYSTEM_PROMPT },
      {
        role: 'user',
        content,
      },
    ],
    modalities: ['text', 'audio'],
  };
}
