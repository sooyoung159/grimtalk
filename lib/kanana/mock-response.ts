import { CharacterCard } from '@/types/character';

export type KananaInputMode = 'image_only' | 'audio_only' | 'image_audio';

export interface MockKananaResponse {
  character: CharacterCard;
  assistantText: string;
  audioBase64?: string | null;
  audioMimeType?: string | null;
  audioUrl?: string | null;
}

const MOCK_BEEP_WAV_BASE64 =
  'UklGRlQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YTAAAACAgICAgP+AgICAgICA/4CAgICAgID/gICAgICAgP+AgICAgICA/4CAgICAgID/gICAgICAgP+AgICAgICA/4CAgICAgID/gICAgICAgA==';

const imageOnlyScenarios: MockKananaResponse[] = [
  {
    character: {
      name: '루루',
      identity: '풀숲 사이를 살금살금 걷는 숲속 토끼 친구',
      traits: ['섬세함', '호기심'],
      voiceTone: '작고 부드럽고 포근함',
      greeting: '안녕, 나는 풀향기를 좋아하는 토끼 루루야!',
      question: '사진 속 내 이름을 뭐라고 지어주고 싶어?',
    },
    assistantText:
      '사진 속엔 복슬복슬한 토끼 친구가 보여. 풀숲에 숨어서 조용히 쉬고 있는 것 같아. 이 친구 이름을 뭐라고 지어주고 싶어?',
    audioBase64: null,
    audioMimeType: null,
  },
  {
    character: {
      name: '보리',
      identity: '이슬 맺힌 숲길을 지키는 작은 토끼 안내자',
      traits: ['차분함', '친절함'],
      voiceTone: '맑고 잔잔함',
      greeting: '반가워! 나는 숲길 안내 토끼 보리야.',
      question: '우리 숲길 표지판에 어떤 이름을 써줄래?',
    },
    assistantText:
      '연한 햇빛이 비치는 숲속에서 귀를 쫑긋 세운 토끼가 보여. 금방이라도 콩콩 뛰어갈 것 같은 표정이야. 이름을 하나 붙여보자!',
    audioBase64: null,
    audioMimeType: null,
  },
  {
    character: {
      name: '모모',
      identity: '나뭇잎 침대에서 낮잠 자는 솜털 토끼',
      traits: ['포근함', '장난기'],
      voiceTone: '몽글몽글하고 따뜻함',
      greeting: '쉿, 나는 방금 낮잠에서 깬 모모야.',
      question: '내가 깨어나서 가장 먼저 뭐 하면 좋을까?',
    },
    assistantText:
      '나뭇잎 사이에 폭신한 토끼가 살짝 몸을 웅크리고 있어. 평화로운 숲속 분위기라서 같이 조용히 숨을 고르게 돼. 이 친구의 하루를 어떻게 시작할까?',
    audioBase64: null,
    audioMimeType: null,
  },
];

const audioOnlyScenarios: MockKananaResponse[] = [
  {
    character: {
      name: '기록요정',
      identity: '네 말을 또렷하게 받아 적는 메아리 친구',
      traits: ['정확함', '집중력'],
      voiceTone: '또박또박한 설명 톤',
      greeting: '방금 네 목소리를 잘 들었어.',
      question: '다음 문장도 그대로 받아 적어줄까?',
    },
    assistantText: "방금 '안녕, 이건 내가 그린 공룡이야'라고 말했어.",
    audioBase64: null,
    audioMimeType: null,
  },
  {
    character: {
      name: '메아리',
      identity: '소리를 따라 말해주는 동굴 친구',
      traits: ['재빠름', '경청'],
      voiceTone: '짧고 또렷함',
      greeting: '좋아, 지금 말한 걸 그대로 돌려줄게.',
      question: '한 번 더 말해볼래?',
    },
    assistantText: "방금 '오늘은 비밀기지에서 모험할 거야'라고 말했어.",
    audioBase64: null,
    audioMimeType: null,
  },
  {
    character: {
      name: '리슨',
      identity: '속삭임도 놓치지 않는 청음 친구',
      traits: ['꼼꼼함', '배려'],
      voiceTone: '부드러운 리포터 톤',
      greeting: '응, 네 문장을 정확히 들었어.',
      question: '다음엔 더 크게 말해줄래?',
    },
    assistantText: "방금 '토끼야, 같이 반짝이는 길을 걷자'라고 말했어.",
    audioBase64: null,
    audioMimeType: null,
  },
];

