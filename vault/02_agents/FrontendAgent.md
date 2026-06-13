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

# FrontendAgent

## Summary

FrontendAgent는 화면, 컴포넌트, 상태관리, 프론트엔드 흐름을 문서화한다.

## Context

프론트엔드 문서는 UI 설계와 API 계약을 연결해야 한다.

## Decision

FrontendAgent는 `07_frontend`에만 승인 요청을 만들 수 있다.

## Details

- Read folders: `04_requirements`, `06_design`, `07_frontend`, `08_backend`
- Write folders: `07_frontend`
- Approval policy: 실제 UI/API 계약과 일치하는 문서만 HIGH confidence로 제안한다.

## Related Links

- [[Agent 역할 권한 매트릭스]]
- [[AI Agent Wiki 운영 규칙]]
