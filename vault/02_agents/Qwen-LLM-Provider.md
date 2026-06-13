---
type: wiki
projectId: aisoftwarefactory
category: agents
status: approved
confidence: HIGH
source: Ollama OpenAI compatibility; Qwen Ollama documentation; Qwen Cloud OpenAI-compatible documentation
updatedBy: Codex
updatedAt: 2026-06-06
---

# Qwen LLM Provider

## Summary

Qwen 모델을 Obsidian AI 업무 Wiki의 LLM provider로 연결한다. 기본 운영 방식은 로컬 Ollama 기반 Qwen이고, 원격 Qwen Cloud는 선택 provider로 유지한다.

## Context

기존 운영 코어는 OpenAI Responses API를 기본 provider로 사용했다. 업무 Wiki는 로컬에서 반복 질의하는 흐름이 많으므로 기본 Qwen 실행은 Ollama로 둔다. Ollama는 OpenAI-compatible API를 제공하므로, 기존 Chat Completions adapter 구조를 유지한 채 로컬 모델로 전환할 수 있다. Qwen Cloud는 별도 원격 provider로 유지한다.

## Decision

`LLM_PROVIDER=ollama`이면 앱은 로컬 Ollama의 `/v1/chat/completions` 엔드포인트를 사용한다. 기본 모델은 현재 로컬에 설치된 `qwen3:latest`다. `LLM_PROVIDER=qwen`이면 원격 Qwen Cloud compatible `/chat/completions` 엔드포인트를 사용한다. 로컬 서버, 모델, 원격 API 키가 준비되지 않으면 기존처럼 fallback mode로 동작하고 앱은 실패하지 않는다.

## Details

로컬 Qwen 환경변수:

```text
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434/v1
OLLAMA_MODEL=qwen3:latest
OLLAMA_API_KEY=ollama
```

로컬 실행 명령:

```text
ollama pull qwen3
ollama run qwen3
```

원격 Qwen Cloud 환경변수:

```text
LLM_PROVIDER=qwen
QWEN_API_KEY=
QWEN_MODEL=qwen-plus
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
```

`DASHSCOPE_API_KEY`도 `QWEN_API_KEY`의 alias로 지원한다.

연결 위치:

- `src/lib/llm/ollama.ts`
- `src/lib/llm/qwen.ts`
- `src/lib/llm/index.ts`
- `.env.local`
- `.env.example`

현재 기본 Qwen 연결은 로컬 Ollama provider 방식이다. macOS에서 Ollama 앱이나 CLI가 실행 중이어야 하며, 모델이 없으면 첫 `pull` 또는 `run`에서 모델 파일을 다운로드한다. 이 Mac에는 `qwen3:latest`, `qwen2.5-coder:14b`, `qwen2.5-coder:32b` 등이 설치되어 있다.

## Related Links

- [[Agent 수집 프로필]]
- [[Project 자동 연결]]
- [[AI Agent Wiki 운영 규칙]]
