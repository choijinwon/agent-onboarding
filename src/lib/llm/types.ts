export type GenerateTextInput = {
  instructions: string;
  input: string;
};

export type GenerateTextResult = {
  text: string;
  model: string;
};

export type LlmClient = {
  generateText(input: GenerateTextInput): Promise<GenerateTextResult>;
};

export type LlmStatus = {
  provider: "openai" | "qwen" | "ollama" | "fallback";
  configured: boolean;
  mode: "llm" | "fallback";
  model: string;
  reason: string;
  baseUrl?: string;
};
