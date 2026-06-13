---
type: wiki
projectId: sample-project
category: agents
status: approved
confidence: HIGH
source: AI-Agent-Wiki-Template-v1.0.0.zip
updatedBy: Codex
updatedAt: 2026-06-04
---

# AI Agent Wiki 운영 규칙

## Summary

이 문서는 Codex, Claude Code, 기타 Agent가 `/vault`를 업무용 AI Wiki로 운영할 때 따르는 공통 규칙이다.

## Context

기존 템플릿의 `AI-Sessions/raw/wiki/conversations` 구조는 현재 POC의 번호 기반 Vault 구조로 매핑한다. Obsidian은 사람이 읽는 지식 저장소이고, 애플리케이션과 PostgreSQL은 승인 상태, 메타데이터, 로그를 관리한다.

## Decision

현재 POC에서는 `/vault`를 canonical Obsidian Vault로 유지한다. Agent는 raw 자료를 읽고, 검증된 결과를 승인 가능한 Markdown으로 제안하며, 승인된 `HIGH` confidence 문서만 Vault에 반영한다.

## Details

- raw → `00_raw_sources`
- projects → `01_projects`
- agent/schema rules → `02_agents`
- decisions → `03_decisions`
- design/dev/backend/db/qa → `06_design`~`10_qa`
- conversations/log → `99_logs`, `log.md`

저장 전에 아래 필터를 적용한다.

1. 향후 실무에 반복해서 재사용될 데이터인가?
2. 다른 에이전트나 동료가 프로젝트를 이어받기 위해 반드시 읽어야 하는가?
3. 의사결정의 근거와 결정권자를 나중에 추적할 필요가 있는가?
4. 실패한 방식이라 다시 시도하면 안 되는 리스크 정보인가?
5. 팀 전체가 맞추어야 하는 공통 규칙이나 디자인 가이드인가?

## Related Links

- [[Karpathy LLM Wiki 원칙]]
- [[Markdown 저장 규칙]]
- [[Agent Wiki 업데이트 흐름]]
