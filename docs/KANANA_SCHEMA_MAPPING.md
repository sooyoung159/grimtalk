# KANANA_SCHEMA_MAPPING

> 목적: 현재 구현의 **추정(fallback) 의존도**를 낮추고, 문서/샘플 근거 기반으로 스키마를 고정하기 위한 매핑표.
>
> 상태 표기:
> - **[CONFIRMED]**: 현재 프로젝트 내부 + 명시 근거로 사실상 고정 가능한 항목
> - **[EVIDENCE-BASED]**: 사용자 제공 Kanana 예시로 근거가 강화된 항목(공식 원문 문서 부재)
> - **[ASSUMED]**: 외부 공식 문서/샘플 확인 전, 업계 관행/기존 구현 기반 추정
> - **[FALLBACK]**: 여러 후보 필드를 순회하며 파싱하는 방어 로직
> - **[UNKNOWN/TODO]**: 사람 확인이 필요한 항목

---

## 1) 현재 가정 request schema (업데이트)

출처:
- `lib/kanana/build-request.ts`
- 사용자 제공 근거 예시(이미지/오디오/modalities)

| 경로 | 현재 값/shape | 상태 | 근거 |
|---|---|---|---|
| `model` | `"kanana-o"` | [ASSUMED] | 하드코딩 값, 공식 허용값 문서 미확보 |
| `messages[0]` | `{ role: "system", content: SYSTEM_PROMPT }` | [ASSUMED] | chat-completions 관행 |
| `messages[1].role` | `"user"` | [ASSUMED] | chat-completions 관행 |
| `messages[1].content[0]` | `{ type: "text", text: string }` | [ASSUMED] | 멀티모달 관행 |
| `messages[1].content[1]` | `{ type: "image_url", image_url: { url: "data:<mime>;base64,<...>" } }` | [EVIDENCE-BASED] | 사용자 제공 이미지 예시 1 반영 |
| `messages[1].content[2]` | `{ type: "input_audio", input_audio: { data, format } }` | [EVIDENCE-BASED] | 사용자 제공 오디오 예시 2 반영 |
| `modalities` | `["text", "audio"]` | [EVIDENCE-BASED] | 사용자 제공 오디오 응답 사용 예시 3 반영 |

### 현재 request 예시 (우선 기준)

```json
{
  "model": "kanana-o",
  "messages": [
    { "role": "system", "content": "...SYSTEM_PROMPT..." },
    {
      "role": "user",
      "content": [
        { "type": "text", "text": "이 그림 속 친구가 되어..." },
        {
          "type": "image_url",
          "image_url": {
            "url": "data:image/webp;base64,...."
          }
        },
        {
          "type": "input_audio",
          "input_audio": {
            "data": "....base64....",
            "format": "webm"
          }
        }
      ]
    }
  ],
  "modalities": ["text", "audio"]
}
```

> 메모: 이미지 `url`에는 현재 **data URI**를 사용한다. (raw base64 단독 문자열 아님)

---

## 2) request에서 확정 가능한 항목 vs 불확실 항목

### 2-1. 확정 가능한 항목(현재 단계)

| 항목 | 상태 | 이유 |
|---|---|---|
| 이미지 파트의 우선 shape: `type: image_url` + `image_url.url` | [EVIDENCE-BASED] | 사용자 제공 예시 1과 일치 |
| 오디오 파트의 우선 shape: `type: input_audio` + `input_audio.data/format` | [EVIDENCE-BASED] | 사용자 제공 예시 2와 일치 |
| `modalities: ["text", "audio"]` 포함 | [EVIDENCE-BASED] | 사용자 제공 예시 3에서 사용 확인 |

### 2-2. 여전히 불확실한 항목

| 항목 | 상태 | 메모 |
|---|---|---|
| `model` 정확 허용값/버전 정책 | [UNKNOWN/TODO] | `kanana-o` 고정 가능 여부 확인 필요 |
| 이미지 `url` 값으로 raw base64 허용 여부 | [UNKNOWN/TODO] | 현재는 data URI 사용 |
| `input_audio.format`의 정식 enum(특히 `webm` 허용) | [UNKNOWN/TODO] | 예시는 `wav`; 실제 입력은 webm 가능 |
| `modalities` 필수/옵션 여부 및 다른 값 허용 여부 | [UNKNOWN/TODO] | 예시 존재하나 규약 원문 부재 |
| response canonical schema(텍스트/오디오 위치) | [UNKNOWN/TODO] | parse는 다중 fallback 상태 |

---

## 3) 현재 가정 response schema (코드 기준, 이번엔 구조 유지)

출처: `lib/kanana/parse-response.ts`

| 우선순위 | 텍스트 추출 경로 | 상태 | 비고 |
|---|---|---|---|
| 1 | `choices[].message.content` | [FALLBACK] | non-stream JSON 기준 |
| 2 | `choices[].text` | [FALLBACK] | 대체 shape 대응 |
| 3 | `output[].content` | [FALLBACK] | 대체 응답 계열 대응 |
| 4 | 기본문구 | [FALLBACK] | 전부 실패 시 안전값 |

| 우선순위 | 오디오 추출 경로 | 상태 | 비고 |
|---|---|---|---|
| 1 | `audio.{base64|data}` | [FALLBACK] | top-level 가정 |
| 2 | `choices[].message.audio.{base64|data}` | [FALLBACK] | message 내부 가정 |
| 3 | `choices[].message.content[].{audio_base64|base64|input_audio.data}` | [FALLBACK] | content 내부 가정 |
| - | MIME | `mimeType|mime_type|format`, default `audio/mpeg` | [FALLBACK] |

추가 명시:
- 현재 파서는 **non-stream 응답 가정**.
- `delta.content` / `delta.audio` 같은 stream chunk 조립은 **미지원**.
- 실제 샘플 JSON 확보 후 canonical 경로 재고정 필요.

---

## 4) 현재 코드에서 fallback 처리 중인 부분

| 파일 | fallback 항목 | 내용 |
|---|---|---|
| `parse-response.ts` | 텍스트 | `choices.message.content` → `choices.text` → `output.content` → 기본문구 |
| `parse-response.ts` | 오디오 | `raw.audio` / `message.audio` / `message.content[]` 다중 경로 순회 |
| `parse-response.ts` | MIME | `mimeType`, `mime_type`, `format` 다중 별칭 + default |
| `parse-response.ts` | 캐릭터 | `character`, `data.character` 및 하위 alias 다중 매핑 |
| `parse-response.ts` | 캐릭터 기본값 | 정보 부재 시 `fallbackCharacter()` |
| `build-request.ts` | 오디오 format | MIME → `webm/wav/mp3/ogg` 정규화, 미일치 시 `webm` |

---

## 5) 최종 고정해야 할 필드명과 shape (잔여)

1. `model`의 정확한 허용값/버전 정책
2. 이미지 `image_url.url`에 raw base64 허용 여부 및 권장 형태(data URI vs URL)
3. `input_audio.format`의 정식 enum과 `webm` 허용 여부
4. response에서 텍스트/오디오 canonical 단일 경로
5. stream 응답 지원 시 delta 필드 스펙 및 조립 방식
