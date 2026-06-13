import {
  createOpenAIClient,
  getOpenAIModel,
  isOpenAIConfigured,
} from "./openai";
import {
  createOllamaClient,
  getOllamaBaseUrl,
  getOllamaModel,
  isOllamaConfigured,
} from "./ollama";
import {
  createQwenClient,
  getQwenBaseUrl,
  getQwenModel,
  isQwenConfigured,
} from "./qwen";
import type { LlmStatus } from "./types";

function getRequestedProvider() {
  const provider = process.env.LLM_PROVIDER?.toLowerCase();
  if (provider === "openai" || provider === "qwen" || provider === "ollama") {
    return provider;
  }
  return undefined;
}

export function getLlmStatus(): LlmStatus {
  const provider = getRequestedProvider();
  const openaiConfigured = isOpenAIConfigured();
  const qwenConfigured = isQwenConfigured();
  const ollamaConfigured = isOllamaConfigured();

  if (provider === "ollama") {
    return {
      provider: "ollama",
      configured: ollamaConfigured,
      mode: ollamaConfigured ? "llm" : "fallback",
      model: getOllamaModel(),
      baseUrl: getOllamaBaseUrl(),
      reason: ollamaConfigured
        ? "로컬 Ollama provider가 설정되었습니다. Ollama 서버와 모델이 실행 가능해야 합니다."
        : "LLM_PROVIDER=ollama이지만 OLLAMA_MODEL 또는 OLLAMA_BASE_URL 설정이 없습니다.",
    };
  }

  if (provider === "qwen") {
    return {
      provider: "qwen",
      configured: qwenConfigured,
      mode: qwenConfigured ? "llm" : "fallback",
      model: getQwenModel(),
      baseUrl: getQwenBaseUrl(),
      reason: qwenConfigured
        ? "Qwen provider is configured."
        : "LLM_PROVIDER=qwen이지만 QWEN_API_KEY 또는 DASHSCOPE_API_KEY가 없습니다.",
    };
  }

  if (provider === "openai") {
    return {
      provider: "openai",
      configured: openaiConfigured,
      mode: openaiConfigured ? "llm" : "fallback",
      model: getOpenAIModel(),
      reason: openaiConfigured
        ? "OpenAI provider is configured."
        : "LLM_PROVIDER=openai이지만 OPENAI_API_KEY가 없습니다.",
    };
  }

  if (openaiConfigured) {
    return {
      provider: "openai",
      configured: true,
      mode: "llm",
      model: getOpenAIModel(),
      reason: "OPENAI_API_KEY가 감지되어 OpenAI provider를 사용합니다.",
    };
  }

  if (qwenConfigured) {
    return {
      provider: "qwen",
      configured: true,
      mode: "llm",
      model: getQwenModel(),
      baseUrl: getQwenBaseUrl(),
      reason: "QWEN_API_KEY 또는 DASHSCOPE_API_KEY가 감지되어 Qwen provider를 사용합니다.",
    };
  }

  if (ollamaConfigured) {
    return {
      provider: "ollama",
      configured: true,
      mode: "llm",
      model: getOllamaModel(),
      baseUrl: getOllamaBaseUrl(),
      reason: "OLLAMA_MODEL 또는 OLLAMA_BASE_URL이 감지되어 로컬 Ollama provider를 사용합니다.",
    };
  }

  return {
    provider: "fallback",
    configured: false,
    mode: "fallback",
    model: "none",
    reason:
      "LLM API 키가 없습니다. Vault 문서 검색 기반 fallback 답변만 반환합니다.",
  };
}

export function getDefaultLlmClient() {
  const status = getLlmStatus();

  if (status.mode !== "llm") {
    return null;
  }

  if (status.provider === "qwen") {
    return createQwenClient();
  }

  if (status.provider === "ollama") {
    return createOllamaClient();
  }

  if (status.provider === "openai") {
    return createOpenAIClient();
  }

  return null;
}
