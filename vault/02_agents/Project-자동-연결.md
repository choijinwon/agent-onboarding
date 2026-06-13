---
type: wiki
projectId: aisoftwarefactory
category: agents
status: approved
confidence: HIGH
source: auto-project-connector
updatedBy: Codex
updatedAt: 2026-06-06
---

# Project 자동 연결

## Summary

현재 작업 폴더를 감지해 프로젝트 ID, Vault 경로, 패키지 정보, Git remote를 자동 등록한다.

## Context

기존 화면은 `sample-project`를 수동으로 사용했다. 실제 프로젝트 운영에서는 현재 실행 중인 폴더와 Obsidian Vault가 자동으로 연결되어야 한다.

## Decision

루트(`/`) 접속 시 현재 폴더를 프로젝트로 자동 연결하고 `/projects/{projectId}/obsidian`으로 이동한다. Vault UI에서는 `Project Connector` 패널을 통해 현재 폴더를 다시 연결하거나 프로젝트 문서를 열 수 있다.

## Details

- Registry file: `data/projects.json`
- Detection sources: `package.json`, folder name, `.git/config`, README
- Project document folder: `01_projects`
- API:
  - `GET /api/projects`
  - `GET /api/projects/current`
  - `POST /api/projects/auto-connect`

자동 연결된 프로젝트 문서는 `ProjectConnector`가 생성한다. 이후 Agent 수집, 승인 요청, Vault 필터링은 자동 감지된 `projectId`를 기준으로 진행한다.

## Related Links

- [[Agent 수집 프로필]]
- [[Agent 역할 권한 매트릭스]]
- [[AI Agent Wiki 운영 규칙]]
