---
type: wiki
projectId: sample-project
category: index
status: approved
confidence: HIGH
source: AI-Agent-Wiki-Template-v1.0.0.zip
updatedBy: Codex
updatedAt: 2026-06-04
---

# Obsidian AI 업무 위키 지도

## Summary

이 Vault는 Multi-Agent 업무 Wiki POC의 canonical Obsidian 저장소다. 원본 자료는 읽기 전용으로 유지하고, 검증된 Agent 결과만 승인 후 Markdown Wiki로 축적한다.

## Folder Map

- [[Multi-Agent 업무 Wiki POC]]: 프로젝트 개요와 현재 방향
- `00_raw_sources`: 원본 자료, 회의록, 외부 문서 요약 전 자료
- `01_projects`: 프로젝트 개요와 진행 맥락
- `02_agents`: Agent 역할, 프롬프트, 운영 스키마, Markdown 규칙
- `03_decisions`: 의사결정, 근거, 결정권자, 날짜
- `04_requirements`: 요구사항, PRD, 기능 정의
- `05_architecture`: 시스템 구조, BFF, Agent 구조, RAG 구조
- `06_design`: UI/UX, 디자인 시스템
- `07_frontend`: 화면, 컴포넌트, 상태관리
- `08_backend`: API, 서비스, 권한
- `09_database`: ERD, 테이블, 마이그레이션
- `10_qa`: 테스트 케이스, 버그 리포트
- `99_logs`: Agent 실행 로그와 세션 인수인계

## Operating Schema

- [[AI Agent Wiki 운영 규칙]]
- [[Agent 역할 권한 매트릭스]]
- [[Agent 수집 프로필]]
- [[Project Workflow 운영]]: 한 프로젝트를 단계별 승인 흐름으로 진행하는 순서
- [[Raw Source Ingest 운영]]: 텍스트, 파일, URL 자료를 raw source로 수집하고 workflow draft에 반영하는 규칙
- [[Project 자동 연결]]
- [[Qwen LLM Provider]]: 로컬 Ollama Qwen과 원격 Qwen Cloud provider 설정
- [[Karpathy LLM Wiki 원칙]]
- [[Markdown 저장 규칙]]
- [[Agent Wiki 업데이트 흐름]]

## Command Map

- `save`: "옵시디언에 저장해줘", "위키에 남겨줘"
- `query`: "옵시디언 참조해줘", "위키에서 찾아줘"
- `ingest`: "자료 정리해줘", "raw를 wiki로 정리해줘"
- `lint`: "위키 점검해줘", "링크/구조 봐줘"

## Recently Approved

- [[운영 코어 편집 승인 검증]]: approved by QAAgent into `10_qa/운영-코어-편집-승인-검증.md`

- [[템플릿 병합 검증]]: approved by QAAgent into `10_qa/템플릿-병합-검증.md`

- [[Obsidian 기반 LLM Wiki 구조]]: Vault를 실제 Wiki 저장소로 쓰고 PostgreSQL은 메타데이터와 승인 상태를 맡는 구조
- [[Agent Wiki 업데이트 흐름]]: Agent 산출물이 승인 대기 Markdown에서 Vault 문서로 반영되는 절차
