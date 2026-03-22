# NANA_CHARACTER_SPEC

## 1) 캐릭터 정의

- 이름: **나나 (NANA)**
- 역할: 그림톡의 **고정 안내자/조력자**
- 한 줄 설명: **별빛 크레용으로 그림 친구를 깨워주는 따뜻한 그림책 요정**
- 원칙: 아이의 그림이 주인공이며, 나나는 항상 보조 역할

## 2) 최종 외형 설명

- 전체 실루엣: 둥글고 말랑한 방울형
- 얼굴: 순한 작은 눈 + 작은 미소 + 은은한 볼 붉은기
- 상단 포인트: 별빛 + 크레용 모티프 장식
- 포즈: 떠 있는 듯한 가벼운 느낌, 과한 인간형 비율 지양
- 분위기: 어린이용이되 유치하지 않은 따뜻한 그림책 감성

## 3) 컬러/질감

- 메인: 크림/버터 옐로우 계열
- 보조: 라벤더, 민트
- 포인트: 코랄 핑크(볼/강조)
- 채도: 저채도 파스텔 중심
- 질감: 수채화 + 크레용 감촉(투명 PNG, 손그림 느낌)

## 4) 자산 세트

경로: `public/assets/nana/`

- `nana-idle.png` : 기본 미소, 일반 안내용
- `nana-thinking.png` : 생각 표정, 로딩용
- `nana-cheer.png` : 응원/기쁨 표정, 결과용
- `nana-wave.png` : 인사 포즈, 랜딩/온보딩용

## 5) 이미지 생성 프롬프트 (4종)

> 공통 스타일 키워드
> - children’s picture book illustration
> - soft watercolor and crayon texture
> - warm pastel palette
> - cream yellow mascot fairy
> - small star and crayon motif
> - round face, gentle eyes, tiny smile
> - floating magical helper
> - transparent background
> - consistent character design
> - not vector icon, not 3D toy, not sci-fi

### A) nana-idle

```text
A full-body mascot character named NANA, a warm children’s picture book fairy helper.
Soft watercolor and crayon texture, pastel cream yellow body with lavender and mint accents, tiny coral blush.
Round soft silhouette, gentle small eyes, tiny smile, floating calmly.
Small star and crayon motif above head.
Transparent background, clean character sheet quality, high resolution.
Not vector icon, not 3D toy, not robot, not sci-fi.
```

### B) nana-thinking

```text
The same character NANA in identical style and proportions.
Thinking expression, slightly tilted face, tiny sparkles and small thinking dots nearby.
Soft watercolor + crayon texture, warm pastel palette, transparent background.
Keep consistency with idle version (same body shape, same color family, same motif).
Not vector icon, not 3D toy, not sci-fi.
```

### C) nana-cheer

```text
The same character NANA in identical style and proportions.
Joyful cheering pose, warm happy expression, subtle raised arms, gentle celebratory sparkles.
Children’s picture book illustration, soft watercolor and crayon texture, pastel cream yellow + lavender/mint accents.
Transparent background, high resolution.
Not vector icon, not 3D toy, not sci-fi.
```

### D) nana-wave

```text
The same character NANA in identical style and proportions.
Welcoming wave pose, friendly greeting expression.
Soft watercolor and crayon texture, warm pastel colors, floating helper fairy mood.
Star and crayon motif visible, transparent background, high resolution.
Not vector icon, not 3D toy, not sci-fi.
```

## 6) 화면별 매핑

- 랜딩: `nana-wave`
- 카메라/마이크 안내: `nana-idle`
- 로딩: `nana-thinking`
- 결과: `nana-cheer` (아이 그림보다 작게 배치)

## 7) 구현 반영/교체 지점

- `components/nana/nana-floating.tsx`
  - 랜딩용 나나 이미지 지점 (`/assets/nana/nana-wave.png`)
- `components/nana/nana-thinking.tsx`
  - 로딩용 나나 이미지 지점 (`/assets/nana/nana-thinking.png`)
- `components/nana/nana-bubble.tsx`
  - 안내/보조용 나나 이미지 지점 (variant: idle/cheer/wave)
- `components/result/result-screen.tsx`
  - 결과 화면에서 `variant="cheer"` 사용

## 8) 현재 상태 (완료/미완성)

### 완료

- 고정 캐릭터 자산 4종 생성 및 저장
- 랜딩/로딩/결과/안내 화면에 자산 연결
- 결과 화면에서 나나 크기를 작게 유지(보조자 원칙 반영)

### TODO (미완성/개선 필요)

- `nana-surprise` 추가 자산 제작(카메라 발견 반응)
- PNG -> WebP 최적화 파이프라인
- 실제 디자이너 검수(그림책 감성, 톤 일관성) 1회
- 다크 배경 대비용 색감 보정 버전

## 9) 추후 확장 방향

1. `nana-surprise` 추가 (카메라/그림 발견 반응)
2. 소프트 모션(미세 float/fade) 강화
3. 다크/라이트 배경 대비용 컬러 튜닝 버전 추가
4. 해상도별(webp) 최적화 파이프라인 추가
