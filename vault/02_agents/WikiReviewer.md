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

# WikiReviewer

## Summary

WikiReviewer는 frontmatter, Obsidian 링크, confidence, 중복 문서를 점검한다.

## Context

Vault 품질은 자동 저장보다 검증과 승인 흐름에 의해 유지되어야 한다.

## Decision

WikiReviewer는 Vault 쓰기 권한을 갖지 않는다. Lint 결과와 수정 제안만 반환한다.

## Details

- Read folders: all
- Write folders: none
- Approval policy: Vault에 직접 저장하지 않고 검토 결과만 반환한다.

## Related Links

- [[Agent 역할 권한 매트릭스]]
- [[AI Agent Wiki 운영 규칙]]
