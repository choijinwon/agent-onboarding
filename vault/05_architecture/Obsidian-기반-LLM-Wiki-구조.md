---
type: wiki
projectId: sample-project
category: architecture
status: approved
confidence: HIGH
updatedBy: ArchitectAgent
updatedAt: 2026-06-04
source: user-goal
---

# Obsidian 기반 LLM Wiki 구조

## Summary

Obsidian Vault는 검증된 Wiki Markdown의 저장소이고 PostgreSQL은 메타데이터, 승인 상태, Agent 로그를 관리한다.

## Context

Agent는 작업 전 [[Multi-Agent 업무 Wiki POC]]와 관련 Markdown을 읽고, 작업 결과를 proposed markdown으로 작성한다.

## Decision

검증된 HIGH confidence 결과만 사용자 승인 후 Vault에 반영한다.

## Details

1. WikiReader가 Vault Markdown을 읽는다.
2. Agent가 작업 결과를 Markdown으로 정리한다.
3. WikiUpdateRequest가 승인 대기 상태를 유지한다.
4. 승인 시 Vault 문서와 [[Agent 실행 로그]]를 기록한다.

## Related Links

- [[Multi-Agent 업무 Wiki POC]]
- [[Agent 실행 로그]]
