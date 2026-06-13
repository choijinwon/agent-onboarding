---
type: wiki
projectId: sample-project
category: agents
status: approved
confidence: HIGH
source: user-goal
updatedBy: Codex
updatedAt: 2026-06-04
---

# Markdown 저장 규칙

## Summary

모든 Wiki 문서는 YAML Frontmatter를 가지고, 문서 간 연결은 Obsidian `[[문서명]]` 링크로 표현한다.

## Context

Vault 문서는 사람이 Obsidian에서 바로 읽고 관리할 수 있어야 한다. Agent가 생성한 문서는 승인 전에는 proposed 상태이며, 승인 후에만 approved 상태로 Vault에 반영된다.

## Decision

승인된 Wiki 문서는 아래 기본 구조를 따른다.

## Details

```markdown
---
type: wiki
projectId: sample-project
category: architecture
status: approved
confidence: HIGH
source: source-id-or-url
updatedBy: ArchitectAgent
updatedAt: YYYY-MM-DD
---

# 제목

## Summary

## Context

## Decision

## Details

## Related Links
```

기능 문서는 관련 API, DB, 화면 문서와 연결한다.

- [[로그인 기능정의]]
- [[로그인 API]]
- [[users 테이블]]
- [[로그인 화면]]

## Related Links

- [[AI Agent Wiki 운영 규칙]]
- [[Karpathy LLM Wiki 원칙]]
- [[Agent Wiki 업데이트 흐름]]
