---
type: wiki
projectId: aisoftwarefactory
category: agents
status: approved
confidence: HIGH
source: user-request
updatedBy: Codex
updatedAt: 2026-06-06
---

# Project Workflow 운영

## Summary

한 프로젝트를 여러 Agent 산출물로 나누어 순서대로 만든다. 이전 단계가 승인되어 Vault에 저장되어야 다음 단계가 열린다.

## Context

사용자는 하나의 프로젝트를 업무 프로세스에 맞게 순차적으로 진행하고 싶다고 요청했다. 기존 UI는 Agent 역할, Vault 질의, 승인 큐를 제공했지만 프로젝트 단위 진행 순서를 강제하지 않았다.

## Decision

`Project Workflow`를 프로젝트별 진행판으로 사용한다. 각 단계는 현재 단계 산출물을 `WikiWriteRequest`로 만들고, 사용자가 승인하면 다음 단계가 `ready`가 된다.

## Details

단계 순서:

1. ProjectAgent: 프로젝트 개요
2. RequirementsAgent: 요구사항 정의
3. ArchitectAgent: 아키텍처 설계
4. DecisionAgent: 핵심 의사결정
5. DesignAgent: UI/UX 설계
6. FrontendAgent: 프론트엔드 설계
7. BackendAgent: 백엔드 설계
8. DatabaseAgent: 데이터베이스 설계
9. QAAgent: QA 검증

상태:

- `locked`: 이전 단계가 승인되지 않아 실행할 수 없음
- `ready`: 현재 단계 산출물을 생성할 수 있음
- `review`: 승인 대기 Markdown이 존재함
- `approved`: Vault에 반영되어 다음 단계의 근거 문서가 됨

API:

- `GET /api/projects/[id]/workflow`
- `POST /api/projects/[id]/workflow/run-current`

UI:

- Project Connector 아래 `Project Workflow` 패널에서 현재 단계와 전체 진행률을 확인한다.
- `현재 단계 산출물 생성` 버튼은 `ready` 단계에서만 활성화된다.
- 생성된 Markdown은 승인 큐에서 편집, 승인, 거절한다.

## Related Links

- [[Agent 역할 권한 매트릭스]]
- [[Agent 수집 프로필]]
- [[Qwen LLM Provider]]
- [[Agent Wiki 업데이트 흐름]]
