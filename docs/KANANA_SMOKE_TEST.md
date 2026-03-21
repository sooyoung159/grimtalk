# KANANA_SMOKE_TEST

Kanana 연동 스모크 테스트 가이드 (구조 변경 없이 관찰 중심)

## 1) 목적

- 실제 Kanana 호출이 성공하는지 확인
- `app/api/kanana/route.ts`의 debug 로그로 **요청 shape / 상태코드 / 응답 미리보기**를 확인
- base64/API key 같은 민감정보는 로그에 남기지 않는지 확인

---

## 2) 사전 준비

### 2-1. `.env.local` 예시

```bash
KANANA_BASE_URL=https://<your-kanana-endpoint>
KANANA_API_KEY=<your-secret-key>
KANANA_DEBUG=true
```

- `KANANA_DEBUG=true`일 때만 debug 로그가 출력됨
- 운영/공유 환경에서는 `KANANA_DEBUG=false` 권장

### 2-2. 실행

```bash
npm install
npm run dev
```

- 기본적으로 Next.js dev server 콘솔에서 로그 확인

---

## 3) 테스트 절차 (권장 순서)

1. 브라우저에서 앱 접속
2. 카메라로 이미지 캡처
3. 마이크 녹음(짧게 2~5초)
4. 첫 턴 요청 전송
5. 서버 콘솔에서 아래 로그 3종 확인
   - `[KANANA_DEBUG] upstream request summary`
   - `[KANANA_DEBUG] upstream status`
   - `[KANANA_DEBUG] upstream raw response preview`
6. UI에서 결과 화면 확인
   - 캐릭터 카드
   - assistantText
   - 오디오 재생(있다면)

---

## 4) 성공 시 기대 결과

- HTTP 응답이 `ok: true`
- 클라이언트에서 결과 화면 진입
- 최소 텍스트 응답이 표시됨
- 오디오가 있으면 플레이어에서 재생 가능
- 디버그 로그에 아래가 포함됨
  - request summary: content 파트 타입, MIME, 길이/크기
  - upstream status: status/ok/content-type
  - raw response preview: 길이 + 일부 미리보기(긴 base64는 redacted)

---

## 5) 실패 시 확인 포인트

### A. 401/403
- `KANANA_API_KEY` 확인
- 키 만료/권한 범위 확인

### B. 400
- 이미지/오디오 MIME 타입 허용 목록 확인
- request shape 불일치 가능성 확인 (`image_url`, `input_audio`, `modalities`)

### C. 429
- 호출 빈도 제한(레이트 리밋)

### D. 5xx/502
- Kanana upstream 장애/일시 불안정
- endpoint 경로(`/chat/completions`)와 베이스 URL 점검

### E. 파싱 실패
- upstream이 JSON이 아닌 경우
- response canonical 경로가 현재 fallback과 다를 가능성

---

## 6) 관찰 시 특히 볼 항목

- request summary의 `contentPartTypes`에
  - `text`
  - `image_url`
  - `input_audio`
  가 모두 있는지
- image/audio MIME, byteSize가 합리적인지
- upstream status가 200대인지
- raw response preview에 에러 메시지/스키마 힌트가 보이는지

---

## 7) 보안/로그 정책

- API key는 절대 로그 출력 금지
- base64 원문은 절대 로그 출력 금지
- 로그에는 길이/타입/존재 여부/일부 마스킹 미리보기만 남김

---

## 8) 테스트 후 권장 정리

- 필요한 샘플 JSON(성공/실패)을 별도 파일로 저장 (민감정보 제거)
- `KANANA_DEBUG=false`로 원복
- 스키마 확정 내용을 `KANANA_SCHEMA_MAPPING.md`에 반영
