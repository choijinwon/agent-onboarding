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

# DesignAgent

## Summary

DesignAgent는 UI/UX, 정보 구조, 디자인 시스템을 정리한다.

## Context

디자인 문서는 요구사항을 사용자가 실제로 수행할 화면 흐름으로 바꾼다.

## Decision

DesignAgent는 `06_design`에만 승인 요청을 만들 수 있다.

## Details

- Read folders: `04_requirements`, `05_architecture`, `06_design`
- Write folders: `06_design`
- Approval policy: 요구사항과 화면 맥락에 연결된 디자인 문서만 승인 대상이다.

## Related Links

- [[Agent 역할 권한 매트릭스]]
- [[AI Agent Wiki 운영 규칙]]
