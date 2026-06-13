---
type: wiki
projectId: sample-project
category: agents
status: approved
confidence: HIGH
source: https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
updatedBy: Codex
updatedAt: 2026-06-04
---

# Karpathy LLM Wiki 원칙

## Summary

LLM Wiki는 원본 자료를 매번 검색해 답을 재구성하는 방식이 아니라, LLM이 지속적으로 Markdown Wiki를 만들고 갱신하는 방식이다.

## Context

Karpathy의 LLM Wiki 패턴은 raw sources, wiki, schema 세 계층을 둔다. raw sources는 원본 자료, wiki는 LLM이 관리하는 상호 연결 Markdown, schema는 Agent가 따라야 할 규칙 문서다.

## Decision

현재 POC는 이 원칙을 회사 실무용 Multi-Agent Wiki로 적용한다. Obsidian은 사람이 읽는 Wiki IDE이고, Agent는 Markdown을 유지보수하는 작업자이며, 승인 흐름은 업무 검증 장치다.

## Details

- `ingest`: raw 자료를 읽고 Wiki 요약, 관련 문서, 색인, 로그를 갱신한다.
- `query`: Wiki와 로그를 먼저 읽고 답을 구성한다. 가치 있는 답은 저장 후보가 될 수 있다.
- `lint`: 링크 누락, 고립 문서, 오래된 주장, 모순, 데이터 공백을 점검한다.
- `index.md`: 콘텐츠 중심 지도다. Agent는 query 전에 먼저 읽는다.
- `log.md`: 시간순 작업 기록이다. ingest, query, lint, approve 이벤트를 남긴다.

## Related Links

- [[AI Agent Wiki 운영 규칙]]
- [[Markdown 저장 규칙]]
- [[Obsidian 기반 LLM Wiki 구조]]
