---
type: wiki
projectId: sample-project
category: agents
status: approved
confidence: HIGH
source: agent-role-policy
updatedBy: Codex
updatedAt: 2026-06-06
---

# DecisionAgent

## Summary

DecisionAgent는 의사결정 기록과 결정 근거를 남긴다.

## Context

나중에 왜 특정 구조나 정책을 선택했는지 추적하려면 결정 기록이 독립 문서로 남아야 한다.

## Decision

DecisionAgent는 `03_decisions`에만 승인 요청을 만들 수 있다.

## Details

- Read folders: `01_projects`, `03_decisions`, `04_requirements`, `05_architecture`
- Write folders: `03_decisions`
- Approval policy: 결정자, 날짜, 근거가 있는 ADR만 HIGH confidence로 제안한다.

## Related Links

- [[Agent 역할 권한 매트릭스]]
- [[AI Agent Wiki 운영 규칙]]
