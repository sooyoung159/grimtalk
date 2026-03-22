# DEPLOY_AUDIO_STRATEGY_VERCEL.md

## 배경

Vercel 배포에서 서버 ffmpeg 전략(`ffmpeg-static` + output file tracing + `/tmp` 복사 실행)을 적용했지만,
실제 런타임에서는 ffmpeg source 파일 누락(ENOENT)이 반복적으로 발생했다.

핵심 문제:
- 경로 문자열은 해석되더라도
- 함수 번들에 바이너리 파일이 안정적으로 포함되지 않으면
- 서버 변환 단계에서 실패한다.

---

## 왜 서버 ffmpeg 전략을 중단했나

서버리스 환경에서는 바이너리 의존성이
- 번들/트레이싱/권한/런타임 제약에 동시에 영향을 받아
- 환경별 편차가 크고 운영 리스크가 높다.

반면 클라이언트 WAV 인코딩은
- 브라우저 표준(Web Audio API) 기반으로
- 서버 바이너리 의존을 제거하고
- Vercel 런타임 제약을 직접 회피할 수 있다.

---

## 현재 전략 (권장)

### 1) 클라이언트

`use-audio-recorder.ts`에서 MediaRecorder 원본 녹음 후,
`lib/media/audio-browser.ts`를 통해 아래 포맷으로 재인코딩한다.

- WAV
- mono (1ch)
- 16000Hz
- 16-bit PCM

그 결과 파일(`audio/wav`)을 서버로 업로드한다.

### 2) 서버(`/api/kanana`)

- 입력 오디오는 **변환하지 않음**
- `audio/wav`를 그대로 base64 인코딩해 `buildKananaPayload`에 전달
- 서버 ffmpeg 의존 없음

### 3) 응답 오디오

- Kanana 응답 오디오(PCM 추정)는 기존 `wrapPcm16ToWav`로 WAV 래핑 유지

---

## 오디오 파이프라인 요약

1. 브라우저 녹음 (webm/mp4 등)
2. 브라우저에서 decode + resample + mono downmix + PCM16 WAV 인코딩
3. `audio/wav` 업로드
4. 서버는 pass-through(base64)
5. Kanana 호출
6. 응답 오디오는 WAV로 래핑해 클라이언트 재생

---

## 운영 체크리스트

- [ ] 업로드 MIME이 `audio/wav`인지 확인
- [ ] 서버에서 ffmpeg 바이너리 의존이 완전히 제거되었는지 확인
- [ ] Vercel 배포 로그에서 ffmpeg 관련 ENOENT가 사라졌는지 확인
- [ ] 실제 기기(iOS/Android/데스크톱)에서 녹음→응답 재생 E2E 확인
