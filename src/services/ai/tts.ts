import { Buffer } from "buffer";

import { createOpenAIClient, resolveModelForCapability } from "./model-routing";
import { type ProviderType } from "./provider-manager";
import { type AssignmentCapability } from "./settings";
import { extractAudioFromMessage, extractTextFromMessage } from "./message-normalizer";

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

  try {
    const response = await client.audio.speech.create({
      model,
      input: text,
      voice: "alloy",
    });

    const buffer = Buffer.from(await response.arrayBuffer());
    const audioUrl = `data:audio/mpeg;base64,${buffer.toString("base64")}`;
    return { audioUrl, provider, model };
  } catch (error) {
    const completion = await client.chat.completions.create({
      model,
      modalities: ["audio", "text"],
      audio: { voice: "alloy", format: "mp3" },
      messages: [
        { role: "system", content: "You are a text-to-speech engine. Return audio output for the provided text." },
        { role: "user", content: text },
      ],
      temperature: 0,
    });

    const message = completion.choices?.[0]?.message;
    const audio = extractAudioFromMessage(message);
    if (!audio.data) {
      const fallbackText = extractTextFromMessage(message).trim();
      throw new Error(
        fallbackText
          ? `Audio output not returned: ${fallbackText}`
          : "Audio output not returned from provider."
      );
    }
    const format = audio.format || "mp3";
    const audioUrl = `data:audio/${format};base64,${audio.data}`;
    return { audioUrl, provider, model };
  }
};
