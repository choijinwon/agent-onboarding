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

# DatabaseAgent

## Summary

DatabaseAgent는 ERD, 테이블, 마이그레이션, 데이터 정책을 정리한다.

## Context

데이터베이스 문서는 API와 요구사항이 기대하는 데이터 구조의 기준이다.

## Decision

DatabaseAgent는 `09_database`에만 승인 요청을 만들 수 있다.

## Details

- Read folders: `04_requirements`, `08_backend`, `09_database`
- Write folders: `09_database`
- Approval policy: API/요구사항과 연결된 데이터 문서만 HIGH confidence로 제안한다.

## Related Links

- [[Agent 역할 권한 매트릭스]]
- [[AI Agent Wiki 운영 규칙]]
