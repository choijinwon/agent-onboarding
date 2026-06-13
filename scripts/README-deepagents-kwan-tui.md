# Deep Agents Kwan TUI POC

폐쇄망 Kwan API가 OpenAI-compatible `/v1/chat/completions` 규격을 제공한다는 전제로 만든 터미널 UI POC입니다. `langchain-ai/deep-agents-ui`의 핵심 흐름인 설정, 채팅, 실행 상태, 파일 state 패널을 터미널에서 간단히 확인할 수 있게 옮겼습니다.

이 POC는 내부망에서 빠르게 API 연결과 UX 흐름을 검증하기 위한 무의존 Node.js 스크립트입니다. 실제 Python `deepagents` 런타임과 tool calling 검증은 Kwan `qwen3.6` 모델의 도구 호출 지원 여부가 확인된 뒤 별도 단계로 붙입니다.

## 환경 변수

프로젝트 루트의 `.env` 또는 `.env.local`에 아래 값을 둡니다.

```ini
KWAN_API_KEY="your-internal-kwan-key"
KWAN_BASE_URL="http://xxx.xxx/v1"
KWAN_MODEL="qwen3.6"
KWAN_TEMPERATURE="0.2"
```

`KWAN_BASE_URL`은 `/chat/completions` 앞까지의 주소입니다. 예를 들어 API가 `http://10.0.0.10:8000/v1/chat/completions`라면 `KWAN_BASE_URL="http://10.0.0.10:8000/v1"`로 설정합니다. 실수로 `/chat/completions`까지 넣어도 TUI가 자동으로 정규화합니다.

## 실행

```bash
npm run tui:kwan
```

일회성 smoke test:

```bash
npm run tui:kwan -- --once --prompt "보안 점검 보고서 TODO를 구성해줘"
```

## 명령어

- `/ask <업무>`: Kwan API에 업무 요청
- `/status`: `/models` endpoint 연결 확인
- `/files`: 가상 파일 state 목록 출력
- `/open <file>`: 가상 파일 내용 출력
- `/plan`: 실행 이벤트와 계획 로그 출력
- `/model <name>`: 현재 세션 모델명 변경
- `/settings`: base URL, 모델, 마스킹된 API key 출력
- `/debug`: step-by-step 확인용 플래그 토글
- `/clear`: 대화 로그 초기화
- `/exit`: 종료

일반 문장을 입력해도 `/ask` 없이 바로 Kwan API에 질문합니다.

## TUI 구성

- `Chat`: 최근 사용자/에이전트 메시지
- `State / Files`: endpoint, model, latency, run count, 가상 파일 목록
- `plan.md`: 모델 응답의 `## Plan` 섹션
- `todo.md`: 체크박스, 목록, 번호 목록으로 감지한 TODO
- `handoff.md`: 모델 응답의 `## Handoff` 섹션
- `risks.md`: 모델 응답의 `## Risks` 섹션
- `settings.json`: 현재 endpoint/model/debug 상태
- `events.md`: 실행 이벤트 로그

## 폐쇄망 POC 범위

- 외부 검색 도구는 연결하지 않습니다.
- Node 기본 모듈만 사용하므로 추가 npm 패키지 설치가 필요 없습니다.
- 실제 `deepagents` Python 런타임 대신 OpenAI-compatible Kwan 모델 호출과 가상 파일 state만 검증합니다.
- 실제 deepagents tool calling 검증은 Kwan `qwen3.6` 모델의 function/tool calling 지원 여부가 확인된 뒤 Python agent 또는 LangGraph 서버를 별도 연결해야 합니다.
