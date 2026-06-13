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

# Agent 실행 로그

## Summary

Agent 실행 로그는 승인된 Vault 변경과 Agent 작업 흐름을 추적하는 기록이다.

## Context

승인된 문서는 `vault/log.md`와 `vault/99_logs`에 함께 기록된다. 이 문서는 기존 `[[Agent 실행 로그]]` 링크의 기준 문서 역할을 한다.

## Decision

로그는 append-only로 관리한다. 사람이 해석해야 하는 실행 요약은 Markdown으로 남기고, 시스템 메타데이터는 별도 저장소에서 관리한다.

## Details

- Timeline: `vault/log.md`
- Agent log folder: `99_logs`
- Log owner: [[LogAgent]]
- 승인 흐름: [[Agent Wiki 업데이트 흐름]]

## Related Links

- [[LogAgent]]
- [[Agent 역할 권한 매트릭스]]
- [[Agent Wiki 업데이트 흐름]]
