import { ProviderManager, type ProviderType } from "./provider-manager";
import { SettingsService, type AssignmentCapability } from "./settings";

export type ProviderName = ProviderType;

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
  completeChat(prompt: ChatPrompt, model: string): Promise<ChatCompletion>;
}

const normalizeBaseUrl = (baseUrl?: string): string => {
  const url = baseUrl ?? "https://api.openai.com/v1";
  return url.endsWith("/") ? url.slice(0, -1) : url;
};

const extractOpenAIMessage = (data: any): string => {
  const choice = data?.choices?.[0];
  const content = choice?.message?.content;
  if (typeof content === "string") {
    return content.trim();
  }
  if (Array.isArray(content)) {
    return content.map((item) => item?.text ?? "").join("").trim();
  }
  return "";
};

const createOpenAICompatibleAdapter = (name: ProviderName, apiKey: string, baseUrl?: string): ProviderAdapter => ({
  name,
  async completeChat(prompt: ChatPrompt, model: string): Promise<ChatCompletion> {
    if (!apiKey) {
      throw new Error(`${name.toUpperCase()}_API_KEY is not configured`);
    }

    const response = await fetch(`${normalizeBaseUrl(baseUrl)}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: prompt.messages,
        temperature: prompt.temperature ?? 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Failed to call ${name} (${response.status}): ${errorText || response.statusText}`);
    }

    const data = await response.json();
    const message = extractOpenAIMessage(data);

    if (!message) {
      throw new Error(`No completion returned from ${name}`);
    }

    return {
      message,
      provider: name,
      model,
    };
  },
});

const createGeminiAdapter = (apiKey: string): ProviderAdapter => ({
  name: "gemini",
  async completeChat(prompt: ChatPrompt, model: string): Promise<ChatCompletion> {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const systemMessage = prompt.messages.find((m) => m.role === "system");
    const conversationMessages = prompt.messages.filter((m) => m.role !== "system");

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: conversationMessages.map((msg) => ({
            role: msg.role === "assistant" ? "model" : "user",
            parts: [{ text: msg.content }],
          })),
          systemInstruction: systemMessage
            ? {
                role: "system",
                parts: [{ text: systemMessage.content }],
              }
            : undefined,
          safetySettings: [],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Failed to call GEMINI (${response.status}): ${errorText || response.statusText}`);
    }

    const data = await response.json();
    const parts = data?.candidates?.[0]?.content?.parts;
    const message = Array.isArray(parts) ? parts.map((p: any) => p?.text ?? "").join("").trim() : "";

    if (!message) {
      throw new Error("No completion returned from GEMINI");
    }

    return {
      message,
      provider: "gemini",
      model: model,
    };
  },
});

export interface AIClientConfig {
  chatModelId?: string;
}

export class AIClient {
  private providerManager: ProviderManager;
  private settingsService: SettingsService;

  constructor() {
    this.providerManager = ProviderManager.getInstance();
    this.settingsService = SettingsService.getInstance();
  }

  private getAdapter(providerId: ProviderName): ProviderAdapter {
    const provider = this.providerManager.getProvider(providerId);
    if (!provider || !provider.isActive || !provider.apiKey) {
      throw new Error(`Provider ${providerId} is not active or configured`);
    }

    if (providerId === "gemini") {
      return createGeminiAdapter(provider.apiKey);
    }

    return createOpenAICompatibleAdapter(providerId, provider.apiKey, provider.baseUrl);
  }

  async completeChat(prompt: ChatPrompt, capability: AssignmentCapability = 'stw_chat'): Promise<ChatCompletion> {
    const settings = this.settingsService.getSettings();
    let modelId = settings.assignments[capability];

    // Fallback logic if no model is assigned
    if (!modelId) {
      // Default fallback for now if nothing configured
      const activeProviders = this.providerManager.getActiveProviders();
      if (activeProviders.length > 0) {
        if (activeProviders.find(p => p.id === 'openai')) {
          return this.getAdapter('openai').completeChat(prompt, 'gpt-4o-realtime-stub');
        }
        if (activeProviders.find(p => p.id === 'gemini')) {
          return this.getAdapter('gemini').completeChat(prompt, 'gemini-2.0-realtime-stub');
        }
      }
      throw new Error(`No model assigned for capability: ${capability}`);
    }

    let providerId: ProviderName | undefined;
    let modelName = modelId;

    // Search in all model lists
    for (const list of Object.values(settings.models)) {
      const found = list.find(m => m.id === modelId);
      if (found) {
        providerId = found.provider as ProviderName;
        modelName = found.id;
        break;
      }
    }

    if (!providerId) {
      // Fallback for migration or missing config
      const activeProviders = this.providerManager.getActiveProviders();
      if (activeProviders.find(p => p.id === 'openai')) {
        providerId = 'openai';
        modelName = 'gpt-4o-realtime-stub';
      } else if (activeProviders.find(p => p.id === 'gemini')) {
        providerId = 'gemini';
        modelName = 'gemini-2.0-realtime-stub';
      }
    }

    if (!providerId) {
      throw new Error(`Could not determine provider for model ${modelId}`);
    }

    return this.getAdapter(providerId).completeChat(prompt, modelName);
  }
}
