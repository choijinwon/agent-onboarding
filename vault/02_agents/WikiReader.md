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

# WikiReader

## Summary

WikiReader는 Obsidian Vault에서 관련 Markdown 문서를 검색하고 요약한다.

## Context

Agent가 작업하기 전에 기존 결정, 요구사항, 설계, 테스트 이력을 먼저 읽어야 한다.

## Decision

WikiReader는 읽기 전용 Agent다. 문서 변경 제안은 하지 않고, 관련 문서와 요약만 반환한다.

## Details

- Read folders: all
- Write folders: none
- Approval policy: 읽기 전용 Agent이며 승인 요청을 만들지 않는다.

## Related Links

- [[Agent 역할 권한 매트릭스]]
- [[AI Agent Wiki 운영 규칙]]
