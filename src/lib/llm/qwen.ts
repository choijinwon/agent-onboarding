import { GenerateTextInput, GenerateTextResult, LlmClient } from "./types";

type QwenChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  model?: string;
};

const DEFAULT_QWEN_BASE_URL =
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const DEFAULT_QWEN_MODEL = "qwen-plus";

export function isQwenConfigured() {
  return Boolean(getQwenApiKey());
}

export function getQwenModel() {
  return process.env.QWEN_MODEL ?? DEFAULT_QWEN_MODEL;
}

export function getQwenBaseUrl() {
  return (process.env.QWEN_BASE_URL ?? DEFAULT_QWEN_BASE_URL).replace(/\/$/, "");
}

export function createQwenClient(): LlmClient {
  const apiKey = getQwenApiKey();
  const model = getQwenModel();
  const baseUrl = getQwenBaseUrl();

  if (!apiKey) {
    throw new Error("QWEN_API_KEY or DASHSCOPE_API_KEY is not configured");
  }

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
        throw new Error(`Qwen request failed: ${response.status} ${detail}`);
      }

      const data = (await response.json()) as QwenChatCompletionResponse;
      const text = data.choices?.[0]?.message?.content?.trim();
      if (!text) {
        throw new Error("Qwen response did not include message content");
      }

      return {
        text,
        model: data.model ?? model,
      };
    },
  };
}

function getQwenApiKey() {
  return process.env.QWEN_API_KEY ?? process.env.DASHSCOPE_API_KEY;
}
