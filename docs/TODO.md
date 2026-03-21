# TODO

## Kanana 연동 후속
- [ ] Kanana response canonical schema 확정 (assistant text/audio의 단일 경로)
- [ ] stream 응답(delta.content / delta.audio) 대응 여부 결정 및 구현
- [ ] 멀티턴(conversation step) API/상태 흐름 정리

## 오디오/미디어 품질
- [ ] ffmpeg 변환 파라미터(샘플레이트/채널/비트뎁스) Kanana 권장값과 최종 일치 검증
- [ ] 변환 실패 케이스별 UX 메시지 세분화
- [ ] 캡처/녹음 preview object URL revoke 정리

## 제품 UX
- [ ] 에러 상태별 UX 카피 세분화(권한/타임아웃/쿼터)
- [ ] 접근성(키보드/스크린리더) 점검
