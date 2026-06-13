---
type: wiki
projectId: aisoftwarefactory
category: log
status: approved
confidence: HIGH
source: user-request
updatedBy: Codex
updatedAt: 2026-06-06
---

# Raw Source Ingest Log

## Summary

자료수집 기능을 추가했다. 텍스트, 파일, URL 원본 자료를 raw source로 저장하고 현재 workflow draft에 자동 반영할 수 있다.

## Context

사용자는 자료수집 기능도 함께 구현해 달라고 요청했다. 기존 Vault에는 `00_raw_sources`와 ingest 운영 규칙이 있었지만 실제 API/UI는 없었다.

## Decision

사용자 수집 액션으로만 raw source를 생성하고, Agent는 ingest를 통해 승인 대기 Markdown을 보강한다.

## Details

- Raw source library: `src/lib/obsidian/sources.ts`
- Source API: `GET/POST /api/projects/[id]/sources`
- Ingest API: `POST /api/projects/[id]/sources/[sourceId]/ingest`
- UI panel: `자료수집`

## Related Links

- [[Raw Source Ingest 운영]]
- [[Project Workflow 운영]]
