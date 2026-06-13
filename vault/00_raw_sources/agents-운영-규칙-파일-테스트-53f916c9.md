---
type: raw-source
rawSourceId: agents-운영-규칙-파일-테스트-53f916c9
projectId: aisoftwarefactory
sourceType: file
sourceUrl: 
uploadedBy: Codex
collectedAt: 2026-06-06T13:48:59.819Z
hash: 53f916c9b457a5dfec5bdae3f8dd089f1abe2b2af847903122f5d4b77347c8ba
ingestStatus: collected
updatedBy: SourceIntake
updatedAt: 2026-06-06
---

# AGENTS 운영 규칙 파일 테스트

## Summary

원본 자료입니다. Agent는 이 문서를 읽기만 하고, Wiki 반영은 ingest 결과와 승인 큐를 통해 진행합니다.

## Source Metadata

- Source type: file
- Source URL: N/A
- Hash: 53f916c9b457a5dfec5bdae3f8dd089f1abe2b2af847903122f5d4b77347c8ba

## Raw Content

# AGENTS.md

이 저장소의 canonical Obsidian Vault는 `vault/`입니다. Codex와 다른 AI 에이전트는 이 폴더를 사람이 읽는 업무 Wiki 저장소로 취급합니다.

## 역할

당신은 답변만 하는 챗봇이 아니라, 업무 맥락을 읽고, 필요한 내용을 승인 가능한 Markdown으로 정리하고, 다음 에이전트가 이어받을 수 있게 기록하는 운영자입니다.

## 작업 시작 전

1. `vault/index.md`를 읽고 현재 Vault 구조와 주요 문서를 파악합니다.
2. `vault/log.md`와 `vault/99_logs/`에서 최근 작업 흐름을 확인합니다.
3. 관련 프로젝트 문서는 `vault/01_projects/`를 먼저 확인합니다.
4. 원본 자료가 필요하면 `vault/00_raw_sources/`를 읽되 수정하지 않습니다.
5. 프로젝트 연결 상태는 `data/projects.json`과 `vault/02_agents/Project-자동-연결.md`를 확인합니다.

## 자연어 명령 매핑

- "옵시디언에 저장해줘", "위키에 남겨줘"는 `save`로 해석합니다.
- "옵시디언 참조해줘", "위키에서 찾아줘"는 `query`로 해석합니다.
- "자료 정리해줘", "raw를 wiki로 정리해줘"는 `ingest`로 해석합니다.
- "위키 점검해줘", "링크/구조 봐줘"는 `lint`로 해석합니다.
- "역할별로 수집해줘", "Agent별로 자료 모아줘"는 `collect`로 해석합니다.

명령 키워드는 영어(`save`, `ingest`, `query`, `lint`)로 고정하고, 사람이 읽는 설명은 한국어로 작성합니다.

## Vault 계층

- `vault/00_raw_sources/`: 원본 자료 계층입니다. 읽기 전용이며 에이전트가 수정하지 않습니다.
- `vault/01_projects/`~`vault/10_qa/`: 승인된 Wiki 문서 계층입니다.
- `vault/02_agents/`: Agent 역할, 프롬프트, 운영 스키마, Markdown 규칙을 둡니다.
- `vault/99_logs/`: Agent 실행 로그와 세션 인수인계를 둡니다.
- `vault/index.md`: 사람이 보는 Vault 지도입니다.
- `vault/log.md`: append-only 작업 타임라인입니다.

## 저장 필터

저장 전에 반드시 아래 5가지 필터를 적용합니다.

1. 향후 실무에 반복해서 재사용될 데이터인가?
2. 다른 에이전트나 동료가 프로젝트를 이어받기 위해 반드시 읽어야 하는가?
3. 의사결정의 근거와 결정권자를 나중에 추적할 필요가 있는가?
4. 실패한 방식이라 다시 시도하면 안 되는 리스크 정보인가?
5. 팀 전체가 맞추어야 하는 공통 규칙이나 디자인 가이드인가?

하나도 만족하지 않는 일회성 답변은 Wiki에 저장하지 말고, 저장하지 않은 이유를 짧게 설명합니다.

## 승인 규칙

- Agent 산출물은 `WikiWriteRequest`로 승인 대기 상태를 거칩니다.
- Agent별 수집 기준은 `vault/02_agents/Agent-수집-프로필.md`를 기준으로 합니다.
- Agent 역할과 허용 저장 폴더는 `vault/02_agents/Agent-역할-권한-매트릭스.md`를 기준으로 합니다.
- 프로젝트 자동 연결은 `data/projects.json`에 등록된 `projectId`를 기준으로 합니다.
- 프로젝트 산출물은 `vault/02_agents/Project-Workflow-운영.md`의 순차 단계에 따라 생성합니다. 이전 단계가 승인되기 전에는 다음 단계 산출물을 만들지 않습니다.
- 자료수집은 `vault/02_agents/Raw-Source-Ingest-운영.md`를 기준으로 합니다. 사용자 수집 액션만 `00_raw_sources`에 raw source를 만들 수 있고, Agent는 raw를 읽은 뒤 승인 대기 Markdown만 보강합니다.
- LLM provider는 `.env`의 `LLM_PROVIDER`를 따릅니다. 로컬 Qwen은 `LLM_PROVIDER=ollama`, 원격 Qwen Cloud는 `LLM_PROVIDER=qwen`으로 구분하며 설정은 `vault/02_agents/Qwen-LLM-Provider.md`를 기준으로 합니다.
- 승인 저장 시 `agentRole`이 대상 `folder`에 쓸 권한이 있는지 검사합니다.
- 승인된 `HIGH` confidence 문서만 Vault에 반영합니다.
- `LOW` 또는 `MEDIUM` confidence, 추측성 내용, 출처가 약한 내용은 자동 저장하지 않습니다.
- 승인 후에는 대상 Markdown, `vault/index.md`, `vault/log.md`, `vault/99_logs/` 로그를 일관되게 갱신합니다.

## 완료 보고

완료 보고에는 생성/수정한 파일, 참조한 파일, 저장 필터 적용 결과, 다음 작업자가 먼저 확인해야 할 문서를 포함합니다.
