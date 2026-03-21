# KANANA_MVP_STATUS

## 현재까지 검증된 것

- 이미지 입력(image_only): 그림 이해 응답이 정상에 가까움
- 음성 입력(audio_only): 핵심 의미 반영 가능(완전 실패 아님)
- 멀티모달(image_audio): 핵심 검증 통과, 이미지+음성 동시 반영 응답 확인
- 업스트림 응답 오디오: 수신됨(choices[0].message.audio.data 경로 관측)
- 재생 경로: PCM 가정을 WAV로 래핑해 브라우저 재생 가능하도록 처리
- 입력 오디오: 서버에서 wav 표준화(ffmpeg) 후 Kanana 전송

## 아직 불확실한 것

- audio_only 전사 정밀도(요약 경향 완전 제거 여부)
- Kanana 응답 오디오의 공식 스펙(PCM 고정인지, 샘플레이트/포맷 정확값)
- response canonical schema 확정(choices/output/audio 위치 단일화)
- stream(delta.*) 응답 지원 필요성

## 다음 우선순위

1. image_audio 품질 튜닝 (그림 캐릭터 몰입도 + 사용자 발화 직접 반응도)
2. audio_only 전사 정밀도 개선(프롬프트/후처리 실험)
3. conversation step 최소 확장(연속 턴 UX)
4. 오디오 스펙 확정 후 하드코딩 가정값 정리
