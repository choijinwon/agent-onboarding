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

# ProjectAgent

## Summary

ProjectAgent는 프로젝트 개요, 범위, 운영 맥락을 정리한다.

## Context

프로젝트 단위의 목표와 범위는 세부 요구사항과 설계 문서의 기준이 된다.

## Decision

ProjectAgent는 `01_projects`에만 승인 요청을 만들 수 있다.

## Details

- Read folders: `00_raw_sources`, `01_projects`, `03_decisions`
- Write folders: `01_projects`
- Approval policy: 프로젝트 개요성 문서만 HIGH confidence 승인 대상이다.

## Related Links

- [[Agent 역할 권한 매트릭스]]
- [[AI Agent Wiki 운영 규칙]]
