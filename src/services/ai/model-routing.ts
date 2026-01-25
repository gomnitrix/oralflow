import OpenAI from "openai";

import { ProviderManager, type ProviderType } from "./provider-manager";
import { SettingsService, type AISettings, type AssignmentCapability } from "./settings";

type ModelCategory = keyof AISettings["models"];

const capabilityCategoryMap: Partial<Record<AssignmentCapability, ModelCategory>> = {
  stw_tts: "tts",
  notebook_tts: "tts",
  stw_stt: "stt",
  stw_audio: "language",
  zen_realtime: "realtime_speech",
  stw_goal: "language",
  zen_goal: "language",
  free_chat_draft: "language",
};

const defaultModelByCategory: Record<ModelCategory, string> = {
  language: "gpt-4o-mini",
  tts: "gpt-4o-mini-tts",
  stt: "whisper-1",
  realtime_speech: "gpt-4o-mini-realtime",
};

const categoryToProviderCapability: Record<ModelCategory, "language" | "tts" | "stt" | "realtime_speech"> = {
  language: "language",
  tts: "tts",
  stt: "stt",
  realtime_speech: "realtime_speech",
};

const flattenModels = (settings: AISettings) => Object.values(settings.models).flat();

export const resolveModelForCapability = (
  capability: AssignmentCapability,
  options?: { categoryOverride?: ModelCategory; fallbackModel?: string }
): { provider: ProviderType; model: string } => {
  const settingsService = SettingsService.getInstance();
  const providerManager = ProviderManager.getInstance();
  const settings = settingsService.getSettings();

  const category = options?.categoryOverride ?? capabilityCategoryMap[capability] ?? "language";
  const assignedId = settings.assignments[capability];

  const allModels = flattenModels(settings);
  const assignedModel = assignedId ? allModels.find((m) => m.id === assignedId) : undefined;

  let providerId = assignedModel?.provider as ProviderType | undefined;
  let modelId = assignedModel?.id ?? assignedId;

  if (providerId) {
    const provider = providerManager.getProvider(providerId);
    if (!provider || !provider.isActive || !provider.apiKey) {
      throw new Error(
        `Assigned provider ${providerId} is not active or configured for capability ${capability}. Check API key and model settings.`
      );
    }
  }

  if (!providerId && assignedId) {
    throw new Error(`Model ${assignedId} is assigned to ${capability} but not found in configured model list.`);
  }

  const isCriticalAssignment = capability.startsWith("stw_") || capability === "zen_realtime";

  if (!providerId) {
    if (isCriticalAssignment) {
      throw new Error(`No model assigned for ${capability}. Please configure it in Model Settings.`);
    }
    const fallbackProvider = providerManager
      .getActiveProviders()
      .find((p) => p.capabilities.includes(categoryToProviderCapability[category]));
    providerId = fallbackProvider?.id;
  }

  if (!providerId) {
    throw new Error(`No active provider available for ${capability}`);
  }

  const defaultModel = options?.fallbackModel ?? defaultModelByCategory[category];
  const resolvedModel = modelId || defaultModel;

  if (!resolvedModel) {
    throw new Error(`No model configured for ${capability}`);
  }

  return { provider: providerId, model: resolvedModel };
};

export const createOpenAIClient = (providerId: ProviderType): OpenAI => {
  const provider = ProviderManager.getInstance().getProvider(providerId);
  if (!provider || !provider.apiKey || !provider.isActive) {
    throw new Error(`Provider ${providerId} is not active or configured`);
  }

  return new OpenAI({
    apiKey: provider.apiKey,
    baseURL: provider.baseUrl ? provider.baseUrl.replace(/\/$/, "") : undefined,
  });
};
