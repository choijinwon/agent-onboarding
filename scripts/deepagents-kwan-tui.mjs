#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const COMMANDS = new Set([
  "/ask",
  "/clear",
  "/debug",
  "/exit",
  "/files",
  "/help",
  "/model",
  "/open",
  "/plan",
  "/settings",
  "/status",
]);

const DEFAULT_PROMPT =
  "사내 데이터 양식에 맞게 보안 점검 보고서 초안의 할 일 목록(TODO)을 구성해줘.";

const colors = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

const state = {
  debug: false,
  events: [],
  files: new Map(),
  messages: [],
  lastModel: "",
  lastLatencyMs: 0,
  runCount: 0,
};

loadEnvFile(path.join(process.cwd(), ".env"));
loadEnvFile(path.join(process.cwd(), ".env.local"));

const config = {
  baseUrl: normalizeBaseUrl(
    process.env.KWAN_BASE_URL ??
      process.env.QWEN_BASE_URL ??
      process.env.OLLAMA_BASE_URL ??
      "http://127.0.0.1:8000/v1",
  ),
  apiKey:
    process.env.KWAN_API_KEY ??
    process.env.QWEN_API_KEY ??
    process.env.DASHSCOPE_API_KEY ??
    process.env.OLLAMA_API_KEY ??
    "local-dev-key",
  model:
    process.env.KWAN_MODEL ??
    process.env.QWEN_MODEL ??
    process.env.OLLAMA_MODEL ??
    "qwen3.6",
  temperature: Number(process.env.KWAN_TEMPERATURE ?? "0.2"),
};

async function main() {
  const promptArg = getArgValue("--prompt");
  const once = process.argv.includes("--once");

  if (once || promptArg) {
    renderShell();
    await askAgent(promptArg ?? DEFAULT_PROMPT);
    renderShell();
    return;
  }

  const rl = readline.createInterface({ input, output });

  renderShell();
  printLine("명령어를 입력하세요. 예: /ask 보안 점검 보고서 TODO 구성");

  while (true) {
    const raw = await rl.question(`${colors.cyan}deep-agent>${colors.reset} `);
    const line = raw.trim();

    if (!line) {
      continue;
    }

    const [command, ...rest] = line.split(/\s+/);
    if (!COMMANDS.has(command)) {
      await askAgent(line);
      renderShell();
      continue;
    }

    const payload = rest.join(" ");

    if (command === "/exit") {
      rl.close();
      return;
    }

    if (command === "/help") {
      renderShell();
      renderHelp();
      continue;
    }

    if (command === "/settings") {
      renderShell();
      renderSettings();
      continue;
    }

    if (command === "/status") {
      await checkStatus();
      renderShell();
      continue;
    }

    if (command === "/debug") {
      state.debug = !state.debug;
      addEvent(`Debug mode ${state.debug ? "enabled" : "disabled"}`);
      renderShell();
      continue;
    }

    if (command === "/clear") {
      state.messages = [];
      state.events = [];
      state.files.clear();
      state.lastLatencyMs = 0;
      renderShell();
      continue;
    }

    if (command === "/files") {
      renderShell();
      renderFiles();
      continue;
    }

    if (command === "/open") {
      renderShell();
      renderFile(payload);
      continue;
    }

    if (command === "/plan") {
      renderShell();
      renderPlan();
      continue;
    }

    if (command === "/model") {
      if (payload) {
        config.model = payload;
        addEvent(`Model changed to ${payload}`);
      }
      renderShell();
      continue;
    }

    if (command === "/ask") {
      await askAgent(payload || DEFAULT_PROMPT);
      renderShell();
    }
  }
}

async function askAgent(content) {
  const startedAt = Date.now();
  state.runCount += 1;
  state.messages.push({ role: "user", content });
  addEvent(`Run ${state.runCount} queued`);
  renderShell();
  printLine("Kwan API 호출 중...");

  try {
    addEvent("Planning prompt prepared");
    const data = await createChatCompletion(content);
    const answer = data.choices?.[0]?.message?.content?.trim();

    if (!answer) {
      throw new Error("응답에 choices[0].message.content가 없습니다.");
    }

    state.lastModel = data.model ?? config.model;
    state.lastLatencyMs = Date.now() - startedAt;
    state.messages.push({ role: "assistant", content: answer });
    updateVirtualFiles(content, answer);
    addEvent(`Completed in ${state.lastLatencyMs}ms`);
  } catch (error) {
    state.messages.push({
      role: "error",
      content: formatError(error),
    });
    addEvent("Run failed");
  }
}

