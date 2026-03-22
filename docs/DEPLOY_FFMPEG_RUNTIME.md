# DEPLOY_FFMPEG_RUNTIME.md

## 문제 배경

배포 환경에서 아래 에러가 발생할 수 있다.

- `spawn ffmpeg ENOENT`
- `Resolved ffmpeg path is not executable: /var/task/.../ffmpeg`

첫 번째는 ffmpeg를 **못 찾는 문제**고,
두 번째는 ffmpeg 경로를 **찾았지만 실행 권한이 없는 문제**다.

특히 Vercel 같은 서버리스 런타임에서는 빌드 산출물이 `/var/task` 아래에 위치하는데,
패키지에 포함된 바이너리를 해당 경로에서 직접 실행할 때 권한 제약(`X_OK` 실패)이 발생할 수 있다.

---

## 왜 로컬에서는 되고 배포에서는 안 되나?

- **로컬**: PATH 기반 시스템 ffmpeg 또는 로컬 파일 실행이 상대적으로 자유로움
- **배포(Vercel)**: 번들 경로(`/var/task/...`)에서 바이너리 직접 실행이 제한될 수 있음

즉, `ffmpeg-static` 경로를 알아내는 것만으로는 충분하지 않고,
**실행 가능한 위치로 옮겨서 권한을 다시 부여**해야 안정적으로 동작한다.

---

## 현재 해결 방식

현재 런타임 전략은 아래 순서다.

1. ffmpeg 소스 경로 결정
   - 1순위: `process.env.FFMPEG_PATH`
   - 2순위: `ffmpeg-static`가 제공하는 경로
2. 실행 바이너리 준비
   - target: `/tmp/grimtalk-ffmpeg`
   - source 바이너리를 `/tmp/grimtalk-ffmpeg`로 복사
   - `chmod 755` 적용
3. 실제 실행
   - `spawn('/tmp/grimtalk-ffmpeg', args)`

요약하면:

**`ffmpeg-static(or FFMPEG_PATH) -> /tmp 복사 -> chmod 755 -> spawn`**

---

## 경로 캐시 전략

- `ffmpegPathCache`에 최종 실행 경로를 캐시한다.
- `/tmp/grimtalk-ffmpeg`가 이미 실행 가능하면 재복사하지 않는다.
- 결과적으로 콜드 스타트 이후에는 준비 비용이 줄어든다.

---

## 에러 처리 정책

사용자 메시지는 친절하고 짧게 유지하되,
`detail`에는 운영 진단 가능한 원인 태그를 남긴다.

예시 detail 태그:
- `[ffmpeg-copy-failed]`
- `[ffmpeg-chmod-failed]`
- `[ffmpeg-not-executable-after-chmod]`
- `[ffmpeg-spawn-failed]`
- `[ffmpeg-exit-nonzero]`

이렇게 하면 로그에서 실패 지점을 빠르게 분리할 수 있다.

---

## 그래도 안 되는 플랫폼이 있는 경우

### 대안 A: Docker 가능 플랫폼

배포 이미지를 직접 제어할 수 있으면 시스템 ffmpeg를 이미지에 포함한다.

```dockerfile
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*
```

필요 시 `FFMPEG_PATH`로 실행 경로를 강제 지정한다.

### 대안 B: 클라이언트 측 wav 인코딩

서버 ffmpeg 의존을 없애고 클라이언트에서 wav(16kHz mono)로 인코딩해 업로드한다.

- 장점: 서버 런타임 바이너리 제약 회피
- 단점: 브라우저 구현/성능/호환성 고려 필요

---

## 운영 체크리스트

- [ ] `ffmpeg-static`가 프로덕션 의존성에 포함되었는가
- [ ] 첫 호출에서 `/tmp/grimtalk-ffmpeg` 복사/권한 설정이 성공하는가
- [ ] 로그에 `[ffmpeg-copy-failed]`, `[ffmpeg-chmod-failed]`가 없는가
- [ ] 변환 입력(webm/mp4/m4a/aac/ogg/mp3) 케이스가 정상 변환되는가
