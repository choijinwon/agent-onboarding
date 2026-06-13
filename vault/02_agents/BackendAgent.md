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

# BackendAgent

## Summary

BackendAgent는 API, 서비스, 인증/권한, 서버 흐름을 설계한다.

## Context

백엔드 문서는 요구사항, 프론트엔드 화면, 데이터 모델 사이의 계약을 정의한다.

## Decision

BackendAgent는 `08_backend`에만 승인 요청을 만들 수 있다.

## Details

- Read folders: `04_requirements`, `05_architecture`, `08_backend`, `09_database`
- Write folders: `08_backend`
- Approval policy: 요구사항과 데이터 계약에 근거한 API 문서만 승인 대상이다.

## Related Links

- [[Agent 역할 권한 매트릭스]]
- [[AI Agent Wiki 운영 규칙]]
