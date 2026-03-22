# KANANA_TRANSCRIPT_CACHE_OPTIMIZATION

## 배경

기존 흐름에서는 사용자 발화 텍스트를 얻기 위해 audio_only 전사 호출을 추가로 수행했다.
이때 동일 오디오 파일에 대해 전사 요청이 반복될 수 있었다.

## 변경 내용

- session store에 최근 1개 전사 캐시 필드 추가
  - `recentTranscript`
  - `recentTranscriptKey`
- `extractUserUtterance()`에서
  - 현재 오디오 파일 키가 캐시 키와 같으면 캐시 재사용
  - 다르면 audio_only 전사 요청 후 캐시 갱신

## 호출 비용 비교

- 개선 전: 1턴당 최대 2회 호출(전사 1 + 본응답 1), 중복 전사 가능
- 개선 후: 동일 오디오 재시도 시 전사 재호출 없이 캐시 사용

## 기대 효과

- 전사 중복 호출 감소
- 응답 지연 감소
- API 쿼터 사용량 감소
