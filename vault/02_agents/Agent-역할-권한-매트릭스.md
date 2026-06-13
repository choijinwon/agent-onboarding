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

# Agent 역할 권한 매트릭스

## Summary

이 문서는 Obsidian AI 업무 Wiki에서 사용하는 Agent별 책임과 Vault 쓰기 권한을 정의한다.

## Context

Agent는 Vault에 직접 쓰지 않는다. Agent 산출물은 `WikiWriteRequest`로 승인 대기 상태가 되며, 승인 시점에 `agentRole`과 대상 `folder` 권한을 검사한다.

## Decision

각 Agent는 자기 역할에 맞는 폴더에만 승인 요청을 만들 수 있다. `PMAgent`, `WikiReader`, `WikiReviewer`는 읽기/분석 전용이며 Vault 쓰기 권한을 갖지 않는다.

## Details

| Agent | Mission | Writable Folders |
| --- | --- | --- |
| [[PMAgent]] | 요청 분석, Agent 순서 결정 | read-only |
| [[WikiReader]] | 관련 문서 검색과 요약 | read-only |
| [[ProjectAgent]] | 프로젝트 개요 정리 | `01_projects` |
| [[RequirementsAgent]] | 요구사항, PRD, 기능 정의 | `04_requirements` |
| [[ArchitectAgent]] | 시스템 구조, BFF, Agent/RAG 구조 | `05_architecture` |
| [[DecisionAgent]] | 의사결정 기록 | `03_decisions` |
| [[DesignAgent]] | UI/UX, 디자인 시스템 | `06_design` |
| [[FrontendAgent]] | 화면, 컴포넌트, 상태관리 | `07_frontend` |
| [[BackendAgent]] | API, 서비스, 권한 | `08_backend` |
| [[DatabaseAgent]] | ERD, 테이블, 마이그레이션 | `09_database` |
| [[QAAgent]] | 테스트 케이스, 버그 리포트 | `10_qa` |
| [[WikiReviewer]] | Wiki 품질 점검 | read-only |
| [[LogAgent]] | Agent 실행 로그 | `99_logs` |

## Related Links

- [[AI Agent Wiki 운영 규칙]]
- [[Agent 수집 프로필]]
- [[Agent Wiki 업데이트 흐름]]
- [[Markdown 저장 규칙]]
