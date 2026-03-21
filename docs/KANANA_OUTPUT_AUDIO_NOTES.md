# KANANA_OUTPUT_AUDIO_NOTES

## 현재 관측 결과

- upstream 응답은 `200`으로 성공
- 응답 본문에서 `choices[0].message.audio.data` 경로의 오디오 데이터가 확인됨
- 즉, Kanana는 오디오 응답 자체는 생성하고 있음

## 왜 raw PCM 가능성이 높은가

- 응답 오디오가 base64로 오지만, 그대로 `<audio>`에서 재생되지 않음
- `audio.data` 형태는 컨테이너(mp3/wav) 파일이 아니라 PCM payload일 가능성이 큼
- 실제로 브라우저 플레이어는 헤더 없는 PCM 바이트를 직접 재생하지 못함

## 왜 브라우저 플레이어가 바로 재생 못할 수 있나

- `<audio src="data:audio/mpeg;base64,...">`는 파일 컨테이너/코덱이 맞아야 동작
- raw PCM에 mpeg/wav MIME만 붙이면 유효한 파일 구조가 아니므로 재생 실패 가능

## 목표 해결 방식

- 서버에서 응답 audio base64(PCM 가정)를 디코드
- PCM 바이트를 WAV 헤더로 감싸서(wrap) 유효한 wav 파일로 변환
- 프론트에는 `audioBase64 + audioMimeType='audio/wav'`로 전달
- 프론트는 기존 `<audio>`로 그대로 재생
