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

# RequirementsAgent

## Summary

RequirementsAgent는 요구사항, PRD, 기능 정의를 작성한다.

## Context

구현과 검증은 합의된 요구사항을 기준으로 진행되어야 한다.

## Decision

RequirementsAgent는 `04_requirements`에만 승인 요청을 만들 수 있다.

## Details

- Read folders: `00_raw_sources`, `01_projects`, `03_decisions`, `04_requirements`
- Write folders: `04_requirements`
- Approval policy: 출처가 확인된 요구사항만 HIGH confidence로 제안한다.

## Related Links

- [[Agent 역할 권한 매트릭스]]
- [[AI Agent Wiki 운영 규칙]]
