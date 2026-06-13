# CLAUDE.md

이 저장소의 canonical Obsidian Vault는 `vault/`입니다. Claude Code는 이 Vault를 회사 실무에서 여러 AI 에이전트가 공유하는 업무 Wiki로 다룹니다.

## Core Operating Rules

1. 작업 시작 전 `vault/index.md`, `vault/log.md`, 관련 `vault/01_projects/` 문서를 먼저 읽습니다.
2. `vault/00_raw_sources/`는 원본 자료 계층이므로 수정하거나 삭제하지 않습니다.
3. 가공된 지식, 결정, 요구사항, 설계, 개발, QA 문서는 `vault/01_projects/`부터 `vault/10_qa/` 사이에 저장합니다.
4. Agent 역할, 프롬프트, 운영 스키마는 `vault/02_agents/`에 둡니다.
5. 세션 인수인계와 실행 로그는 `vault/99_logs/`와 `vault/log.md`에 기록합니다.
6. 사용자가 명시적으로 원하지 않는 한 민감정보, 토큰, 비밀번호, 고객 개인정보를 저장하지 않습니다.
7. 프로젝트 자동 연결 상태는 `data/projects.json`과 `vault/02_agents/Project-자동-연결.md`를 기준으로 확인합니다.

## Korean / English Hybrid

사람이 읽고 검토해야 하는 가이드라인은 한국어로 작성합니다.

파일 시스템 작업, 명령 키워드, 자동화 트리거는 영어로 고정합니다.

- `save`: 현재 작업 맥락을 승인 가능한 Markdown으로 저장 요청합니다.
- `collect`: Agent 역할에 맞는 정보만 수집하고 근거와 confidence를 분리합니다.
- `ingest`: raw 자료를 읽고 Wiki 문서로 가공합니다.
- `query`: 기존 Wiki와 log를 참조합니다.
- `lint`: Vault 구조, 링크, 저장 규칙 위반을 점검합니다.

자연어 예시는 다음처럼 해석합니다.

- "옵시디언에 저장해줘" → `save`
- "역할별로 수집해줘" → `collect`
- "옵시디언 참조해줘" → `query`
- "자료 정리해줘" → `ingest`
- "위키 점검해줘" → `lint`

## Raw / Wiki / Schema

- Raw: `vault/00_raw_sources/`입니다. 원본 자료이며 에이전트는 읽기만 합니다.
- Wiki: `vault/01_projects/`~`vault/10_qa/`입니다. 승인된 Markdown 지식이 축적됩니다.
- Schema: `AGENTS.md`, `CLAUDE.md`, `vault/index.md`, `vault/02_agents/` 문서입니다. 에이전트의 행동 규칙을 정의합니다.

## Save Filter

`save` 전에 아래 5가지 조건을 확인합니다.

1. 이 정보가 향후 실무에 반복해서 재사용될 데이터인가?
2. 다른 에이전트나 동료가 프로젝트를 이어받기 위해 반드시 읽어야 하는가?
3. 의사결정의 근거와 결정권자를 나중에 추적할 필요가 있는가?
4. 실패한 방식이라 다시 시도하면 안 되는 리스크 정보인가?
5. 팀 전체가 맞추어야 하는 공통 규칙이나 디자인 가이드인가?

하나도 만족하지 않는 일회성 답변, 감상, 사소한 표현 변경은 Wiki에 저장하지 않습니다.

## Document Format

새 Wiki 문서는 YAML Frontmatter와 Obsidian 링크를 사용합니다.

```markdown
---
type: wiki
projectId: sample-project
category: architecture
status: approved
confidence: HIGH
source: source-id-or-url
updatedBy: ArchitectAgent
updatedAt: YYYY-MM-DD
---

# 제목

## Summary

## Context

## Decision

## Details

## Related Links
```

## Approval Rule

Agent 결과는 바로 Vault에 쓰지 않고 `WikiWriteRequest`로 승인 대기 상태를 거칩니다. Agent별 수집 기준은 `vault/02_agents/Agent-수집-프로필.md`를 기준으로 하고, Agent 역할과 허용 저장 폴더는 `vault/02_agents/Agent-역할-권한-매트릭스.md`를 기준으로 합니다. 승인 저장 시 `agentRole`이 대상 `folder`에 쓸 권한이 있는지 검사합니다. 승인된 `HIGH` confidence 문서만 Vault에 반영합니다. 승인 후에는 `vault/index.md`, `vault/log.md`, `vault/99_logs/`를 함께 갱신합니다.

## Project Auto Connect

현재 작업 폴더는 `POST /api/projects/auto-connect` 또는 루트(`/`) 접속으로 자동 연결할 수 있습니다. 자동 연결 결과는 `data/projects.json`에 저장되고, 프로젝트 개요 문서는 `vault/01_projects/`에 생성됩니다.

## Project Workflow

프로젝트 산출물은 `vault/02_agents/Project-Workflow-운영.md`의 순서대로 생성합니다. `ProjectAgent → RequirementsAgent → ArchitectAgent → DecisionAgent → DesignAgent → FrontendAgent → BackendAgent → DatabaseAgent → QAAgent` 순서이며, 이전 단계 승인 전에는 다음 단계 산출물을 만들지 않습니다.

## Raw Source Ingest

자료수집은 `vault/02_agents/Raw-Source-Ingest-운영.md`를 기준으로 합니다. 사용자 수집 액션은 `vault/00_raw_sources/`에 raw source를 생성할 수 있지만, Agent는 raw 문서를 직접 수정하지 않습니다. ingest 결과는 현재 workflow 승인 대기 Markdown을 보강하며, Vault 최종 저장은 사용자 승인 후에만 수행합니다.

## LLM Provider

기본 LLM provider는 `.env`의 `LLM_PROVIDER`로 선택합니다. `LLM_PROVIDER=ollama`이면 로컬 Ollama의 Qwen 모델을 사용하고, `LLM_PROVIDER=qwen`이면 Qwen Cloud OpenAI-compatible Chat Completions API를 사용합니다. 설정 방법은 `vault/02_agents/Qwen-LLM-Provider.md`를 기준으로 합니다. 로컬 Ollama 서버나 원격 API 키가 없으면 Query는 fallback mode로 동작합니다.
