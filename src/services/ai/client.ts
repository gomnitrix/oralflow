import { ProviderManager, type ProviderType } from "./provider-manager";
import { SettingsService } from "./settings";

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

  async completeChat(prompt: ChatPrompt, capability: 'chat' | 'tools' | 'realtime' = 'chat'): Promise<ChatCompletion> {
    const settings = this.settingsService.getSettings();
    let modelId = settings.assignments[capability];

    // Fallback logic if no model is assigned
    if (!modelId) {
      // Default fallback for now if nothing configured
      const activeProviders = this.providerManager.getActiveProviders();
      if (activeProviders.length > 0) {
        // This is a bit arbitrary, but better than failing if user hasn't configured yet
        // In reality, we might want to force configuration or have hardcoded defaults
        if (activeProviders.find(p => p.id === 'openai')) {
          return this.getAdapter('openai').completeChat(prompt, 'gpt-4o-realtime-stub');
        }
        if (activeProviders.find(p => p.id === 'gemini')) {
          return this.getAdapter('gemini').completeChat(prompt, 'gemini-2.0-realtime-stub');
        }
      }
      throw new Error(`No model assigned for capability: ${capability}`);
    }

    // Find which provider this model belongs to
    // We need to look up the model in the settings to find its provider
    // But wait, the assignment is just an ID (likely the model name). 
    // We need to know the provider for this model.
    // The settings.models lists have the info.

    let providerId: ProviderName | undefined;
    let modelName = modelId;

    // Search in language models for chat capability
    const languageModel = settings.models.language.find(m => m.id === modelId);
    if (languageModel) {
      providerId = languageModel.provider as ProviderName;
      modelName = languageModel.id;
    } else {
      // If not found in user configured models, check if it's a known default or fallback
      // For this implementation, let's assume if it's not in the list, we might have issues.
      // However, for the initial state where lists are empty, we might need some bootstrapped models.

      // Let's try to infer or default.
      // If we are in the middle of migration, we might want to support the old hardcoded behavior if config is empty.
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