const imageAudioScenarios: MockKananaResponse[] = [
  {
    character: {
      name: '루루',
      identity: '풀숲에서 친구를 기다리는 토끼 캐릭터',
      traits: ['다정함', '수줍음'],
      voiceTone: '사근사근하고 밝음',
      greeting: '안녕! 나는 풀숲 토끼 친구야.',
      question: '아직 이름이 없는데, 어떤 이름이 잘 어울릴까?',
    },
    assistantText:
      '안녕! 나는 풀숲 토끼 친구야. 아직 이름이 없어서 네가 지어주면 좋겠어. 어떤 이름이 잘 어울릴까?',
    audioBase64: MOCK_BEEP_WAV_BASE64,
    audioMimeType: 'audio/wav',
  },
  {
    character: {
      name: '쿵이',
      identity: '용감한 초록 공룡 캐릭터',
      traits: ['씩씩함', '활발함'],
      voiceTone: '에너지 넘치고 힘찬 톤',
      greeting: '우와! 나랑 놀아줘서 고마워!',
      question: '우리 어디부터 달려볼까?',
    },
    assistantText:
      '나는 씩씩한 공룡 친구야! 네가 같이 놀자고 해서 정말 신났어. 나는 쿵쿵 발을 구르며 뛰어다니고 싶어. 너도 같이 달려볼래?',
    audioBase64: MOCK_BEEP_WAV_BASE64,
    audioMimeType: 'audio/wav',
  },
  {
    character: {
      name: '별여우',
      identity: '별빛 숲을 안내하는 여우 캐릭터',
      traits: ['차분함', '위로'],
      voiceTone: '낮고 포근한 톤',
      greeting: '괜찮아, 내가 옆에 있어.',
      question: '천천히 손잡고 걸어볼까?',
    },
    assistantText:
      '나는 별빛 숲의 여우 친구야. 네가 조금 무섭다고 해서 내가 곁에 와줬어. 우리 천천히 반짝이는 길부터 같이 걸어볼까?',
    audioBase64: MOCK_BEEP_WAV_BASE64,
    audioMimeType: 'audio/wav',
  },
  {
    character: {
      name: '콩콩',
      identity: '비 온 뒤 숲에서 뛰노는 토끼 캐릭터',
      traits: ['장난기', '용기'],
      voiceTone: '통통 튀는 경쾌한 톤',
      greeting: '빗방울 냄새가 너무 좋아!',
      question: '물웅덩이 점프 놀이 해볼래?',
    },
    assistantText:
      '와, 네 목소리를 듣고 더 용기가 났어! 우리 숲길을 콩콩 뛰면서 작은 물웅덩이도 같이 점프해보자. 네가 먼저 신호를 줘!',
    audioBase64: MOCK_BEEP_WAV_BASE64,
    audioMimeType: 'audio/wav',
  },
  {
    character: {
      name: '도토리 기사',
      identity: '숲마을을 지키는 작은 기사 다람쥐',
      traits: ['책임감', '유쾌함'],
      voiceTone: '당차고 명랑한 톤',
      greeting: '어서 와! 오늘의 탐험 파트너가 되어줘!',
      question: '첫 번째 미션은 무엇으로 할까?',
    },
    assistantText:
      '좋아, 네가 방금 말한 작전대로 출발하자! 나는 도토리 검을 들고 앞장설게. 너는 내 옆에서 길을 밝혀줄래?',
    audioBase64: MOCK_BEEP_WAV_BASE64,
    audioMimeType: 'audio/wav',
  },
];

function pickScenario<T>(list: T[]): T {
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

function cloneMock<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

export function getMockKananaResponse(mode: KananaInputMode): MockKananaResponse {
  if (mode === 'image_only') return cloneMock(pickScenario(imageOnlyScenarios));
  if (mode === 'audio_only') return cloneMock(pickScenario(audioOnlyScenarios));
  return cloneMock(pickScenario(imageAudioScenarios));
}

export async function getMockKananaResponseWithDelay(mode: KananaInputMode): Promise<MockKananaResponse> {
  const delayMs = 500 + Math.floor(Math.random() * 401); // 500~900ms
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return getMockKananaResponse(mode);
}
