---
type: wiki
projectId: sample-project
category: agents
status: approved
confidence: HIGH
source: user-goal
updatedBy: PMAgent
updatedAt: 2026-06-04
---

# Agent Wiki 업데이트 흐름

## Summary

Agent 작업 결과는 proposed markdown으로 생성되고 WikiUpdateRequest 승인 후에만 Vault에 반영된다.

## Context

PMAgent가 요청을 분석한 뒤 필요한 Agent 순서를 결정하고, WikiReader는 관련 Obsidian Markdown을 읽는다.

## Decision

Agent가 추측한 내용은 LOW confidence로 유지하고 자동 저장하지 않는다.

## Details

- [[Obsidian 기반 LLM Wiki 구조]]를 기준 아키텍처로 사용한다.
- 승인된 결과는 Vault 문서로 저장한다.
- 변경 내역은 [[Agent 실행 로그]]에 기록한다.

## Related Links

- [[Obsidian 기반 LLM Wiki 구조]]
- [[Agent 실행 로그]]
