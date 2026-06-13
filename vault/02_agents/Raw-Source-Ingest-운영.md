---
type: wiki
projectId: aisoftwarefactory
category: agents
status: approved
confidence: HIGH
source: user-request
updatedBy: Codex
updatedAt: 2026-06-06
---

# Raw Source Ingest 운영

## Summary

자료수집 기능은 텍스트, 로컬 Markdown/TXT 파일, 공개 URL을 raw source로 저장하고, 로컬 Qwen이 요약/분류한 결과를 현재 Project Workflow 승인 대기 Markdown에 반영한다.

## Context

`vault/00_raw_sources`는 원본 자료 계층이다. Agent는 이 폴더를 직접 수정하지 않고 읽기만 한다. 다만 사용자의 명시적 자료수집 액션은 raw source 생성을 허용한다.

## Decision

raw source는 `type: raw-source` frontmatter를 가진 Markdown으로 저장한다. ingest 결과는 Wiki 문서로 바로 저장하지 않고 `WikiWriteRequest`의 pending draft를 보강한다.

## Details

Raw frontmatter:

```text
type: raw-source
projectId: aisoftwarefactory
sourceType: text | file | url
sourceUrl: optional
uploadedBy: user
collectedAt: ISO timestamp
hash: sha256
ingestStatus: collected | ingested | failed
```

API:

- `GET /api/projects/[id]/sources`
- `POST /api/projects/[id]/sources`
- `POST /api/projects/[id]/sources/[sourceId]/ingest`

UI:

- Text, File, URL 입력을 지원한다.
- `자료 저장`은 raw source만 만든다.
- `수집 후 현재 단계에 반영`은 raw source를 만든 뒤 현재 workflow pending draft를 보강한다.

## Related Links

- [[Project Workflow 운영]]
- [[Agent 수집 프로필]]
- [[Markdown 저장 규칙]]
