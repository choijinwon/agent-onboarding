---
type: wiki
projectId: sample-project
category: log
status: approved
confidence: HIGH
source: AI-Agent-Wiki-Template-v1.0.0.zip
updatedBy: Codex
updatedAt: 2026-06-04
---

# Vault 작업 로그

## [2026-06-04] setup | Obsidian AI 업무 Wiki 템플릿 병합

- `AI-Agent-Wiki-Template-v1.0.0.zip`의 운영 규칙을 현재 `/vault` 구조에 맞게 병합했다.
- Karpathy LLM Wiki 원칙의 raw/wiki/schema, `ingest/query/lint`, `index.md`, `log.md` 운영을 적용했다.
- 관련 문서: [[AI Agent Wiki 운영 규칙]], [[Karpathy LLM Wiki 원칙]], [[Markdown 저장 규칙]]

## [2026-06-04] approve | 템플릿 병합 검증

- Agent: QAAgent
- Confidence: HIGH
- Vault path: 10_qa/템플릿-병합-검증.md
- Document: [[템플릿 병합 검증]]

## [2026-06-04] approve | 운영 코어 편집 승인 검증

- Agent: QAAgent
- Confidence: HIGH
- Vault path: 10_qa/운영-코어-편집-승인-검증.md
- Document: [[운영 코어 편집 승인 검증]]

## [2026-06-06] setup | Agent 역할과 Vault 쓰기 권한 정의

- Agent 역할 문서를 `vault/02_agents`에 추가했다.
- 승인 저장 시 `agentRole`과 대상 `folder` 권한을 검사하도록 운영 코어를 보강했다.
- 관련 문서: [[Agent 역할 권한 매트릭스]], [[PMAgent]], [[WikiReader]], [[RequirementsAgent]], [[ArchitectAgent]], [[QAAgent]]

## [2026-06-06] setup | Agent별 수집 프로필 정의

- Agent별 수집 항목, 필수 근거, confidence 규칙을 운영 코어와 UI에 추가했다.
- Vault 운영 문서에 `collect` 명령을 연결했다.
- 관련 문서: [[Agent 수집 프로필]], [[Agent 역할 권한 매트릭스]]

## [2026-06-06] setup | 현재 폴더 프로젝트 자동 연결

- 현재 작업 폴더를 감지해 `data/projects.json`에 프로젝트로 등록하는 API를 추가했다.
- 루트(`/`) 접속 시 자동 연결된 프로젝트 Vault 화면으로 이동하도록 변경했다.
- 관련 문서: [[Project 자동 연결]], [[Agent 수집 프로필]]

## [2026-06-06] setup | Qwen LLM Provider 연결

- `LLM_PROVIDER=qwen` 설정으로 Qwen OpenAI-compatible Chat Completions API를 사용할 수 있게 했다.
- API 키가 없으면 Query는 기존 fallback mode로 동작한다.
- 관련 문서: [[Qwen LLM Provider]], [[Agent 수집 프로필]]

## [2026-06-06] setup | 로컬 Qwen Ollama Provider 구성

- `LLM_PROVIDER=ollama` 설정을 추가해 로컬 Ollama의 Qwen 모델을 Query provider로 사용할 수 있게 했다.
- 기본 로컬 모델은 현재 설치된 `qwen3:latest`, 기본 endpoint는 `http://127.0.0.1:11434/v1`이다.
- 관련 문서: [[Qwen LLM Provider]], [[Agent 수집 프로필]]

## [2026-06-06] setup | Project Workflow 순차 진행 구성

- 한 프로젝트 안에서 Agent 산출물을 순서대로 생성하는 `Project Workflow`를 추가했다.
- 이전 단계 승인 전에는 다음 단계 산출물을 만들 수 없도록 workflow 상태를 `locked`, `ready`, `review`, `approved`로 관리한다.
- 관련 문서: [[Project Workflow 운영]], [[Agent 역할 권한 매트릭스]]

## [2026-06-06] setup | Raw Source Ingest 자료수집 구성

- 텍스트, 파일, URL 자료를 `00_raw_sources`에 raw source로 저장하는 Source Intake API를 추가했다.
- raw source ingest 결과는 현재 workflow 승인 대기 Markdown을 자동 보강하고, 최종 Vault 저장은 기존 승인 흐름을 유지한다.
- 관련 문서: [[Raw Source Ingest 운영]], [[Project Workflow 운영]]
