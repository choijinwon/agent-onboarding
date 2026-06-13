---
type: wiki
projectId: sample-project
category: projects
status: approved
confidence: HIGH
source: initial-goal
updatedBy: PMAgent
updatedAt: 2026-06-04
---

# Multi-Agent 업무 Wiki POC

## Summary

Obsidian Vault를 사람이 읽고 관리하는 실제 Wiki 저장소로 사용하고, PostgreSQL은 메타데이터와 승인 상태, Agent 로그를 관리한다.

## Context

기존 DB Wiki 중심 구조는 Agent 결과와 사람이 읽는 지식 저장소가 분리되기 어렵다. 이 POC는 Markdown 문서를 기준 지식으로 삼고, 승인된 결과만 Vault에 반영한다.

## Decision

Agent 결과는 즉시 저장하지 않고 WikiUpdateRequest로 승인 대기 상태에 둔다. 승인 후 Vault 폴더에 Markdown 문서를 생성하거나 업데이트하고, [[Agent 실행 로그]]에 변경 내역을 남긴다.

## Details

- Vault 루트는 `OBSIDIAN_VAULT_PATH`로 지정하거나 기본 `/vault`를 사용한다.
- 모든 Wiki 문서는 YAML Frontmatter를 가진다.
- 문서 간 연결은 Obsidian의 `[[문서명]]` 형식을 사용한다.

## Related Links

- [[Agent 실행 로그]]
- [[로그인 기능정의]]