async function checkStatus() {
  try {
    const response = await fetch(`${config.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`/models 실패: ${response.status} ${detail}`);
    }

    state.messages.push({
      role: "system",
      content: "Kwan/OpenAI-compatible endpoint 연결 확인 완료",
    });
    addEvent("/models endpoint reachable");
  } catch (error) {
    state.messages.push({
      role: "error",
      content: formatError(error),
    });
    addEvent("/models endpoint failed");
  }
}

async function createChatCompletion(content) {
  const systemPrompt = [
    "You are a closed-network deep agent POC.",
    "Do not use internet tools or external APIs.",
    "Act like a Deep Agents style planner: plan first, then produce an answer.",
    "Prefer concrete TODOs, assumptions, internal handoff notes, and risks.",
    "Use Markdown headings exactly when relevant: ## Plan, ## TODO, ## Handoff, ## Risks.",
    "Keep the response suitable for an internal terminal UI and later Markdown approval.",
  ].join("\n");

  const messages = [
    { role: "system", content: systemPrompt },
    ...state.messages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .slice(-8),
  ];

  if (messages.at(-1)?.content !== content) {
    messages.push({ role: "user", content });
  }

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: config.model,
      temperature: config.temperature,
      stream: false,
      messages,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Kwan request failed: ${response.status} ${detail || response.statusText}`,
    );
  }

  return response.json();
}

function updateVirtualFiles(content, answer) {
  const timestamp = new Date().toISOString();
  state.files.set("task.md", markdownFile("Task", content, timestamp));
  state.files.set("answer.md", markdownFile("Agent Response", answer, timestamp));
  state.files.set(
    "settings.json",
    JSON.stringify(
      {
        baseUrl: config.baseUrl,
        chatCompletionsUrl: `${config.baseUrl}/chat/completions`,
        model: config.model,
        temperature: config.temperature,
        debug: state.debug,
        runCount: state.runCount,
        lastLatencyMs: state.lastLatencyMs,
      },
      null,
      2,
    ),
  );
  state.files.set("events.md", markdownFile("Execution Events", renderEventLines().join("\n"), timestamp));

  const plan = extractSection(answer, "Plan");
  if (plan) {
    state.files.set("plan.md", markdownFile("Plan", plan, timestamp));
  }

  const todos = answer
    .split("\n")
    .filter((line) => /^\s*(- \[[ x]\]|[-*]\s+|[0-9]+\.)/.test(line))
    .join("\n");

  if (todos.trim()) {
    state.files.set("todo.md", markdownFile("TODO", todos, timestamp));
  }

  const handoff = extractSection(answer, "Handoff");
  if (handoff) {
    state.files.set("handoff.md", markdownFile("Handoff", handoff, timestamp));
  }

  const risks = extractSection(answer, "Risks");
  if (risks) {
    state.files.set("risks.md", markdownFile("Risks", risks, timestamp));
  }
}

function markdownFile(title, body, timestamp) {
  return [`# ${title}`, "", `updatedAt: ${timestamp}`, "", body.trim(), ""].join("\n");
}

function renderShell() {
  clearScreen();
  const width = Math.max(84, Math.min(process.stdout.columns || 100, 120));
  const leftWidth = Math.floor(width * 0.62);
  const rightWidth = width - leftWidth - 3;
  const rows = pairPanels(
    panel(
      "Chat",
      renderMessages().map((line) => truncate(line, leftWidth - 4)),
      leftWidth,
    ),
    panel(
      "State / Files",
      renderState().map((line) => truncate(line, rightWidth - 4)),
      rightWidth,
    ),
  );

  printLine(header(width));
  rows.forEach(printLine);
  printLine(footer(width));
}

function renderMessages() {
  if (!state.messages.length) {
    return [
      "아직 대화가 없습니다.",
      "",
      "/ask <업무> 로 Kwan API를 호출합니다.",
      "일반 문장을 입력해도 바로 질문으로 처리합니다.",
    ];
  }

  return state.messages.slice(-10).flatMap((message) => {
    const label = roleLabel(message.role);
    return [`${label} ${message.content}`, ""];
  });
}

function renderState() {
  const fileNames = [...state.files.keys()];
  return [
    `base_url: ${config.baseUrl}`,
    `model: ${config.model}`,
    `debug: ${state.debug ? "on" : "off"}`,
    `last_model: ${state.lastModel || "-"}`,
    `latency: ${state.lastLatencyMs ? `${state.lastLatencyMs}ms` : "-"}`,
    `runs: ${state.runCount}`,
    "",
    "files:",
    ...(fileNames.length ? fileNames.map((name) => `- ${name}`) : ["- 없음"]),
    "",
    "commands:",
    "/ask, /files, /open <file>",
    "/plan, /model <name>, /status",
    "/debug, /settings, /clear, /exit",
  ];
}

function renderPlan() {
  printLine(`${colors.bold}Execution plan / events${colors.reset}`);
  renderEventLines().forEach(printLine);
}

