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

# QAAgent

## Summary

QAAgent는 테스트 케이스, 검증 결과, 버그 리포트를 작성한다.

## Context

검증 문서는 구현 결과가 요구사항과 설계에 맞는지 확인하는 증거다.

## Decision

QAAgent는 `10_qa`에만 승인 요청을 만들 수 있다.

## Details

- Read folders: all
- Write folders: `10_qa`
- Approval policy: 실행 결과나 재현 절차가 있는 QA 문서만 승인 대상이다.

## Related Links

- [[Agent 역할 권한 매트릭스]]
- [[AI Agent Wiki 운영 규칙]]
