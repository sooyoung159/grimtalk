# DEPLOY_FFMPEG_RUNTIME.md

## 문제 배경

배포 환경에서 아래 에러가 발생할 수 있다.

- `spawn ffmpeg ENOENT`
- `오디오 변환 도구(ffmpeg)를 찾지 못했어...`

원인: 로컬 개발 환경(macOS 등)에는 `ffmpeg`가 PATH에 설치되어 있는 경우가 많지만,
배포 런타임(서버리스/컨테이너 최소 이미지)은 시스템 `ffmpeg` 바이너리를 기본 제공하지 않는다.

즉,
- **로컬**: `spawn('ffmpeg', ...)` 동작할 수 있음
- **배포**: PATH에 `ffmpeg` 없음 → ENOENT

---

## 해결 방식

시스템 ffmpeg 의존을 제거하고, 프로젝트 의존성으로 `ffmpeg-static`을 사용한다.

### 적용 내용

1. `package.json`에 `ffmpeg-static` 추가
2. `lib/media/audio.ts`에서
   - 기존: `spawn('ffmpeg', args)`
   - 변경: `spawn(<resolved ffmpeg binary path>, args)`
3. 경로 해결 우선순위
   - 1순위: `process.env.FFMPEG_PATH` (운영자가 강제 지정할 때)
   - 2순위: `ffmpeg-static`가 제공하는 바이너리 경로
   - 둘 다 없으면 명확한 `AudioConversionError` 반환

또한 경로가 실제 실행 가능한지(`X_OK`) 검증 후 실행한다.

---

## 런타임 동작 요약

`convertAudioToWav()` 호출 시:

1. `resolveFfmpegPath()` 실행
2. ffmpeg 경로를 캐시/검증
3. ffmpeg 바이너리를 절대경로로 spawn
4. 입력 오디오를 wav(pcm_s16le, mono, 16kHz)로 변환
5. 실패 시 사용자 메시지 + 상세 로그(detail) 분리

---

## 그래도 안 되는 플랫폼이 있는 경우

`ffmpeg-static`이 일부 런타임/아키텍처에서 제한될 수 있다.

### 대안 A: Docker 가능 플랫폼

배포 이미지를 직접 제어할 수 있으면 Docker 이미지에 시스템 ffmpeg를 포함한다.

예시:

```dockerfile
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
```

그 후 `FFMPEG_PATH`를 명시적으로 주입해 경로를 고정할 수 있다.

### 대안 B: 클라이언트 측 wav 인코딩

서버에서 ffmpeg를 쓰지 않고, 클라이언트에서 wav(16kHz mono)로 인코딩해서 업로드한다.

- 장점: 서버 런타임 바이너리 의존 제거
- 단점: 브라우저 구현/성능/호환성 고려 필요

---

## 운영 체크리스트

- [ ] `ffmpeg-static`가 프로덕션 의존성에 포함되었는가
- [ ] 빌드 후 런타임에서 바이너리 파일 접근이 가능한가
- [ ] 서버 로그에 `Resolved ffmpeg path is not executable`가 없는가
- [ ] 변환 입력(webm/mp4/m4a/aac/ogg/mp3) 케이스가 정상 변환되는가
