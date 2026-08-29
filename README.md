# 토킹 튜터 (Talking Tutor)

폰만으로 만드는 영어 회화 연습 봇.
영어로 말을 걸면 화면 속 캐릭터가 입을 움직이며 영어로 답하고, 틀린 표현을 한국어로 짚어줍니다.

**튜터링 모드** — 틀리면 그 자리에서 교정 + 한국어 설명
**상황극 모드** — 카페 · 공항 · 호텔 · 병원 · 면접. 배역을 유지하고 교정은 끝나고 한 번에

## 문서

| 파일 | 내용 |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | 작업 지침. 클로드가 세션 시작 시 자동으로 읽습니다 |
| [`docs/overview.md`](./docs/overview.md) | 밑그림 — 무엇을 만드는가. 잘 바뀌지 않습니다 |
| [`docs/plan.md`](./docs/plan.md) | 하루 단위 할 일. **매일 바뀝니다** |
| [`docs/decisions.md`](./docs/decisions.md) | 결정 기록 — 무엇을 왜 정했는가 |
| [`docs/history/`](./docs/history/) | 개발일지 — 실제로 어떻게 진행됐는가 |

## 명령어

| 명령 | 하는 일 |
|---|---|
| `/today` | 오늘의 할 일 불러오기 |
| `/milestone` | 끝낸 마디를 개발일지로 기록하고 푸시 |

세션을 열면 `.claude/hooks/session-start.sh` 가 현재 상태와 오늘 할 일을 자동으로 읽어옵니다.

## 상태

Day 3 완료. https://talking-nu.vercel.app 에서 영어로 대화가 됩니다. 음성과 아바타는 아직입니다.

## 기술

브라우저 음성 인식 · Gemini 3.6 Flash · 브라우저 실시간 아바타 · Vercel
