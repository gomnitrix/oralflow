export type ProviderName = "openai" | "gemini";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatPrompt {
  messages: ChatMessage[];
  temperature?: number;
}

export interface ChatCompletion {
  message: string;
  provider: ProviderName;
  model: string;
}

interface ProviderAdapter {
  readonly name: ProviderName;
  completeChat(prompt: ChatPrompt): Promise<ChatCompletion>;
}

const createOpenAIAdapter = (apiKey?: string): ProviderAdapter => ({
  name: "openai",
  async completeChat(prompt: ChatPrompt): Promise<ChatCompletion> {
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured");
    }
    return {
      message: prompt.messages[prompt.messages.length - 1]?.content ?? "",
      provider: "openai",
      model: "gpt-4o-realtime-stub",
    };
  },
});

const createGeminiAdapter = (apiKey?: string): ProviderAdapter => ({
  name: "gemini",
  async completeChat(prompt: ChatPrompt): Promise<ChatCompletion> {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    return {
      message: prompt.messages[prompt.messages.length - 1]?.content ?? "",
      provider: "gemini",
      model: "gemini-2.0-realtime-stub",
    };
  },
});

export interface AIClientConfig {
  provider: ProviderName;
  openAIApiKey?: string;
  geminiApiKey?: string;
}

export const resolveAIClientConfig = (): AIClientConfig => {
  const providerEnv = (process.env.REALTIME_PROVIDER ?? "openai").toLowerCase();
  const provider: ProviderName = providerEnv === "gemini" ? "gemini" : "openai";
  return {
    provider,
    openAIApiKey: process.env.OPENAI_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
  };
};

export class AIClient {
  private readonly adapter: ProviderAdapter;

  constructor(config: AIClientConfig = resolveAIClientConfig()) {
    this.adapter =
      config.provider === "gemini"
        ? createGeminiAdapter(config.geminiApiKey)
        : createOpenAIAdapter(config.openAIApiKey);
  }

  get provider(): ProviderName {
    return this.adapter.name;
  }

  async completeChat(prompt: ChatPrompt): Promise<ChatCompletion> {
    return this.adapter.completeChat(prompt);
  }
}
