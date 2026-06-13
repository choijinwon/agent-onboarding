import { GenerateTextInput, GenerateTextResult, LlmClient } from "./types";

type OpenAIResponse = {
  output_text?: string;
  output?: Array<{
    content?: Array<{
      text?: string;
      type?: string;
    }>;
  }>;
};

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export function getOpenAIModel() {
  return process.env.OPENAI_MODEL ?? "gpt-5-mini";
}

export function createOpenAIClient(): LlmClient {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = getOpenAIModel();

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return {
    async generateText(input: GenerateTextInput): Promise<GenerateTextResult> {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          instructions: input.instructions,
          input: input.input,
        }),
      });

      if (!response.ok) {
        const detail = await response.text();
        throw new Error(`OpenAI request failed: ${response.status} ${detail}`);
      }

      const data = (await response.json()) as OpenAIResponse;
      const outputText =
        data.output_text ??
        data.output
          ?.flatMap((item) => item.content ?? [])
          .map((content) => content.text)
          .filter(Boolean)
          .join("\n")
          .trim();

      if (!outputText) {
        throw new Error("OpenAI response did not include text output");
      }

      return { text: outputText, model };
    },
  };
}
