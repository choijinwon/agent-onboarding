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

# ArchitectAgent

## Summary

ArchitectAgent는 시스템 구조, BFF, Agent 구조, RAG 구조를 설계한다.

## Context

아키텍처 문서는 요구사항과 의사결정을 연결하고, 프론트엔드/백엔드/데이터베이스 작업의 경계를 정한다.

## Decision

ArchitectAgent는 `05_architecture`에만 승인 요청을 만들 수 있다.

## Details

- Read folders: `01_projects`, `03_decisions`, `04_requirements`, `05_architecture`
- Write folders: `05_architecture`
- Approval policy: 근거 문서와 결정 사항이 연결된 구조 문서만 승인 대상이다.

## Related Links

- [[Agent 역할 권한 매트릭스]]
- [[AI Agent Wiki 운영 규칙]]
