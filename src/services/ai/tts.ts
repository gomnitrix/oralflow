import { Buffer } from "buffer";

import { createOpenAIClient, resolveModelForCapability } from "./model-routing";
import { type ProviderType } from "./provider-manager";
import { type AssignmentCapability } from "./settings";

export interface TtsResult {
  audioUrl: string;
  provider: ProviderType;
  model: string;
}

export const synthesizeSpeech = async (
  text: string,
  capability: AssignmentCapability = "stw_tts"
): Promise<TtsResult> => {
  const { provider, model } = resolveModelForCapability(capability, { categoryOverride: "tts", fallbackModel: "gpt-4o-mini-tts" });
  const client = createOpenAIClient(provider);

  const response = await client.audio.speech.create({
    model,
    input: text,
    voice: "alloy",
  });

  const buffer = Buffer.from(await response.arrayBuffer());
  const audioUrl = `data:audio/mpeg;base64,${buffer.toString("base64")}`;
  return { audioUrl, provider, model };
};
