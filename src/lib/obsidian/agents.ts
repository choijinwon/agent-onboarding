import type { VaultFolder } from "./types";

export type AgentRoleDefinition = {
  agentRole: string;
  title: string;
  mission: string;
  readFolders: readonly VaultFolder[] | "all";
  writeFolders: readonly VaultFolder[];
  collects: readonly string[];
  requiredEvidence: readonly string[];
  confidenceRules: readonly string[];
  approvalPolicy: string;
};

export const AGENT_ROLE_DEFINITIONS = [
  {
    agentRole: "PMAgent",
    title: "PM Agent",
    mission: "사용자 요청을 분석하고 필요한 Agent 실행 순서를 결정한다.",
    readFolders: "all",
    writeFolders: [],
    collects: [
      "사용자 목표",
      "업무 범위",
      "우선순위",
      "필요한 Agent 순서",
      "승인 또는 보류가 필요한 결정",
    ],
    requiredEvidence: ["사용자 요청 원문", "관련 프로젝트 문서"],
    confidenceRules: [
      "사용자가 명시한 목표는 HIGH",
      "추론한 우선순위와 범위는 MEDIUM 이하",
    ],
    approvalPolicy: "직접 Vault 저장 제안을 만들지 않는다.",
  },
  {
    agentRole: "WikiReader",
    title: "Wiki Reader",
    mission: "Obsidian Vault에서 관련 Markdown 문서를 검색하고 요약한다.",
    readFolders: "all",
    writeFolders: [],
    collects: [
      "관련 Vault 문서",
      "문서 간 링크",
      "최근 작업 로그",
      "요청과 직접 관련된 결정과 요구사항",
    ],
    requiredEvidence: ["Vault 문서 경로", "Obsidian 링크", "log.md 항목"],
    confidenceRules: [
      "Vault에 존재하는 문서 내용만 HIGH",
      "연결 문서가 없는 추정 요약은 LOW",
    ],
    approvalPolicy: "읽기 전용 Agent이며 승인 요청을 만들지 않는다.",
  },
  {
    agentRole: "ProjectAgent",
    title: "Project Agent",
    mission: "프로젝트 개요, 범위, 운영 맥락을 정리한다.",
    readFolders: ["00_raw_sources", "01_projects", "03_decisions"],
    writeFolders: ["01_projects"],
    collects: [
      "프로젝트 목표",
      "문제 정의",
      "대상 사용자",
      "범위와 제외 범위",
      "현재 진행 상태",
    ],
    requiredEvidence: ["원본 요청", "프로젝트 문서", "의사결정 문서"],
    confidenceRules: [
      "프로젝트 문서와 사용자 요청이 일치하면 HIGH",
      "범위 추정은 MEDIUM 이하",
    ],
    approvalPolicy: "프로젝트 개요성 문서만 HIGH confidence 승인 대상이다.",
  },
  {
    agentRole: "RequirementsAgent",
    title: "Requirements Agent",
    mission: "요구사항, PRD, 기능 정의를 작성한다.",
    readFolders: ["00_raw_sources", "01_projects", "03_decisions", "04_requirements"],
    writeFolders: ["04_requirements"],
    collects: [
      "기능 요구사항",
      "비기능 요구사항",
      "유저스토리",
      "수용 조건",
      "예외/제약 사항",
    ],
    requiredEvidence: ["원본 자료", "프로젝트 목표", "사용자 요청", "관련 결정"],
    confidenceRules: [
      "명시된 요구사항과 수용 조건은 HIGH",
      "Agent가 보완한 기능 해석은 MEDIUM",
      "근거 없는 기능 추정은 LOW",
    ],
    approvalPolicy: "출처가 확인된 요구사항만 HIGH confidence로 제안한다.",
  },
  {
    agentRole: "ArchitectAgent",
    title: "Architect Agent",
    mission: "시스템 구조, BFF, Agent 구조, RAG 구조를 설계한다.",
    readFolders: ["01_projects", "03_decisions", "04_requirements", "05_architecture"],
    writeFolders: ["05_architecture"],
    collects: [
      "시스템 경계",
      "컴포넌트 관계",
      "Agent 흐름",
      "RAG/검색 구조",
      "기술 선택과 트레이드오프",
    ],
    requiredEvidence: ["요구사항 문서", "결정 문서", "기존 아키텍처 문서"],
    confidenceRules: [
      "요구사항과 결정에 근거한 구조는 HIGH",
      "대안 비교 없이 선택한 기술은 MEDIUM 이하",
      "성능/확장성 추정은 LOW 또는 MEDIUM",
    ],
    approvalPolicy: "근거 문서와 결정 사항이 연결된 구조 문서만 승인 대상이다.",
  },
  {
    agentRole: "DecisionAgent",
    title: "Decision Agent",
    mission: "의사결정 기록과 결정 근거를 남긴다.",
    readFolders: ["01_projects", "03_decisions", "04_requirements", "05_architecture"],
    writeFolders: ["03_decisions"],
    collects: [
      "결정 내용",
      "결정 배경",
      "선택지",
      "트레이드오프",
      "결정자와 날짜",
    ],
    requiredEvidence: ["회의/요청 근거", "관련 요구사항", "대안 비교"],
    confidenceRules: [
      "결정자와 근거가 명확하면 HIGH",
      "결정자가 없거나 암묵적 합의면 MEDIUM 이하",
    ],
    approvalPolicy: "결정자, 날짜, 근거가 있는 ADR만 HIGH confidence로 제안한다.",
  },
  {
    agentRole: "DesignAgent",
    title: "Design Agent",
    mission: "UI/UX, 정보 구조, 디자인 시스템을 정리한다.",
    readFolders: ["04_requirements", "05_architecture", "06_design"],
    writeFolders: ["06_design"],
    collects: [
      "사용자 흐름",
      "화면 정보 구조",
      "디자인 시스템 규칙",
      "상태/빈 상태/오류 상태",
      "접근성 고려사항",
    ],
    requiredEvidence: ["요구사항", "사용자 업무 흐름", "기존 디자인 문서"],
    confidenceRules: [
      "요구사항과 기존 UI 패턴에 근거하면 HIGH",
      "시각 취향 제안은 MEDIUM 이하",
    ],
    approvalPolicy: "요구사항과 화면 맥락에 연결된 디자인 문서만 승인 대상이다.",
  },
  {
    agentRole: "FrontendAgent",
    title: "Frontend Agent",
    mission: "화면, 컴포넌트, 상태관리, 프론트엔드 흐름을 문서화한다.",
    readFolders: ["04_requirements", "06_design", "07_frontend", "08_backend"],
    writeFolders: ["07_frontend"],
    collects: [
      "화면 목록",
      "컴포넌트 책임",
      "상태관리 흐름",
      "라우팅",
      "API 연동 지점",
    ],
    requiredEvidence: ["디자인 문서", "요구사항", "API 계약", "기존 프론트엔드 문서"],
    confidenceRules: [
      "실제 UI/API 계약과 일치하면 HIGH",
      "미구현 화면 가정은 MEDIUM 이하",
    ],
    approvalPolicy: "실제 UI/API 계약과 일치하는 문서만 HIGH confidence로 제안한다.",
  },
  {
    agentRole: "BackendAgent",
    title: "Backend Agent",
    mission: "API, 서비스, 인증/권한, 서버 흐름을 설계한다.",
    readFolders: ["04_requirements", "05_architecture", "08_backend", "09_database"],
    writeFolders: ["08_backend"],
    collects: [
      "API 엔드포인트",
      "서비스 책임",
      "인증/권한 정책",
      "에러 처리",
      "외부 연동",
    ],
    requiredEvidence: ["요구사항", "아키텍처 문서", "DB 문서", "프론트엔드 계약"],
    confidenceRules: [
      "요구사항과 데이터 계약이 연결되면 HIGH",
      "권한/보안 가정은 MEDIUM 이하",
    ],
    approvalPolicy: "요구사항과 데이터 계약에 근거한 API 문서만 승인 대상이다.",
  },
  {
    agentRole: "DatabaseAgent",
    title: "Database Agent",
    mission: "ERD, 테이블, 마이그레이션, 데이터 정책을 정리한다.",
    readFolders: ["04_requirements", "08_backend", "09_database"],
    writeFolders: ["09_database"],
    collects: [
      "엔티티",
      "테이블과 컬럼",
      "관계",
      "인덱스",
      "마이그레이션/데이터 정책",
    ],
    requiredEvidence: ["요구사항", "백엔드 API", "기존 DB 문서"],
    confidenceRules: [
      "API와 요구사항에 필요한 데이터 구조는 HIGH",
      "성능 인덱스 제안은 검증 전 MEDIUM 이하",
    ],
    approvalPolicy: "API/요구사항과 연결된 데이터 문서만 HIGH confidence로 제안한다.",
  },
  {
    agentRole: "QAAgent",
    title: "QA Agent",
    mission: "테스트 케이스, 검증 결과, 버그 리포트를 작성한다.",
    readFolders: "all",
    writeFolders: ["10_qa"],
    collects: [
      "테스트 시나리오",
      "수용 기준 검증",
      "버그 재현 절차",
      "실행 결과",
      "리스크와 회귀 범위",
    ],
    requiredEvidence: ["테스트 실행 결과", "재현 절차", "관련 요구사항/설계 문서"],
    confidenceRules: [
      "실행 로그나 재현 절차가 있으면 HIGH",
      "예상 리스크는 MEDIUM 이하",
    ],
    approvalPolicy: "실행 결과나 재현 절차가 있는 QA 문서만 승인 대상이다.",
  },
  {
    agentRole: "WikiReviewer",
    title: "Wiki Reviewer",
    mission: "frontmatter, Obsidian 링크, confidence, 중복 문서를 점검한다.",
    readFolders: "all",
    writeFolders: [],
    collects: [
      "frontmatter 누락",
      "깨진 Obsidian 링크",
      "고립 문서",
      "중복/충돌 문서",
      "confidence/status 위반",
    ],
    requiredEvidence: ["Vault lint 결과", "문서 경로", "링크 대상"],
    confidenceRules: [
      "자동 점검으로 확인된 구조 위반은 HIGH",
      "내용 품질 판단은 MEDIUM 이하",
    ],
    approvalPolicy: "Vault에 직접 저장하지 않고 검토 결과만 반환한다.",
  },
  {
    agentRole: "LogAgent",
    title: "Log Agent",
    mission: "Agent 실행 결과와 승인 이력을 append-only 로그로 정리한다.",
    readFolders: "all",
    writeFolders: ["99_logs"],
    collects: [
      "Agent 실행 시각",
      "실행 Agent",
      "승인 요청 ID",
      "Vault 반영 경로",
      "관련 링크",
    ],
    requiredEvidence: ["실행 결과", "승인 요청", "Vault 저장 경로"],
    confidenceRules: [
      "시스템 이벤트와 승인 결과는 HIGH",
      "실행 의도 요약은 MEDIUM 이하",
    ],
    approvalPolicy: "실행 로그와 승인 로그만 저장 대상이다.",
  },
] as const satisfies AgentRoleDefinition[];

export function getAgentRoleDefinition(agentRole: string) {
  return AGENT_ROLE_DEFINITIONS.find((definition) => definition.agentRole === agentRole);
}

export function canAgentWriteFolder(agentRole: string, folder: string) {
  const writeFolders =
    getAgentRoleDefinition(agentRole)?.writeFolders as
      | readonly VaultFolder[]
      | undefined;
  return writeFolders?.includes(folder as VaultFolder) ?? false;
}

export function assertAgentCanWrite(agentRole: string, folder: VaultFolder): void {
  const definition = getAgentRoleDefinition(agentRole);
  if (!definition) {
    throw new Error(`Unknown agent role: ${agentRole}`);
  }

  const writeFolders = definition.writeFolders as readonly VaultFolder[];
  if (!writeFolders.includes(folder)) {
    const allowed =
      writeFolders.length > 0
        ? writeFolders.join(", ")
        : "no vault write folders";
    throw new Error(
      `${agentRole} cannot write to ${folder}. Allowed folders: ${allowed}.`,
    );
  }
}
