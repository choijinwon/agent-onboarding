---
type: wiki
projectId: sample-project
category: agents
status: approved
confidence: HIGH
source: agent-collection-policy
updatedBy: Codex
updatedAt: 2026-06-06
---

# Agent 수집 프로필

## Summary

각 Agent는 자기 역할에 맞는 정보만 수집하고, 수집 결과를 승인 가능한 Markdown 제안으로 정리한다.

## Context

역할별 쓰기 권한만 있으면 Agent가 어떤 정보를 먼저 모아야 하는지 불명확하다. 수집 프로필은 `collect -> propose -> approve -> save` 흐름의 첫 단계를 정의한다.

## Decision

Agent별로 수집 항목, 읽기 폴더, 필수 근거, confidence 규칙을 고정한다. 수집 결과가 충분히 검증되지 않으면 `LOW` 또는 `MEDIUM` confidence로 남기고 자동 저장하지 않는다.

## Details

| Agent | Collects | Read Folders | Output |
| --- | --- | --- | --- |
| [[PMAgent]] | 목표, 범위, 우선순위, Agent 순서 | all | read-only |
| [[WikiReader]] | 관련 문서, 링크, 최근 로그, 관련 결정 | all | read-only |
| [[ProjectAgent]] | 프로젝트 목표, 문제 정의, 대상 사용자, 범위 | `00_raw_sources`, `01_projects`, `03_decisions` | `01_projects` |
| [[RequirementsAgent]] | 기능 요구사항, 유저스토리, 수용 조건, 제약 | `00_raw_sources`, `01_projects`, `03_decisions`, `04_requirements` | `04_requirements` |
| [[ArchitectAgent]] | 시스템 경계, 컴포넌트 관계, Agent/RAG 구조 | `01_projects`, `03_decisions`, `04_requirements`, `05_architecture` | `05_architecture` |
| [[DecisionAgent]] | 결정 내용, 배경, 선택지, 트레이드오프 | `01_projects`, `03_decisions`, `04_requirements`, `05_architecture` | `03_decisions` |
| [[DesignAgent]] | 사용자 흐름, 화면 정보 구조, 디자인 시스템 | `04_requirements`, `05_architecture`, `06_design` | `06_design` |
| [[FrontendAgent]] | 화면, 컴포넌트, 상태관리, 라우팅, API 연동 | `04_requirements`, `06_design`, `07_frontend`, `08_backend` | `07_frontend` |
| [[BackendAgent]] | API, 서비스 책임, 인증/권한, 에러 처리 | `04_requirements`, `05_architecture`, `08_backend`, `09_database` | `08_backend` |
| [[DatabaseAgent]] | 엔티티, 테이블, 관계, 인덱스, 마이그레이션 | `04_requirements`, `08_backend`, `09_database` | `09_database` |
| [[QAAgent]] | 테스트 시나리오, 검증 결과, 버그, 리스크 | all | `10_qa` |
| [[WikiReviewer]] | frontmatter, 링크, 고립 문서, confidence 위반 | all | read-only |
| [[LogAgent]] | 실행 시각, 실행 Agent, 승인 ID, Vault 경로 | all | `99_logs` |

## Confidence Rules

- 원본 자료나 Vault 문서로 확인되는 정보는 `HIGH` 후보가 될 수 있다.
- Agent가 해석하거나 보완한 내용은 기본적으로 `MEDIUM` 이하로 둔다.
- 근거가 없는 추측은 `LOW`로 표시하고 승인 저장하지 않는다.
- 저장 전에는 [[Markdown 저장 규칙]]과 [[Agent 역할 권한 매트릭스]]를 함께 확인한다.

## Related Links

- [[Agent 역할 권한 매트릭스]]
- [[AI Agent Wiki 운영 규칙]]
- [[Agent Wiki 업데이트 흐름]]
