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

# Project Workflow Sequence Log

## Summary

한 프로젝트를 Agent 단계 순서대로 만들 수 있도록 workflow API와 UI 패널을 추가했다.

## Context

사용자는 하나의 프로젝트를 순서대로 만들도록 운영할 수 있는지 물었다. 기존 구조는 Agent 역할과 승인 큐는 있었지만 단계 진행을 강제하지 않았다.

## Decision

프로젝트별 현재 단계는 승인 요청 상태에서 계산한다. 이전 단계가 승인되어야 다음 단계가 `ready`가 된다.

## Details

- Workflow core: `src/lib/projects/workflow.ts`
- Workflow API: `GET /api/projects/[id]/workflow`
- Run API: `POST /api/projects/[id]/workflow/run-current`
- UI panel: `Project Workflow`
- Request link: `workflowStepId`

## Related Links

- [[Project Workflow 운영]]
- [[Agent 역할 권한 매트릭스]]
- [[Agent Wiki 업데이트 흐름]]
