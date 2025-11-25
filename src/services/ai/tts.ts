import { Buffer } from "buffer";

import { ProviderManager, type ProviderType } from "./provider-manager";
import { SettingsService, type AssignmentCapability } from "./settings";

export interface TtsResult {
  audioUrl: string;
  provider: ProviderType;
  model: string;
}

const resolveModel = (
  capability: AssignmentCapability,
  settings: ReturnType<SettingsService["getSettings"]>
): { modelId: string; providerId: ProviderType } | null => {
  const modelId = settings.assignments[capability];
  if (!modelId) return null;

  for (const list of Object.values(settings.models)) {
    const found = list.find((m) => m.id === modelId);
    if (found) {
      return { modelId: found.id, providerId: found.provider as ProviderType };
    }
  }
  return null;
};

export const synthesizeSpeech = async (
  text: string,
  capability: AssignmentCapability = "stw_tts"
): Promise<TtsResult> => {
  const settingsService = SettingsService.getInstance();
  const settings = settingsService.getSettings();
  const providerManager = ProviderManager.getInstance();

  const resolved = resolveModel(capability, settings);
  const activeProviders = providerManager.getActiveProviders();
  const fallbackProvider = activeProviders.find((p) => p.capabilities.includes("tts"));

  const providerId = resolved?.providerId ?? fallbackProvider?.id;
  const model = resolved?.modelId ?? "gpt-4o-mini-tts";

  if (!providerId) {
    throw new Error("No TTS provider configured");
  }

  const provider = providerManager.getProvider(providerId);
  if (!provider?.apiKey) {
    throw new Error(`Provider ${providerId} is not configured`);
  }

  const baseUrl = provider.baseUrl ?? "https://api.openai.com/v1";
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/audio/speech`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${provider.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: text,
      voice: "alloy",
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => "");
    throw new Error(`TTS failed (${response.status}): ${errText || response.statusText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  const audioUrl = `data:audio/mpeg;base64,${buffer.toString("base64")}`;
  return { audioUrl, provider: providerId, model };
};
