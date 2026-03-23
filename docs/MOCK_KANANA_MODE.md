# MOCK_KANANA_MODE

## 왜 필요한가

Kanana 실 API는 일일 호출 제한(10회)이 있기 때문에,
UI/UX 디테일(로딩, 결과 화면, 다시 말하기, 방금 대화)을 개발할 때 매번 실제 API를 쓰면 빠르게 한도에 도달한다.

`MOCK_KANANA_MODE`는 아래 목적을 위해 추가됐다.

- 실제 API 없이도 end-to-end 화면 흐름 개발
- image_only / audio_only / image_audio 각 모드 검증
- 다양한 응답 텍스트/캐릭터 카드 시나리오 점검
- 실제 API는 최종 검증 단계에서만 사용

---

## 모드 전환 방법

환경변수로 전환한다.

```bash
# mock 모드 (개발 기본 권장)
NEXT_PUBLIC_KANANA_MODE=mock

# live 모드 (실제 Kanana 호출)
NEXT_PUBLIC_KANANA_MODE=live
```

### 동작 규칙

- `mock`이면 `/api/kanana`를 호출하지 않는다.
- `live`이면 기존처럼 `/api/kanana`를 호출한다.
- 값이 없거나 알 수 없는 값이면 안전하게 `live`로 동작한다.

---

## Mock 시나리오

Mock 응답은 `lib/kanana/mock-response.ts`에서 관리한다.

### 1) image_only
- 숲/토끼 느낌의 이미지 설명형 응답
- 3개 variation
- 오디오는 기본 null (오디오 UI fallback 확인용)

### 2) audio_only
- 사용자 발화 전사형 응답
- 3개 variation
- 예: `방금 '안녕, 이건 내가 그린 공룡이야'라고 말했어.`

### 3) image_audio
- 캐릭터+대화 응답 시나리오 5개 variation
- 포함 시나리오
  - 토끼 이름 짓기
  - 공룡과 같이 놀기
  - 무서움/위로(별빛 숲 여우)
  - 토끼와 모험 확장
  - 숲 기사 미션형 대화

---

## 오디오 Mock 처리

- image_audio mock은 재생 가능한 `audio/wav` data URI(짧은 더미 비프음)를 포함한다.
- image_only / audio_only는 `audioUrl = null`로 반환될 수 있다.
- `audioUrl`이 null이어도 UI가 깨지지 않도록 설계되어 있다.

또한 mock 응답에는 `audioBase64`/`audioMimeType` 또는 `audioUrl` 형태를 둘 다 지원할 수 있도록 구현되어 있어,
향후 실제 샘플 오디오 파일을 붙이기 쉬운 구조다.

---

## 개발 권장 워크플로우

1. 평소 개발: `NEXT_PUBLIC_KANANA_MODE=mock`
2. UI/애니메이션/문구/플로우 반복 조정
3. 주요 시나리오 완료 후: `NEXT_PUBLIC_KANANA_MODE=live`
4. 실 API로 최종 검증만 수행

즉, **mock으로 빠르게 다듬고 live는 검증용으로만** 사용한다.
