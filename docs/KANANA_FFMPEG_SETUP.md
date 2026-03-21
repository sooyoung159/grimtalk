# KANANA_FFMPEG_SETUP

## 왜 필요한가

Kanana 업스트림에서 `cannot load audio file`가 관측되어,
브라우저 원본 오디오(webm/mp4/m4a/aac)를 서버에서 **wav(pcm_s16le, mono, 16kHz)** 로 표준화해서 전송한다.
이 변환에 `ffmpeg`가 필요하다.

---

## 1) 로컬 설치 확인

```bash
ffmpeg -version
```

정상이라면 버전 정보가 출력된다.

### macOS (Homebrew)

```bash
brew install ffmpeg
ffmpeg -version
```

---

## 2) 동작 확인 포인트

개발 서버 실행:

```bash
npm run dev
```

`.env.local` 예시:

```bash
KANANA_BASE_URL=https://<your-kanana-endpoint>
KANANA_API_KEY=<your-secret-key>
KANANA_DEBUG=true
```

요청 후 서버 로그에서 확인:
- `audioOriginal.mimeType`, `audioOriginal.byteSize`
- `audioConverted.mimeType`가 `audio/wav`인지
- `audioConverted.byteSize`가 채워지는지

---

## 3) 실패 시 점검

1. `ffmpeg -version`이 실패하는가? → ffmpeg 미설치/경로 문제
2. 오디오 MIME이 허용 목록에 있는가?
3. 변환 실패 로그(`audio convert failed`)가 있는가?
4. 변환은 성공했는데 upstream이 실패하는가? → Kanana wav 사양(샘플레이트/채널) 재검증

---

## 4) 테스트 절차(요약)

1. 모바일에서 녹음 후 업로드
2. 서버에서 wav 변환 수행
3. Kanana 요청 payload에 `input_audio.format='wav'`로 전송
4. upstream status/response 확인
