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

const createOpenAICompatibleAdapter = (name: ProviderName, apiKey: string, baseUrl?: string): ProviderAdapter => ({
  name,
  async completeChat(prompt: ChatPrompt, model: string): Promise<ChatCompletion> {
    // In a real implementation, this would make an HTTP request to the provider's API
    // For now, we keep the stub behavior but acknowledge the configuration
    if (!apiKey) {
      throw new Error(`${name.toUpperCase()}_API_KEY is not configured`);
    }

    // Simulating a network call
    // const response = await fetch(`${baseUrl}/chat/completions`, ...);

    return {
      message: prompt.messages[prompt.messages.length - 1]?.content ?? "",
      provider: name,
      model: model,
    };
  },
});

const createGeminiAdapter = (apiKey: string): ProviderAdapter => ({
  name: "gemini",
  async completeChat(prompt: ChatPrompt, model: string): Promise<ChatCompletion> {
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    return {
      message: prompt.messages[prompt.messages.length - 1]?.content ?? "",
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
