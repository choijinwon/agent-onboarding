---
type: wiki
projectId: aisoftwarefactory
category: log
status: approved
confidence: HIGH
source: user-request
updatedBy: Codex
updatedAt: 2026-06-06
---

# Local Qwen Ollama Provider Log

## Summary

사용자 요청에 따라 Qwen 모델을 원격 API가 아닌 로컬 Ollama provider로 실행하도록 구성했다.

## Context

기존 `LLM_PROVIDER=qwen`은 Qwen Cloud compatible API를 호출하는 원격 provider였다. 사용자는 Qwen 모델을 로컬에서 돌리겠다고 요청했다.

## Decision

기본 로컬 provider를 `LLM_PROVIDER=ollama`로 추가한다. 앱은 Ollama의 OpenAI-compatible `/v1/chat/completions` endpoint를 호출한다.

## Details

- 기본 endpoint: `http://127.0.0.1:11434/v1`
- 기본 model: `qwen3:latest`
- 설정 파일: `.env.local`
- adapter: `src/lib/llm/ollama.ts`
- 상태 API: `GET /api/llm/status`

Ollama CLI는 로컬에 설치되어 있고 `qwen3:latest` 모델도 이미 존재한다. 모델 다운로드와 실행은 `ollama pull qwen3` 또는 `ollama run qwen3`로 진행한다.

## Related Links

- [[Qwen LLM Provider]]
- [[Agent 수집 프로필]]
- [[Project 자동 연결]]
