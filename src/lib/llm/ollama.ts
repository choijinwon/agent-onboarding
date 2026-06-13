import { GenerateTextInput, GenerateTextResult, LlmClient } from "./types";

type OllamaChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  model?: string;
};

const DEFAULT_OLLAMA_BASE_URL = "http://127.0.0.1:11434/v1";
const DEFAULT_OLLAMA_MODEL = "qwen3:latest";
const DEFAULT_OLLAMA_API_KEY = "ollama";

export function isOllamaConfigured() {
  return Boolean(
    process.env.LLM_PROVIDER?.toLowerCase() === "ollama" ||
      process.env.OLLAMA_MODEL ||
      process.env.OLLAMA_BASE_URL,
  );
}

export function getOllamaModel() {
  return process.env.OLLAMA_MODEL ?? DEFAULT_OLLAMA_MODEL;
}

export function getOllamaBaseUrl() {
  return (process.env.OLLAMA_BASE_URL ?? DEFAULT_OLLAMA_BASE_URL).replace(
    /\/$/,
    "",
  );
}

export function createOllamaClient(): LlmClient {
  const model = getOllamaModel();
  const baseUrl = getOllamaBaseUrl();
  const apiKey = process.env.OLLAMA_API_KEY ?? DEFAULT_OLLAMA_API_KEY;

  return {
    async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            {
              role: "system",
              content: input.instructions,
            },
            {
              role: "user",
              content: input.input,
            },
          ],
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`Ollama request failed: ${response.status} ${detail}`);
      }

      const data = (await response.json()) as OllamaChatCompletionResponse;
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) {
        throw new Error("Ollama response did not include message content");
      }

      return {
        text,
        model: data.model ?? model,
      };
    },
  };
}
