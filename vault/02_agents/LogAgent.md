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

# LogAgent

## Summary

LogAgent는 Agent 실행 결과와 승인 이력을 append-only 로그로 정리한다.

## Context

Agent 실행 로그는 사람이 나중에 작업 흐름과 승인 근거를 추적하기 위한 기록이다.

## Decision

LogAgent는 `99_logs`에만 승인 요청을 만들 수 있다.

## Details

- Read folders: all
- Write folders: `99_logs`
- Approval policy: 실행 로그와 승인 로그만 저장 대상이다.

## Related Links

- [[Agent 역할 권한 매트릭스]]
- [[Agent 실행 로그]]
- [[AI Agent Wiki 운영 규칙]]