function renderSettings() {
  printLine(`${colors.bold}Settings${colors.reset}`);
  printLine(`base_url: ${config.baseUrl}`);
  printLine(`chat_completions: ${config.baseUrl}/chat/completions`);
  printLine(`models: ${config.baseUrl}/models`);
  printLine(`model: ${config.model}`);
  printLine(`temperature: ${config.temperature}`);
  printLine(`api_key: ${maskSecret(config.apiKey)}`);
}

function renderFiles() {
  const names = [...state.files.keys()];
  if (!names.length) {
    printLine("파일 state가 아직 없습니다. 먼저 /ask를 실행하세요.");
    return;
  }

  printLine(`${colors.bold}Virtual files${colors.reset}`);
  names.forEach((name) => printLine(`- ${name}`));
}

function renderFile(name) {
  if (!name) {
    printLine("사용법: /open <file>");
    return;
  }

  const content = state.files.get(name);
  if (!content) {
    printLine(`파일을 찾지 못했습니다: ${name}`);
    return;
  }

  printLine(`${colors.bold}${name}${colors.reset}`);
  printLine(content);
}

function renderHelp() {
  printLine([
    "명령어",
    "  /ask <업무>       Kwan API에 업무 요청",
    "  /status          /models endpoint 연결 확인",
    "  /files           가상 파일 목록 출력",
    "  /open <file>     가상 파일 내용 출력",
    "  /plan            실행 단계 이벤트 출력",
    "  /model <name>    현재 세션 모델명 변경",
    "  /settings        endpoint/model 설정 출력",
    "  /debug           step-by-step 확인용 플래그 토글",
    "  /clear           대화 로그 초기화",
    "  /exit            종료",
  ].join("\n"));
}

function panel(title, lines, width) {
  const inner = width - 2;
  const top = `+${"-".repeat(inner)}+`;
  const heading = `| ${colors.bold}${pad(title, inner - 1)}${colors.reset}|`;
  const body = lines.slice(0, 20).map((line) => `| ${pad(stripAnsi(line), inner - 1)}|`);
  const filler = Array.from({ length: Math.max(0, 20 - body.length) }, () =>
    `| ${" ".repeat(inner - 1)}|`,
  );
  return [top, heading, top, ...body, ...filler, top];
}

function pairPanels(left, right) {
  return left.map((line, index) => `${line} ${right[index] ?? ""}`);
}

function header(width) {
  return `${colors.bold}${colors.blue}${"=".repeat(width)}${colors.reset}\n${colors.bold}Deep Agents Kwan TUI POC${colors.reset} ${colors.dim}closed-network / OpenAI-compatible${colors.reset}`;
}

function footer(width) {
  return `${colors.blue}${"=".repeat(width)}${colors.reset}`;
}

function roleLabel(role) {
  if (role === "user") return `${colors.cyan}USER${colors.reset}`;
  if (role === "assistant") return `${colors.green}AGENT${colors.reset}`;
  if (role === "error") return `${colors.red}ERROR${colors.reset}`;
  return `${colors.yellow}SYS${colors.reset}`;
}

function clearScreen() {
  if (!process.env.NO_CLEAR) {
    output.write("\x1Bc");
  }
}

function printLine(value) {
  output.write(`${value}\n`);
}

function pad(value, width) {
  const text = value.length > width ? `${value.slice(0, Math.max(0, width - 1))}…` : value;
  return text.padEnd(width, " ");
}

function truncate(value, width) {
  return value.length > width ? `${value.slice(0, Math.max(0, width - 1))}…` : value;
}

function stripAnsi(value) {
  return value.replace(/\x1b\[[0-9;]*m/g, "");
}

function normalizeBaseUrl(value) {
  return value.replace(/\/chat\/completions\/?$/, "").replace(/\/$/, "");
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) {
      continue;
    }

    process.env[key] = rawValue.trim().replace(/^["']|["']$/g, "");
  }
}

function getArgValue(name) {
  const index = process.argv.indexOf(name);
  if (index === -1) {
    return undefined;
  }

  return process.argv[index + 1];
}

function addEvent(message) {
  state.events.push({
    at: new Date().toISOString(),
    message,
  });

  if (state.events.length > 40) {
    state.events = state.events.slice(-40);
  }
}

function renderEventLines() {
  if (!state.events.length) {
    return ["- 이벤트가 아직 없습니다."];
  }

  return state.events.map((event) => `- ${event.at} ${event.message}`);
}

function extractSection(markdown, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`(^|\\n)##\\s+${escaped}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`, "i");
  const match = markdown.match(pattern);
  return match?.[2]?.trim() ?? "";
}

function maskSecret(value) {
  if (!value) {
    return "-";
  }

  if (value.length <= 8) {
    return "****";
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function formatError(error) {
  if (!(error instanceof Error)) {
    return String(error);
  }

  const cause = error.cause;
  if (cause instanceof Error && cause.message) {
    return `${error.message}: ${cause.message}`;
  }

  return error.message;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
